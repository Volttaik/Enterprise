import path from "path";
import { v4 as uuidv4 } from "uuid";
import QRCode from "qrcode";
import pino from "pino";
import makeWASocket, {
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  downloadMediaMessage,
  DisconnectReason,
  type WASocket,
} from "@whiskeysockets/baileys";
import {
  getWhatsappAccountById,
  getAllActiveWhatsappAccounts,
  upsertWhatsappAccount,
  getOrCreateContact,
  getOrCreateConversation,
  createMessage,
  updateContact,
  getMessagesByConversation,
  createAnalyticsEvent,
} from "../db";
import { generateAIResponse, analyzeImage } from "./ai";

type ConnectionStatus =
  | "idle"
  | "connecting"
  | "qr"
  | "phone_pairing"
  | "connected"
  | "disconnected"
  | "error";

interface WhatsAppSession {
  accountId: number;
  socket: WASocket | null;
  status: ConnectionStatus;
  qrDataUrl: string | null;
  pairingCode: string | null;
  phoneNumber: string | null;
  lastError: string | null;
}

const sessions = new Map<number, WhatsAppSession>();
// Per-account in-flight connect promise, so concurrent callers (e.g. startup
// restore racing a user-triggered connect) share one attempt instead of
// spawning duplicate Baileys sockets for the same account.
const connectLocks = new Map<number, Promise<WhatsAppSession>>();

function authFolder(accountId: number) {
  return path.join(process.cwd(), ".baileys_auth", String(accountId));
}

function getOrInitSessionRecord(accountId: number): WhatsAppSession {
  let session = sessions.get(accountId);
  if (!session) {
    session = {
      accountId,
      socket: null,
      status: "idle",
      qrDataUrl: null,
      pairingCode: null,
      phoneNumber: null,
      lastError: null,
    };
    sessions.set(accountId, session);
  }
  return session;
}

/**
 * Starts (or restarts) a real Baileys WhatsApp Web connection for the given
 * account. Emits a QR code (as a data URL) via the session record until the
 * phone scans it and pairing completes.
 */
export async function connectWhatsAppAccount(whatsappAccountId: number) {
  const inFlight = connectLocks.get(whatsappAccountId);
  if (inFlight) return inFlight;

  const attempt = doConnectWhatsAppAccount(whatsappAccountId).finally(() => {
    connectLocks.delete(whatsappAccountId);
  });
  connectLocks.set(whatsappAccountId, attempt);
  return attempt;
}

async function doConnectWhatsAppAccount(whatsappAccountId: number) {
  const account = await getWhatsappAccountById(whatsappAccountId);
  if (!account) {
    throw new Error(`WhatsApp account ${whatsappAccountId} not found`);
  }

  const existing = sessions.get(whatsappAccountId);
  if (existing?.socket && (existing.status === "connected" || existing.status === "connecting")) {
    return existing;
  }

  const session = getOrInitSessionRecord(whatsappAccountId);
  session.status = "connecting";
  session.qrDataUrl = null;
  session.pairingCode = null;
  session.lastError = null;

  const { state, saveCreds } = await useMultiFileAuthState(authFolder(whatsappAccountId));

  let version: [number, number, number] | undefined;
  try {
    version = (await fetchLatestBaileysVersion()).version;
  } catch (error) {
    console.warn(
      `[WhatsApp] Failed to fetch latest Baileys version, using bundled default: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }

  const socket = makeWASocket({
    auth: state,
    ...(version ? { version } : {}),
    logger: pino({ level: "silent" }),
    // Disable QR generation if we plan to use phone pairing
    printQRInTerminal: false,
  });
  session.socket = socket;

  socket.ev.on("creds.update", saveCreds);

  socket.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      session.qrDataUrl = await QRCode.toDataURL(qr);
      session.status = "qr";
    }

    if (connection === "open") {
      session.status = "connected";
      session.qrDataUrl = null;
      session.pairingCode = null;
      session.phoneNumber = socket.user?.id?.split(":")[0] ?? account.phoneNumber;
      session.lastError = null;
      await upsertWhatsappAccount({
        userId: account.userId,
        accountName: account.accountName,
        phoneNumber: session.phoneNumber || account.phoneNumber,
        isActive: true,
      });
      console.log(`[WhatsApp] Account ${whatsappAccountId} connected as ${session.phoneNumber}`);
    }

    if (connection === "close") {
      const statusCode = (lastDisconnect?.error as { output?: { statusCode?: number } })?.output
        ?.statusCode;
      const loggedOut = statusCode === DisconnectReason.loggedOut;

      if (loggedOut) {
        session.status = "disconnected";
        session.socket = null;
        console.log(`[WhatsApp] Account ${whatsappAccountId} logged out; reconnect to pair again.`);
        // Persist so a server restart doesn't try to auto-reconnect a
        // session WhatsApp itself has invalidated.
        void upsertWhatsappAccount({
          userId: account.userId,
          accountName: account.accountName,
          phoneNumber: account.phoneNumber,
          isActive: false,
        }).catch((error) => {
          console.error(`[WhatsApp] Failed to persist logout for account ${whatsappAccountId}:`, error);
        });
      } else {
        console.log(`[WhatsApp] Account ${whatsappAccountId} disconnected, reconnecting...`);
        session.socket = null;
        session.status = "connecting";
        void connectWhatsAppAccount(whatsappAccountId).catch((error) => {
          session.status = "error";
          session.lastError = error instanceof Error ? error.message : String(error);
        });
      }
    }
  });

  socket.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;

    for (const msg of messages) {
      if (msg.key.fromMe) continue;
      const remoteJid = msg.key.remoteJid;
      if (!remoteJid || remoteJid.endsWith("@g.us")) continue;

      const phoneNumber = remoteJid.replace(/@s\.whatsapp\.net$/, "").replace(/@lid$/, "");
      const incomingImageMessage = msg.message?.imageMessage;
      const text =
        msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
        incomingImageMessage?.caption ||
        "";

      if (!text && !incomingImageMessage) continue;

      try {
        let imageDescription: string | undefined;
        let mediaUrl: string | undefined;

        if (incomingImageMessage) {
          try {
            const buffer = (await downloadMediaMessage(msg, "buffer", {})) as Buffer;
            const { storagePut } = await import("../storage");
            const saved = await storagePut(
              `whatsapp-incoming/${uuidv4()}.jpg`,
              buffer,
              "image/jpeg"
            );
            mediaUrl = saved.url;
            imageDescription = await analyzeImage(buffer.toString("base64"));
          } catch (error) {
            console.error("[WhatsApp] Failed to download/analyze incoming image:", error);
          }
        }

        const { conversationId } = await receiveMessage(
          whatsappAccountId,
          phoneNumber,
          text || "[Image]",
          incomingImageMessage ? "image" : "text",
          mediaUrl,
          msg.pushName || undefined
        );

        const history = await getMessagesByConversation(conversationId, 20);
        const conversationHistory = history
          .slice()
          .reverse()
          .map((m) => ({
            role: (m.isFromAI ? "assistant" : "user") as "assistant" | "user",
            content: m.content,
          }));

        const account = await getWhatsappAccountById(whatsappAccountId);
        if (account) {
          const response = await generateAIResponse(
            account.userId,
            whatsappAccountId,
            conversationHistory,
            text,
            imageDescription
          );
          if (response.text) {
            await sendMessage(whatsappAccountId, phoneNumber, response.text);
          }
          for (const product of response.matchedProducts) {
            if (!product.imageUrl) continue;
            try {
              await sendMediaMessage(
                whatsappAccountId,
                phoneNumber,
                product.imageUrl,
                `${product.name} — ${product.price}`,
                "image"
              );
            } catch (error) {
              console.error(`[WhatsApp] Failed to send product image for "${product.name}":`, error);
            }
          }
        }
      } catch (error) {
        console.error("[WhatsApp] Failed to process incoming message:", error);
      }
    }
  });

  return session;
}

/**
 * Request a phone-number-based pairing code instead of using QR.
 * Baileys must be connected (socket initialised) before calling this.
 * Returns the 8-character code the user enters in WhatsApp → Linked Devices.
 */
export async function requestPhonePairingCode(
  whatsappAccountId: number,
  phoneNumber: string
): Promise<string> {
  const session = sessions.get(whatsappAccountId);
  if (!session?.socket) {
    throw new Error("WhatsApp connection not initialised. Start the connection first.");
  }

  if (session.status === "connected") {
    throw new Error("Account is already connected.");
  }

  try {
    // Strip any non-digits
    const digits = phoneNumber.replace(/\D/g, "");
    const code = await session.socket.requestPairingCode(digits);
    // Format code as XXXX-XXXX for readability
    const formatted = code.match(/.{1,4}/g)?.join("-") ?? code;
    session.pairingCode = formatted;
    session.status = "phone_pairing";
    console.log(`[WhatsApp] Pairing code requested for ${digits}: ${formatted}`);
    return formatted;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    session.lastError = msg;
    throw new Error(`Failed to get pairing code: ${msg}`);
  }
}

/** Logs out the WhatsApp account and clears its persisted session. */
export async function disconnectWhatsAppAccount(whatsappAccountId: number) {
  const session = sessions.get(whatsappAccountId);
  if (session?.socket) {
    try {
      await session.socket.logout();
    } catch {
      // ignore — tearing down regardless
    }
  }
  sessions.delete(whatsappAccountId);
  connectLocks.delete(whatsappAccountId);

  // Persist the disconnect so a server restart doesn't auto-reconnect an
  // account the user intentionally logged out.
  const account = await getWhatsappAccountById(whatsappAccountId);
  if (account) {
    await upsertWhatsappAccount({
      userId: account.userId,
      accountName: account.accountName,
      phoneNumber: account.phoneNumber,
      isActive: false,
    });
  }
}

export function getConnectionState(whatsappAccountId: number) {
  const session = sessions.get(whatsappAccountId);
  return {
    status: session?.status ?? "idle",
    qrDataUrl: session?.qrDataUrl ?? null,
    pairingCode: session?.pairingCode ?? null,
    phoneNumber: session?.phoneNumber ?? null,
    lastError: session?.lastError ?? null,
  };
}

export async function receiveMessage(
  whatsappAccountId: number,
  phoneNumber: string,
  message: string,
  messageType: "text" | "image" | "document" | "audio" | "video" = "text",
  mediaUrl?: string,
  senderName?: string
) {
  const account = await getWhatsappAccountById(whatsappAccountId);
  if (!account) throw new Error(`WhatsApp account ${whatsappAccountId} not found`);

  const contact = await getOrCreateContact({
    userId: account.userId,
    whatsappAccountId,
    phoneNumber,
    name: senderName,
  });
  if (!contact) throw new Error("Failed to create contact");

  const conversation = await getOrCreateConversation({
    contactId: contact.id,
    whatsappAccountId,
  });
  if (!conversation) throw new Error("Failed to create conversation");

  await createMessage({
    conversationId: conversation.id,
    contactId: contact.id,
    whatsappAccountId,
    direction: "inbound",
    messageType,
    content: message,
    mediaUrl,
    timestamp: new Date(),
  });

  await updateContact(contact.id, { lastInteraction: new Date() });

  // Track inbound message in analytics
  void createAnalyticsEvent({
    userId: account.userId,
    whatsappAccountId,
    eventType: "message_received",
    contactId: contact.id,
    metadata: { messageType, preview: message.slice(0, 60) },
  }).catch(() => {/* non-fatal */});

  console.log(`[WhatsApp] Message received from ${phoneNumber}: ${message}`);
  return { contactId: contact.id, conversationId: conversation.id };
}

export async function sendMessage(whatsappAccountId: number, phoneNumber: string, message: string) {
  const session = sessions.get(whatsappAccountId);
  if (!session?.socket || session.status !== "connected") {
    throw new Error(`WhatsApp account ${whatsappAccountId} is not connected`);
  }

  const jid = phoneNumber.includes("@") ? phoneNumber : `${phoneNumber}@s.whatsapp.net`;
  await session.socket.sendMessage(jid, { text: message });

  const account = await getWhatsappAccountById(whatsappAccountId);
  if (account) {
    const contact = await getOrCreateContact({ userId: account.userId, whatsappAccountId, phoneNumber });
    if (contact) {
      const conversation = await getOrCreateConversation({ contactId: contact.id, whatsappAccountId });
      if (conversation) {
        await createMessage({
          conversationId: conversation.id,
          contactId: contact.id,
          whatsappAccountId,
          direction: "outbound",
          messageType: "text",
          content: message,
          isFromAI: true,
          timestamp: new Date(),
        });
      }

      // Track outbound message in analytics
      void createAnalyticsEvent({
        userId: account.userId,
        whatsappAccountId,
        eventType: "message_sent",
        contactId: contact.id,
        metadata: { preview: message.slice(0, 60) },
      }).catch(() => {/* non-fatal */});
    }
  }

  return { success: true, messageId: uuidv4() };
}

export async function sendMediaMessage(
  whatsappAccountId: number,
  phoneNumber: string,
  mediaUrl: string,
  caption?: string,
  mediaType: "image" | "document" | "audio" | "video" = "image"
) {
  const session = sessions.get(whatsappAccountId);
  if (!session?.socket || session.status !== "connected") {
    throw new Error(`WhatsApp account ${whatsappAccountId} is not connected`);
  }

  const jid = phoneNumber.includes("@") ? phoneNumber : `${phoneNumber}@s.whatsapp.net`;

  const mediaSource = mediaUrl.startsWith("/manus-storage/")
    ? await (async () => {
        const { getUploadsDir } = await import("../storage");
        const pathMod = await import("path");
        const fs = await import("fs");
        const key = mediaUrl.replace(/^\/manus-storage\//, "");
        const filePath = pathMod.join(getUploadsDir(), key);
        return fs.readFileSync(filePath);
      })()
    : { url: mediaUrl };

  if (mediaType === "image") {
    await session.socket.sendMessage(jid, { image: mediaSource, caption });
  } else if (mediaType === "video") {
    await session.socket.sendMessage(jid, { video: mediaSource, caption });
  } else if (mediaType === "audio") {
    await session.socket.sendMessage(jid, { audio: mediaSource, mimetype: "audio/mp4" });
  } else {
    await session.socket.sendMessage(jid, { document: mediaSource, caption, mimetype: "application/octet-stream" });
  }

  const account = await getWhatsappAccountById(whatsappAccountId);
  if (account) {
    const contact = await getOrCreateContact({ userId: account.userId, whatsappAccountId, phoneNumber });
    if (contact) {
      const conversation = await getOrCreateConversation({ contactId: contact.id, whatsappAccountId });
      if (conversation) {
        await createMessage({
          conversationId: conversation.id,
          contactId: contact.id,
          whatsappAccountId,
          direction: "outbound",
          messageType: mediaType,
          content: caption || `[${mediaType.toUpperCase()}]`,
          mediaUrl,
          isFromAI: true,
          timestamp: new Date(),
        });
      }
    }
  }

  return { success: true, messageId: uuidv4() };
}

export function isSessionConnected(whatsappAccountId: number): boolean {
  return sessions.get(whatsappAccountId)?.status === "connected";
}

/**
 * Re-establishes WhatsApp sockets for every account marked active in the
 * database. Must be called once when the server process starts — sessions
 * live only in memory, so without this a server restart leaves accounts
 * showing "connected" in the UI/DB while actually having no live socket,
 * causing all sends/receives to silently fail.
 */
export async function restoreActiveWhatsAppSessions() {
  const accounts = await getAllActiveWhatsappAccounts();
  for (const account of accounts) {
    connectWhatsAppAccount(account.id).catch((error) => {
      console.error(
        `[WhatsApp] Failed to restore session for account ${account.id}:`,
        error instanceof Error ? error.message : error
      );
    });
  }
}

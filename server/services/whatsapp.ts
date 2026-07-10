import path from "path";
import { v4 as uuidv4 } from "uuid";
import QRCode from "qrcode";
import pino from "pino";
import makeWASocket, {
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason,
  type WASocket,
} from "@whiskeysockets/baileys";
import {
  getWhatsappAccountById,
  upsertWhatsappAccount,
  getOrCreateContact,
  getOrCreateConversation,
  createMessage,
  updateContact,
  getMessagesByConversation,
} from "../db";
import { generateAIResponse } from "./ai";

type ConnectionStatus =
  | "idle"
  | "connecting"
  | "qr"
  | "connected"
  | "disconnected"
  | "error";

interface WhatsAppSession {
  accountId: number;
  socket: WASocket | null;
  status: ConnectionStatus;
  qrDataUrl: string | null;
  phoneNumber: string | null;
  lastError: string | null;
}

const sessions = new Map<number, WhatsAppSession>();

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
  session.lastError = null;

  const { state, saveCreds } = await useMultiFileAuthState(authFolder(whatsappAccountId));

  let version: [number, number, number] | undefined;
  try {
    version = (await fetchLatestBaileysVersion()).version;
  } catch (error) {
    // Fall back to the version bundled with this Baileys release rather than
    // blocking the connection entirely on a transient network/DNS failure.
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
        console.log(`[WhatsApp] Account ${whatsappAccountId} logged out; scan a new QR to reconnect.`);
      } else {
        console.log(`[WhatsApp] Account ${whatsappAccountId} disconnected, reconnecting...`);
        // Clear the dead socket first so connectWhatsAppAccount's "already
        // connecting" guard doesn't skip creating a fresh one.
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
      if (!remoteJid || remoteJid.endsWith("@g.us")) continue; // skip group chats

      const phoneNumber = remoteJid.replace(/@s\.whatsapp\.net$/, "").replace(/@lid$/, "");
      const text =
        msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
        msg.message?.imageMessage?.caption ||
        "";

      if (!text) continue;

      try {
        const { conversationId } = await receiveMessage(
          whatsappAccountId,
          phoneNumber,
          text,
          "text",
          undefined,
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
            text
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

/** Logs out the WhatsApp account and clears its persisted session. */
export async function disconnectWhatsAppAccount(whatsappAccountId: number) {
  const session = sessions.get(whatsappAccountId);
  if (session?.socket) {
    try {
      await session.socket.logout();
    } catch {
      // ignore — we're tearing the session down regardless
    }
  }
  sessions.delete(whatsappAccountId);
}

export function getConnectionState(whatsappAccountId: number) {
  const session = sessions.get(whatsappAccountId);
  return {
    status: session?.status ?? "idle",
    qrDataUrl: session?.qrDataUrl ?? null,
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
  if (!account) {
    throw new Error(`WhatsApp account ${whatsappAccountId} not found`);
  }

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

  if (mediaType === "image") {
    await session.socket.sendMessage(jid, { image: { url: mediaUrl }, caption });
  } else if (mediaType === "video") {
    await session.socket.sendMessage(jid, { video: { url: mediaUrl }, caption });
  } else if (mediaType === "audio") {
    await session.socket.sendMessage(jid, { audio: { url: mediaUrl }, mimetype: "audio/mp4" });
  } else {
    await session.socket.sendMessage(jid, { document: { url: mediaUrl }, caption, mimetype: "application/octet-stream" });
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

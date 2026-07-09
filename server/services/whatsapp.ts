import { v4 as uuidv4 } from "uuid";
import { getDb, getWhatsappAccountById, upsertWhatsappAccount, getOrCreateContact, getOrCreateConversation, createMessage, updateContact } from "../db";

interface WhatsAppSession {
  accountId: number;
  phoneNumber: string;
  isConnected: boolean;
  lastConnected?: Date;
}

const sessions = new Map<number, WhatsAppSession>();

export async function initializeWhatsAppSession(whatsappAccountId: number) {
  try {
    const account = await getWhatsappAccountById(whatsappAccountId);
    if (!account) {
      throw new Error(`WhatsApp account ${whatsappAccountId} not found`);
    }

    const session: WhatsAppSession = {
      accountId: whatsappAccountId,
      phoneNumber: account.phoneNumber,
      isConnected: true,
      lastConnected: new Date(),
    };

    sessions.set(whatsappAccountId, session);

    // Update account as connected
    await upsertWhatsappAccount({
      userId: account.userId,
      accountName: account.accountName,
      phoneNumber: account.phoneNumber,
      isActive: true,
    });

    console.log(`[WhatsApp] Session initialized for ${account.phoneNumber}`);
    return session;
  } catch (error) {
    console.error("[WhatsApp] Failed to initialize session:", error);
    throw error;
  }
}

export async function receiveMessage(
  whatsappAccountId: number,
  phoneNumber: string,
  message: string,
  messageType: "text" | "image" | "document" | "audio" | "video" = "text",
  mediaUrl?: string,
  senderName?: string
) {
  try {
    const account = await getWhatsappAccountById(whatsappAccountId);
    if (!account) {
      throw new Error(`WhatsApp account ${whatsappAccountId} not found`);
    }

    // Get or create contact
    const contactResult = await getOrCreateContact({
      userId: account.userId,
      whatsappAccountId: whatsappAccountId,
      phoneNumber,
      name: senderName,
    });

    if (!contactResult) {
      throw new Error("Failed to create contact");
    }

    const contactId = typeof contactResult === "object" && "id" in contactResult ? (contactResult as any).id : 0;

    // Get or create conversation
    const conversationResult = await getOrCreateConversation({
      contactId: contactId,
      whatsappAccountId: whatsappAccountId,
    });

    if (!conversationResult) {
      throw new Error("Failed to create conversation");
    }

    const conversationId = typeof conversationResult === "object" && "id" in conversationResult ? (conversationResult as any).id : 0;

    // Store message
    await createMessage({
      conversationId: conversationId,
      contactId: contactId,
      whatsappAccountId: whatsappAccountId,
      direction: "inbound",
      messageType: messageType,
      content: message,
      mediaUrl: mediaUrl,
      timestamp: new Date(),
    });

    // Update contact last interaction
    await updateContact(contactId, {
      lastInteraction: new Date(),
    });

    console.log(`[WhatsApp] Message received from ${phoneNumber}: ${message}`);
  } catch (error) {
    console.error("[WhatsApp] Failed to receive message:", error);
    throw error;
  }
}

export async function sendMessage(whatsappAccountId: number, phoneNumber: string, message: string) {
  try {
    const session = sessions.get(whatsappAccountId);
    if (!session || !session.isConnected) {
      throw new Error(`WhatsApp session ${whatsappAccountId} not found or not connected`);
    }

    // Simulate sending message - in production, this would use Baileys or another WhatsApp API
    console.log(`[WhatsApp] Sending message to ${phoneNumber}: ${message}`);

    // Store outbound message in database
    const account = await getWhatsappAccountById(whatsappAccountId);
    if (account) {
      const contactResult = await getOrCreateContact({
        userId: account.userId,
        whatsappAccountId: whatsappAccountId,
        phoneNumber,
      });

      if (contactResult) {
        const contactId = typeof contactResult === "object" && "id" in contactResult ? (contactResult as any).id : 0;
        const conversationResult = await getOrCreateConversation({
          contactId: contactId,
          whatsappAccountId: whatsappAccountId,
        });

        if (conversationResult) {
          const conversationId = typeof conversationResult === "object" && "id" in conversationResult ? (conversationResult as any).id : 0;
          await createMessage({
            conversationId: conversationId,
            contactId: contactId,
            whatsappAccountId: whatsappAccountId,
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
  } catch (error) {
    console.error("[WhatsApp] Failed to send message:", error);
    throw error;
  }
}

export async function sendMediaMessage(
  whatsappAccountId: number,
  phoneNumber: string,
  mediaUrl: string,
  caption?: string,
  mediaType: "image" | "document" | "audio" | "video" = "image"
) {
  try {
    const session = sessions.get(whatsappAccountId);
    if (!session || !session.isConnected) {
      throw new Error(`WhatsApp session ${whatsappAccountId} not found or not connected`);
    }

    console.log(`[WhatsApp] Sending ${mediaType} to ${phoneNumber}: ${mediaUrl}`);

    const account = await getWhatsappAccountById(whatsappAccountId);
    if (account) {
      const contactResult = await getOrCreateContact({
        userId: account.userId,
        whatsappAccountId: whatsappAccountId,
        phoneNumber,
      });

      if (contactResult) {
        const contactId = typeof contactResult === "object" && "id" in contactResult ? (contactResult as any).id : 0;
        const conversationResult = await getOrCreateConversation({
          contactId: contactId,
          whatsappAccountId: whatsappAccountId,
        });

        if (conversationResult) {
          const conversationId = typeof conversationResult === "object" && "id" in conversationResult ? (conversationResult as any).id : 0;
          await createMessage({
            conversationId: conversationId,
            contactId: contactId,
            whatsappAccountId: whatsappAccountId,
            direction: "outbound",
            messageType: mediaType,
            content: caption || `[${mediaType.toUpperCase()}]`,
            mediaUrl: mediaUrl,
            isFromAI: true,
            timestamp: new Date(),
          });
        }
      }
    }

    return { success: true, messageId: uuidv4() };
  } catch (error) {
    console.error("[WhatsApp] Failed to send media message:", error);
    throw error;
  }
}

export function getSession(whatsappAccountId: number) {
  return sessions.get(whatsappAccountId);
}

export function getAllSessions() {
  return Array.from(sessions.values());
}

export function isSessionConnected(whatsappAccountId: number): boolean {
  const session = sessions.get(whatsappAccountId);
  return session?.isConnected ?? false;
}

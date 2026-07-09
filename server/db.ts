import { eq, and, desc, like, gte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import {
  InsertUser,
  users,
  whatsappAccounts,
  contacts,
  conversations,
  messages,
  products,
  inventory,
  orders,
  orderItems,
  payments,
  knowledgeBase,
  broadcastCampaigns,
  automationRules,
  dripSequences,
  analyticsEvents,
  businessConfig,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

const { Pool } = pg;

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const pool = new Pool({ connectionString: process.env.DATABASE_URL });
      _db = drizzle(pool);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod", "passwordHash"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db
      .insert(users)
      .values(values)
      .onConflictDoUpdate({
        target: users.openId,
        set: updateSet,
      });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserCount() {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select().from(users);
  return result.length;
}

export async function createUser(data: InsertUser) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(users).values(data).returning();
  return result[0];
}

// WhatsApp Accounts
export async function getWhatsappAccountsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(whatsappAccounts).where(eq(whatsappAccounts.userId, userId));
}

export async function getWhatsappAccountById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(whatsappAccounts).where(eq(whatsappAccounts.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function upsertWhatsappAccount(data: {
  userId: number;
  accountName: string;
  phoneNumber: string;
  sessionData?: string;
  isActive?: boolean;
}) {
  const db = await getDb();
  if (!db) return null;
  
  const existing = await db
    .select()
    .from(whatsappAccounts)
    .where(eq(whatsappAccounts.phoneNumber, data.phoneNumber))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(whatsappAccounts)
      .set({
        sessionData: data.sessionData,
        lastConnected: new Date(),
        isActive: data.isActive ?? true,
      })
      .where(eq(whatsappAccounts.id, existing[0].id));
    return existing[0];
  }

  const result = await db.insert(whatsappAccounts).values({
    userId: data.userId,
    accountName: data.accountName,
    phoneNumber: data.phoneNumber,
    sessionData: data.sessionData,
    isActive: data.isActive ?? true,
  }).returning();

  return result[0] ?? null;
}

// Contacts
export async function getOrCreateContact(data: {
  userId: number;
  whatsappAccountId: number;
  phoneNumber: string;
  name?: string;
  email?: string;
}) {
  const db = await getDb();
  if (!db) return null;

  const existing = await db
    .select()
    .from(contacts)
    .where(
      and(
        eq(contacts.userId, data.userId),
        eq(contacts.phoneNumber, data.phoneNumber)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    if (data.name || data.email) {
      await db
        .update(contacts)
        .set({
          name: data.name || existing[0].name,
          email: data.email || existing[0].email,
          lastInteraction: new Date(),
        })
        .where(eq(contacts.id, existing[0].id));
    }
    return existing[0];
  }

  const result = await db.insert(contacts).values({
    userId: data.userId,
    whatsappAccountId: data.whatsappAccountId,
    phoneNumber: data.phoneNumber,
    name: data.name,
    email: data.email,
  }).returning();

  return result[0] ?? null;
}

export async function getContactById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(contacts).where(eq(contacts.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getContactsByUser(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(contacts)
    .where(eq(contacts.userId, userId))
    .orderBy(desc(contacts.lastInteraction))
    .limit(limit);
}

export async function updateContact(id: number, data: Partial<typeof contacts.$inferInsert>) {
  const db = await getDb();
  if (!db) return null;
  await db.update(contacts).set(data).where(eq(contacts.id, id));
  return getContactById(id);
}

// Conversations
export async function getOrCreateConversation(data: {
  contactId: number;
  whatsappAccountId: number;
}) {
  const db = await getDb();
  if (!db) return null;

  const existing = await db
    .select()
    .from(conversations)
    .where(eq(conversations.contactId, data.contactId))
    .limit(1);

  if (existing.length > 0) {
    return existing[0];
  }

  const result = await db.insert(conversations).values({
    contactId: data.contactId,
    whatsappAccountId: data.whatsappAccountId,
  }).returning();

  return result[0] ?? null;
}

export async function getConversationById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(conversations).where(eq(conversations.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

// Messages
export async function createMessage(data: typeof messages.$inferInsert) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(messages).values(data).returning();
  return result[0] ?? null;
}

export async function getMessagesByConversation(conversationId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(desc(messages.timestamp))
    .limit(limit);
}

// Products
export async function getProductsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(products)
    .where(and(eq(products.userId, userId), eq(products.isActive, true)));
}

export async function getProductById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function searchProducts(userId: number, query: string) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(products)
    .where(
      and(
        eq(products.userId, userId),
        eq(products.isActive, true),
        like(products.name, `%${query}%`)
      )
    );
}

export async function createProduct(data: typeof products.$inferInsert) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(products).values(data).returning();
  return result[0] ?? null;
}

// Inventory
export async function getInventoryByProductId(productId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(inventory).where(eq(inventory.productId, productId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateInventory(productId: number, quantity: number) {
  const db = await getDb();
  if (!db) return null;
  await db.update(inventory).set({ quantity }).where(eq(inventory.productId, productId));
  return getInventoryByProductId(productId);
}

// Orders
export async function createOrder(data: typeof orders.$inferInsert) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(orders).values(data).returning();
  return result[0] ?? null;
}

export async function getOrderById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getOrdersByContact(contactId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(orders)
    .where(eq(orders.contactId, contactId))
    .orderBy(desc(orders.createdAt));
}

export async function updateOrder(id: number, data: Partial<typeof orders.$inferInsert>) {
  const db = await getDb();
  if (!db) return null;
  await db.update(orders).set(data).where(eq(orders.id, id));
  return getOrderById(id);
}

// Order Items
export async function createOrderItem(data: typeof orderItems.$inferInsert) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(orderItems).values(data).returning();
  return result[0] ?? null;
}

export async function getOrderItems(orderId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
}

// Payments
export async function createPayment(data: typeof payments.$inferInsert) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(payments).values(data).returning();
  return result[0] ?? null;
}

export async function getPaymentByOrderId(orderId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(payments).where(eq(payments.orderId, orderId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updatePayment(id: number, data: Partial<typeof payments.$inferInsert>) {
  const db = await getDb();
  if (!db) return null;
  await db.update(payments).set(data).where(eq(payments.id, id));
  const result = await db.select().from(payments).where(eq(payments.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

// Knowledge Base
export async function getKnowledgeBaseByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(knowledgeBase)
    .where(and(eq(knowledgeBase.userId, userId), eq(knowledgeBase.isActive, true)));
}

export async function createKnowledgeBase(data: typeof knowledgeBase.$inferInsert) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(knowledgeBase).values(data).returning();
  return result[0] ?? null;
}

// Broadcast Campaigns
export async function createBroadcastCampaign(data: typeof broadcastCampaigns.$inferInsert) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(broadcastCampaigns).values(data).returning();
  return result[0] ?? null;
}

export async function getBroadcastCampaignsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(broadcastCampaigns)
    .where(eq(broadcastCampaigns.userId, userId))
    .orderBy(desc(broadcastCampaigns.createdAt));
}

export async function updateBroadcastCampaign(id: number, data: Partial<typeof broadcastCampaigns.$inferInsert>) {
  const db = await getDb();
  if (!db) return null;
  await db.update(broadcastCampaigns).set(data).where(eq(broadcastCampaigns.id, id));
  const result = await db.select().from(broadcastCampaigns).where(eq(broadcastCampaigns.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

// Automation Rules
export async function getAutomationRulesByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(automationRules)
    .where(and(eq(automationRules.userId, userId), eq(automationRules.isActive, true)));
}

export async function createAutomationRule(data: typeof automationRules.$inferInsert) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(automationRules).values(data).returning();
  return result[0] ?? null;
}

// Drip Sequences
export async function getPendingDripSequences() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(dripSequences)
    .where(eq(dripSequences.status, "pending"));
}

export async function createDripSequence(data: typeof dripSequences.$inferInsert) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(dripSequences).values(data).returning();
  return result[0] ?? null;
}

export async function updateDripSequence(id: number, data: Partial<typeof dripSequences.$inferInsert>) {
  const db = await getDb();
  if (!db) return null;
  await db.update(dripSequences).set(data).where(eq(dripSequences.id, id));
  const result = await db.select().from(dripSequences).where(eq(dripSequences.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

// Analytics
export async function createAnalyticsEvent(data: typeof analyticsEvents.$inferInsert) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(analyticsEvents).values(data).returning();
  return result[0] ?? null;
}

export async function getAnalyticsEventsByUser(userId: number, eventType?: string, days = 30) {
  const db = await getDb();
  if (!db) return [];
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const conditions = [
    eq(analyticsEvents.userId, userId),
    gte(analyticsEvents.createdAt, startDate),
  ];

  if (eventType) {
    conditions.push(eq(analyticsEvents.eventType, eventType as any));
  }

  return db
    .select()
    .from(analyticsEvents)
    .where(and(...conditions))
    .orderBy(desc(analyticsEvents.createdAt));
}

// Business Config
export async function getBusinessConfig(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(businessConfig).where(eq(businessConfig.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function upsertBusinessConfig(data: typeof businessConfig.$inferInsert) {
  const db = await getDb();
  if (!db) return null;

  const existing = await getBusinessConfig(data.userId);

  if (existing) {
    await db
      .update(businessConfig)
      .set(data)
      .where(eq(businessConfig.userId, data.userId));
    return getBusinessConfig(data.userId);
  }

  const result = await db.insert(businessConfig).values(data).returning();
  return result[0] ?? null;
}

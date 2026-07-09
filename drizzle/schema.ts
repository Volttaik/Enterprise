import {
  integer,
  pgTable,
  text,
  timestamp,
  varchar,
  decimal,
  boolean,
  json,
  serial,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/**
 * Core user table backing auth flow.
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  passwordHash: text("passwordHash"),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: varchar("role", { length: 10 }).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * WhatsApp Business Account Configuration
 */
export const whatsappAccounts = pgTable(
  "whatsapp_accounts",
  {
    id: serial("id").primaryKey(),
    userId: integer("userId").notNull(),
    accountName: varchar("accountName", { length: 255 }).notNull(),
    phoneNumber: varchar("phoneNumber", { length: 20 }).notNull().unique(),
    isActive: boolean("isActive").default(true).notNull(),
    sessionData: text("sessionData"), // Encrypted session data
    lastConnected: timestamp("lastConnected"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  (table) => [index("idx_wa_userId").on(table.userId)]
);

export type WhatsappAccount = typeof whatsappAccounts.$inferSelect;
export type InsertWhatsappAccount = typeof whatsappAccounts.$inferInsert;

/**
 * CRM Contacts
 */
export const contacts = pgTable(
  "contacts",
  {
    id: serial("id").primaryKey(),
    userId: integer("userId").notNull(),
    whatsappAccountId: integer("whatsappAccountId").notNull(),
    phoneNumber: varchar("phoneNumber", { length: 20 }).notNull(),
    name: varchar("name", { length: 255 }),
    email: varchar("email", { length: 320 }),
    address: text("address"),
    tags: json("tags").$type<string[]>().default([]).notNull(), // ["vip", "prospect", "customer"]
    notes: text("notes"),
    leadScore: integer("leadScore").default(0).notNull(), // 0-100
    leadStatus: varchar("leadStatus", { length: 20 }).default("cold").notNull(),
    lastInteraction: timestamp("lastInteraction"),
    lifetimeValue: decimal("lifetimeValue", { precision: 12, scale: 2 }).default("0").notNull(),
    preferredProducts: json("preferredProducts").$type<number[]>().default([]).notNull(),
    customFields: json("customFields").$type<Record<string, unknown>>().default({}).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  (table) => [
    index("idx_contacts_userId_phoneNumber").on(table.userId, table.phoneNumber),
    index("idx_contacts_leadStatus").on(table.leadStatus),
  ]
);

export type Contact = typeof contacts.$inferSelect;
export type InsertContact = typeof contacts.$inferInsert;

/**
 * Conversations & Message History
 */
export const conversations = pgTable(
  "conversations",
  {
    id: serial("id").primaryKey(),
    contactId: integer("contactId").notNull(),
    whatsappAccountId: integer("whatsappAccountId").notNull(),
    lastMessageAt: timestamp("lastMessageAt").defaultNow().notNull(),
    messageCount: integer("messageCount").default(0).notNull(),
    summary: text("summary"), // AI-generated summary
    context: text("context"), // Conversation context for AI
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  (table) => [index("idx_conversations_contactId").on(table.contactId)]
);

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = typeof conversations.$inferInsert;

/**
 * Messages
 */
export const messages = pgTable(
  "messages",
  {
    id: serial("id").primaryKey(),
    conversationId: integer("conversationId").notNull(),
    contactId: integer("contactId").notNull(),
    whatsappAccountId: integer("whatsappAccountId").notNull(),
    direction: varchar("direction", { length: 10 }).notNull(),
    messageType: varchar("messageType", { length: 20 }).default("text").notNull(),
    content: text("content").notNull(),
    mediaUrl: varchar("mediaUrl", { length: 2048 }),
    mediaKey: varchar("mediaKey", { length: 255 }), // S3 key
    timestamp: timestamp("timestamp").defaultNow().notNull(),
    isFromAI: boolean("isFromAI").default(false).notNull(),
    aiIntent: varchar("aiIntent", { length: 100 }), // "product_inquiry", "order_status", etc.
    aiConfidence: decimal("aiConfidence", { precision: 3, scale: 2 }), // 0-1
    toolCalls: json("toolCalls").$type<Record<string, unknown>[]>().default([]).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [
    index("idx_messages_conversationId").on(table.conversationId),
    index("idx_messages_timestamp").on(table.timestamp),
  ]
);

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

/**
 * Products & Catalog
 */
export const products = pgTable(
  "products",
  {
    id: serial("id").primaryKey(),
    userId: integer("userId").notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    category: varchar("category", { length: 100 }),
    price: decimal("price", { precision: 12, scale: 2 }).notNull(),
    costPrice: decimal("costPrice", { precision: 12, scale: 2 }),
    imageUrl: varchar("imageUrl", { length: 2048 }),
    imageKey: varchar("imageKey", { length: 255 }), // S3 key
    sku: varchar("sku", { length: 100 }).unique(),
    isActive: boolean("isActive").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  (table) => [
    index("idx_products_userId").on(table.userId),
    index("idx_products_category").on(table.category),
  ]
);

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

/**
 * Inventory
 */
export const inventory = pgTable(
  "inventory",
  {
    id: serial("id").primaryKey(),
    productId: integer("productId").notNull().unique(),
    quantity: integer("quantity").default(0).notNull(),
    lowStockThreshold: integer("lowStockThreshold").default(10).notNull(),
    lastRestockDate: timestamp("lastRestockDate"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  (table) => [index("idx_inventory_productId").on(table.productId)]
);

export type Inventory = typeof inventory.$inferSelect;
export type InsertInventory = typeof inventory.$inferInsert;

/**
 * Orders
 */
export const orders = pgTable(
  "orders",
  {
    id: serial("id").primaryKey(),
    contactId: integer("contactId").notNull(),
    whatsappAccountId: integer("whatsappAccountId").notNull(),
    orderNumber: varchar("orderNumber", { length: 50 }).notNull().unique(),
    status: varchar("status", { length: 20 }).default("pending").notNull(),
    paymentStatus: varchar("paymentStatus", { length: 20 }).default("pending").notNull(),
    totalAmount: decimal("totalAmount", { precision: 12, scale: 2 }).notNull(),
    taxAmount: decimal("taxAmount", { precision: 12, scale: 2 }).default("0").notNull(),
    discountAmount: decimal("discountAmount", { precision: 12, scale: 2 }).default("0").notNull(),
    deliveryAddress: text("deliveryAddress"),
    deliveryMethod: varchar("deliveryMethod", { length: 50 }), // "pickup", "delivery", "courier"
    aiSummary: text("aiSummary"), // AI-generated order summary
    notes: text("notes"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  (table) => [
    index("idx_orders_contactId").on(table.contactId),
    index("idx_orders_status").on(table.status),
    index("idx_orders_paymentStatus").on(table.paymentStatus),
  ]
);

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

/**
 * Order Items
 */
export const orderItems = pgTable(
  "order_items",
  {
    id: serial("id").primaryKey(),
    orderId: integer("orderId").notNull(),
    productId: integer("productId").notNull(),
    quantity: integer("quantity").notNull(),
    unitPrice: decimal("unitPrice", { precision: 12, scale: 2 }).notNull(),
    totalPrice: decimal("totalPrice", { precision: 12, scale: 2 }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [index("idx_orderItems_orderId").on(table.orderId)]
);

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = typeof orderItems.$inferInsert;

/**
 * Payments
 */
export const payments = pgTable(
  "payments",
  {
    id: serial("id").primaryKey(),
    orderId: integer("orderId").notNull(),
    amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
    paymentMethod: varchar("paymentMethod", { length: 50 }).notNull(), // "bank_transfer", "cash", "card"
    status: varchar("status", { length: 20 }).default("pending").notNull(),
    bankName: varchar("bankName", { length: 100 }),
    accountName: varchar("accountName", { length: 100 }),
    accountNumber: varchar("accountNumber", { length: 50 }),
    referenceNumber: varchar("referenceNumber", { length: 100 }),
    receiptUrl: varchar("receiptUrl", { length: 2048 }),
    receiptKey: varchar("receiptKey", { length: 255 }), // S3 key
    receiptMetadata: json("receiptMetadata").$type<Record<string, unknown>>().default({}).notNull(),
    verificationNotes: text("verificationNotes"),
    verifiedAt: timestamp("verifiedAt"),
    verifiedBy: integer("verifiedBy"), // User ID
    paidAt: timestamp("paidAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  (table) => [
    index("idx_payments_orderId").on(table.orderId),
    index("idx_payments_status").on(table.status),
  ]
);

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

/**
 * Knowledge Base Documents
 */
export const knowledgeBase = pgTable(
  "knowledge_base",
  {
    id: serial("id").primaryKey(),
    userId: integer("userId").notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    content: text("content").notNull(),
    fileUrl: varchar("fileUrl", { length: 2048 }),
    fileKey: varchar("fileKey", { length: 255 }), // S3 key
    fileType: varchar("fileType", { length: 20 }), // "pdf", "docx", "txt", "md", "excel"
    chunks: json("chunks").$type<Array<{ text: string; embedding?: number[] }>>().default([]).notNull(),
    isActive: boolean("isActive").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  (table) => [index("idx_kb_userId").on(table.userId)]
);

export type KnowledgeBase = typeof knowledgeBase.$inferSelect;
export type InsertKnowledgeBase = typeof knowledgeBase.$inferInsert;

/**
 * Broadcast Campaigns
 */
export const broadcastCampaigns = pgTable(
  "broadcast_campaigns",
  {
    id: serial("id").primaryKey(),
    userId: integer("userId").notNull(),
    whatsappAccountId: integer("whatsappAccountId").notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    message: text("message").notNull(),
    targetTags: json("targetTags").$type<string[]>().default([]).notNull(),
    targetLeadStatus: json("targetLeadStatus").$type<string[]>().default([]).notNull(),
    status: varchar("status", { length: 20 }).default("draft").notNull(),
    scheduledAt: timestamp("scheduledAt"),
    startedAt: timestamp("startedAt"),
    completedAt: timestamp("completedAt"),
    totalContacts: integer("totalContacts").default(0).notNull(),
    sentCount: integer("sentCount").default(0).notNull(),
    failedCount: integer("failedCount").default(0).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  (table) => [
    index("idx_bc_userId").on(table.userId),
    index("idx_bc_status").on(table.status),
  ]
);

export type BroadcastCampaign = typeof broadcastCampaigns.$inferSelect;
export type InsertBroadcastCampaign = typeof broadcastCampaigns.$inferInsert;

/**
 * Automation Rules
 */
export const automationRules = pgTable(
  "automation_rules",
  {
    id: serial("id").primaryKey(),
    userId: integer("userId").notNull(),
    whatsappAccountId: integer("whatsappAccountId").notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    trigger: varchar("trigger", { length: 30 }).notNull(),
    triggerValue: varchar("triggerValue", { length: 500 }), // keyword, time delay, etc.
    action: varchar("action", { length: 30 }).notNull(),
    actionValue: text("actionValue"), // Message template, product IDs, etc.
    isActive: boolean("isActive").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  (table) => [
    index("idx_ar_userId").on(table.userId),
    index("idx_ar_trigger").on(table.trigger),
  ]
);

export type AutomationRule = typeof automationRules.$inferSelect;
export type InsertAutomationRule = typeof automationRules.$inferInsert;

/**
 * Drip Sequences (Time-based follow-ups)
 */
export const dripSequences = pgTable(
  "drip_sequences",
  {
    id: serial("id").primaryKey(),
    userId: integer("userId").notNull(),
    whatsappAccountId: integer("whatsappAccountId").notNull(),
    contactId: integer("contactId").notNull(),
    sequenceName: varchar("sequenceName", { length: 255 }).notNull(),
    step: integer("step").notNull(), // 1, 2, 3, etc.
    delayHours: integer("delayHours").notNull(), // Hours after previous step
    message: text("message").notNull(),
    scheduledAt: timestamp("scheduledAt"),
    sentAt: timestamp("sentAt"),
    status: varchar("status", { length: 20 }).default("pending").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  (table) => [
    index("idx_ds_contactId").on(table.contactId),
    index("idx_ds_status").on(table.status),
  ]
);

export type DripSequence = typeof dripSequences.$inferSelect;
export type InsertDripSequence = typeof dripSequences.$inferInsert;

/**
 * Analytics Events
 */
export const analyticsEvents = pgTable(
  "analytics_events",
  {
    id: serial("id").primaryKey(),
    userId: integer("userId").notNull(),
    whatsappAccountId: integer("whatsappAccountId").notNull(),
    eventType: varchar("eventType", { length: 30 }).notNull(),
    contactId: integer("contactId"),
    orderId: integer("orderId"),
    paymentId: integer("paymentId"),
    metadata: json("metadata").$type<Record<string, unknown>>().default({}).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [
    index("idx_ae_userId_eventType").on(table.userId, table.eventType),
    index("idx_ae_createdAt").on(table.createdAt),
  ]
);

export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type InsertAnalyticsEvent = typeof analyticsEvents.$inferInsert;

/**
 * Business Configuration
 */
export const businessConfig = pgTable(
  "business_config",
  {
    id: serial("id").primaryKey(),
    userId: integer("userId").notNull().unique(),
    businessName: varchar("businessName", { length: 255 }),
    businessDescription: text("businessDescription"),
    businessLogo: varchar("businessLogo", { length: 2048 }),
    businessLogoKey: varchar("businessLogoKey", { length: 255 }), // S3 key
    aiSystemPrompt: text("aiSystemPrompt"), // Customizable AI system prompt
    aiModel: varchar("aiModel", { length: 50 }).default("mixtral-8x7b-32768").notNull(),
    bankName: varchar("bankName", { length: 100 }),
    bankAccountName: varchar("bankAccountName", { length: 100 }),
    bankAccountNumber: varchar("bankAccountNumber", { length: 50 }),
    bankPaymentInstructions: text("bankPaymentInstructions"),
    timezone: varchar("timezone", { length: 50 }).default("UTC").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  (table) => [index("idx_bc_config_userId").on(table.userId)]
);

export type BusinessConfig = typeof businessConfig.$inferSelect;
export type InsertBusinessConfig = typeof businessConfig.$inferInsert;

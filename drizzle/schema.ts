import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  boolean,
  json,
  longtext,
  mediumtext,
  index,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * WhatsApp Business Account Configuration
 */
export const whatsappAccounts = mysqlTable(
  "whatsapp_accounts",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    accountName: varchar("accountName", { length: 255 }).notNull(),
    phoneNumber: varchar("phoneNumber", { length: 20 }).notNull().unique(),
    isActive: boolean("isActive").default(true).notNull(),
    sessionData: longtext("sessionData"), // Encrypted session data
    lastConnected: timestamp("lastConnected"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [index("idx_userId").on(table.userId)]
);

export type WhatsappAccount = typeof whatsappAccounts.$inferSelect;
export type InsertWhatsappAccount = typeof whatsappAccounts.$inferInsert;

/**
 * CRM Contacts
 */
export const contacts = mysqlTable(
  "contacts",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    whatsappAccountId: int("whatsappAccountId").notNull(),
    phoneNumber: varchar("phoneNumber", { length: 20 }).notNull(),
    name: varchar("name", { length: 255 }),
    email: varchar("email", { length: 320 }),
    address: text("address"),
    tags: json("tags").$type<string[]>().default([]).notNull(), // ["vip", "prospect", "customer"]
    notes: longtext("notes"),
    leadScore: int("leadScore").default(0).notNull(), // 0-100
    leadStatus: mysqlEnum("leadStatus", [
      "cold",
      "warm",
      "hot",
      "qualified",
      "customer",
      "inactive",
    ])
      .default("cold")
      .notNull(),
    lastInteraction: timestamp("lastInteraction"),
    lifetimeValue: decimal("lifetimeValue", { precision: 12, scale: 2 }).default("0").notNull(),
    preferredProducts: json("preferredProducts").$type<number[]>().default([]).notNull(),
    customFields: json("customFields").$type<Record<string, unknown>>().default({}).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_userId_phoneNumber").on(table.userId, table.phoneNumber),
    index("idx_leadStatus").on(table.leadStatus),
  ]
);

export type Contact = typeof contacts.$inferSelect;
export type InsertContact = typeof contacts.$inferInsert;

/**
 * Conversations & Message History
 */
export const conversations = mysqlTable(
  "conversations",
  {
    id: int("id").autoincrement().primaryKey(),
    contactId: int("contactId").notNull(),
    whatsappAccountId: int("whatsappAccountId").notNull(),
    lastMessageAt: timestamp("lastMessageAt").defaultNow().notNull(),
    messageCount: int("messageCount").default(0).notNull(),
    summary: mediumtext("summary"), // AI-generated summary
    context: longtext("context"), // Conversation context for AI
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [index("idx_contactId").on(table.contactId)]
);

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = typeof conversations.$inferInsert;

/**
 * Messages
 */
export const messages = mysqlTable(
  "messages",
  {
    id: int("id").autoincrement().primaryKey(),
    conversationId: int("conversationId").notNull(),
    contactId: int("contactId").notNull(),
    whatsappAccountId: int("whatsappAccountId").notNull(),
    direction: mysqlEnum("direction", ["inbound", "outbound"]).notNull(),
    messageType: mysqlEnum("messageType", ["text", "image", "document", "audio", "video", "location"])
      .default("text")
      .notNull(),
    content: longtext("content").notNull(),
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
    index("idx_conversationId").on(table.conversationId),
    index("idx_timestamp").on(table.timestamp),
  ]
);

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

/**
 * Products & Catalog
 */
export const products = mysqlTable(
  "products",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    description: longtext("description"),
    category: varchar("category", { length: 100 }),
    price: decimal("price", { precision: 12, scale: 2 }).notNull(),
    costPrice: decimal("costPrice", { precision: 12, scale: 2 }),
    imageUrl: varchar("imageUrl", { length: 2048 }),
    imageKey: varchar("imageKey", { length: 255 }), // S3 key
    sku: varchar("sku", { length: 100 }).unique(),
    isActive: boolean("isActive").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_userId").on(table.userId),
    index("idx_category").on(table.category),
  ]
);

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

/**
 * Inventory
 */
export const inventory = mysqlTable(
  "inventory",
  {
    id: int("id").autoincrement().primaryKey(),
    productId: int("productId").notNull().unique(),
    quantity: int("quantity").default(0).notNull(),
    lowStockThreshold: int("lowStockThreshold").default(10).notNull(),
    lastRestockDate: timestamp("lastRestockDate"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [index("idx_productId").on(table.productId)]
);

export type Inventory = typeof inventory.$inferSelect;
export type InsertInventory = typeof inventory.$inferInsert;

/**
 * Orders
 */
export const orders = mysqlTable(
  "orders",
  {
    id: int("id").autoincrement().primaryKey(),
    contactId: int("contactId").notNull(),
    whatsappAccountId: int("whatsappAccountId").notNull(),
    orderNumber: varchar("orderNumber", { length: 50 }).notNull().unique(),
    status: mysqlEnum("status", [
      "pending",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
      "refunded",
    ])
      .default("pending")
      .notNull(),
    paymentStatus: mysqlEnum("paymentStatus", ["pending", "paid", "unpaid", "refunded"])
      .default("pending")
      .notNull(),
    totalAmount: decimal("totalAmount", { precision: 12, scale: 2 }).notNull(),
    taxAmount: decimal("taxAmount", { precision: 12, scale: 2 }).default("0").notNull(),
    discountAmount: decimal("discountAmount", { precision: 12, scale: 2 }).default("0").notNull(),
    deliveryAddress: text("deliveryAddress"),
    deliveryMethod: varchar("deliveryMethod", { length: 50 }), // "pickup", "delivery", "courier"
    aiSummary: mediumtext("aiSummary"), // AI-generated order summary
    notes: longtext("notes"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_contactId").on(table.contactId),
    index("idx_status").on(table.status),
    index("idx_paymentStatus").on(table.paymentStatus),
  ]
);

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

/**
 * Order Items
 */
export const orderItems = mysqlTable(
  "order_items",
  {
    id: int("id").autoincrement().primaryKey(),
    orderId: int("orderId").notNull(),
    productId: int("productId").notNull(),
    quantity: int("quantity").notNull(),
    unitPrice: decimal("unitPrice", { precision: 12, scale: 2 }).notNull(),
    totalPrice: decimal("totalPrice", { precision: 12, scale: 2 }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [index("idx_orderId").on(table.orderId)]
);

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = typeof orderItems.$inferInsert;

/**
 * Payments
 */
export const payments = mysqlTable(
  "payments",
  {
    id: int("id").autoincrement().primaryKey(),
    orderId: int("orderId").notNull(),
    amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
    paymentMethod: varchar("paymentMethod", { length: 50 }).notNull(), // "bank_transfer", "cash", "card"
    status: mysqlEnum("status", ["pending", "paid", "unpaid", "refunded"])
      .default("pending")
      .notNull(),
    bankName: varchar("bankName", { length: 100 }),
    accountName: varchar("accountName", { length: 100 }),
    accountNumber: varchar("accountNumber", { length: 50 }),
    referenceNumber: varchar("referenceNumber", { length: 100 }),
    receiptUrl: varchar("receiptUrl", { length: 2048 }),
    receiptKey: varchar("receiptKey", { length: 255 }), // S3 key
    receiptMetadata: json("receiptMetadata").$type<Record<string, unknown>>().default({}).notNull(),
    verificationNotes: longtext("verificationNotes"),
    verifiedAt: timestamp("verifiedAt"),
    verifiedBy: int("verifiedBy"), // User ID
    paidAt: timestamp("paidAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_orderId").on(table.orderId),
    index("idx_status").on(table.status),
  ]
);

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

/**
 * Knowledge Base Documents
 */
export const knowledgeBase = mysqlTable(
  "knowledge_base",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    content: longtext("content").notNull(),
    fileUrl: varchar("fileUrl", { length: 2048 }),
    fileKey: varchar("fileKey", { length: 255 }), // S3 key
    fileType: varchar("fileType", { length: 20 }), // "pdf", "docx", "txt", "md", "excel"
    chunks: json("chunks").$type<Array<{ text: string; embedding?: number[] }>>().default([]).notNull(),
    isActive: boolean("isActive").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [index("idx_userId").on(table.userId)]
);

export type KnowledgeBase = typeof knowledgeBase.$inferSelect;
export type InsertKnowledgeBase = typeof knowledgeBase.$inferInsert;

/**
 * Broadcast Campaigns
 */
export const broadcastCampaigns = mysqlTable(
  "broadcast_campaigns",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    whatsappAccountId: int("whatsappAccountId").notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    message: longtext("message").notNull(),
    targetTags: json("targetTags").$type<string[]>().default([]).notNull(),
    targetLeadStatus: json("targetLeadStatus").$type<string[]>().default([]).notNull(),
    status: mysqlEnum("status", ["draft", "scheduled", "running", "completed", "cancelled"])
      .default("draft")
      .notNull(),
    scheduledAt: timestamp("scheduledAt"),
    startedAt: timestamp("startedAt"),
    completedAt: timestamp("completedAt"),
    totalContacts: int("totalContacts").default(0).notNull(),
    sentCount: int("sentCount").default(0).notNull(),
    failedCount: int("failedCount").default(0).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_userId").on(table.userId),
    index("idx_status").on(table.status),
  ]
);

export type BroadcastCampaign = typeof broadcastCampaigns.$inferSelect;
export type InsertBroadcastCampaign = typeof broadcastCampaigns.$inferInsert;

/**
 * Automation Rules
 */
export const automationRules = mysqlTable(
  "automation_rules",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    whatsappAccountId: int("whatsappAccountId").notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    trigger: mysqlEnum("trigger", [
      "keyword",
      "time_based",
      "lead_status_change",
      "order_status_change",
      "payment_received",
    ]).notNull(),
    triggerValue: varchar("triggerValue", { length: 500 }), // keyword, time delay, etc.
    action: mysqlEnum("action", [
      "send_message",
      "create_order",
      "update_lead_status",
      "send_product_list",
      "request_payment",
    ]).notNull(),
    actionValue: longtext("actionValue"), // Message template, product IDs, etc.
    isActive: boolean("isActive").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_userId").on(table.userId),
    index("idx_trigger").on(table.trigger),
  ]
);

export type AutomationRule = typeof automationRules.$inferSelect;
export type InsertAutomationRule = typeof automationRules.$inferInsert;

/**
 * Drip Sequences (Time-based follow-ups)
 */
export const dripSequences = mysqlTable(
  "drip_sequences",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    whatsappAccountId: int("whatsappAccountId").notNull(),
    contactId: int("contactId").notNull(),
    sequenceName: varchar("sequenceName", { length: 255 }).notNull(),
    step: int("step").notNull(), // 1, 2, 3, etc.
    delayHours: int("delayHours").notNull(), // Hours after previous step
    message: longtext("message").notNull(),
    scheduledAt: timestamp("scheduledAt"),
    sentAt: timestamp("sentAt"),
    status: mysqlEnum("status", ["pending", "scheduled", "sent", "failed", "skipped"])
      .default("pending")
      .notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_contactId").on(table.contactId),
    index("idx_status").on(table.status),
  ]
);

export type DripSequence = typeof dripSequences.$inferSelect;
export type InsertDripSequence = typeof dripSequences.$inferInsert;

/**
 * Analytics Events
 */
export const analyticsEvents = mysqlTable(
  "analytics_events",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    whatsappAccountId: int("whatsappAccountId").notNull(),
    eventType: mysqlEnum("eventType", [
      "message_received",
      "message_sent",
      "order_created",
      "payment_received",
      "contact_created",
      "lead_qualified",
    ]).notNull(),
    contactId: int("contactId"),
    orderId: int("orderId"),
    paymentId: int("paymentId"),
    metadata: json("metadata").$type<Record<string, unknown>>().default({}).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [
    index("idx_userId_eventType").on(table.userId, table.eventType),
    index("idx_createdAt").on(table.createdAt),
  ]
);

export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type InsertAnalyticsEvent = typeof analyticsEvents.$inferInsert;

/**
 * Business Configuration
 */
export const businessConfig = mysqlTable(
  "business_config",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().unique(),
    businessName: varchar("businessName", { length: 255 }),
    businessDescription: longtext("businessDescription"),
    businessLogo: varchar("businessLogo", { length: 2048 }),
    businessLogoKey: varchar("businessLogoKey", { length: 255 }), // S3 key
    aiSystemPrompt: longtext("aiSystemPrompt"), // Customizable AI system prompt
    aiModel: varchar("aiModel", { length: 50 }).default("mixtral-8x7b-32768").notNull(),
    bankName: varchar("bankName", { length: 100 }),
    bankAccountName: varchar("bankAccountName", { length: 100 }),
    bankAccountNumber: varchar("bankAccountNumber", { length: 50 }),
    bankPaymentInstructions: longtext("bankPaymentInstructions"),
    timezone: varchar("timezone", { length: 50 }).default("UTC").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [index("idx_userId").on(table.userId)]
);

export type BusinessConfig = typeof businessConfig.$inferSelect;
export type InsertBusinessConfig = typeof businessConfig.$inferInsert;

CREATE TABLE `analytics_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`whatsappAccountId` int NOT NULL,
	`eventType` enum('message_received','message_sent','order_created','payment_received','contact_created','lead_qualified') NOT NULL,
	`contactId` int,
	`orderId` int,
	`paymentId` int,
	`metadata` json NOT NULL DEFAULT ('{}'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `analytics_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `automation_rules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`whatsappAccountId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`trigger` enum('keyword','time_based','lead_status_change','order_status_change','payment_received') NOT NULL,
	`triggerValue` varchar(500),
	`action` enum('send_message','create_order','update_lead_status','send_product_list','request_payment') NOT NULL,
	`actionValue` longtext,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `automation_rules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `broadcast_campaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`whatsappAccountId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`message` longtext NOT NULL,
	`targetTags` json NOT NULL DEFAULT ('[]'),
	`targetLeadStatus` json NOT NULL DEFAULT ('[]'),
	`status` enum('draft','scheduled','running','completed','cancelled') NOT NULL DEFAULT 'draft',
	`scheduledAt` timestamp,
	`startedAt` timestamp,
	`completedAt` timestamp,
	`totalContacts` int NOT NULL DEFAULT 0,
	`sentCount` int NOT NULL DEFAULT 0,
	`failedCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `broadcast_campaigns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `business_config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`businessName` varchar(255),
	`businessDescription` longtext,
	`businessLogo` varchar(2048),
	`businessLogoKey` varchar(255),
	`aiSystemPrompt` longtext,
	`aiModel` varchar(50) NOT NULL DEFAULT 'mixtral-8x7b-32768',
	`bankName` varchar(100),
	`bankAccountName` varchar(100),
	`bankAccountNumber` varchar(50),
	`bankPaymentInstructions` longtext,
	`timezone` varchar(50) NOT NULL DEFAULT 'UTC',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `business_config_id` PRIMARY KEY(`id`),
	CONSTRAINT `business_config_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `contacts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`whatsappAccountId` int NOT NULL,
	`phoneNumber` varchar(20) NOT NULL,
	`name` varchar(255),
	`email` varchar(320),
	`address` text,
	`tags` json NOT NULL DEFAULT ('[]'),
	`notes` longtext,
	`leadScore` int NOT NULL DEFAULT 0,
	`leadStatus` enum('cold','warm','hot','qualified','customer','inactive') NOT NULL DEFAULT 'cold',
	`lastInteraction` timestamp,
	`lifetimeValue` decimal(12,2) NOT NULL DEFAULT '0',
	`preferredProducts` json NOT NULL DEFAULT ('[]'),
	`customFields` json NOT NULL DEFAULT ('{}'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contacts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `conversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contactId` int NOT NULL,
	`whatsappAccountId` int NOT NULL,
	`lastMessageAt` timestamp NOT NULL DEFAULT (now()),
	`messageCount` int NOT NULL DEFAULT 0,
	`summary` mediumtext,
	`context` longtext,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `conversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `drip_sequences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`whatsappAccountId` int NOT NULL,
	`contactId` int NOT NULL,
	`sequenceName` varchar(255) NOT NULL,
	`step` int NOT NULL,
	`delayHours` int NOT NULL,
	`message` longtext NOT NULL,
	`scheduledAt` timestamp,
	`sentAt` timestamp,
	`status` enum('pending','scheduled','sent','failed','skipped') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `drip_sequences_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inventory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`quantity` int NOT NULL DEFAULT 0,
	`lowStockThreshold` int NOT NULL DEFAULT 10,
	`lastRestockDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `inventory_id` PRIMARY KEY(`id`),
	CONSTRAINT `inventory_productId_unique` UNIQUE(`productId`)
);
--> statement-breakpoint
CREATE TABLE `knowledge_base` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` longtext NOT NULL,
	`fileUrl` varchar(2048),
	`fileKey` varchar(255),
	`fileType` varchar(20),
	`chunks` json NOT NULL DEFAULT ('[]'),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `knowledge_base_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationId` int NOT NULL,
	`contactId` int NOT NULL,
	`whatsappAccountId` int NOT NULL,
	`direction` enum('inbound','outbound') NOT NULL,
	`messageType` enum('text','image','document','audio','video','location') NOT NULL DEFAULT 'text',
	`content` longtext NOT NULL,
	`mediaUrl` varchar(2048),
	`mediaKey` varchar(255),
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	`isFromAI` boolean NOT NULL DEFAULT false,
	`aiIntent` varchar(100),
	`aiConfidence` decimal(3,2),
	`toolCalls` json NOT NULL DEFAULT ('[]'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`productId` int NOT NULL,
	`quantity` int NOT NULL,
	`unitPrice` decimal(12,2) NOT NULL,
	`totalPrice` decimal(12,2) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `order_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contactId` int NOT NULL,
	`whatsappAccountId` int NOT NULL,
	`orderNumber` varchar(50) NOT NULL,
	`status` enum('pending','processing','shipped','delivered','cancelled','refunded') NOT NULL DEFAULT 'pending',
	`paymentStatus` enum('pending','paid','unpaid','refunded') NOT NULL DEFAULT 'pending',
	`totalAmount` decimal(12,2) NOT NULL,
	`taxAmount` decimal(12,2) NOT NULL DEFAULT '0',
	`discountAmount` decimal(12,2) NOT NULL DEFAULT '0',
	`deliveryAddress` text,
	`deliveryMethod` varchar(50),
	`aiSummary` mediumtext,
	`notes` longtext,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `orders_orderNumber_unique` UNIQUE(`orderNumber`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`paymentMethod` varchar(50) NOT NULL,
	`status` enum('pending','paid','unpaid','refunded') NOT NULL DEFAULT 'pending',
	`bankName` varchar(100),
	`accountName` varchar(100),
	`accountNumber` varchar(50),
	`referenceNumber` varchar(100),
	`receiptUrl` varchar(2048),
	`receiptKey` varchar(255),
	`receiptMetadata` json NOT NULL DEFAULT ('{}'),
	`verificationNotes` longtext,
	`verifiedAt` timestamp,
	`verifiedBy` int,
	`paidAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` longtext,
	`category` varchar(100),
	`price` decimal(12,2) NOT NULL,
	`costPrice` decimal(12,2),
	`imageUrl` varchar(2048),
	`imageKey` varchar(255),
	`sku` varchar(100),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`),
	CONSTRAINT `products_sku_unique` UNIQUE(`sku`)
);
--> statement-breakpoint
CREATE TABLE `whatsapp_accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`accountName` varchar(255) NOT NULL,
	`phoneNumber` varchar(20) NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`sessionData` longtext,
	`lastConnected` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `whatsapp_accounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `whatsapp_accounts_phoneNumber_unique` UNIQUE(`phoneNumber`)
);
--> statement-breakpoint
CREATE INDEX `idx_userId_eventType` ON `analytics_events` (`userId`,`eventType`);--> statement-breakpoint
CREATE INDEX `idx_createdAt` ON `analytics_events` (`createdAt`);--> statement-breakpoint
CREATE INDEX `idx_userId` ON `automation_rules` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_trigger` ON `automation_rules` (`trigger`);--> statement-breakpoint
CREATE INDEX `idx_userId` ON `broadcast_campaigns` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_status` ON `broadcast_campaigns` (`status`);--> statement-breakpoint
CREATE INDEX `idx_userId` ON `business_config` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_userId_phoneNumber` ON `contacts` (`userId`,`phoneNumber`);--> statement-breakpoint
CREATE INDEX `idx_leadStatus` ON `contacts` (`leadStatus`);--> statement-breakpoint
CREATE INDEX `idx_contactId` ON `conversations` (`contactId`);--> statement-breakpoint
CREATE INDEX `idx_contactId` ON `drip_sequences` (`contactId`);--> statement-breakpoint
CREATE INDEX `idx_status` ON `drip_sequences` (`status`);--> statement-breakpoint
CREATE INDEX `idx_productId` ON `inventory` (`productId`);--> statement-breakpoint
CREATE INDEX `idx_userId` ON `knowledge_base` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_conversationId` ON `messages` (`conversationId`);--> statement-breakpoint
CREATE INDEX `idx_timestamp` ON `messages` (`timestamp`);--> statement-breakpoint
CREATE INDEX `idx_orderId` ON `order_items` (`orderId`);--> statement-breakpoint
CREATE INDEX `idx_contactId` ON `orders` (`contactId`);--> statement-breakpoint
CREATE INDEX `idx_status` ON `orders` (`status`);--> statement-breakpoint
CREATE INDEX `idx_paymentStatus` ON `orders` (`paymentStatus`);--> statement-breakpoint
CREATE INDEX `idx_orderId` ON `payments` (`orderId`);--> statement-breakpoint
CREATE INDEX `idx_status` ON `payments` (`status`);--> statement-breakpoint
CREATE INDEX `idx_userId` ON `products` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_category` ON `products` (`category`);--> statement-breakpoint
CREATE INDEX `idx_userId` ON `whatsapp_accounts` (`userId`);
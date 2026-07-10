import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import {
  getWhatsappAccountsByUser,
  upsertWhatsappAccount,
  getContactsByUser,
  getOrdersByContact,
  getProductsByUser,
  getBusinessConfig,
  upsertBusinessConfig,
  createOrder,
  createOrderItem,
  createPayment,
  getAnalyticsEventsByUser,
  createAnalyticsEvent,
  getKnowledgeBaseByUser,
  createKnowledgeBase,
} from "./db";
import {
  sendMessage,
  sendMediaMessage,
  connectWhatsAppAccount,
  disconnectWhatsAppAccount,
  getConnectionState,
} from "./services/whatsapp";
import { generateAIResponse } from "./services/ai";

/** There is no login flow — every request resolves to the single owner user. */
export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
  }),

  // WhatsApp Accounts
  whatsapp: router({
    getAccounts: protectedProcedure.query(async ({ ctx }) => {
      return getWhatsappAccountsByUser(ctx.user.id);
    }),

    /** Ensures a default account row exists for the owner and returns it. */
    getOrCreateDefaultAccount: protectedProcedure.mutation(async ({ ctx }) => {
      const existing = await getWhatsappAccountsByUser(ctx.user.id);
      if (existing.length > 0) return existing[0];
      return upsertWhatsappAccount({
        userId: ctx.user.id,
        accountName: "My WhatsApp",
        phoneNumber: `pending-${ctx.user.id}`,
        isActive: false,
      });
    }),

    /** Starts (or restarts) the Baileys connection and begins emitting a QR code to scan. */
    connect: protectedProcedure
      .input(z.object({ whatsappAccountId: z.number() }))
      .mutation(async ({ input }) => {
        await connectWhatsAppAccount(input.whatsappAccountId);
        return { success: true };
      }),

    disconnect: protectedProcedure
      .input(z.object({ whatsappAccountId: z.number() }))
      .mutation(async ({ input }) => {
        await disconnectWhatsAppAccount(input.whatsappAccountId);
        return { success: true };
      }),

    /** Poll this for the QR code / connection status while pairing. */
    getStatus: protectedProcedure
      .input(z.object({ whatsappAccountId: z.number() }))
      .query(async ({ input }) => {
        return getConnectionState(input.whatsappAccountId);
      }),

    sendMessage: protectedProcedure
      .input(
        z.object({
          whatsappAccountId: z.number(),
          phoneNumber: z.string(),
          message: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await sendMessage(input.whatsappAccountId, input.phoneNumber, input.message);
        return { success: true };
      }),
  }),

  // Contacts & CRM
  contacts: router({
    getContacts: protectedProcedure.query(async ({ ctx }) => {
      return getContactsByUser(ctx.user.id);
    }),

    getContactDetails: protectedProcedure
      .input(z.object({ contactId: z.number() }))
      .query(async ({ input }) => {
        // Get contact with orders and conversation history
        const orders = await getOrdersByContact(input.contactId);
        return { contactId: input.contactId, orders };
      }),

    updateContactTags: protectedProcedure
      .input(
        z.object({
          contactId: z.number(),
          tags: z.array(z.string()),
        })
      )
      .mutation(async ({ input }) => {
        return { success: true };
      }),
  }),

  // Products
  products: router({
    getProducts: protectedProcedure.query(async ({ ctx }) => {
      return getProductsByUser(ctx.user.id);
    }),

    searchProducts: protectedProcedure
      .input(z.object({ query: z.string() }))
      .query(async ({ ctx, input }) => {
        // Search products by name or description
        const products = await getProductsByUser(ctx.user.id);
        const query = input.query.toLowerCase();
        return products.filter(
          (p) =>
            p.name.toLowerCase().includes(query) ||
            (p.description && p.description.toLowerCase().includes(query))
        );
      }),
  }),

  // Orders
  orders: router({
    getOrders: protectedProcedure.query(async ({ ctx }) => {
      // Get all orders for user's contacts
      return { success: true, orders: [] };
    }),

    createOrder: protectedProcedure
      .input(
        z.object({
          contactId: z.number(),
          whatsappAccountId: z.number(),
          items: z.array(
            z.object({
              productId: z.number(),
              quantity: z.number(),
              unitPrice: z.number(),
            })
          ),
          totalAmount: z.number(),
          deliveryAddress: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const orderNumber = `ORD-${Date.now()}`;
        const result = await createOrder({
          contactId: input.contactId,
          whatsappAccountId: input.whatsappAccountId,
          orderNumber,
          totalAmount: input.totalAmount.toString() as any,
          deliveryAddress: input.deliveryAddress,
        });

        // Create order items
        for (const item of input.items) {
          await createOrderItem({
            orderId: (result as any).insertId || 0,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice.toString() as any,
            totalPrice: (item.quantity * item.unitPrice).toString() as any,
          });
        }

        // Log analytics
        await createAnalyticsEvent({
          userId: ctx.user.id,
          whatsappAccountId: input.whatsappAccountId,
          eventType: "order_created",
          contactId: input.contactId,
          metadata: { orderNumber, totalAmount: input.totalAmount },
        });

        return { success: true, orderNumber };
      }),
  }),

  // Payments
  payments: router({
    recordPayment: protectedProcedure
      .input(
        z.object({
          orderId: z.number(),
          amount: z.number(),
          paymentMethod: z.string(),
          receiptUrl: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const result = await createPayment({
          orderId: input.orderId,
          amount: input.amount.toString() as any,
          paymentMethod: input.paymentMethod,
          receiptUrl: input.receiptUrl,
          status: "pending",
        });

        return { success: true, paymentId: (result as any).insertId };
      }),
  }),

  // AI & Messaging
  ai: router({
    generateResponse: protectedProcedure
      .input(
        z.object({
          whatsappAccountId: z.number(),
          phoneNumber: z.string(),
          message: z.string(),
          conversationHistory: z.array(
            z.object({
              role: z.enum(["user", "assistant", "system"]),
              content: z.string(),
            })
          ),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const response = await generateAIResponse(
          ctx.user.id,
          input.whatsappAccountId,
          input.conversationHistory,
          input.message
        );

        // Send AI response via WhatsApp
        await sendMessage(input.whatsappAccountId, input.phoneNumber, response.text);

        return response;
      }),
  }),

  // Business Configuration
  config: router({
    getConfig: protectedProcedure.query(async ({ ctx }) => {
      return getBusinessConfig(ctx.user.id);
    }),

    updateConfig: protectedProcedure
      .input(
        z.object({
          businessName: z.string().optional(),
          businessDescription: z.string().optional(),
          aiSystemPrompt: z.string().optional(),
          bankName: z.string().optional(),
          bankAccountName: z.string().optional(),
          bankAccountNumber: z.string().optional(),
          bankPaymentInstructions: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const updated = await upsertBusinessConfig({
          userId: ctx.user.id,
          businessName: input.businessName,
          businessDescription: input.businessDescription,
          aiSystemPrompt: input.aiSystemPrompt,
          bankName: input.bankName,
          bankAccountName: input.bankAccountName,
          bankAccountNumber: input.bankAccountNumber,
          bankPaymentInstructions: input.bankPaymentInstructions,
        });

        return { success: true, config: updated };
      }),
  }),

  // Knowledge Base
  knowledgeBase: router({
    getEntries: protectedProcedure.query(async ({ ctx }) => {
      return getKnowledgeBaseByUser(ctx.user.id);
    }),

    createEntry: protectedProcedure
      .input(
        z.object({
          title: z.string(),
          content: z.string(),
          fileType: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const entry = await createKnowledgeBase({
          userId: ctx.user.id,
          title: input.title,
          content: input.content,
          fileType: input.fileType,
        });
        return { success: true, entry };
      }),
  }),

  // Analytics
  analytics: router({
    getMetrics: protectedProcedure
      .input(z.object({ days: z.number().default(30) }))
      .query(async ({ ctx, input }) => {
        const events = await getAnalyticsEventsByUser(ctx.user.id, undefined, input.days);

        // Calculate metrics
        const metrics = {
          totalMessages: events.filter((e) => e.eventType === "message_sent" || e.eventType === "message_received").length,
          totalOrders: events.filter((e) => e.eventType === "order_created").length,
          totalPayments: events.filter((e) => e.eventType === "payment_received").length,
          totalContacts: events.filter((e) => e.eventType === "contact_created").length,
        };

        return metrics;
      }),
  }),
});

export type AppRouter = typeof appRouter;

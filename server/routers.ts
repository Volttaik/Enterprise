import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import {
  signToken,
  verifyPassword,
  hashPassword,
  setCookie,
  clearCookie,
} from "./_core/auth";
import { z } from "zod";
import { randomUUID } from "crypto";
import {
  getWhatsappAccountsByUser,
  getWhatsappAccountById,
  upsertWhatsappAccount,
  getContactsByUser,
  getContactById,
  getOrdersByContact,
  getOrderById,
  getProductsByUser,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  upsertInventory,
  getInventoryByProductId,
  getBusinessConfig,
  upsertBusinessConfig,
  createOrder,
  createOrderItem,
  createPayment,
  updatePayment,
  getAnalyticsEventsByUser,
  createAnalyticsEvent,
  getKnowledgeBaseByUser,
  createKnowledgeBase,
  getUserByEmail,
  createUser,
  getOrdersByUser,
} from "./db";
import {
  sendMessage,
  sendMediaMessage,
  connectWhatsAppAccount,
  disconnectWhatsAppAccount,
  getConnectionState,
  requestPhonePairingCode,
} from "./services/whatsapp";
import { generateAIResponse } from "./services/ai";
import { TRPCError } from "@trpc/server";
import { storagePut } from "./storage";

/** Sends a WhatsApp message to the business owner's notification number, if configured. */
async function notifyOwner(userId: number, text: string) {
  try {
    const config = await getBusinessConfig(userId);
    if (!config?.ownerNotificationPhone) return;
    const accounts = await getWhatsappAccountsByUser(userId);
    const activeAccount = accounts.find((a) => a.isActive) ?? accounts[0];
    if (!activeAccount) return;
    await sendMessage(activeAccount.id, config.ownerNotificationPhone, text);
  } catch (error) {
    console.warn("[notifyOwner] Failed to send owner notification:", error);
  }
}

// ─── Ownership helpers ─────────────────────────────────────────────────────

/** Throws FORBIDDEN if the WhatsApp account doesn't belong to the requesting user. */
async function assertAccountOwnership(userId: number, whatsappAccountId: number) {
  const account = await getWhatsappAccountById(whatsappAccountId);
  if (!account || account.userId !== userId) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Access denied." });
  }
  return account;
}

/** Throws FORBIDDEN if the contact doesn't belong to the requesting user. */
async function assertContactOwnership(userId: number, contactId: number) {
  const contact = await getContactById(contactId);
  if (!contact || contact.userId !== userId) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Access denied." });
  }
  return contact;
}

/** Throws FORBIDDEN if the order's WhatsApp account doesn't belong to the user. */
async function assertOrderOwnership(userId: number, orderId: number) {
  const order = await getOrderById(orderId);
  if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "Order not found." });
  const account = await getWhatsappAccountById(order.whatsappAccountId);
  if (!account || account.userId !== userId) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Access denied." });
  }
  return order;
}

// ─── Router ───────────────────────────────────────────────────────────────

export const appRouter = router({
  system: systemRouter,

  // ─── Auth ──────────────────────────────────────────────────────────────
  auth: router({
    me: publicProcedure.query((opts) => {
      if (!opts.ctx.user) return null;
      const { passwordHash, openId, ...safe } = opts.ctx.user;
      return safe;
    }),

    register: publicProcedure
      .input(
        z.object({
          name: z.string().min(2).max(100),
          email: z.string().email(),
          password: z.string().min(8).max(128),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const existing = await getUserByEmail(input.email);
        if (existing) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "An account with this email already exists.",
          });
        }

        const passwordHash = await hashPassword(input.password);
        const user = await createUser({
          openId: randomUUID(),
          name: input.name,
          email: input.email,
          passwordHash,
          loginMethod: "email",
          role: "user",
          lastSignedIn: new Date(),
        });

        if (!user) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create account." });
        }

        const token = await signToken({
          sub: String(user.id),
          email: user.email ?? "",
          role: user.role,
          name: user.name,
        });

        setCookie(ctx.res, token);
        const { passwordHash: _, openId: __, ...safe } = user;
        return { user: safe };
      }),

    login: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          password: z.string().min(1),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const user = await getUserByEmail(input.email);
        if (!user || !user.passwordHash) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid email or password.",
          });
        }

        const valid = await verifyPassword(input.password, user.passwordHash);
        if (!valid) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid email or password.",
          });
        }

        const token = await signToken({
          sub: String(user.id),
          email: user.email ?? "",
          role: user.role,
          name: user.name,
        });

        setCookie(ctx.res, token);
        const { passwordHash: _, openId: __, ...safe } = user;
        return { user: safe };
      }),

    logout: protectedProcedure.mutation(({ ctx }) => {
      clearCookie(ctx.res);
      return { success: true };
    }),
  }),

  // ─── WhatsApp Accounts ────────────────────────────────────────────────
  whatsapp: router({
    getAccounts: protectedProcedure.query(async ({ ctx }) => {
      return getWhatsappAccountsByUser(ctx.user.id);
    }),

    getOrCreateDefaultAccount: protectedProcedure.mutation(async ({ ctx }) => {
      const existing = await getWhatsappAccountsByUser(ctx.user.id);
      const pendingUnpaired = existing.find((a) => a.phoneNumber.startsWith("pending-"));
      if (pendingUnpaired) return pendingUnpaired;
      if (existing.length > 0) return existing[0];
      return upsertWhatsappAccount({
        userId: ctx.user.id,
        accountName: "My WhatsApp",
        phoneNumber: `pending-${ctx.user.id}`,
        isActive: false,
      });
    }),

    createAdditionalAccount: protectedProcedure.mutation(async ({ ctx }) => {
      return upsertWhatsappAccount({
        userId: ctx.user.id,
        accountName: `WhatsApp ${randomUUID().slice(0, 4)}`,
        phoneNumber: `pending-${ctx.user.id}-${Date.now()}`,
        isActive: false,
      });
    }),

    connect: protectedProcedure
      .input(z.object({ whatsappAccountId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await assertAccountOwnership(ctx.user.id, input.whatsappAccountId);
        await connectWhatsAppAccount(input.whatsappAccountId);
        return { success: true };
      }),

    disconnect: protectedProcedure
      .input(z.object({ whatsappAccountId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await assertAccountOwnership(ctx.user.id, input.whatsappAccountId);
        await disconnectWhatsAppAccount(input.whatsappAccountId);
        return { success: true };
      }),

    getStatus: protectedProcedure
      .input(z.object({ whatsappAccountId: z.number() }))
      .query(async ({ ctx, input }) => {
        await assertAccountOwnership(ctx.user.id, input.whatsappAccountId);
        return getConnectionState(input.whatsappAccountId);
      }),

    requestPhoneCode: protectedProcedure
      .input(
        z.object({
          whatsappAccountId: z.number(),
          phoneNumber: z.string().min(7).max(20),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await assertAccountOwnership(ctx.user.id, input.whatsappAccountId);
        const code = await requestPhonePairingCode(
          input.whatsappAccountId,
          input.phoneNumber
        );
        return { code };
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
        await assertAccountOwnership(ctx.user.id, input.whatsappAccountId);
        await sendMessage(input.whatsappAccountId, input.phoneNumber, input.message);
        return { success: true };
      }),
  }),

  // ─── Contacts & CRM ──────────────────────────────────────────────────
  contacts: router({
    getContacts: protectedProcedure.query(async ({ ctx }) => {
      return getContactsByUser(ctx.user.id);
    }),

    getContactDetails: protectedProcedure
      .input(z.object({ contactId: z.number() }))
      .query(async ({ ctx, input }) => {
        await assertContactOwnership(ctx.user.id, input.contactId);
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
      .mutation(async ({ ctx, input }) => {
        await assertContactOwnership(ctx.user.id, input.contactId);
        return { success: true };
      }),
  }),

  // ─── Products ────────────────────────────────────────────────────────
  products: router({
    getProducts: protectedProcedure.query(async ({ ctx }) => {
      const list = await getProductsByUser(ctx.user.id);
      return Promise.all(
        list.map(async (p) => ({ ...p, inventory: await getInventoryByProductId(p.id) }))
      );
    }),

    searchProducts: protectedProcedure
      .input(z.object({ query: z.string() }))
      .query(async ({ ctx, input }) => {
        const allProducts = await getProductsByUser(ctx.user.id);
        const query = input.query.toLowerCase();
        return allProducts.filter(
          (p) =>
            p.name.toLowerCase().includes(query) ||
            (p.description && p.description.toLowerCase().includes(query))
        );
      }),

    createProduct: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1).max(255),
          description: z.string().optional(),
          category: z.string().optional(),
          price: z.number().min(0),
          discountPercent: z.number().min(0).max(100).default(0),
          sku: z.string().optional(),
          imageBase64: z.string().optional(),
          stock: z.number().min(0).default(0),
        })
      )
      .mutation(async ({ ctx, input }) => {
        let imageUrl: string | undefined;
        if (input.imageBase64) {
          const match = input.imageBase64.match(/^data:(image\/\w+);base64,(.+)$/);
          if (match) {
            const [, mimeType, base64Data] = match;
            const ext = mimeType.split("/")[1] || "png";
            const { url } = await storagePut(
              `products/${Date.now()}.${ext}`,
              Buffer.from(base64Data, "base64"),
              mimeType
            );
            imageUrl = url;
          }
        }

        const product = await createProduct({
          userId: ctx.user.id,
          name: input.name,
          description: input.description,
          category: input.category,
          price: input.price.toString() as any,
          discountPercent: input.discountPercent,
          sku: input.sku || undefined,
          imageUrl,
        });

        if (product) {
          await upsertInventory(product.id, input.stock);
        }

        return { success: true, product };
      }),

    updateProduct: protectedProcedure
      .input(
        z.object({
          productId: z.number(),
          name: z.string().min(1).max(255).optional(),
          description: z.string().optional(),
          category: z.string().optional(),
          price: z.number().min(0).optional(),
          discountPercent: z.number().min(0).max(100).optional(),
          sku: z.string().optional(),
          imageBase64: z.string().optional(),
          stock: z.number().min(0).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const existing = await getProductById(input.productId);
        if (!existing || existing.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Access denied." });
        }

        let imageUrl: string | undefined;
        if (input.imageBase64) {
          const match = input.imageBase64.match(/^data:(image\/\w+);base64,(.+)$/);
          if (match) {
            const [, mimeType, base64Data] = match;
            const ext = mimeType.split("/")[1] || "png";
            const { url } = await storagePut(
              `products/${Date.now()}.${ext}`,
              Buffer.from(base64Data, "base64"),
              mimeType
            );
            imageUrl = url;
          }
        }

        const product = await updateProduct(input.productId, {
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.description !== undefined ? { description: input.description } : {}),
          ...(input.category !== undefined ? { category: input.category } : {}),
          ...(input.price !== undefined ? { price: input.price.toString() as any } : {}),
          ...(input.discountPercent !== undefined ? { discountPercent: input.discountPercent } : {}),
          ...(input.sku !== undefined ? { sku: input.sku } : {}),
          ...(imageUrl ? { imageUrl } : {}),
        });

        if (input.stock !== undefined) {
          await upsertInventory(input.productId, input.stock);
        }

        return { success: true, product };
      }),

    deleteProduct: protectedProcedure
      .input(z.object({ productId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const existing = await getProductById(input.productId);
        if (!existing || existing.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Access denied." });
        }
        await deleteProduct(input.productId);
        return { success: true };
      }),
  }),

  // ─── Orders ──────────────────────────────────────────────────────────
  orders: router({
    getOrders: protectedProcedure.query(async ({ ctx }) => {
      const orders = await getOrdersByUser(ctx.user.id);
      return { success: true, orders };
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
        // Validate both the WhatsApp account and contact belong to this user
        await assertAccountOwnership(ctx.user.id, input.whatsappAccountId);
        await assertContactOwnership(ctx.user.id, input.contactId);

        // Validate every product in the order belongs to this user
        for (const item of input.items) {
          const product = await getProductById(item.productId);
          if (!product || product.userId !== ctx.user.id) {
            throw new TRPCError({ code: "FORBIDDEN", message: "Invalid product in order." });
          }
        }

        const orderNumber = `ORD-${Date.now()}`;
        const result = await createOrder({
          contactId: input.contactId,
          whatsappAccountId: input.whatsappAccountId,
          orderNumber,
          totalAmount: input.totalAmount.toString() as any,
          deliveryAddress: input.deliveryAddress,
        });

        for (const item of input.items) {
          await createOrderItem({
            orderId: (result as any)?.id ?? 0,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice.toString() as any,
            totalPrice: (item.quantity * item.unitPrice).toString() as any,
          });
        }

        await createAnalyticsEvent({
          userId: ctx.user.id,
          whatsappAccountId: input.whatsappAccountId,
          eventType: "order_created",
          contactId: input.contactId,
          metadata: { orderNumber, totalAmount: input.totalAmount },
        });

        const contact = await getContactById(input.contactId);
        const config = await getBusinessConfig(ctx.user.id);
        if (config?.notifyOnNewOrder !== false) {
          await notifyOwner(
            ctx.user.id,
            `🛒 New order ${orderNumber}\nCustomer: ${contact?.name || contact?.phoneNumber || "Unknown"}\nTotal: ${input.totalAmount.toLocaleString()}`
          );
        }

        return { success: true, orderNumber };
      }),
  }),

  // ─── Payments ────────────────────────────────────────────────────────
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
        // Validate the order belongs to this user before recording payment
        const order = await assertOrderOwnership(ctx.user.id, input.orderId);
        const result = await createPayment({
          orderId: input.orderId,
          amount: input.amount.toString() as any,
          paymentMethod: input.paymentMethod,
          receiptUrl: input.receiptUrl,
          status: "pending",
        });

        const contact = await getContactById(order.contactId);
        const config = await getBusinessConfig(ctx.user.id);
        if (config?.notifyOnPayment !== false) {
          await notifyOwner(
            ctx.user.id,
            `💰 Payment recorded for order ${order.orderNumber}\nCustomer: ${contact?.name || contact?.phoneNumber || "Unknown"}\nAmount: ${input.amount.toLocaleString()} via ${input.paymentMethod}`
          );
        }

        return { success: true, paymentId: (result as any)?.id };
      }),
  }),

  // ─── AI & Messaging ──────────────────────────────────────────────────
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
        await assertAccountOwnership(ctx.user.id, input.whatsappAccountId);
        const response = await generateAIResponse(
          ctx.user.id,
          input.whatsappAccountId,
          input.conversationHistory,
          input.message
        );
        await sendMessage(input.whatsappAccountId, input.phoneNumber, response.text);
        return response;
      }),
  }),

  // ─── Business Configuration ──────────────────────────────────────────
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
          ownerNotificationPhone: z.string().optional(),
          notifyOnNewOrder: z.boolean().optional(),
          notifyOnPayment: z.boolean().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const updated = await upsertBusinessConfig({
          userId: ctx.user.id,
          ...input,
        });
        return { success: true, config: updated };
      }),
  }),

  // ─── Knowledge Base ──────────────────────────────────────────────────
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

  // ─── Analytics ───────────────────────────────────────────────────────
  analytics: router({
    getMetrics: protectedProcedure
      .input(z.object({ days: z.number().default(30) }))
      .query(async ({ ctx, input }) => {
        const events = await getAnalyticsEventsByUser(ctx.user.id, undefined, input.days);
        return {
          totalMessages: events.filter(
            (e) => e.eventType === "message_sent" || e.eventType === "message_received"
          ).length,
          totalOrders: events.filter((e) => e.eventType === "order_created").length,
          totalPayments: events.filter((e) => e.eventType === "payment_received").length,
          totalContacts: events.filter((e) => e.eventType === "contact_created").length,
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;

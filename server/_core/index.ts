import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { restoreActiveWhatsAppSessions } from "../services/whatsapp";

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Body parsers
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // Cookie parser (needed for auth token cookie)
  app.use(cookieParser());

  registerStorageProxy(app);

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = parseInt(process.env.PORT || "3000");
  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });

  // Reconnect any WhatsApp accounts that were active before this process
  // started (e.g. after a crash/restart) — session state is memory-only.
  restoreActiveWhatsAppSessions().catch((error) => {
    console.error("[WhatsApp] Failed to restore active sessions:", error);
  });
}

startServer().catch(console.error);

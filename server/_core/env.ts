const cookieSecret = process.env.JWT_SECRET ?? process.env.SESSION_SECRET ?? "";

if (!cookieSecret) {
  throw new Error(
    "Missing auth secret: set JWT_SECRET (or SESSION_SECRET) before starting the server."
  );
}

export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret,
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  groqApiKey: process.env.GROQ_API_KEY ?? "",
  groqModel: process.env.GROQ_MODEL ?? "llama3-70b-8192",
  groqVisionModel: process.env.GROQ_VISION_MODEL ?? "llava-v1.5-7b-4096-preview",
  port: parseInt(process.env.PORT ?? "3000", 10),
  // Forge API (legacy stubs — not actively used in multi-tenant mode)
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
};

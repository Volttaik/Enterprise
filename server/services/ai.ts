import Groq from "groq-sdk";
import { getBusinessConfig, getKnowledgeBaseByUser, getProductsByUser } from "../db";

let groqClient: Groq | null = null;

if (process.env.GROQ_API_KEY) {
  groqClient = new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });
}

interface ConversationMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface AIResponse {
  text: string;
  intent: string;
  confidence: number;
  toolCalls: Array<{
    tool: string;
    args: Record<string, unknown>;
  }>;
  matchedProducts: Array<{
    id: number;
    name: string;
    price: string;
    imageUrl: string | null;
  }>;
}

/**
 * Finds products the AI's reply actually named, so the WhatsApp layer can
 * follow up the text with the product photo(s). Matching is done against the
 * AI's own response text (not the raw user message) so we only send images
 * for products the assistant is actively describing/recommending.
 */
function findMentionedProducts(
  responseText: string,
  products: Array<{ id: number; name: string; price: string; imageUrl: string | null }>
) {
  const lowerResponse = responseText.toLowerCase();
  return products.filter((p) => p.name && lowerResponse.includes(p.name.toLowerCase()));
}

/**
 * Uses Groq's vision model to describe/analyze an image (e.g. a product
 * photo, receipt, or screenshot a customer sent on WhatsApp).
 */
export async function analyzeImage(imageBase64: string, prompt?: string): Promise<string> {
  if (!groqClient) {
    return "";
  }
  try {
    const response = await groqClient.chat.completions.create({
      model: process.env.GROQ_VISION_MODEL || "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text:
                prompt ||
                "Describe what's in this image in detail. If it looks like a payment receipt or proof of payment, extract the amount, date, and reference number. If it looks like a product, describe it.",
            },
            {
              type: "image_url",
              image_url: { url: `data:image/jpeg;base64,${imageBase64}` },
            },
          ] as unknown as string,
        },
      ],
      temperature: 0.3,
      max_tokens: 512,
    });

    return response.choices[0]?.message?.content || "";
  } catch (error) {
    console.error("[AI] Failed to analyze image:", error);
    return "";
  }
}

export async function generateAIResponse(
  userId: number,
  whatsappAccountId: number,
  conversationHistory: ConversationMessage[],
  userMessage: string,
  imageDescription?: string
): Promise<AIResponse> {
  if (!groqClient) {
    return {
      text: "I'm sorry, the AI service is not configured. Please contact support.",
      intent: "error",
      confidence: 0,
      toolCalls: [],
      matchedProducts: [],
    };
  }
  try {
    // Get business config for custom system prompt
    const config = await getBusinessConfig(userId);
    const systemPrompt = config?.aiSystemPrompt || getDefaultSystemPrompt();

    // Get knowledge base for RAG
    const knowledgeBase = await getKnowledgeBaseByUser(userId);
    const ragContext = knowledgeBase
      .slice(0, 3)
      .map((kb) => `Title: ${kb.title}\nContent: ${kb.content}`)
      .join("\n\n");

    // Get products for context
    const products = await getProductsByUser(userId);
    const productContext = products
      .slice(0, 5)
      .map((p) => `${p.name}: $${p.price} - ${p.description}`)
      .join("\n");

    // Build system message with context
    const enhancedSystemPrompt = `${systemPrompt}

## Available Products:
${productContext}

## Business Knowledge:
${ragContext}

## Instructions:
- Respond naturally and conversationally
- If the user asks about products, reference the product list above
- If the user asks about business information, use the knowledge base
- For orders, confirm items, quantities, and delivery address
- For payments, provide bank details from business config
- Detect user intent (product_inquiry, order_status, payment_info, etc.)
- Respond with JSON for structured data when needed`;

    // Prepare messages for GROQ
    const effectiveUserMessage = imageDescription
      ? `${userMessage ? userMessage + "\n\n" : ""}[Customer sent an image. Here's what it shows: ${imageDescription}]`
      : userMessage;

    const messages: ConversationMessage[] = [
      ...conversationHistory,
      { role: "user", content: effectiveUserMessage },
    ];

    // Call GROQ API with streaming
    if (!groqClient) {
      throw new Error("GROQ_API_KEY not configured. Please set the environment variable.");
    }
    const response = await groqClient.chat.completions.create({
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: enhancedSystemPrompt },
        ...messages.map((m) => ({
          role: m.role as "user" | "assistant" | "system",
          content: m.content,
        })),
      ],
      temperature: 0.7,
      max_tokens: 1024,
      top_p: 1,
    });

    const responseText = response.choices[0]?.message?.content || "";

    // Parse intent and tool calls from response
    const { intent, confidence, toolCalls } = parseAIResponse(responseText);
    const matchedProducts = findMentionedProducts(responseText, products).map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      imageUrl: p.imageUrl,
    }));

    return {
      text: responseText,
      intent,
      confidence,
      toolCalls,
      matchedProducts,
    };
  } catch (error) {
    console.error("[AI] Failed to generate response:", error);
    throw error;
  }
}

export async function streamAIResponse(
  userId: number,
  whatsappAccountId: number,
  conversationHistory: ConversationMessage[],
  userMessage: string,
  onChunk: (chunk: string) => void
): Promise<void> {
  try {
    const config = await getBusinessConfig(userId);
    const systemPrompt = config?.aiSystemPrompt || getDefaultSystemPrompt();

    const knowledgeBase = await getKnowledgeBaseByUser(userId);
    const ragContext = knowledgeBase
      .slice(0, 3)
      .map((kb) => `Title: ${kb.title}\nContent: ${kb.content}`)
      .join("\n\n");

    const products = await getProductsByUser(userId);
    const productContext = products
      .slice(0, 5)
      .map((p) => `${p.name}: $${p.price} - ${p.description}`)
      .join("\n");

    const enhancedSystemPrompt = `${systemPrompt}

## Available Products:
${productContext}

## Business Knowledge:
${ragContext}

## Instructions:
- Respond naturally and conversationally
- If the user asks about products, reference the product list above
- If the user asks about business information, use the knowledge base
- For orders, confirm items, quantities, and delivery address
- For payments, provide bank details from business config
- Detect user intent (product_inquiry, order_status, payment_info, etc.)`;

    const messages: ConversationMessage[] = [
      ...conversationHistory,
      { role: "user", content: userMessage },
    ];

    if (!groqClient) {
      throw new Error("GROQ_API_KEY not configured. Please set the environment variable.");
    }
    const stream = await groqClient.chat.completions.create({
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: enhancedSystemPrompt },
        ...messages.map((m) => ({
          role: m.role as "user" | "assistant" | "system",
          content: m.content,
        })),
      ],
      temperature: 0.7,
      max_tokens: 1024,
      top_p: 1,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        onChunk(content);
      }
    }
  } catch (error) {
    console.error("[AI] Failed to stream response:", error);
    throw error;
  }
}

function parseAIResponse(response: string): {
  intent: string;
  confidence: number;
  toolCalls: Array<{ tool: string; args: Record<string, unknown> }>;
} {
  let intent = "general";
  let confidence = 0.5;
  const toolCalls: Array<{ tool: string; args: Record<string, unknown> }> = [];

  // Simple intent detection
  const lowerResponse = response.toLowerCase();

  if (
    lowerResponse.includes("product") ||
    lowerResponse.includes("item") ||
    lowerResponse.includes("catalog")
  ) {
    intent = "product_inquiry";
    confidence = 0.8;
  } else if (
    lowerResponse.includes("order") ||
    lowerResponse.includes("purchase") ||
    lowerResponse.includes("buy")
  ) {
    intent = "order_creation";
    confidence = 0.8;
  } else if (
    lowerResponse.includes("payment") ||
    lowerResponse.includes("bank") ||
    lowerResponse.includes("transfer")
  ) {
    intent = "payment_info";
    confidence = 0.8;
  } else if (
    lowerResponse.includes("status") ||
    lowerResponse.includes("track") ||
    lowerResponse.includes("where")
  ) {
    intent = "order_status";
    confidence = 0.8;
  } else if (
    lowerResponse.includes("help") ||
    lowerResponse.includes("support") ||
    lowerResponse.includes("question")
  ) {
    intent = "support_request";
    confidence = 0.7;
  }

  // Try to parse JSON tool calls if present
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.tool && parsed.args) {
        toolCalls.push(parsed);
      }
    }
  } catch (e) {
    // JSON parsing failed, continue without tool calls
  }

  return { intent, confidence, toolCalls };
}

function getDefaultSystemPrompt(): string {
  return `You are a professional WhatsApp business assistant for a company. Your role is to:
- Help customers find products and services
- Answer questions about the business
- Assist with order placement and tracking
- Provide payment information
- Handle customer inquiries professionally and courteously
- Be concise and clear in your responses
- Use WhatsApp-friendly formatting (no long paragraphs)
- Suggest relevant products when appropriate
- Always be helpful and friendly`;
}

export async function summarizeConversation(messages: ConversationMessage[]): Promise<string> {
  try {
    if (!groqClient) {
      throw new Error("GROQ_API_KEY not configured. Please set the environment variable.");
    }
    const response = await groqClient.chat.completions.create({
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content:
            "Summarize the following conversation in 2-3 sentences, focusing on the customer's intent and any important details.",
        },
        ...messages.map((m) => ({
          role: m.role as "user" | "assistant" | "system",
          content: m.content,
        })),
      ],
      temperature: 0.5,
      max_tokens: 256,
    });

    return response.choices[0]?.message?.content || "";
  } catch (error) {
    console.error("[AI] Failed to summarize conversation:", error);
    return "";
  }
}

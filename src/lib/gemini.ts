import { GoogleGenerativeAI } from "@google/generative-ai";
import { Workflow } from "@/types/workflow";

// Initialize Gemini API
// You need to set NEXT_PUBLIC_GEMINI_API_KEY in your .env.local file
const API_KEY = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

export async function parseWorkflowWithGemini(prompt: string): Promise<Workflow | null> {
  if (!API_KEY) {
    console.warn("Gemini API key not found");
    return null;
  }

  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    // Use gemini-pro as it is widely available, or try gemini-1.5-flash if you have access
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const systemPrompt = `
    You are a trading strategy parser. Convert the user's natural language trading strategy into a structured JSON workflow.
    
    The output must be a valid JSON object matching this TypeScript interface:
    
    interface Workflow {
      id: string;
      name: string;
      triggers: PriceTrigger[];
      actions: (TradeAction | NotificationAction)[];
      edges: { from: string; to: string }[];
    }

    interface PriceTrigger {
      id: string;
      type: "PriceTrigger";
      asset: string; // e.g., "BTC", "ETH", "RELIANCE"
      operator: ">=" | "<=" | ">" | "<";
      value: number;
    }

    interface TradeAction {
      id: string;
      type: "TradeAction";
      side: "buy" | "sell" | "long" | "short";
      asset: string;
      amount: number;
      leverage?: number;
      takeProfit?: number;
      stopLoss?: number;
    }

    interface NotificationAction {
      id: string;
      type: "NotificationAction";
      channel: "email" | "sms" | "discord";
      to: string;
      message?: string;
    }

    Rules:
    1. Extract the asset name carefully (e.g., "Reliance", "BTC").
    2. Infer the operator from context ("drops down to" -> "<=", "gets to" -> ">=").
    3. Handle typos gracefully ("see all of it" -> "sell").
    4. Create logical edges between triggers and actions.
    5. Return ONLY the JSON object, no markdown formatting.
    `;

    const result = await model.generateContent(`${systemPrompt}\n\nUser Strategy: "${prompt}"`);
    const response = result.response;
    const text = response.text();
    
    // Clean up markdown code blocks if present
    const jsonString = text.replace(/```json/g, "").replace(/```/g, "").trim();
    
    return JSON.parse(jsonString) as Workflow;
  } catch (error) {
    console.error("Gemini parsing error:", error);
    return null;
  }
}

import { Workflow, Trigger } from "@/types/workflow";
import { eventsBus } from "@/lib/events";
import axios from "axios";
import { LighterClient } from "@/lib/lighterClient";

export type Provider = "backpack" | "lighter" | "cardano" | "masumi";

export interface ExecutionResult {
  ok: boolean;
  message?: string;
  txId?: string;
  details?: any;
}

export interface ProviderAdapter {
  name: Provider;
  placeOrder: (args: {
    side: "buy" | "sell" | "long" | "short";
    asset: string;
    amount: number;
    price?: number;
    leverage?: number;
  }) => Promise<ExecutionResult>;
  notify?: (args: { channel: string; to: string; message: string }) => Promise<ExecutionResult>;
}

// Stub adapters with TODOs for real trading integrations
export const backpackAdapter: ProviderAdapter = {
  name: "backpack",
  async notify(args) {
    return await sendRealEmail(args);
  },
  async placeOrder(args) {
    // TODO: Implement ED25519 signing and real endpoint
    const apiKey = process.env.BACKPACK_API_KEY;
    const apiSecret = process.env.BACKPACK_API_SECRET;
    if (!apiKey || !apiSecret) {
      return { ok: false, message: "Missing BACKPACK_API_KEY/BACKPACK_API_SECRET" };
    }
    // Placeholder REST call structure (endpoint and signature to be added)
    try {
      const payload = {
        symbol: args.asset,
        side: args.side.toUpperCase(),
        size: args.amount,
        type: "market",
      };
      // Example axios call (replace URL and headers with signed auth)
      // const res = await axios.post("https://api.backpack.exchange/orders", payload, { headers: { Authorization: "..." } });
      // return { ok: true, txId: res.data?.id, details: res.data };
      return { ok: true, message: "Backpack order simulated", details: payload };
    } catch (e: any) {
      return { ok: false, message: e?.message || "Backpack order failed" };
    }
  },
};

export const lighterAdapter: ProviderAdapter = {
  name: "lighter",
  async notify(args) {
    return await sendRealEmail(args);
  },
  async placeOrder(args) {
    const apiKeyPublic = process.env.LIGHTER_API_KEY_PUBLIC;
    const apiKeyPrivate = process.env.LIGHTER_API_KEY_PRIVATE;
    const apiKeyIndex = Number(process.env.LIGHTER_API_KEY_INDEX || 0);
    const ethPrivateKey = process.env.ETH_PRIVATE_KEY;
    const baseUrl = process.env.LIGHTER_BASE_URL || "";
    const wallet = process.env.LIGHTER_WALLET_ADDRESS;

    const missing: string[] = [];
    if (!apiKeyPublic) missing.push("LIGHTER_API_KEY_PUBLIC");
    if (!apiKeyPrivate) missing.push("LIGHTER_API_KEY_PRIVATE");
    if (!ethPrivateKey) missing.push("ETH_PRIVATE_KEY");
    if (!baseUrl) missing.push("LIGHTER_BASE_URL");
    if (!wallet) missing.push("LIGHTER_WALLET_ADDRESS");
    if (missing.length) {
      return { ok: false, message: `Missing env: ${missing.join(", ")}` };
    }

    try {
      const client = new LighterClient({
        baseUrl,
        apiKeyPublic,
        apiKeyPrivate,
        apiKeyIndex,
        ethPrivateKey,
        walletAddress: wallet,
      });

      // Determine symbol format (ETH vs ETH-USDC)
      const symbol = args.asset.includes("-") ? args.asset : `${args.asset}-USDC`;
      
      return await client.placeOrder({
        symbol,
        side: args.side.toUpperCase() as "BUY" | "SELL",
        size: args.amount,
        type: "MARKET",
        price: args.price,
      });
    } catch (e: any) {
      return { ok: false, message: e?.message || "Lighter order failed" };
    }
  },
};

export const masumiAdapter: ProviderAdapter = {
  name: "masumi",
  async placeOrder(args) {
    // TODO: Call Masumi Payment Service for on-chain settlement/logging
    return { ok: true, message: "Masumi payment stub", details: args };
  },
  async notify(args) {
    return await sendRealEmail(args);
  },
};

// Real email notification function
async function sendRealEmail(args: { channel: string; to: string; message: string }): Promise<ExecutionResult> {
  try {
    console.log(`📧 Sending real email notification to: ${args.to}`);
    
    const response = await fetch('/api/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: args.to,
        subject: '🚀 Trading Workflow Alert - Live Notification',
        message: args.message,
        timestamp: new Date().toISOString()
      })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log(`✅ Email sent successfully to ${args.to}`);
      return { ok: true, message: `Real email sent to ${args.to}`, details: result };
    } else {
      console.error(`❌ Email send failed:`, result);
      return { ok: false, message: `Email failed: ${result.error}` };
    }
  } catch (error: any) {
    console.error(`❌ Email service error:`, error);
    return { ok: false, message: `Email error: ${error.message}` };
  }
}

export function pickAdapter(provider: Provider): ProviderAdapter {
  switch (provider) {
    case "backpack":
      return backpackAdapter;
    case "lighter":
      return lighterAdapter;
    case "masumi":
      return masumiAdapter;
    case "cardano":
      return masumiAdapter; // placeholder for on-chain; reuse Masumi for now
    default:
      return backpackAdapter;
  }
}

export async function executeWorkflow(
  wf: Workflow,
  opts: { provider: Provider; onEvent?: (e: any) => void }
): Promise<ExecutionResult[]> {
  const results: ExecutionResult[] = [];
  const adapter = pickAdapter(opts.provider);

  // Basic validation
  if (!wf.triggers?.length || !wf.actions?.length) {
    return [{ ok: false, message: "Invalid workflow: requires triggers and actions" }];
  }

  // Emit helper
  const emit = (e: any) => {
    const event = { ...e, workflowId: wf.id };
    try { opts.onEvent?.(event); } catch {}
    try { eventsBus.publish(event); } catch {}
  };

  // Timer-triggered strategies: run actions on an interval (continuous for fixed bot)
  const timer = (wf.triggers as Trigger[]).find((t: any) => t.type === "TimerTrigger") as any;
  if (timer && timer.intervalSec) {
    emit({ type: "start", workflowId: wf.id, mode: "timer", intervalSec: timer.intervalSec });
    let count = 0;
    const id = setInterval(async () => {
      count++;
      for (const action of wf.actions) {
        if (action.type === "TradeAction") {
          emit({ type: "action", actionId: action.id, status: "placing", iteration: count });
          // Quote-based amount: compute size using real price from Lighter
          let amount = Number((action as any).amount || 1);
          const quoteAmount = (action as any).quoteAmount as number | undefined;
          const quoteAsset = ((action as any).quoteAsset as string | undefined) || "USDC";
          if (quoteAmount && opts.provider === "lighter") {
            try {
              const lighterClient = new (await import("@/lib/lighterClient")).LighterClient({
                baseUrl: process.env.LIGHTER_BASE_URL || "",
                apiKeyPublic: process.env.LIGHTER_API_KEY_PUBLIC || "",
                apiKeyPrivate: process.env.LIGHTER_API_KEY_PRIVATE || "",
                apiKeyIndex: Number(process.env.LIGHTER_API_KEY_INDEX || 0),
                ethPrivateKey: process.env.ETH_PRIVATE_KEY || "",
                walletAddress: process.env.LIGHTER_WALLET_ADDRESS || "",
              });
              const symbol = `${(action as any).asset}-${quoteAsset}`;
              const price = await lighterClient.getPrice(symbol);
              if (price > 0) amount = quoteAmount / price;
            } catch (error) {
              console.warn("Price fetch failed, using fallback:", error);
              amount = quoteAmount / 3000; // fallback
            }
          }
          const r = await adapter.placeOrder({
            side: (action as any).side,
            asset: (action as any).asset,
            amount,
            leverage: (action as any).leverage,
          });
          emit({ type: "action", actionId: (action as any).id, status: r.ok ? "placed" : "failed", result: r, iteration: count });
        }
      }
      // Continuous mode: no automatic stop; add optional safeguard via env TRADING_MAX_ITER
      const maxIterEnv = Number(process.env.TRADING_MAX_ITER || 0);
      if (maxIterEnv > 0 && count >= maxIterEnv) {
        clearInterval(id);
        emit({ type: "end", workflowId: wf.id, reason: "maxIterEnv" });
      }
    }, Math.max(1, timer.intervalSec) * 1000);
    return [{ ok: true, message: "Timer strategy started" }];
  }

  // One-shot execution
  emit({ type: "start", workflowId: wf.id, mode: "oneshot" });
  for (const action of wf.actions) {
    if (action.type === "TradeAction") {
      emit({ type: "action", actionId: action.id, status: "placing" });
      const r = await adapter.placeOrder({
        side: (action as any).side,
        asset: (action as any).asset,
        amount: Number((action as any).amount || 1),
      });
      results.push(r);
      emit({ type: "action", actionId: action.id, status: r.ok ? "placed" : "failed", result: r });
    } else if (action.type === "NotificationAction") {
      emit({ type: "action", actionId: action.id, status: "sending_email" });
      console.log(`📧 Processing email notification for action: ${action.id}`);
      
      const notifAction = action as any;
      const emailResult = await sendRealEmail({
        channel: notifAction.channel || 'email',
        to: notifAction.to || 'trader@example.com',
        message: notifAction.message || 'Trade executed successfully'
      });
      
      results.push(emailResult);
      emit({ 
        type: "action", 
        actionId: action.id, 
        status: emailResult.ok ? "email_sent" : "email_failed", 
        result: emailResult 
      });
    }
  }
  emit({ type: "end", workflowId: wf.id });
  return results;
}

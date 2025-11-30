import { Workflow } from "@/types/workflow";

/**
 * Enhanced Local NLP parser
 * Supports:
 * - Amount units: "10 shares", "0.5 BTC", "100 units"
 * - Percent-based TP/SL: "TP 5%", "SL 2%", "take profit 10%"
 * - Chained logic: "buy at 100 and sell at 120"
 * - Multiple triggers mapped to corresponding actions
 * - Dynamic asset extraction
 */
export function parseWorkflowLocally(prompt: string): Workflow {
  const lowerPrompt = prompt.toLowerCase();
  const originalPrompt = prompt;

  // ─────────────────────────────────────────────────────────────
  // 1. EXTRACT ASSET
  // ─────────────────────────────────────────────────────────────
  const knownAssets: Record<string, string> = {
    btc: "BTC", bitcoin: "BTC",
    eth: "ETH", ethereum: "ETH",
    sol: "SOL", solana: "SOL",
    ada: "ADA", cardano: "ADA",
    xrp: "XRP", ripple: "XRP",
    doge: "DOGE", dogecoin: "DOGE",
    bnb: "BNB", binance: "BNB",
    matic: "MATIC", polygon: "MATIC",
    reliance: "RELIANCE",
    nifty: "NIFTY",
    banknifty: "BANKNIFTY",
    sensex: "SENSEX",
    gold: "GOLD",
    silver: "SILVER",
    crude: "CRUDE",
  };

  let asset = "BTC"; // default
  let assetFound = false;

  for (const [key, val] of Object.entries(knownAssets)) {
    if (lowerPrompt.includes(key)) {
      asset = val;
      assetFound = true;
      break;
    }
  }

  // Dynamic asset extraction if not found
  if (!assetFound) {
    const dynamicPatterns = [
      /(?:buy|sell|long|short|accumulate)\s+(\d*\.?\d*\s*)?([a-z]{2,10})(?:\s+(?:stock|shares?|coin|token))?/i,
      /([a-z]{2,10})\s+(?:stock|shares?|coin|token)/i,
    ];
    for (const pattern of dynamicPatterns) {
      const m = lowerPrompt.match(pattern);
      if (m) {
        const candidate = (m[2] || m[1] || "").toUpperCase().trim();
        const ignored = ["THE", "IT", "THIS", "DIP", "NOW", "LATER", "IF", "WHEN", "AT", "AND", "OR", "TO"];
        if (candidate && !ignored.includes(candidate) && candidate.length >= 2) {
          asset = candidate;
          break;
        }
      }
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 2. EXTRACT TRADE ACTIONS (buy/sell/long/short) with amounts
  // ─────────────────────────────────────────────────────────────
  interface ParsedAction {
    side: "buy" | "sell" | "long" | "short";
    amount: number;
    leverage?: number;
    priceHint?: number; // associated price from "at X"
    index: number; // position in prompt for ordering
  }

  const actionList: ParsedAction[] = [];
  // Detect quote-based sizing: e.g., "buy 5 usdc worth eth" or "5 usd of eth"
  let quoteSizing: { quoteAmount: number; quoteAsset: string; targetAsset?: string } | null = null;
  const quoteMatch = lowerPrompt.match(/(buy|long)?\s*(\d+(?:\.\d+)?)\s*(usdc|usd)\s*(?:worth\s*of|worth|of)\s*([a-z]{2,10})/i);
  if (quoteMatch) {
    const qa = parseFloat(quoteMatch[2]);
    const qAsset = quoteMatch[3].toUpperCase();
    const tgt = (quoteMatch[4] || "").toUpperCase();
    quoteSizing = { quoteAmount: qa, quoteAsset: qAsset, targetAsset: tgt };
  }

  // Pattern: (buy|sell|long|short) [amount] [unit]? [asset]? [at price]?
  const actionRegex = /\b(buy|sell|long|short)\s+(?:(\d+(?:\.\d+)?)\s*(?:shares?|units?|coins?|tokens?|x)?\s*)?(?:[a-z]+\s+)?(?:at\s+(\d+(?:\.\d+)?))?/gi;
  let actionMatch: RegExpExecArray | null;
  while ((actionMatch = actionRegex.exec(lowerPrompt)) !== null) {
    const side = actionMatch[1] as ParsedAction["side"];
    const amount = actionMatch[2] ? parseFloat(actionMatch[2]) : 1;
    const priceHint = actionMatch[3] ? parseFloat(actionMatch[3]) : undefined;

    // Check for leverage pattern nearby (e.g., "10x")
    const nearby = lowerPrompt.substring(Math.max(0, actionMatch.index - 10), actionMatch.index + actionMatch[0].length + 15);
    const levMatch = nearby.match(/(\d+)x/i);
    const leverage = levMatch ? parseInt(levMatch[1]) : undefined;

    actionList.push({ side, amount, leverage, priceHint, index: actionMatch.index });
  }

  // Dedupe by side+priceHint (keep first occurrence)
  const seenActions = new Set<string>();
  const uniqueActions = actionList.filter((a) => {
    const key = `${a.side}-${a.priceHint ?? ""}`;
    if (seenActions.has(key)) return false;
    seenActions.add(key);
    return true;
  });

  // Sort by position in prompt
  uniqueActions.sort((a, b) => a.index - b.index);

  // ─────────────────────────────────────────────────────────────
  // 3. EXTRACT PRICE TRIGGERS
  // ─────────────────────────────────────────────────────────────
  interface ParsedTrigger {
    value: number;
    operator: ">=" | "<=" | ">" | "<";
    index: number;
  }

  const triggerList: ParsedTrigger[] = [];
  const seenPrices = new Set<number>();

  // Patterns for price conditions
  const pricePatterns = [
    /(?:hits|reaches|at|@)\s*\$?(\d+(?:\.\d+)?)/gi,
    /(?:price|value|cost)?\s*(?:is|goes|reaches|hits|drops?|falls?|gets?\s*to|exceeds?)?\s*(?:above|below|over|under|>=|<=|>|<)?\s*\$?(\d+(?:\.\d+)?)/gi,
    /(?:above|below|over|under)\s*\$?(\d+(?:\.\d+)?)/gi,
    /(?:if|when)\s+.*?\$?(\d+(?:\.\d+)?)/gi,
  ];

  for (const pattern of pricePatterns) {
    let m: RegExpExecArray | null;
    while ((m = pattern.exec(lowerPrompt)) !== null) {
      const val = parseFloat(m[1]);
      if (seenPrices.has(val)) continue;
      
      // Skip if this looks like leverage (number followed by 'x')
      const afterMatch = lowerPrompt.substring(m.index + m[0].length, m.index + m[0].length + 2);
      if (/^x/i.test(afterMatch)) continue;
      
      // Skip very small numbers that are likely leverage or amounts, not prices
      if (val < 10) continue;
      
      seenPrices.add(val);

      // Determine operator from surrounding context
      const start = Math.max(0, m.index - 25);
      const ctx = lowerPrompt.substring(start, m.index + m[0].length + 10);

      let operator: ParsedTrigger["operator"] = ">=";
      if (/below|under|drops?|falls?|</.test(ctx)) {
        operator = "<=";
      } else if (/above|over|exceeds?|hits|reaches|>/.test(ctx)) {
        // "hits" or "reaches" means trigger when price gets to that level
        operator = ">=";
      } else if (/sell\s+.*?at/.test(ctx) || /sell\s+at/.test(ctx)) {
        // "sell at X" means trigger when price reaches X (>=)
        operator = ">=";
      } else if (/buy\s+.*?at/.test(ctx) || /buy\s+at/.test(ctx)) {
        // "buy at X" means trigger when price drops to X (<=)
        operator = "<=";
      }

      triggerList.push({ value: val, operator, index: m.index });
    }
  }

  // Remove duplicates and sort by index
  const uniqueTriggers = Array.from(
    new Map(triggerList.map((t) => [t.value, t])).values()
  ).sort((a, b) => a.index - b.index);

  // ─────────────────────────────────────────────────────────────
  // 4. EXTRACT TP / SL (absolute or percent-based)
  // ─────────────────────────────────────────────────────────────
  let takeProfit: number | undefined;
  let takeProfitPercent: number | undefined;
  let stopLoss: number | undefined;
  let stopLossPercent: number | undefined;

  // TP patterns
  const tpMatch = lowerPrompt.match(/(?:take\s*profit|tp|target)\s*(?:at|@|:)?\s*(\d+(?:\.\d+)?)\s*(%)?/i);
  if (tpMatch) {
    if (tpMatch[2] === "%") {
      takeProfitPercent = parseFloat(tpMatch[1]);
    } else {
      takeProfit = parseFloat(tpMatch[1]);
    }
  }

  // SL patterns
  const slMatch = lowerPrompt.match(/(?:stop\s*loss|sl|stop)\s*(?:at|@|:)?\s*(\d+(?:\.\d+)?)\s*(%)?/i);
  if (slMatch) {
    if (slMatch[2] === "%") {
      stopLossPercent = parseFloat(slMatch[1]);
    } else {
      stopLoss = parseFloat(slMatch[1]);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 5. BUILD TRIGGERS ARRAY (with unique IDs)
  // ─────────────────────────────────────────────────────────────
  const timestamp = Date.now();
  const triggers = uniqueTriggers.map((t, i) => ({
    id: `trigger-${timestamp}-${i + 1}`,
    type: "PriceTrigger" as const,
    asset,
    operator: t.operator,
    value: t.value,
  }));

  // Timer trigger: "every 10 sec/seconds/min/minutes" or recurring patterns
  const timerMatch = lowerPrompt.match(/every\s+(\d+)\s*(sec|second|seconds|min|minute|minutes)/i);
  const recurringMatch = lowerPrompt.match(/(each|every)\s+(\d+)\s*(sec|second|seconds|min|minute|minutes)/i);
  
  let isRecurringWorkflow = false;
  let intervalSeconds = 0;
  
  if (timerMatch || recurringMatch) {
    const match = timerMatch || recurringMatch;
    const n = parseInt(match[2]);
    const unit = match[3];
    intervalSeconds = /min/i.test(unit) ? n * 60 : n;
    isRecurringWorkflow = true;
    
    triggers.push({ 
      id: `trigger-${timestamp}-timer`, 
      type: "TimerTrigger", 
      intervalSec: intervalSeconds 
    } as any);
  }
  
  // Check for "again and again" or similar repeating patterns
  if (/again\s+and\s+again|repeatedly|repeat|loop|continuous/i.test(lowerPrompt) && !isRecurringWorkflow) {
    // Default to 15 seconds if no specific interval mentioned
    intervalSeconds = 15;
    isRecurringWorkflow = true;
    
    triggers.push({
      id: `trigger-${timestamp}-timer`,
      type: "TimerTrigger", 
      intervalSec: intervalSeconds
    } as any);
  }

  // ─────────────────────────────────────────────────────────────
  // 6. BUILD ACTIONS ARRAY (with unique IDs)
  // ─────────────────────────────────────────────────────────────
  const actions: any[] = uniqueActions.map((a, i) => {
    const action: any = {
      id: `action-${timestamp}-${i + 1}`,
      type: "TradeAction",
      side: a.side,
      asset: quoteSizing?.targetAsset || asset,
      amount: a.amount || 1,
    };
    if (a.leverage) action.leverage = a.leverage;
    if (quoteSizing) {
      action.quoteAmount = quoteSizing.quoteAmount;
      action.quoteAsset = quoteSizing.quoteAsset;
    }
    return action;
  });

  // Attach TP/SL to first action if present
  if (actions.length > 0) {
    if (takeProfit !== undefined) actions[0].takeProfit = takeProfit;
    if (takeProfitPercent !== undefined) actions[0].takeProfitPercent = takeProfitPercent;
    if (stopLoss !== undefined) actions[0].stopLoss = stopLoss;
    if (stopLossPercent !== undefined) actions[0].stopLossPercent = stopLossPercent;
  }

  // ─────────────────────────────────────────────────────────────
  // 7. NOTIFICATION ACTIONS (always add notification for 3-node workflow)
  // ─────────────────────────────────────────────────────────────
  const emailMatch = lowerPrompt.match(/(?:email|mail).*?([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})/i);
  const smsMatch = lowerPrompt.match(/(?:sms|text|phone).*?(\+?\d[\d\s-]{8,})/i);
  const discordMatch = /discord/i.test(lowerPrompt);

  // Add loop control for recurring workflows
  if (isRecurringWorkflow) {
    // Add a loop counter action that stops after 10 iterations
    actions.push({
      id: `action-${timestamp}-loop-control`,
      type: "LoopControlAction",
      maxIterations: 10,
      currentIteration: 0,
      intervalSec: intervalSeconds,
      message: `Loop ${intervalSeconds}s intervals, max 10 times`,
    });
  }

  // Always add a notification action to make 3+ nodes
  let notificationChannel: "email" | "sms" | "discord" = "email";
  let notificationTo = "trader@example.com";
  
  if (emailMatch) {
    notificationChannel = "email";
    notificationTo = emailMatch[1];
  } else if (smsMatch) {
    notificationChannel = "sms";
    notificationTo = smsMatch[1];
  } else if (discordMatch) {
    notificationChannel = "discord";
    notificationTo = "trader";
  }

  // Add notification action
  const notificationMessage = isRecurringWorkflow 
    ? `${asset} recurring trade (${intervalSeconds}s intervals): ${uniqueActions.map(a => `${a.side} ${a.amount}`).join(", ")}`
    : `${asset} trade executed: ${uniqueActions.map(a => `${a.side} ${a.amount}`).join(", ")}`;

  actions.push({
    id: `action-${timestamp}-notif-${actions.length + 1}`,
    type: "NotificationAction",
    channel: notificationChannel,
    to: notificationTo,
    message: notificationMessage,
  });

  // ─────────────────────────────────────────────────────────────
  // 8. BUILD EDGES (create 3-node linear flow: trigger → trade → notification)
  // ─────────────────────────────────────────────────────────────
  const edges: { from: string; to: string }[] = [];

  // Separate different types of actions
  const tradeActions = actions.filter(a => a.type === "TradeAction");
  const loopControlActions = actions.filter(a => a.type === "LoopControlAction");
  const notificationActions = actions.filter(a => a.type === "NotificationAction");

  if (triggers.length > 0) {
    if (isRecurringWorkflow && loopControlActions.length > 0) {
      // For recurring workflows: timer → loop control → trade → notification
      const timerTrigger = triggers.find(t => (t as any).type === "TimerTrigger");
      if (timerTrigger) {
        edges.push({ from: timerTrigger.id, to: loopControlActions[0].id });
        
        if (tradeActions.length > 0) {
          edges.push({ from: loopControlActions[0].id, to: tradeActions[0].id });
          
          // Chain multiple trade actions
          for (let i = 0; i < tradeActions.length - 1; i++) {
            edges.push({ from: tradeActions[i].id, to: tradeActions[i + 1].id });
          }
          
          // Connect last trade to notification
          if (notificationActions.length > 0) {
            const lastTradeAction = tradeActions[tradeActions.length - 1];
            edges.push({ from: lastTradeAction.id, to: notificationActions[0].id });
            
            // Loop back from notification to loop control for next iteration
            edges.push({ from: notificationActions[0].id, to: loopControlActions[0].id });
          }
        }
      }
    } else if (tradeActions.length > 0) {
      // Regular workflow: trigger → trade → notification
      edges.push({ from: triggers[0].id, to: tradeActions[0].id });
      
      // Connect additional triggers to first trade if multiple triggers
      for (let i = 1; i < triggers.length; i++) {
        edges.push({ from: triggers[i].id, to: tradeActions[0].id });
      }
      
      // Chain trade actions if multiple
      for (let i = 0; i < tradeActions.length - 1; i++) {
        edges.push({ from: tradeActions[i].id, to: tradeActions[i + 1].id });
      }
      
      // Connect last trade action to notification action
      if (notificationActions.length > 0) {
        const lastTradeAction = tradeActions[tradeActions.length - 1];
        edges.push({ from: lastTradeAction.id, to: notificationActions[0].id });
      }
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 9. FALLBACKS
  // ─────────────────────────────────────────────────────────────
  // If no actions but triggers exist, infer a buy action
  if (actions.length === 0 && triggers.length > 0) {
    const fallbackActionId = `action-${timestamp}-fallback`;
    actions.push({
      id: fallbackActionId,
      type: "TradeAction",
      side: "buy",
      asset,
      amount: 1,
    });
    edges.push({ from: triggers[0].id, to: fallbackActionId });
  }

  // If no triggers but actions exist, create a manual trigger placeholder
  if (triggers.length === 0 && actions.length > 0) {
    const fallbackTriggerId = `trigger-${timestamp}-fallback`;
    triggers.push({
      id: fallbackTriggerId,
      type: "PriceTrigger",
      asset,
      operator: ">=",
      value: 0, // placeholder
    });
    edges.push({ from: fallbackTriggerId, to: actions[0].id });
  }

  // ─────────────────────────────────────────────────────────────
  // 10. RETURN WORKFLOW
  // ─────────────────────────────────────────────────────────────
  return {
    id: `wf-${Date.now()}`,
    name: originalPrompt.slice(0, 50),
    triggers,
    actions,
    edges,
  };
}

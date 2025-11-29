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
    /(?:price|value|cost)?\s*(?:is|goes|reaches|hits|drops?|falls?|gets?\s*to|exceeds?)?\s*(?:above|below|over|under|>=|<=|>|<)?\s*\$?(\d+(?:\.\d+)?)/gi,
    /(?:at|@)\s*\$?(\d+(?:\.\d+)?)/gi,
    /(?:above|below|over|under)\s*\$?(\d+(?:\.\d+)?)/gi,
    /(?:if|when)\s+.*?\$?(\d+(?:\.\d+)?)/gi,
  ];

  for (const pattern of pricePatterns) {
    let m: RegExpExecArray | null;
    while ((m = pattern.exec(lowerPrompt)) !== null) {
      const val = parseFloat(m[1]);
      if (seenPrices.has(val)) continue;
      seenPrices.add(val);

      // Determine operator from surrounding context
      const start = Math.max(0, m.index - 25);
      const ctx = lowerPrompt.substring(start, m.index + m[0].length + 10);

      let operator: ParsedTrigger["operator"] = ">=";
      if (/below|under|drops?|falls?|</.test(ctx)) {
        operator = "<=";
      } else if (/above|over|exceeds?|>/.test(ctx)) {
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
  // 5. BUILD TRIGGERS ARRAY
  // ─────────────────────────────────────────────────────────────
  const triggers = uniqueTriggers.map((t, i) => ({
    id: `t${i + 1}`,
    type: "PriceTrigger" as const,
    asset,
    operator: t.operator,
    value: t.value,
  }));

  // ─────────────────────────────────────────────────────────────
  // 6. BUILD ACTIONS ARRAY
  // ─────────────────────────────────────────────────────────────
  const actions: any[] = uniqueActions.map((a, i) => {
    const action: any = {
      id: `a${i + 1}`,
      type: "TradeAction",
      side: a.side,
      asset,
      amount: a.amount,
    };
    if (a.leverage) action.leverage = a.leverage;
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
  // 7. NOTIFICATION ACTIONS (email/sms/discord)
  // ─────────────────────────────────────────────────────────────
  const emailMatch = lowerPrompt.match(/(?:email|mail).*?([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})/i);
  const smsMatch = lowerPrompt.match(/(?:sms|text|phone).*?(\+?\d[\d\s-]{8,})/i);
  const discordMatch = /discord/i.test(lowerPrompt);

  if (emailMatch || smsMatch || discordMatch) {
    actions.push({
      id: `a${actions.length + 1}`,
      type: "NotificationAction",
      channel: emailMatch ? "email" : smsMatch ? "sms" : "discord",
      to: emailMatch?.[1] || smsMatch?.[1] || "user",
      message: "Trade executed",
    });
  }

  // ─────────────────────────────────────────────────────────────
  // 8. BUILD EDGES (smart mapping)
  // ─────────────────────────────────────────────────────────────
  const edges: { from: string; to: string }[] = [];

  if (triggers.length > 0 && actions.length > 0) {
    if (triggers.length === actions.length) {
      // 1:1 mapping
      for (let i = 0; i < triggers.length; i++) {
        edges.push({ from: triggers[i].id, to: actions[i].id });
      }
    } else if (triggers.length > actions.length) {
      // More triggers than actions: first N triggers map to actions, rest chain
      for (let i = 0; i < actions.length; i++) {
        edges.push({ from: triggers[i].id, to: actions[i].id });
      }
      // Remaining triggers chain to first action
      for (let i = actions.length; i < triggers.length; i++) {
        edges.push({ from: triggers[i].id, to: actions[0].id });
      }
    } else {
      // More actions than triggers: first trigger -> first action, chain actions
      edges.push({ from: triggers[0].id, to: actions[0].id });
      for (let i = 0; i < actions.length - 1; i++) {
        edges.push({ from: actions[i].id, to: actions[i + 1].id });
      }
      // Extra triggers map to first action
      for (let i = 1; i < triggers.length; i++) {
        edges.push({ from: triggers[i].id, to: actions[0].id });
      }
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 9. FALLBACKS
  // ─────────────────────────────────────────────────────────────
  // If no actions but triggers exist, infer a buy action
  if (actions.length === 0 && triggers.length > 0) {
    actions.push({
      id: "a1",
      type: "TradeAction",
      side: "buy",
      asset,
      amount: 1,
    });
    edges.push({ from: triggers[0].id, to: "a1" });
  }

  // If no triggers but actions exist, create a manual trigger placeholder
  if (triggers.length === 0 && actions.length > 0) {
    triggers.push({
      id: "t1",
      type: "PriceTrigger",
      asset,
      operator: ">=",
      value: 0, // placeholder
    });
    edges.push({ from: "t1", to: actions[0].id });
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

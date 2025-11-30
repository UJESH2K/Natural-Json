export interface PriceTrigger {
  id: string;
  type: "PriceTrigger";
  asset: string;
  operator: ">=" | "<=" | ">" | "<";
  value: number;
}

export interface TimerTrigger {
  id: string;
  type: "TimerTrigger";
  intervalSec: number;
}

export interface TradeAction {
  id: string;
  type: "TradeAction";
  side: "long" | "short" | "buy" | "sell";
  asset: string;
  amount: number;
  leverage?: number;
  takeProfit?: number;
  stopLoss?: number;
  // Optional: quote-based order sizing (e.g., buy 5 USDC worth of ETH)
  quoteAmount?: number;
  quoteAsset?: string; // e.g., "USDC" | "USD"
}

export interface NotificationAction {
  id: string;
  type: "NotificationAction";
  channel: "email" | "sms" | "discord";
  to: string;
  template?: string;
  message?: string;
}

export interface LoopControlAction {
  id: string;
  type: "LoopControlAction";
  maxIterations: number;
  currentIteration: number;
  intervalSec: number;
  message?: string;
}

export type Trigger = PriceTrigger | TimerTrigger;
export type Action = TradeAction | NotificationAction | LoopControlAction;

export interface WorkflowEdge {
  from: string;
  to: string;
}

export interface NodeEntry {
  key: string;
  value: string;
  type: string;
  isConnection: boolean;
}

export interface WorkflowNodeData extends Record<string, unknown> {
  label: string;
  type: 'trigger' | 'action' | 'notification';
  entries: NodeEntry[];
  isRoot?: boolean;
  status?: string;
  actionType?: string;
  originalId?: string;
}

export interface Workflow {
  id: string;
  name?: string;
  triggers: Trigger[];
  actions: Action[];
  edges: WorkflowEdge[];
}
export interface PriceTrigger {
  id: string;
  type: "PriceTrigger";
  asset: string;
  operator: ">=" | "<=" | ">" | "<";
  value: number;
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
}

export interface NotificationAction {
  id: string;
  type: "NotificationAction";
  channel: "email" | "sms" | "discord";
  to: string;
  template?: string;
  message?: string;
}

export type Trigger = PriceTrigger;
export type Action = TradeAction | NotificationAction;

export interface WorkflowEdge {
  from: string;
  to: string;
}

export interface Workflow {
  id: string;
  name?: string;
  triggers: Trigger[];
  actions: Action[];
  edges: WorkflowEdge[];
}
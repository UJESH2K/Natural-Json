import { Workflow, PriceTrigger, TradeAction, NotificationAction, LoopControlAction, WorkflowNodeData, NodeEntry } from '@/types/workflow';
import { AppNode, AppEdge } from './layout';

/**
 * Converts a Workflow to React Flow nodes and edges using the flo3 pattern
 * Creates detailed workflow visualization with proper node data structure
 */
export const parseWorkflowToFlow = (workflow: Workflow): { nodes: AppNode[]; edges: AppEdge[] } => {
  console.log("🔄 Converting workflow to React Flow format:", workflow);
  
  const nodes: AppNode[] = [];
  const edges: AppEdge[] = [];

  // Create nodes for triggers
  workflow.triggers.forEach((trigger, index) => {
    const entries: NodeEntry[] = [];
    
    if (trigger.type === 'PriceTrigger') {
      const priceTrigger = trigger as PriceTrigger;
      entries.push(
        { key: 'id', value: trigger.id, type: 'string', isConnection: false },
        { key: 'asset', value: priceTrigger.asset, type: 'string', isConnection: false },
        { key: 'operator', value: priceTrigger.operator, type: 'string', isConnection: false },
        { key: 'value', value: `$${priceTrigger.value}`, type: 'number', isConnection: false }
      );
    }

    nodes.push({
      id: trigger.id,
      type: 'custom',
      position: { x: 0, y: 0 }, // Layout will position these
      data: {
        label: trigger.type === 'PriceTrigger' 
          ? `${(trigger as PriceTrigger).asset} ${(trigger as PriceTrigger).operator} $${(trigger as PriceTrigger).value}`
          : `Timer: ${(trigger as any).intervalSec}s`,
        type: 'trigger',
        entries,
        originalId: trigger.id,
      },
    });
  });

  // Create nodes for actions
  workflow.actions.forEach((action, index) => {
    const entries: NodeEntry[] = [];
    let nodeType: 'action' | 'notification' = 'action';
    let label = '';

    if (action.type === 'TradeAction') {
      const trade = action as TradeAction;
      nodeType = 'action';
      label = `${trade.side.toUpperCase()} ${trade.asset}`;
      
      entries.push(
        { key: 'id', value: action.id, type: 'string', isConnection: false },
        { key: 'side', value: trade.side, type: 'string', isConnection: false },
        { key: 'asset', value: trade.asset, type: 'string', isConnection: false },
        { key: 'amount', value: trade.amount.toString(), type: 'number', isConnection: false }
      );

      if (trade.leverage) {
        entries.push({ key: 'leverage', value: `${trade.leverage}x`, type: 'number', isConnection: false });
      }
      if (trade.takeProfit) {
        entries.push({ key: 'takeProfit', value: `$${trade.takeProfit}`, type: 'number', isConnection: false });
      }
      if (trade.stopLoss) {
        entries.push({ key: 'stopLoss', value: `$${trade.stopLoss}`, type: 'number', isConnection: false });
      }
      if (trade.quoteAmount && trade.quoteAsset) {
        entries.push({ key: 'quoteAmount', value: `${trade.quoteAmount} ${trade.quoteAsset}`, type: 'string', isConnection: false });
      }
    } else if (action.type === 'NotificationAction') {
      const notif = action as NotificationAction;
      nodeType = 'notification';
      label = `Notify via ${notif.channel}`;
      
      entries.push(
        { key: 'id', value: action.id, type: 'string', isConnection: false },
        { key: 'channel', value: notif.channel, type: 'string', isConnection: false },
        { key: 'to', value: notif.to, type: 'string', isConnection: false }
      );

      if (notif.message) {
        entries.push({ key: 'message', value: notif.message, type: 'string', isConnection: false });
      }
    } else if (action.type === 'LoopControlAction') {
      const loop = action as LoopControlAction;
      nodeType = 'action';
      label = `Loop Control (${loop.maxIterations}x)`;
      
      entries.push(
        { key: 'id', value: action.id, type: 'string', isConnection: false },
        { key: 'maxIterations', value: loop.maxIterations.toString(), type: 'number', isConnection: false },
        { key: 'intervalSec', value: `${loop.intervalSec}s`, type: 'number', isConnection: false },
        { key: 'currentIteration', value: loop.currentIteration.toString(), type: 'number', isConnection: false }
      );

      if (loop.message) {
        entries.push({ key: 'message', value: loop.message, type: 'string', isConnection: false });
      }
    }

    nodes.push({
      id: action.id,
      type: 'custom',
      position: { x: 0, y: 0 }, // Layout will position these
      data: {
        label,
        type: nodeType,
        entries,
        originalId: action.id,
        actionType: action.type === 'TradeAction' ? 'Trade' : 'Notification',
      },
    });
  });

  // Create edges from workflow connections
  workflow.edges.forEach((workflowEdge, index) => {
    edges.push({
      id: `edge-${index}`,
      source: workflowEdge.from,
      target: workflowEdge.to,
      type: 'default',
      animated: true,
      style: { 
        stroke: '#8b5cf6', 
        strokeWidth: 2,
      },
    });
  });

  console.log("✅ React Flow conversion complete:", {
    originalTriggers: workflow.triggers.length,
    originalActions: workflow.actions.length,
    originalEdges: workflow.edges.length,
    generatedNodes: nodes.length,
    generatedEdges: edges.length,
    nodeIds: nodes.map(n => n.id),
    edgeConnections: edges.map(e => `${e.source} → ${e.target}`)
  });

  return { nodes, edges };
};
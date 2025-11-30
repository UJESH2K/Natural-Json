import { Node, Edge } from '@xyflow/react';
import { WorkflowNodeData } from '@/types/workflow';

export type AppNode = Node<WorkflowNodeData>;
export type AppEdge = Edge;

/**
 * Hierarchical layout algorithm for workflow visualization
 * Places triggers on the left, actions on the right with proper spacing
 */
export const getLayoutedElements = (
  nodes: AppNode[],
  edges: AppEdge[],
  direction = 'LR'
): { nodes: AppNode[]; edges: AppEdge[] } => {
  console.log("📐 Applying layout to nodes:", {
    inputNodes: nodes.length,
    inputEdges: edges.length,
    nodeTypes: nodes.map(n => ({ id: n.id, type: n.data.type }))
  });

  // Configuration
  const TRIGGER_X = 50;
  const ACTION_X = 450;
  const NOTIFICATION_X = 800;
  const START_Y = 50;
  const SPACING_Y = 180;
  const NODE_WIDTH = 320;
  const NODE_HEIGHT = 120;

  // Separate nodes by type
  const triggers = nodes.filter(node => node.data.type === 'trigger');
  const actions = nodes.filter(node => node.data.type === 'action');
  const notifications = nodes.filter(node => node.data.type === 'notification');
  
  // Check if this is a loop workflow
  const hasLoopControl = nodes.some(node => 
    node.data.actionType === 'LoopControlAction' || 
    (node.data.label && node.data.label.includes('Loop Control'))
  );

  // Layout triggers vertically on the left
  const layoutedTriggers = triggers.map((node, index) => ({
    ...node,
    position: {
      x: TRIGGER_X,
      y: START_Y + index * SPACING_Y
    }
  }));

  // Layout actions vertically in the middle (with special handling for loop workflows)
  const layoutedActions = actions.map((node, index) => {
    let xPosition = ACTION_X;
    
    // If this is a loop control node, place it between trigger and main action
    if (hasLoopControl && (node.data.actionType === 'LoopControlAction' || 
        (node.data.label && node.data.label.includes('Loop Control')))) {
      xPosition = ACTION_X - 200; // Place loop control before main actions
    }
    
    return {
      ...node,
      position: {
        x: xPosition,
        y: START_Y + index * SPACING_Y
      }
    };
  });

  // Layout notifications vertically on the right
  const layoutedNotifications = notifications.map((node, index) => ({
    ...node,
    position: {
      x: NOTIFICATION_X,
      y: START_Y + index * SPACING_Y
    }
  }));

  // Combine all layouted nodes
  const layoutedNodes = [
    ...layoutedTriggers,
    ...layoutedActions,
    ...layoutedNotifications
  ];

  console.log("✅ Layout complete:", {
    layoutedNodes: layoutedNodes.length,
    positions: layoutedNodes.map(n => ({ id: n.id, x: n.position.x, y: n.position.y }))
  });

  return {
    nodes: layoutedNodes,
    edges: edges.map(edge => ({
      ...edge,
      animated: true,
      style: {
        stroke: '#8b5cf6',
        strokeWidth: 2,
      },
    })),
  };
};
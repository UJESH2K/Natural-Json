"use client";

import React, { useState, useCallback, useEffect } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  NodeChange,
  EdgeChange,
  Connection,
  BackgroundVariant,
  Panel,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Workflow } from "@/types/workflow";
import CustomNode from "./CustomNode";
import { parseWorkflowToFlow } from "@/lib/workflow-parser";
import { getLayoutedElements, AppNode, AppEdge } from "@/lib/layout";

const nodeTypes = {
  custom: CustomNode,
};

interface WorkflowCanvasProps {
  workflow: Workflow | null;
  isLoading: boolean;
}

const VisualizerInner: React.FC<WorkflowCanvasProps & { statuses?: Record<string, string> }> = ({ 
  workflow, 
  isLoading, 
  statuses 
}) => {
  const [nodes, setNodes] = useState<AppNode[]>([]);
  const [edges, setEdges] = useState<AppEdge[]>([]);
  const { fitView } = useReactFlow();

  // Update nodes and edges when workflow changes
  useEffect(() => {
    console.log("VisualizerInner - workflow changed:", workflow, "isLoading:", isLoading);
    
    if (isLoading) {
      // Show loading skeleton
      setNodes([]);
      setEdges([]);
      return;
    }

    if (!workflow) {
      setNodes([]);
      setEdges([]);
      return;
    }

    // Convert workflow to React Flow format
    const { nodes: workflowNodes, edges: workflowEdges } = parseWorkflowToFlow(workflow);
    
    // Apply auto-layout
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(workflowNodes, workflowEdges, 'LR');
    
    // Add status information to nodes
    const nodesWithStatus = layoutedNodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        status: statuses && node.data.originalId ? statuses[node.data.originalId] : undefined,
      }
    }));

    console.log("Setting layouted nodes:", nodesWithStatus.length, "edges:", layoutedEdges.length);
    setNodes(nodesWithStatus);
    setEdges(layoutedEdges);

    // Auto-fit the view
    setTimeout(() => {
      fitView({ padding: 0.2, duration: 800 });
    }, 100);
  }, [workflow, isLoading, statuses, fitView, setNodes, setEdges]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    []
  );

  return (
    <div className="w-full h-full bg-[#0f0f11] rounded-lg overflow-hidden border border-zinc-800 shadow-2xl">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2, duration: 800 }}
        minZoom={0.05}
        maxZoom={2}
        defaultEdgeOptions={{
          type: 'default',
          animated: true,
          style: { stroke: '#8b5cf6', strokeWidth: 2 },
        }}
        snapToGrid={true}
        snapGrid={[20, 20]}
        panOnDrag={true}
        zoomOnScroll={true}
        zoomOnPinch={true}
        zoomOnDoubleClick={false}
        attributionPosition="bottom-right"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1.5}
          color="#3f3f46"
          className="bg-[#0f0f11]"
        />
        <Controls
          className="bg-[#18181b]! border-zinc-700! fill-zinc-400! shadow-xl! rounded-lg! overflow-hidden"
          showInteractive={false}
        />
        <MiniMap
          nodeColor={(node) => {
            if (node.data?.type === 'trigger') return '#3b82f6';
            if (node.data?.type === 'action') return '#8b5cf6';
            if (node.data?.type === 'notification') return '#eab308';
            return '#6b7280';
          }}
          maskColor="rgba(15, 15, 17, 0.8)"
          className="bg-[#18181b]! border! border-zinc-700! rounded-lg overflow-hidden shadow-xl"
          nodeBorderRadius={2}
        />

        <Panel position="top-right" className="bg-[#18181b]/90 backdrop-blur-sm border border-zinc-700 p-4 shadow-2xl rounded-xl">
          <div className="flex flex-col gap-3">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-700 pb-2 mb-1">Workflow</span>
            <div className="flex items-center gap-3 text-xs text-zinc-300 font-mono">
              <span className="w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]"></span> Trigger
            </div>
            <div className="flex items-center gap-3 text-xs text-zinc-300 font-mono">
              <span className="w-2 h-2 bg-purple-500 rounded-full shadow-[0_0_8px_rgba(139,92,246,0.5)]"></span> Action
            </div>
            <div className="flex items-center gap-3 text-xs text-zinc-300 font-mono">
              <span className="w-2 h-2 bg-yellow-500 rounded-full shadow-[0_0_8px_rgba(234,179,8,0.5)]"></span> Notification
            </div>
          </div>
        </Panel>
      </ReactFlow>

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="text-zinc-400 text-lg flex items-center gap-3 bg-zinc-900/50 px-6 py-4 rounded-xl backdrop-blur-sm">
            <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <span>Building your workflow...</span>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center text-zinc-600">
            <div className="w-12 h-12 mx-auto mb-4 opacity-30 border-2 border-zinc-600 rounded-lg flex items-center justify-center">
              <span className="text-lg">⚡</span>
            </div>
            <p className="text-sm font-mono tracking-widest uppercase">No Workflow Generated</p>
          </div>
        </div>
      )}
    </div>
  );
};

// Main component wrapper with ReactFlowProvider
export function WorkflowCanvas({ workflow, isLoading, statuses }: WorkflowCanvasProps & { statuses?: Record<string, string> }) {
  return (
    <ReactFlowProvider>
      <VisualizerInner workflow={workflow} isLoading={isLoading} statuses={statuses} />
    </ReactFlowProvider>
  );
}

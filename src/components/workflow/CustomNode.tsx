import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { TrendingUp, Bell, Zap, Circle, DollarSign, BarChart3 } from 'lucide-react';
import clsx from 'clsx';
import { WorkflowNodeData } from '@/types/workflow';

const getIconForType = (type: string) => {
  switch (type) {
    case 'trigger': return <Zap className="w-4 h-4 text-blue-400" />;
    case 'action': return <TrendingUp className="w-4 h-4 text-purple-400" />;
    case 'notification': return <Bell className="w-4 h-4 text-yellow-400" />;
    default: return <Circle className="w-3 h-3 fill-zinc-400 text-zinc-400" />;
  }
};

const getStatusColor = (status?: string) => {
  switch (status) {
    case 'placed': return 'bg-blue-500/20 border-blue-400 text-blue-300';
    case 'failed': return 'bg-red-500/20 border-red-400 text-red-300';
    case 'filled': return 'bg-green-500/20 border-green-400 text-green-300';
    case 'pending': return 'bg-yellow-500/20 border-yellow-400 text-yellow-300';
    default: return 'bg-purple-500/20 border-purple-400 text-purple-300';
  }
};

const getNodeColors = (type: string) => {
  switch (type) {
    case 'trigger':
      return {
        border: 'border-blue-500/50 hover:border-blue-400',
        bg: 'bg-gradient-to-br from-blue-900/80 to-blue-800/60',
        header: 'bg-blue-900/50',
        headerBorder: 'border-blue-800',
        handleColor: 'bg-blue-400',
      };
    case 'action':
      return {
        border: 'border-purple-500/50 hover:border-purple-400',
        bg: 'bg-gradient-to-br from-purple-900/80 to-purple-800/60',
        header: 'bg-purple-900/50',
        headerBorder: 'border-purple-800',
        handleColor: 'bg-purple-400',
      };
    case 'notification':
      return {
        border: 'border-yellow-500/50 hover:border-yellow-400',
        bg: 'bg-gradient-to-br from-yellow-900/80 to-yellow-800/60',
        header: 'bg-yellow-900/50',
        headerBorder: 'border-yellow-800',
        handleColor: 'bg-yellow-400',
      };
    default:
      return {
        border: 'border-gray-500/50 hover:border-gray-400',
        bg: 'bg-gradient-to-br from-gray-900/80 to-gray-800/60',
        header: 'bg-gray-900/50',
        headerBorder: 'border-gray-800',
        handleColor: 'bg-gray-400',
      };
  }
};

const CustomNode = ({ data, selected }: NodeProps<WorkflowNodeData>) => {
  const colors = getNodeColors(data.type);
  const isTrigger = data.type === 'trigger';
  const isAction = data.type === 'action';

  return (
    <div className={`w-[320px] rounded-xl border-2 min-w-[280px] transition-all duration-300 ${
      selected
        ? colors.border.replace('hover:', '') + ' shadow-lg shadow-' + data.type === 'trigger' ? 'blue' : data.type === 'action' ? 'purple' : 'yellow' + '-500/30'
        : colors.border
    } ${colors.bg} backdrop-blur-sm font-mono group relative`}>

      {/* Status Badge */}
      {data.status && (
        <div className={`absolute -top-2 -right-2 px-2 py-0.5 text-[10px] rounded-full border ${getStatusColor(data.status)}`}>
          {data.status}
        </div>
      )}

      {/* Input Handle - for actions and notifications */}
      {!isTrigger && (
        <Handle
          type="target"
          position={Position.Left}
          className={`${colors.handleColor}! w-3! h-3! border-2! border-gray-800! -left-1.5! shadow-[0_0_10px_currentColor]`}
        />
      )}

      {/* Header */}
      <div className={`px-4 py-3 flex items-center justify-between border-b ${colors.headerBorder} ${colors.header} rounded-t-xl`}>
        <div className="flex items-center gap-3">
          {getIconForType(data.type)}
          <span className="text-sm font-bold text-white truncate max-w-[200px] tracking-tight" title={data.label}>
            {data.label}
          </span>
        </div>
        <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
          {data.actionType || data.type}
        </span>
      </div>

      {/* Body: Properties */}
      <div className="bg-black/40 py-2 rounded-b-xl">
        {data.entries.length > 0 ? (
          data.entries.map((entry) => (
            <div
              key={entry.key}
              className="relative px-4 py-1.5 flex items-center justify-between hover:bg-white/5 transition-colors group/row"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <span className="text-xs font-semibold text-gray-400 group-hover/row:text-gray-200 transition-colors truncate max-w-[120px]" title={entry.key}>
                  {entry.key}
                </span>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className={clsx(
                  "text-xs truncate max-w-[140px]",
                  entry.isConnection ? "text-gray-500 italic" : "text-gray-200"
                )}>
                  {String(entry.value)}
                </span>
                {entry.key === 'amount' && <DollarSign className="w-3 h-3 text-green-400" />}
                {entry.key === 'leverage' && <BarChart3 className="w-3 h-3 text-orange-400" />}
                {entry.type === 'number' && !entry.key.includes('amount') && !entry.key.includes('leverage') && <span className="w-2 h-2 rounded-full bg-blue-400" />}
                {entry.type === 'string' && <span className="w-2 h-2 bg-gray-400" />}
              </div>

              {/* Output Handle for connections */}
              {entry.isConnection && (
                <Handle
                  type="source"
                  position={Position.Right}
                  id={entry.key}
                  className="bg-gray-400! w-2! h-2! border-none! -right-1! opacity-60 hover:opacity-100 transition-opacity hover:scale-125"
                />
              )}
            </div>
          ))
        ) : (
          <div className="px-4 py-3 text-xs text-gray-500 italic text-center">
            No properties
          </div>
        )}
      </div>

      {/* Output Handle - for triggers and actions that can chain */}
      {(isTrigger || isAction) && (
        <Handle
          type="source"
          position={Position.Right}
          className={`${colors.handleColor}! w-3! h-3! border-2! border-gray-800! -right-1.5! shadow-[0_0_10px_currentColor]`}
        />
      )}
    </div>
  );
};

export default memo(CustomNode);
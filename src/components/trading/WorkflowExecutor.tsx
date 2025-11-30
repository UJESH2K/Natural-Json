import React, { useState, useEffect } from 'react';
import { Workflow } from '@/types/workflow';

interface WorkflowExecutorProps {
  workflow: Workflow | null;
  provider: 'cardano' | 'backpack' | 'lighter' | 'masumi';
  onExecutionStart: () => void;
  onExecutionStop: () => void;
  onTradeEvent: (event: any) => void;
}

export const WorkflowExecutor: React.FC<WorkflowExecutorProps> = ({
  workflow,
  provider,
  onExecutionStart,
  onExecutionStop,
  onTradeEvent
}) => {
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionCount, setExecutionCount] = useState(0);
  const [results, setResults] = useState<any[]>([]);

  // Auto-execute recurring workflows
  useEffect(() => {
    if (!workflow) return;

    // Check if workflow has timer trigger (recurring)
    const timerTrigger = workflow.triggers.find((t: any) => t.type === 'TimerTrigger');
    
    if (timerTrigger && timerTrigger.intervalSec && !isExecuting) {
      console.log(`🔄 Starting recurring workflow: every ${timerTrigger.intervalSec} seconds`);
      setIsExecuting(true);
      onExecutionStart();

      const interval = setInterval(async () => {
        try {
          console.log(`📈 Executing trade #${executionCount + 1}`);
          
          // Execute the workflow via API
          // Submit trade to both workflow API and real-time webhook server
          const [workflowResponse, webhookResponse] = await Promise.all([
            fetch('/api/execute', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ workflow, provider })
            }),
            fetch('http://localhost:4000/api/submit-trade', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'buy',
                amount: 10,
                asset: 'ADA',
                provider: provider
              })
            }).catch(err => {
              console.warn('Webhook server not available:', err.message);
              return null;
            })
          ]);
          
          const result = await workflowResponse.json();
          
          if (result.ok) {
            setResults(prev => [...prev, ...result.results]);
            
            // Send trade event to dashboard
            const tradeEvent = {
              type: 'action',
              actionId: `action-${Date.now()}`,
              status: 'placed',
              result: result.results[0],
              webhookSubmitted: !!webhookResponse
            };
            onTradeEvent(tradeEvent);
            
            console.log(`✅ Trade ${executionCount + 1} submitted - Workflow: ${result.ok}, Webhook: ${!!webhookResponse}`);
          }

          setExecutionCount(prev => prev + 1);

          // Stop after 50 iterations for extended demo
          if (executionCount >= 49) {
            clearInterval(interval);
            setIsExecuting(false);
            onExecutionStop();
            console.log('✅ Recurring workflow completed (50 trades max)');
          }

        } catch (error) {
          console.error('❌ Trade execution error:', error);
        }
      }, Math.max(1000, timerTrigger.intervalSec * 1000)); // Min 1 second interval

      return () => {
        clearInterval(interval);
        setIsExecuting(false);
        onExecutionStop();
      };
    }
  }, [workflow, provider, executionCount, isExecuting, onExecutionStart, onExecutionStop, onTradeEvent]);

  const handleManualExecute = async () => {
    if (!workflow || isExecuting) return;

    try {
      setIsExecuting(true);
      onExecutionStart();

      console.log('🚀 Executing workflow manually...');
      
      // Execute via API
      const response = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflow,
          provider
        })
      });
      
      const result = await response.json();
      
      if (result.ok) {
        setResults(prev => [...prev, ...result.results]);
        
        // Simulate trade event for dashboard
        const tradeEvent = {
          type: 'action',
          actionId: `action-${Date.now()}`,
          status: 'placed',
          result: result.results[0]
        };
        onTradeEvent(tradeEvent);
        
        console.log('✅ Manual execution completed');
      } else {
        console.error('❌ Manual execution failed:', result.error);
      }

    } catch (error) {
      console.error('❌ Manual execution error:', error);
    } finally {
      setIsExecuting(false);
      onExecutionStop();
    }
  };

  const handleStop = () => {
    setIsExecuting(false);
    onExecutionStop();
    console.log('⏹️ Workflow execution stopped');
  };

  if (!workflow) return null;

  const timerTrigger = workflow.triggers.find((t: any) => t.type === 'TimerTrigger');
  const isRecurring = !!timerTrigger;

  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">
          {isRecurring ? '🔄 Recurring Execution' : '⚡ Manual Execution'}
        </h3>
        <div className="flex items-center gap-2">
          {isExecuting && (
            <div className="flex items-center gap-2 text-green-400">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm">Executing...</span>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {/* Workflow Info */}
        <div className="bg-gray-700 p-3 rounded">
          <div className="text-sm text-gray-300">
            <div><strong>Provider:</strong> {provider.toUpperCase()}</div>
            <div><strong>Triggers:</strong> {workflow.triggers.length}</div>
            <div><strong>Actions:</strong> {workflow.actions.length}</div>
            {isRecurring && (
              <div><strong>Interval:</strong> {timerTrigger.intervalSec} seconds</div>
            )}
          </div>
        </div>

        {/* Execution Stats */}
        {isExecuting && (
          <div className="bg-blue-900/20 border border-blue-500/30 p-3 rounded">
            <div className="text-blue-400">
              <div className="text-sm">Execution Count: <strong>{executionCount}</strong></div>
              {isRecurring && (
                <div className="text-xs text-blue-300 mt-1">
                  Max: 10 trades (safety limit)
                </div>
              )}
            </div>
          </div>
        )}

        {/* Control Buttons */}
        <div className="flex gap-2">
          {!isExecuting ? (
            <button
              onClick={isRecurring ? () => {} : handleManualExecute}
              disabled={isRecurring}
              className={`px-4 py-2 rounded font-medium ${
                isRecurring 
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isRecurring ? 'Auto-Starting...' : '▶️ Execute Now'}
            </button>
          ) : (
            <button
              onClick={handleStop}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-medium"
            >
              ⏹️ Stop Execution
            </button>
          )}
        </div>

        {/* Recent Results */}
        {results.length > 0 && (
          <div className="bg-gray-700 p-3 rounded">
            <div className="text-sm text-gray-300 mb-2">
              <strong>Recent Results:</strong>
            </div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {results.slice(-5).map((result, index) => (
                <div key={index} className="text-xs p-2 bg-gray-600 rounded">
                  <span className={result.ok ? 'text-green-400' : 'text-red-400'}>
                    {result.ok ? '✅' : '❌'} {result.message}
                  </span>
                  {result.txId && (
                    <div className="text-gray-400 mt-1">
                      TX: {result.txId.substring(0, 16)}...
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
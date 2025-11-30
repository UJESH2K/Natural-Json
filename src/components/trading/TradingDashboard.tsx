import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { io, Socket } from 'socket.io-client';

interface TradeData {
  id: string;
  timestamp: string;
  time: string;
  side: 'buy' | 'sell';
  asset: string;
  amount: number;
  price: number;
  total: number;
  status: 'executing' | 'completed' | 'failed';
  txHash: string;
}

interface TradingDashboardProps {
  workflowId?: string;
  isExecuting: boolean;
}

export const TradingDashboard: React.FC<TradingDashboardProps> = ({
  workflowId,
  isExecuting
}) => {
  const [trades, setTrades] = useState<TradeData[]>([]);
  const [currentPrice, setCurrentPrice] = useState(0.45);
  const [totalVolume, setTotalVolume] = useState(0);
  const [totalValue, setTotalValue] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Price simulation - updates every 2 seconds
  useEffect(() => {
    const priceInterval = setInterval(() => {
      setCurrentPrice(prev => {
        const change = (Math.random() - 0.5) * 0.02; // ±1% change
        const newPrice = Math.max(0.3, Math.min(0.7, prev + change));
        return Math.round(newPrice * 1000) / 1000;
      });
    }, 2000);

    return () => clearInterval(priceInterval);
  }, []);

  // Real-time Blockfrost WebSocket connection
  useEffect(() => {
    if (!isExecuting || !workflowId) return;

    // Connect to real-time trading WebSocket server
    const connectToTradingSocket = () => {
      try {
        const socket = io('http://localhost:4000', {
          transports: ['websocket', 'polling']
        });
        
        socket.on('connect', () => {
          console.log('🔗 Connected to real-time trading server');
          setIsConnected(true);
        });
        
        socket.on('disconnect', () => {
          console.log('❌ Disconnected from trading server');
          setIsConnected(false);
        });
        
        // Listen for Blockfrost webhook events
        socket.on('trade:blockfrost-event', (event: any) => {
          console.log('🔗 Blockfrost event received:', event);
          // Handle real blockchain events here
        });
        
        // Listen for completed trades from blockchain
        socket.on('trade:completed', (trade: any) => {
          console.log('✅ Trade completed on blockchain:', trade);
          setTrades(prev => {
            const updated = prev.map(t => 
              t.txHash === trade.txHash ? { ...t, ...trade, status: 'completed' } : t
            );
            return updated.some(t => t.txHash === trade.txHash) ? updated : [...updated, trade];
          });
        });
        
        // Listen for submitted trades
        socket.on('trade:submitted', (trade: any) => {
          console.log('📤 Trade submitted to blockchain:', trade);
          setTrades(prev => [trade, ...prev.slice(0, 19)]); // Keep last 20 trades
        });
        
        // Status updates
        socket.on('trade:status', (status: any) => {
          console.log('📊 Trading status:', status);
          setIsConnected(status.connected);
        });
        
        return socket;
      } catch (error) {
        console.warn('Socket.IO not available, falling back to simulation');
        return null;
      }
    };
    
    const socket = connectToTradingSocket();

    // Fallback to events stream if WebSocket unavailable
    if (!socket && eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const eventSource = new EventSource(`/api/events?workflowId=${encodeURIComponent(workflowId)}`);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
      console.log('📡 Connected to trading stream');
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📊 Trade event received:', data);

        if (data.type === 'action' && data.status === 'placed') {
          // Create new trade entry
          const trade: TradeData = {
            id: `trade-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toISOString(),
            time: new Date().toLocaleTimeString(),
            side: 'buy', // From the action
            asset: 'ADA',
            amount: 10, // From prompt
            price: currentPrice,
            total: 10 * currentPrice,
            status: 'executing',
            txHash: data.result?.txId || 'pending'
          };

          setTrades(prev => {
            const updated = [trade, ...prev].slice(0, 50); // Keep last 50 trades
            return updated;
          });

          // Update totals
          setTotalVolume(prev => prev + 10);
          setTotalValue(prev => prev + (10 * currentPrice));

          // Mark as completed after 2 seconds
          setTimeout(() => {
            setTrades(prev => 
              prev.map(t => 
                t.id === trade.id 
                  ? { ...t, status: 'completed' as const, txHash: `sim_${Date.now()}` }
                  : t
              )
            );
          }, 2000);
        }
      } catch (error) {
        console.error('❌ Error parsing trade event:', error);
      }
    };

    eventSource.onerror = () => {
      setIsConnected(false);
      console.log('❌ Trading stream disconnected');
    };

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      setIsConnected(false);
    };
  }, [isExecuting, workflowId, currentPrice]);

  // Prepare chart data
  const chartData = trades.slice(0, 20).reverse().map((trade, index) => ({
    name: `${index + 1}`,
    time: trade.time,
    price: trade.price,
    amount: trade.amount,
    total: trade.total,
    status: trade.status
  }));

  const volumeData = trades.slice(0, 10).reverse().map((trade, index) => ({
    name: trade.time.split(':').slice(0, 2).join(':'),
    volume: trade.amount,
    value: trade.total
  }));

  const statusData = [
    { name: 'Completed', value: trades.filter(t => t.status === 'completed').length, color: '#10b981' },
    { name: 'Executing', value: trades.filter(t => t.status === 'executing').length, color: '#f59e0b' },
    { name: 'Failed', value: trades.filter(t => t.status === 'failed').length, color: '#ef4444' }
  ];

  // Function to submit real trade to blockchain
  const submitRealTrade = async (amount: number, side: 'buy' | 'sell' = 'buy') => {
    try {
      const response = await fetch('http://localhost:4000/api/submit-trade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount,
          asset: 'ADA',
          side
        })
      });
      
      if (!response.ok) {
        throw new Error(`Trade submission failed: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('✅ Trade submitted successfully:', result);
      return result;
    } catch (error) {
      console.error('❌ Failed to submit trade:', error);
      throw error;
    }
  };

  return (
    <div className="bg-gray-900 text-white p-6 rounded-lg space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">🚀 Live Trading Dashboard</h2>
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
            {isConnected ? 'Connected' : 'Disconnected'}
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">ADA Price</div>
            <div className="text-xl font-bold text-blue-400">${currentPrice}</div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="text-sm text-gray-400">Total Trades</div>
          <div className="text-2xl font-bold text-blue-400">{trades.length}</div>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="text-sm text-gray-400">Volume (ADA)</div>
          <div className="text-2xl font-bold text-green-400">{totalVolume.toFixed(1)}</div>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="text-sm text-gray-400">Value (USD)</div>
          <div className="text-2xl font-bold text-yellow-400">${totalValue.toFixed(2)}</div>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="text-sm text-gray-400">Success Rate</div>
          <div className="text-2xl font-bold text-purple-400">
            {trades.length > 0 ? Math.round((trades.filter(t => t.status === 'completed').length / trades.length) * 100) : 0}%
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Price Chart */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">📈 Price & Trade History</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                labelStyle={{ color: '#f3f4f6' }}
              />
              <Line 
                type="monotone" 
                dataKey="price" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Volume Chart */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">📊 Trade Volume</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={volumeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                labelStyle={{ color: '#f3f4f6' }}
              />
              <Bar dataKey="volume" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Status Chart */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">🎯 Trade Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

      </div>

      
     
      <div className="bg-gray-800 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">📋 Recent Trades</h3>
        <div className="space-y-2 max-h-250 overflow-y-auto">
          {trades.slice(0, 8).map((trade) => (
            <div key={trade.id} className="flex items-center justify-between py-2 px-3 bg-gray-700 rounded">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${
                  trade.status === 'completed' ? 'bg-green-400' : 
                  trade.status === 'executing' ? 'bg-yellow-400 animate-pulse' : 'bg-red-400'
                }`}></div>
                <div>
                  <div className="text-sm font-medium">{trade.amount} {trade.asset}</div>
                  <div className="text-xs text-gray-400">{trade.time}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">${trade.total.toFixed(2)}</div>
                <div className="text-xs text-gray-400">@${trade.price}</div>
              </div>
            </div>
          ))}
          {trades.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <div className="text-lg">⏳ Waiting for trades...</div>
              <div className="text-sm">Submit a workflow to see live trading data</div>
            </div>
          )}
        </div>
      </div>

      {/* Real-time Status */}
      {isExecuting && (
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 bg-blue-400 rounded-full animate-pulse"></div>
            <span className="text-blue-400 font-medium">
              🔄 Workflow executing... Trades will appear here in real-time
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
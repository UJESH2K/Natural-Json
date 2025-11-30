// Real-time trading server with Blockfrost webhooks and Socket.IO
const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const { Server: IOServer } = require('socket.io');
const cors = require('cors');

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const PORT = process.env.WEBHOOK_PORT || 4000;
const BLOCKFROST_TOKEN = process.env.BLOCKFROST_PROJECT_ID || process.env.BLOCKFROST_PROJECT_ID_TESTNET;

const app = express();
app.use(cors({ origin: '*' }));
app.use(bodyParser.json());

const server = http.createServer(app);
const io = new IOServer(server, { 
  cors: { origin: '*' },
  path: '/socket.io'
});

// Connected clients
let connectedClients = new Set();

io.on('connection', (socket) => {
  console.log('📱 Trading client connected:', socket.id);
  connectedClients.add(socket.id);
  
  // Send current status to new client
  socket.emit('trade:status', {
    connected: true,
    clientCount: connectedClients.size,
    timestamp: new Date().toISOString()
  });
  
  socket.on('disconnect', () => {
    console.log('📱 Trading client disconnected:', socket.id);
    connectedClients.delete(socket.id);
  });
});

// Blockfrost webhook endpoint for real-time transaction events
app.post('/webhook/blockfrost', async (req, res) => {
  try {
    const event = req.body;
    console.log('🔗 Blockfrost webhook received:', JSON.stringify(event, null, 2));
    
    // Broadcast to all connected trading clients
    io.emit('trade:blockfrost-event', {
      ...event,
      timestamp: new Date().toISOString(),
      clientCount: connectedClients.size
    });
    
    res.status(200).json({ success: true, processed: true });
    
  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Manual trade submission endpoint (for testing)
app.post('/api/submit-trade', async (req, res) => {
  try {
    const { amount, asset = 'ADA', side = 'buy' } = req.body;
    
    // Generate mock tx hash for demo
    const txHash = 'demo_' + Date.now().toString(16) + '_' + Math.random().toString(16).substring(2, 8);
    
    // Emit immediate trade event
    const tradeEvent = {
      id: Math.random().toString(36).substring(7),
      timestamp: new Date().toISOString(),
      time: new Date().toLocaleTimeString(),
      side,
      asset,
      amount: parseFloat(amount),
      price: 0.45 + (Math.random() - 0.5) * 0.02,
      total: parseFloat(amount) * (0.45 + (Math.random() - 0.5) * 0.02),
      status: 'executing',
      txHash
    };
    
    io.emit('trade:submitted', tradeEvent);
    
    // Simulate blockchain confirmation after 3-5 seconds
    setTimeout(() => {
      io.emit('trade:completed', {
        ...tradeEvent,
        status: 'completed',
        blockHeight: Math.floor(Math.random() * 1000000) + 9000000,
        fees: 0.17
      });
    }, 3000 + Math.random() * 2000);
    
    console.log(`📤 Simulated ${side} ${amount} ${asset} - TX Hash: ${txHash}`);
    
    res.json({ success: true, txHash, tradeEvent });
    
  } catch (error) {
    console.error('❌ Trade submission error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    connectedClients: connectedClients.size,
    timestamp: new Date().toISOString(),
    blockfrost: !!BLOCKFROST_TOKEN
  });
});

app.get('/', (req, res) => {
  res.json({ 
    status: 'Jrine Real-time Trading Server',
    timestamp: new Date().toISOString(),
    port: PORT,
    connectedClients: connectedClients.size,
    endpoints: [
      'POST /api/submit-trade',
      'POST /webhook/blockfrost', 
      'GET /health',
      'WS /socket.io'
    ]
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Real-time Trading Server running on port ${PORT}`);
  console.log(`🔗 Blockfrost integration: ${BLOCKFROST_TOKEN ? 'ENABLED' : 'DISABLED (add BLOCKFROST_PROJECT_ID to .env.local)'}`);
  console.log(`📡 WebSocket endpoint: ws://localhost:${PORT}/socket.io`);
  console.log(`🎯 Webhook endpoint: http://localhost:${PORT}/webhook/blockfrost`);
  console.log(`🎮 Manual trading: POST localhost:${PORT}/api/submit-trade`);
});
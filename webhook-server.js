// Simple webhook server for /api/nlp endpoint
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

const app = express();
const PORT = 8080;

// Enable CORS for all requests
app.use(cors());
app.use(express.json());

// Log all requests
app.use((req, res, next) => {
  console.log(`📨 ${new Date().toISOString()} - ${req.method} ${req.url}`);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// Proxy /api/nlp requests to localhost:3000
app.use('/api/nlp', createProxyMiddleware({
  target: 'http://localhost:3000',
  changeOrigin: true,
  logLevel: 'info',
  onProxyReq: (proxyReq, req, res) => {
    console.log('🔄 Proxying to localhost:3000/api/nlp');
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log('✅ Response from localhost:3000:', proxyRes.statusCode);
  },
  onError: (err, req, res) => {
    console.error('❌ Proxy Error:', err.message);
    res.status(500).json({ error: 'Proxy connection failed', details: err.message });
  }
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Webhook server running',
    timestamp: new Date().toISOString(),
    proxying: 'http://localhost:3000/api/nlp'
  });
});

// Catch all other routes
app.all('*', (req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    message: 'This server only proxies /api/nlp requests to localhost:3000',
    availableEndpoints: ['/api/nlp', '/health']
  });
});

app.listen(PORT, () => {
  console.log('🚀 Webhook server running on port', PORT);
  console.log('🔗 Proxying /api/nlp to http://localhost:3000/api/nlp');
  console.log('📊 Health check: http://localhost:' + PORT + '/health');
  console.log('🌐 External endpoint: http://localhost:' + PORT + '/api/nlp');
});
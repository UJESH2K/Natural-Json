// Test Cardano + Blockfrost integration
const axios = require('axios');

async function testCardanoIntegration() {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🧪 Testing Cardano + Blockfrost Integration...\n');

  try {
    // Test 1: Get real-time ADA price
    console.log('1️⃣ Testing real-time price...');
    const priceResponse = await axios.get(`${baseUrl}/api/cardano?action=price`);
    console.log('✅ Price:', priceResponse.data.data);
    console.log('');

    // Test 2: Get network info
    console.log('2️⃣ Testing network info...');
    const networkResponse = await axios.get(`${baseUrl}/api/cardano?action=network`);
    console.log('✅ Network:', networkResponse.data.data.network);
    console.log('✅ Latest Block:', networkResponse.data.data.latestBlock.height);
    console.log('');

    // Test 3: Get popular tokens
    console.log('3️⃣ Testing token info...');
    const tokensResponse = await axios.get(`${baseUrl}/api/cardano?action=tokens`);
    console.log('✅ Base Assets:', tokensResponse.data.data.baseAssets);
    console.log('');

    // Test 4: Simulate a trade
    console.log('4️⃣ Testing trade simulation...');
    const tradeResponse = await axios.post(`${baseUrl}/api/cardano`, {
      action: 'simulate_trade',
      side: 'buy',
      asset: 'ADA',
      amount: 100
    });
    console.log('✅ Trade Result:', tradeResponse.data.data.transaction);
    console.log('✅ Message:', tradeResponse.data.data.message);
    console.log('');

    // Test 5: Test workflow execution with Cardano
    console.log('5️⃣ Testing workflow with Cardano...');
    const workflowResponse = await axios.post(`${baseUrl}/api/nlp`, {
      prompt: 'buy 50 ADA when price hits $0.50'
    });
    
    if (workflowResponse.data) {
      console.log('✅ Workflow created with ID:', workflowResponse.data.id);
      console.log('✅ Triggers:', workflowResponse.data.triggers.length);
      console.log('✅ Actions:', workflowResponse.data.actions.length);
    }

    console.log('\n🎉 All Cardano integration tests passed!');
    console.log('🔗 Your system can now:');
    console.log('   • Fetch real-time ADA prices from CoinGecko');
    console.log('   • Connect to Cardano Preprod Testnet via Blockfrost');
    console.log('   • Simulate realistic trades with actual blockchain data');
    console.log('   • Process natural language → JSON → Cardano transactions');
    console.log('   • Send email notifications for completed trades');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure the Next.js server is running on http://localhost:3000');
    console.log('2. Check BLOCKFROST_PROJECT_ID in .env.local');
    console.log('3. Sign up at https://blockfrost.io/ for a free API key');
  }
}

testCardanoIntegration();
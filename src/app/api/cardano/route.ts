import { NextRequest, NextResponse } from 'next/server';
import { cardanoService } from '@/lib/cardanoService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const address = searchParams.get('address');
    const txHash = searchParams.get('txHash');

    switch (action) {
      case 'price':
        const price = await cardanoService.getRealTimePrice();
        return NextResponse.json({
          success: true,
          data: price
        });

      case 'network':
        const network = await cardanoService.getNetworkInfo();
        return NextResponse.json({
          success: true,
          data: network
        });

      case 'tokens':
        const tokens = await cardanoService.getPopularTokens();
        return NextResponse.json({
          success: true,
          data: tokens
        });

      case 'account':
        if (!address) {
          return NextResponse.json({
            success: false,
            error: 'Address parameter required for account info'
          }, { status: 400 });
        }
        
        const accountInfo = await cardanoService.getAccountInfo(address);
        return NextResponse.json({
          success: true,
          data: accountInfo
        });

      case 'transaction':
        if (!txHash) {
          return NextResponse.json({
            success: false,
            error: 'Transaction hash required'
          }, { status: 400 });
        }
        
        const txStatus = await cardanoService.getTransactionStatus(txHash);
        return NextResponse.json({
          success: true,
          data: txStatus
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Available: price, network, tokens, account, transaction'
        }, { status: 400 });
    }
    
  } catch (error: any) {
    console.error('❌ Cardano API error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Cardano service error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    switch (action) {
      case 'simulate_trade':
        const { side, asset, amount, price } = params;
        
        if (!side || !asset || !amount) {
          return NextResponse.json({
            success: false,
            error: 'Missing required parameters: side, asset, amount'
          }, { status: 400 });
        }

        const transaction = await cardanoService.simulateTradeTransaction({
          side,
          asset,
          amount: parseFloat(amount),
          price: price ? parseFloat(price) : undefined
        });

        return NextResponse.json({
          success: true,
          data: {
            transaction,
            message: `Simulated ${side} of ${amount} ${asset} on Cardano testnet`,
            network: 'Cardano Preprod Testnet'
          }
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid POST action. Available: simulate_trade'
        }, { status: 400 });
    }
    
  } catch (error: any) {
    console.error('❌ Cardano POST error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Cardano service error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return NextResponse.json({}, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}
import { BlockfrostAPI } from '@blockfrost/blockfrost-js';
import axios from 'axios';

export interface CardanoPrice {
  ada_usd: number;
  ada_btc: number;
  ada_eth: number;
  timestamp: string;
}

export interface CardanoTransaction {
  txHash: string;
  amount: string;
  fee: string;
  status: 'submitted' | 'confirmed' | 'failed';
  blockHeight?: number;
  timestamp: string;
}

export interface CardanoTradeParams {
  side: 'buy' | 'sell';
  asset: string;
  amount: number;
  price?: number;
}

export class CardanoBlockfrostService {
  private blockfrost: BlockfrostAPI;
  private network: string;

  constructor() {
    const projectId = process.env.BLOCKFROST_PROJECT_ID;
    const network = process.env.BLOCKFROST_NETWORK || 'preprod';
    
    if (!projectId || projectId.includes('YOUR_PROJECT_ID_HERE')) {
      console.warn('⚠️ BLOCKFROST_PROJECT_ID not configured. Running in simulation mode.');
      console.log('📝 To get real blockchain data:');
      console.log('   1. Sign up at https://blockfrost.io/');
      console.log('   2. Create a "Cardano Preprod" project');
      console.log('   3. Copy project ID to BLOCKFROST_PROJECT_ID in .env.local');
      
      // Create a dummy blockfrost instance to prevent errors
      this.blockfrost = null as any;
      this.network = network;
      return;
    }

    try {
      this.blockfrost = new BlockfrostAPI({
        projectId,
        network: network as 'mainnet' | 'testnet' | 'preprod'
      });
      
      this.network = network;
      console.log(`🔗 Cardano Blockfrost service initialized for ${network}`);
    } catch (error) {
      console.error('❌ Blockfrost initialization failed:', error);
      this.blockfrost = null as any;
      this.network = network;
    }
  }

  /**
   * Get real-time ADA price from multiple sources
   */
  async getRealTimePrice(): Promise<CardanoPrice> {
    try {
      console.log('📊 Fetching real-time ADA price...');
      
      // Try CoinGecko first (free tier)
      const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=cardano&vs_currencies=usd,btc,eth');
      
      const price: CardanoPrice = {
        ada_usd: response.data.cardano.usd,
        ada_btc: response.data.cardano.btc,
        ada_eth: response.data.cardano.eth,
        timestamp: new Date().toISOString()
      };

      console.log(`💰 ADA Price: $${price.ada_usd} USD`);
      return price;
      
    } catch (error) {
      console.error('❌ Price fetch failed, using fallback:', error);
      
      // Fallback price (approximate current ADA price)
      return {
        ada_usd: 0.45,
        ada_btc: 0.0000047,
        ada_eth: 0.00014,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get network information and latest block
   */
  async getNetworkInfo() {
    if (!this.blockfrost) {
      console.log(`🌐 Cardano ${this.network} - Simulation Mode`);
      
      // Return mock network data for demo
      return {
        network: this.network,
        mode: 'simulation',
        latestBlock: {
          height: Math.floor(Date.now() / 20000), // Simulate growing block height
          hash: `sim_block_${Date.now()}`,
          time: Date.now(),
          slot: Math.floor(Date.now() / 1000)
        },
        networkInfo: {
          supply: { max: '45000000000000000', total: '32066390668330808' },
          stake: { live: '23395324667136338' }
        }
      };
    }

    try {
      const networkInfo = await this.blockfrost.network();
      const latestBlock = await this.blockfrost.blocksLatest();
      
      console.log(`🌐 Cardano ${this.network} - Latest Block: ${latestBlock.height}`);
      
      return {
        network: this.network,
        mode: 'live',
        latestBlock: {
          height: latestBlock.height,
          hash: latestBlock.hash,
          time: latestBlock.time,
          slot: latestBlock.slot
        },
        networkInfo
      };
      
    } catch (error) {
      console.error('❌ Network info fetch failed, using simulation:', error);
      
      // Fallback to simulation mode
      return {
        network: this.network,
        mode: 'simulation_fallback',
        latestBlock: {
          height: Math.floor(Date.now() / 20000),
          hash: `fallback_block_${Date.now()}`,
          time: Date.now(),
          slot: Math.floor(Date.now() / 1000)
        },
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Simulate a trade transaction on Cardano testnet
   * This creates a realistic transaction simulation without requiring real funds
   */
  async simulateTradeTransaction(params: CardanoTradeParams): Promise<CardanoTransaction> {
    try {
      console.log(`🔄 Simulating ${params.side} ${params.amount} ${params.asset} on Cardano ${this.network}`);
      
      // Get current price for calculation
      const price = await this.getRealTimePrice();
      const networkInfo = await this.getNetworkInfo();
      
      // Calculate trade values
      const adaAmount = params.asset === 'ADA' ? params.amount : params.amount / price.ada_usd;
      const usdValue = params.asset === 'ADA' ? params.amount * price.ada_usd : params.amount;
      
      // Simulate transaction fee (typical Cardano fee: 0.16-0.17 ADA)
      const fee = '0.165743'; 
      
      // Generate realistic transaction hash (testnet format)
      const txHash = this.generateTestnetTxHash();
      
      // Create transaction simulation
      const transaction: CardanoTransaction = {
        txHash,
        amount: `${adaAmount.toFixed(6)} ADA (≈$${usdValue.toFixed(2)})`,
        fee: `${fee} ADA`,
        status: 'submitted',
        blockHeight: networkInfo.latestBlock.height + 1, // Next block
        timestamp: new Date().toISOString()
      };

      console.log(`✅ Trade simulated successfully:`);
      console.log(`   TX Hash: ${txHash}`);
      console.log(`   Amount: ${transaction.amount}`);
      console.log(`   Fee: ${transaction.fee}`);
      console.log(`   Network: Cardano ${this.network}`);
      
      // Simulate confirmation after a short delay
      setTimeout(() => {
        console.log(`🎉 Transaction ${txHash.substring(0, 8)}... confirmed on block ${transaction.blockHeight}`);
      }, 2000);

      return transaction;
      
    } catch (error) {
      console.error('❌ Trade simulation failed:', error);
      
      return {
        txHash: 'simulation_failed',
        amount: '0 ADA',
        fee: '0 ADA', 
        status: 'failed',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get transaction status from Cardano blockchain
   */
  async getTransactionStatus(txHash: string): Promise<any> {
    try {
      if (txHash === 'simulation_failed' || txHash.startsWith('sim_')) {
        return {
          status: 'simulation',
          message: 'This is a simulated transaction for demo purposes'
        };
      }

      const tx = await this.blockfrost.txs(txHash);
      const utxos = await this.blockfrost.txsUtxos(txHash);
      
      return {
        status: 'confirmed',
        block: tx.block,
        blockHeight: tx.block_height,
        fees: tx.fees,
        size: tx.size,
        utxos: utxos
      };
      
    } catch (error) {
      console.log(`ℹ️  Transaction ${txHash} not found (likely simulation)`);
      return {
        status: 'not_found',
        message: 'Transaction not found on blockchain (simulation mode)'
      };
    }
  }

  /**
   * Get account information for a given address
   */
  async getAccountInfo(address: string) {
    try {
      const account = await this.blockfrost.accounts(address);
      const history = await this.blockfrost.accountsHistory(address);
      
      return {
        address,
        balance: account.controlled_amount,
        rewards: account.rewards_sum,
        withdrawals: account.withdrawals_sum,
        history: history.slice(0, 5) // Last 5 transactions
      };
      
    } catch (error) {
      console.error('❌ Account info fetch failed:', error);
      return null;
    }
  }

  /**
   * Generate a realistic testnet transaction hash
   */
  private generateTestnetTxHash(): string {
    const prefix = 'sim_'; // Prefix to indicate simulation
    const chars = '0123456789abcdef';
    let hash = prefix;
    
    for (let i = 0; i < 60; i++) {
      hash += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return hash;
  }

  /**
   * Get popular Cardano native tokens for trading simulation
   */
  async getPopularTokens() {
    try {
      // Get some popular Cardano native tokens
      const assets = await this.blockfrost.assets();
      
      return {
        nativeTokens: assets.slice(0, 10).map((asset: any) => ({
          asset: asset.asset,
          name: asset.onchain_metadata?.name || 'Unknown',
          ticker: asset.onchain_metadata?.ticker || asset.asset.substring(0, 8)
        })),
        baseAssets: [
          { symbol: 'ADA', name: 'Cardano', decimals: 6 },
          { symbol: 'USD', name: 'US Dollar (simulated)', decimals: 2 }
        ]
      };
      
    } catch (error) {
      console.error('❌ Token fetch failed:', error);
      
      // Return mock data for demo
      return {
        nativeTokens: [
          { asset: 'SUNDAE', name: 'SundaeSwap', ticker: 'SUNDAE' },
          { asset: 'MIN', name: 'Minswap', ticker: 'MIN' },
          { asset: 'WMT', name: 'World Mobile Token', ticker: 'WMT' }
        ],
        baseAssets: [
          { symbol: 'ADA', name: 'Cardano', decimals: 6 },
          { symbol: 'USD', name: 'US Dollar (simulated)', decimals: 2 }
        ]
      };
    }
  }
}

// Create singleton instance
export const cardanoService = new CardanoBlockfrostService();
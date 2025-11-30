import axios from "axios";
import { ethers } from "ethers";

export interface LighterOrderParams {
  symbol: string;
  side: "BUY" | "SELL";
  size: number;
  type: "MARKET" | "LIMIT";
  price?: number;
  leverage?: number;
}

export interface LighterOrder {
  symbol: string;
  side: string;
  size: string;
  type: string;
  price?: string;
  leverage?: number;
  timestamp: number;
  nonce: number;
}

export class LighterClient {
  private baseUrl: string;
  private apiKeyPublic: string;
  private apiKeyPrivate: string;
  private apiKeyIndex: number;
  private ethPrivateKey: string;
  private walletAddress: string;

  constructor({
    baseUrl,
    apiKeyPublic,
    apiKeyPrivate,
    apiKeyIndex,
    ethPrivateKey,
    walletAddress,
  }: {
    baseUrl: string;
    apiKeyPublic: string;
    apiKeyPrivate: string;
    apiKeyIndex: number;
    ethPrivateKey: string;
    walletAddress: string;
  }) {
    this.baseUrl = baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`;
    this.apiKeyPublic = apiKeyPublic;
    this.apiKeyPrivate = apiKeyPrivate;
    this.apiKeyIndex = apiKeyIndex;
    this.ethPrivateKey = ethPrivateKey;
    this.walletAddress = walletAddress;
    
    console.log("❌ LighterClient: API endpoints not working - no real trading available");
  }

  async getNonce(): Promise<number> {
    console.log("❌ Nonce API not available");
    throw new Error("Nonce API not working");
    
    try {
      // Try Lighter-specific endpoints
      const endpoints = [
        `/account/nonce?address=${this.walletAddress}`,
        `/api/account/nonce?address=${this.walletAddress}`,
        `/v1/account/nonce?address=${this.walletAddress}`,
        `/api/v1/nonce?wallet=${this.walletAddress}`,
        `/nonce?address=${this.walletAddress}`
      ];
      
      for (const endpoint of endpoints) {
        try {
          console.log(`Trying nonce endpoint: ${this.baseUrl}${endpoint}`);
          const response = await axios.get(`${this.baseUrl}${endpoint}`, {
            headers: this.getHeaders(),
          });
          
          const nonce = response.data?.nonce || response.data?.result?.nonce;
          if (nonce !== undefined) {
            console.log(`✅ Got nonce ${nonce} from ${endpoint}`);
            return nonce;
          }
        } catch (err: any) {
          console.log(`❌ Nonce endpoint ${endpoint} failed:`, err?.response?.status);
          continue;
        }
      }
      
      console.warn("All nonce endpoints failed, using timestamp fallback");
      return Date.now();
    } catch (error: any) {
      console.error("Failed to get nonce:", error?.message);
      return Date.now();
    }
  }

  async getPrice(symbol: string): Promise<number> {
    console.log("❌ Price API not available");
    throw new Error("Price API not working");
    
    try {
      // Try Lighter-specific ticker endpoints
      const endpoints = [
        `/ticker?symbol=${symbol}`,
        `/api/ticker?symbol=${symbol}`,
        `/v1/ticker?symbol=${symbol}`,
        `/market/ticker?pair=${symbol}`,
        `/api/v1/ticker/${symbol}`,
        `/price?symbol=${symbol}`
      ];
      
      for (const endpoint of endpoints) {
        try {
          console.log(`Trying price endpoint: ${this.baseUrl}${endpoint}`);
          const response = await axios.get(`${this.baseUrl}${endpoint}`, {
            headers: this.getHeaders(),
          });
          
          const price = parseFloat(
            response.data?.price || 
            response.data?.lastPrice || 
            response.data?.last || 
            response.data?.result?.price ||
            "0"
          );
          
          if (price > 0) {
            console.log(`✅ Got price ${price} for ${symbol} from ${endpoint}`);
            return price;
          }
        } catch (err: any) {
          console.log(`❌ Price endpoint ${endpoint} failed:`, err?.response?.status);
          continue;
        }
      }
      
      console.warn("All ticker endpoints failed, using fallback price");
    } catch (error) {
      console.warn("Ticker failed, using fallback price:", error);
    }
    
    // Fallback prices for common symbols
    const fallbacks: Record<string, number> = {
      "ETH-USDC": 3000,
      "BTC-USDC": 95000,
      ETH: 3000,
      BTC: 95000,
    };
    return fallbacks[symbol] || fallbacks[symbol.replace("-USDC", "")] || 1;
  }

  private getHeaders() {
    return {
      "Content-Type": "application/json",
      "X-API-KEY": this.apiKeyPublic,
      "X-API-INDEX": this.apiKeyIndex.toString(),
    };
  }

  private signOrder(order: LighterOrder): string {
    try {
      // Create message hash from order data
      const message = JSON.stringify({
        symbol: order.symbol,
        side: order.side,
        size: order.size,
        type: order.type,
        price: order.price,
        timestamp: order.timestamp,
        nonce: order.nonce,
        wallet: this.walletAddress,
      });

      // Ensure private key is in correct format
      let privateKey = this.ethPrivateKey;
      if (privateKey.startsWith('0x')) {
        privateKey = privateKey.slice(2);
      }
      // Validate hex format and length
      if (!/^[0-9a-fA-F]{64}$/.test(privateKey)) {
        throw new Error(`Invalid private key format: expected 64 hex chars, got ${privateKey.length}`);
      }

      // Sign with ETH private key
      const wallet = new ethers.Wallet(`0x${privateKey}`);
      const messageHash = ethers.keccak256(ethers.toUtf8Bytes(message));
      const signature = wallet.signingKey.sign(messageHash);
      return ethers.Signature.from(signature).serialized;
    } catch (error) {
      console.error('Signing error:', error);
      throw error;
    }
  }

  async placeOrder(params: LighterOrderParams): Promise<{
    ok: boolean;
    txId?: string;
    message?: string;
    details?: any;
  }> {
    console.log("❌ Lighter API not working - cannot place real orders");
    return {
      ok: false,
      message: "❌ Lighter API endpoints not working - no real trading available",
      details: { error: "API endpoints return 404" }
    };
  }
}
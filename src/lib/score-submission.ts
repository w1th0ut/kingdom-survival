import { ethers } from 'ethers';
import { API_BASE_URL } from './game-config';
import type { ScoreSubmission } from '../types/game';

export interface ScorePayload {
  address: string;
  username: string;
  scoreDelta: number;
  txDelta: number;
  durationMs: number;
  cpsMax: number;
  seed: string;
  timestamp: number;
}

export class ScoreSubmissionService {
  
  /**
   * Create canonical message for signing
   */
  static createMessage(payload: ScorePayload): string {
    return `Kingdom: Survival Score Submission
Address: ${payload.address}
Score: ${payload.scoreDelta}
Transactions: ${payload.txDelta}
Duration: ${payload.durationMs}ms
Max CPS: ${payload.cpsMax}
Seed: ${payload.seed}
Timestamp: ${payload.timestamp}`;
  }

  /**
   * Submit score with signature verification
   */
  static async submitScore(
    payload: ScorePayload,
    signMessage: (message: string) => Promise<string>
  ): Promise<{
    success: boolean;
    transactionHash?: string;
    message?: string;
    error?: string;
  }> {
    try {
      // Create message to sign
      const message = this.createMessage(payload);
      
      // Request signature from user
      const signature = await signMessage(message);
      
      // Submit to backend
      const response = await fetch(`${API_BASE_URL}/submit-score`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...payload,
          signature,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        return {
          success: true,
          transactionHash: result.transactionHash,
          message: result.message,
        };
      } else {
        return {
          success: false,
          error: result.error || 'Failed to submit score',
        };
      }

    } catch (error) {
      console.error('Score submission error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get leaderboard data
   */
  static async getLeaderboard(period: 'daily' | 'weekly' = 'daily') {
    try {
      const response = await fetch(`${API_BASE_URL}/leaderboard?period=${period}`);
      
      if (response.ok) {
        return await response.json();
      } else {
        throw new Error('Failed to load leaderboard');
      }
    } catch (error) {
      console.error('Leaderboard error:', error);
      throw error;
    }
  }

  /**
   * Register game on blockchain (admin function)
   */
  static async registerGame(gameDetails: {
    name: string;
    image: string;
    url: string;
  }) {
    try {
      const response = await fetch(`${API_BASE_URL}/register-game`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(gameDetails),
      });

      const result = await response.json();

      if (response.ok) {
        return {
          success: true,
          transactionHash: result.transactionHash,
          gameAddress: result.gameAddress,
          message: result.message,
        };
      } else {
        return {
          success: false,
          error: result.error || 'Failed to register game',
        };
      }
    } catch (error) {
      console.error('Game registration error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

/**
 * Generate seed for fairness based on daily block hash and user address
 * For demo purposes, this is simplified. In production, use:
 * seed = keccak(blockHash_day || userAddress)
 */
export function generateFairSeed(userAddress: string): string {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const seedInput = `${today}_${userAddress}`;
  
  // Simple hash for demo (use proper keccak256 in production)
  let hash = 0;
  for (let i = 0; i < seedInput.length; i++) {
    const char = seedInput.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(36);
}

/**
 * Generate seed using actual block hash (for production)
 */
export async function generateBlockHashSeed(userAddress: string): Promise<string> {
  try {
    // Get current block hash from Monad RPC
    const rpcUrl = 'https://testnet-rpc.monad.xyz';
    
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getBlockByNumber',
        params: ['latest', false],
        id: 1,
      }),
    });

    const data = await response.json();
    const blockHash = data.result?.hash;

    if (blockHash) {
      // Combine block hash with user address and create seed
      const combined = blockHash + userAddress.toLowerCase();
      const seed = ethers.keccak256(ethers.toUtf8Bytes(combined));
      return seed.slice(2, 18); // Use first 16 hex characters
    } else {
      // Fallback to simple seed
      return generateFairSeed(userAddress);
    }
  } catch (error) {
    console.error('Error generating block hash seed:', error);
    // Fallback to simple seed
    return generateFairSeed(userAddress);
  }
}

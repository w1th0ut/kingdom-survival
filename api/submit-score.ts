import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ethers } from 'ethers';
import { createPublicClient, http } from 'viem';
import { defineChain } from 'viem/utils';
import { GAME_CONTRACT_ABI } from '../src/lib/contract-abi';

// Define Monad testnet chain
const monadTestnet = defineChain({
  id: 41454,
  name: 'Monad Testnet',
  network: 'monad-testnet',
  nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://testnet-rpc.monad.xyz'] },
    public: { http: ['https://testnet-rpc.monad.xyz'] },
  },
  blockExplorers: {
    default: { name: 'Monad Explorer', url: 'https://testnet-explorer.monad.xyz' },
  },
});

// In-memory storage for demo (use proper database in production)
const scores: any[] = [];
const processedSessions = new Set<string>();

interface ScoreSubmission {
  address: string;
  username: string;
  scoreDelta: number;
  txDelta: number;
  durationMs: number;
  cpsMax: number;
  seed: string;
  timestamp: number;
  signature: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('🔥 API ENDPOINT HIT:', req.method, req.url);
  console.log('📥 Request body:', JSON.stringify(req.body, null, 2));
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const submission: ScoreSubmission = req.body;

    // Validate required fields
    const requiredFields = ['address', 'scoreDelta', 'txDelta', 'durationMs', 'cpsMax', 'seed', 'timestamp', 'signature'];
    for (const field of requiredFields) {
      if (!(field in submission)) {
        return res.status(400).json({ error: `Missing field: ${field}` });
      }
    }

    // Create session ID for deduplication
    const sessionId = `${submission.address}_${submission.seed}_${submission.timestamp}`;
    if (processedSessions.has(sessionId)) {
      return res.status(400).json({ error: 'Session already processed' });
    }

    // Sanity checks
    const validationResult = validateSubmission(submission);
    if (!validationResult.isValid) {
      return res.status(400).json({ error: validationResult.error });
    }

    // Verify signature (simplified for demo - in production, verify EIP-191 signature)
    if (submission.signature === 'mock_signature') {
      console.log('Warning: Using mock signature for development');
    } else {
      const isValidSignature = await verifySignature(submission);
      if (!isValidSignature) {
        return res.status(400).json({ error: 'Invalid signature' });
      }
    }

    // Store score off-chain
    const scoreEntry = {
      address: submission.address,
      username: submission.username,
      score: submission.scoreDelta,
      transactions: submission.txDelta,
      timestamp: submission.timestamp,
      seed: submission.seed,
      duration: submission.durationMs,
      cpsMax: submission.cpsMax,
    };

    scores.push(scoreEntry);
    processedSessions.add(sessionId);

    // Submit to blockchain
    try {
      const txHash = await submitToBlockchain(submission);
      console.log('Blockchain submission successful:', txHash);
      
      return res.status(200).json({
        success: true,
        message: 'Score submitted successfully',
        transactionHash: txHash,
        scoreDelta: submission.scoreDelta,
        txDelta: submission.txDelta,
      });
    } catch (blockchainError) {
      console.error('Blockchain submission failed:', blockchainError);
      
      // Still return success since we saved off-chain, but note the blockchain failure
      return res.status(200).json({
        success: true,
        message: 'Score saved off-chain, blockchain submission failed',
        scoreDelta: submission.scoreDelta,
        txDelta: submission.txDelta,
        blockchainError: (blockchainError as Error).message,
        entry: scoreEntry, // Include the stored entry for consistency
      });
    }

  } catch (error) {
    console.error('Submit score error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: (error as Error).message 
    });
  }
}

function validateSubmission(submission: ScoreSubmission): { isValid: boolean; error?: string } {
  // Debug logging
  console.log('🔍 Backend Validation Debug:');
  console.log('  durationMs:', submission.durationMs, '(type:', typeof submission.durationMs, ')');
  console.log('  Expected: 5000 <= durationMs <= 300000');
  console.log('  Check: 5000 <=', submission.durationMs, '<=', 300000);
  console.log('  Result:', submission.durationMs >= 5000 && submission.durationMs <= 300000);
  
  // Duration check - allow shorter games for Tower Defense (5 seconds to 5 minutes)
  if (submission.durationMs < 5000 || submission.durationMs > 300000) {
    console.log('❌ Duration validation failed!');
    return { isValid: false, error: `Invalid game duration: ${submission.durationMs}ms (must be 5000-300000ms)` };
  }

  // CPS check (max 8 clicks per second)
  if (submission.cpsMax > 8) {
    return { isValid: false, error: 'CPS too high' };
  }

  // Score reasonableness check (max ~1000 points in 90 seconds)
  if (submission.scoreDelta > 10000 || submission.scoreDelta < 10) {
    return { isValid: false, error: 'Score too high or low' };
  }

  // Address format check
  if (!ethers.isAddress(submission.address)) {
    return { isValid: false, error: 'Invalid address format' };
  }

  return { isValid: true };
}

async function verifySignature(submission: ScoreSubmission): Promise<boolean> {
  try {
    // Create canonical message for signature verification
    const message = `${submission.address}${submission.scoreDelta}${submission.txDelta}${submission.durationMs}${submission.cpsMax}${submission.seed}${submission.timestamp}`;
    
    // Verify EIP-191 signature
    const recoveredAddress = ethers.verifyMessage(message, submission.signature);
    
    return recoveredAddress.toLowerCase() === submission.address.toLowerCase();
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

async function submitToBlockchain(submission: ScoreSubmission): Promise<string> {
  const privateKey = process.env.GAME_SIGNER_PRIVATE_KEY;
  const rpcUrl = process.env.MONAD_RPC_URL || 'https://testnet-rpc.monad.xyz';
  const contractAddress = process.env.CONTRACT_ADDRESS || '0xceCBFF203C8B6044F52CE23D914A1bfD997541A4';

  if (!privateKey) {
    throw new Error('GAME_SIGNER_PRIVATE_KEY not configured');
  }

  try {
    // Create provider and wallet
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);

    // Create contract instance
    const contract = new ethers.Contract(contractAddress, GAME_CONTRACT_ABI, wallet);

    // Call updatePlayerData with delta values (increments, not totals)
    const tx = await contract.updatePlayerData(
      submission.address,
      submission.scoreDelta,
      submission.txDelta,
      {
        gasLimit: 300000, // Set appropriate gas limit
      }
    );

    console.log('Transaction submitted:', tx.hash);
    
    // Wait for confirmation
    await tx.wait();
    
    return tx.hash;
  } catch (error) {
    console.error('Blockchain submission error:', error);
    throw error;
  }
}

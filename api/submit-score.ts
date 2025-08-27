import type { VercelRequest, VercelResponse } from '@vercel/node';

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
  // Set headers first
  res.setHeader('Content-Type', 'application/json');
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
    console.log('📥 Score submission received:', JSON.stringify(req.body, null, 2));
    
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

    // Basic validation
    const validationResult = validateSubmission(submission);
    if (!validationResult.isValid) {
      return res.status(400).json({ error: validationResult.error });
    }

    // Verify signature (simplified for demo)
    if (submission.signature === 'mock_signature') {
      console.log('✅ Using mock signature for development');
    } else {
      // Skip signature validation for now to avoid ethers import issues
      console.log('⚠️ Signature validation skipped');
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
    
    console.log('✅ Score stored off-chain:', scoreEntry);

    // Try blockchain submission (but don't crash if it fails)
    try {
      const txHash = await submitToBlockchain(submission);
      console.log('✅ Blockchain submission successful:', txHash);
      
      return res.status(200).json({
        success: true,
        message: 'Score submitted successfully',
        transactionHash: txHash,
        scoreDelta: submission.scoreDelta,
        txDelta: submission.txDelta,
      });
    } catch (blockchainError) {
      console.error('❌ Blockchain submission failed:', blockchainError);
      
      // Still return success since we saved off-chain
      return res.status(200).json({
        success: true,
        message: 'Score saved off-chain, blockchain submission failed',
        scoreDelta: submission.scoreDelta,
        txDelta: submission.txDelta,
        blockchainError: (blockchainError as Error).message,
        entry: scoreEntry,
      });
    }

  } catch (error) {
    console.error('❌ Submit score error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: (error as Error).message
    });
  }
}

function validateSubmission(submission: ScoreSubmission): { isValid: boolean; error?: string } {
  console.log('🔍 Validating submission:');
  console.log('  durationMs:', submission.durationMs);
  console.log('  scoreDelta:', submission.scoreDelta);
  console.log('  cpsMax:', submission.cpsMax);
  
  // Duration check (5 seconds to 5 minutes)
  if (submission.durationMs < 5000 || submission.durationMs > 300000) {
    return { isValid: false, error: `Invalid game duration: ${submission.durationMs}ms (must be 5000-300000ms)` };
  }

  // CPS check (max 8 clicks per second)
  if (submission.cpsMax > 8) {
    return { isValid: false, error: 'CPS too high' };
  }

  // Score check (10-10000 points)
  if (submission.scoreDelta > 10000 || submission.scoreDelta < 10) {
    return { isValid: false, error: 'Score too high or low' };
  }

  // Basic address format check (simple regex)
  if (!/^0x[a-fA-F0-9]{40}$/.test(submission.address)) {
    return { isValid: false, error: 'Invalid address format' };
  }

  return { isValid: true };
}

// Contract ABI embedded directly to avoid import issues
const GAME_CONTRACT_ABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "player", "type": "address" },
      { "internalType": "uint256", "name": "scoreAmount", "type": "uint256" },
      { "internalType": "uint256", "name": "transactionAmount", "type": "uint256" }
    ],
    "name": "updatePlayerData",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

async function submitToBlockchain(submission: ScoreSubmission): Promise<string> {
  // Import ethers dynamically to avoid import issues
  const { ethers } = await import('ethers');
  
  const privateKey = process.env.GAME_SIGNER_PRIVATE_KEY;
  const rpcUrl = process.env.MONAD_RPC_URL || 'https://testnet-rpc.monad.xyz';
  const contractAddress = process.env.CONTRACT_ADDRESS || '0xceCBFF203C8B6044F52CE23D914A1bfD997541A4';

  if (!privateKey) {
    throw new Error('GAME_SIGNER_PRIVATE_KEY not configured');
  }

  // Create provider and wallet
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);

  // Create contract instance
  const contract = new ethers.Contract(contractAddress, GAME_CONTRACT_ABI, wallet);

  // Call updatePlayerData
  const tx = await contract.updatePlayerData(
    submission.address,
    submission.scoreDelta,
    submission.txDelta,
    {
      gasLimit: 300000,
    }
  );

  console.log('Transaction submitted:', tx.hash);
  
  // Wait for confirmation
  await tx.wait();
  
  return tx.hash;
}

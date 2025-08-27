import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { ethers } from 'ethers';
import fs from 'fs';

// Import contract ABI
const CONTRACT_ABI = [
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
];

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage for demo (same as the Vercel function)
let scores = [];

// Leaderboard API endpoint
app.get('/api/leaderboard', (req, res) => {
  try {
    const { period = 'daily' } = req.query;

    if (period !== 'daily' && period !== 'weekly') {
      return res.status(400).json({ error: 'Invalid period. Must be "daily" or "weekly"' });
    }

    // Calculate time window
    const now = new Date();
    const startTime = getStartTime(period, now);

    // Filter scores by time period
    const filteredScores = scores.filter(score => {
      const scoreDate = new Date(score.timestamp);
      return scoreDate >= startTime;
    });

    // Group by address and sum scores
    const playerTotals = new Map();

    filteredScores.forEach(score => {
      const existing = playerTotals.get(score.address) || {
        address: score.address,
        username: score.username,
        totalScore: 0,
        totalTransactions: 0,
        lastPlayed: 0,
      };

      existing.totalScore += score.score;
      existing.totalTransactions += score.transactions;
      existing.lastPlayed = Math.max(existing.lastPlayed, score.timestamp);

      playerTotals.set(score.address, existing);
    });

    // Convert to array and sort by score
    const leaderboard = Array.from(playerTotals.values())
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, 100) // Top 100
      .map((entry, index) => ({
        rank: index + 1,
        username: entry.username || `${entry.address.slice(0, 6)}...${entry.address.slice(-4)}`,
        score: entry.totalScore,
        address: entry.address,
        timestamp: entry.lastPlayed,
        transactions: entry.totalTransactions,
      }));

    return res.status(200).json({
      period,
      entries: leaderboard,
      total: leaderboard.length,
      lastUpdated: Date.now(),
    });

  } catch (error) {
    console.error('Leaderboard error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// Submit score API endpoint with blockchain integration
app.post('/api/submit-score', async (req, res) => {
  try {
    const {
      address,
      username,
      scoreDelta,
      txDelta,
      durationMs,
      cpsMax,
      seed,
      timestamp,
      signature
    } = req.body;

    // Validate required fields
    const requiredFields = ['address', 'scoreDelta', 'txDelta', 'durationMs', 'cpsMax', 'seed', 'timestamp', 'signature'];
    for (const field of requiredFields) {
      if (req.body[field] === undefined) {
        return res.status(400).json({ error: `Missing field: ${field}` });
      }
    }

    // Validate game data - allow shorter games for Tower Defense (5 seconds to 5 minutes)
    console.log('🔍 Dev Server Validation Debug:');
    console.log('  durationMs:', durationMs, '(type:', typeof durationMs, ')');
    console.log('  Expected: 5000 <= durationMs <= 300000');
    
    if (durationMs < 5000 || durationMs > 300000) {
      console.log('❌ Duration validation failed!');
      return res.status(400).json({ error: `Invalid game duration: ${durationMs}ms (must be 5000-300000ms)` });
    }
    console.log('✅ Duration validation passed!');
    
    if (cpsMax > 8) {
      return res.status(400).json({ error: 'CPS too high' });
    }
    if (scoreDelta > 10000 || scoreDelta < 10) {
      return res.status(400).json({ error: 'Score too high or low' });
    }
    if (!ethers.isAddress(address)) {
      return res.status(400).json({ error: 'Invalid address format' });
    }

    // Add the score to our in-memory storage
    const scoreEntry = {
      address,
      username: username || 'Anonymous',
      score: scoreDelta,
      transactions: txDelta,
      timestamp: timestamp || Date.now(),
      duration: durationMs,
      cpsMax,
      seed
    };

    scores.push(scoreEntry);
    console.log('Score submitted and stored:', scoreEntry);

    // Submit to blockchain
    try {
      const txHash = await submitToBlockchain({
        address,
        scoreDelta,
        txDelta
      });
      
      console.log('✅ Blockchain submission successful:', txHash);
      
      return res.status(200).json({
        success: true,
        message: 'Score submitted successfully to blockchain',
        transactionHash: txHash,
        scoreDelta,
        txDelta,
        entry: scoreEntry
      });
    } catch (blockchainError) {
      console.error('❌ Blockchain submission failed:', blockchainError);
      
      return res.status(200).json({
        success: true,
        message: 'Score saved off-chain, blockchain submission failed',
        blockchainError: blockchainError.message,
        scoreDelta,
        txDelta,
        entry: scoreEntry
      });
    }

  } catch (error) {
    console.error('Submit score error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Blockchain submission function
async function submitToBlockchain({ address, scoreDelta, txDelta }) {
  // Load environment variables from .env file
  const envPath = path.join(__dirname, '.env');
  let privateKey, rpcUrl, contractAddress;
  
  try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envLines = envContent.split('\n');
    
    for (const line of envLines) {
      if (line.startsWith('GAME_SIGNER_PRIVATE_KEY=')) {
        privateKey = line.split('=')[1].trim();
      }
      if (line.startsWith('MONAD_RPC_URL=')) {
        rpcUrl = line.split('=')[1].trim();
      }
      if (line.startsWith('CONTRACT_ADDRESS=')) {
        contractAddress = line.split('=')[1].trim();
      }
    }
  } catch (error) {
    console.log('Could not read .env file, using defaults');
  }
  
  // Set defaults
  rpcUrl = rpcUrl || 'https://testnet-rpc.monad.xyz';
  contractAddress = contractAddress || '0xceCBFF203C8B6044F52CE23D914A1bfD997541A4';
  
  if (!privateKey || privateKey === 'your_actual_private_key_here') {
    throw new Error('GAME_SIGNER_PRIVATE_KEY not configured in .env file');
  }

  console.log('🔗 Connecting to blockchain...');
  console.log(`   RPC: ${rpcUrl}`);
  console.log(`   Contract: ${contractAddress}`);
  console.log(`   Player: ${address}`);
  console.log(`   Score: ${scoreDelta}, Kills: ${txDelta}`);

  // Create provider and wallet
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);
  
  console.log(`   Wallet: ${wallet.address}`);

  // Check balance
  const balance = await provider.getBalance(wallet.address);
  const balanceInMON = ethers.formatEther(balance);
  console.log(`   Balance: ${balanceInMON} MON`);
  
  if (balance < ethers.parseEther('0.01')) {
    throw new Error(`Insufficient balance: ${balanceInMON} MON (need at least 0.01 MON)`);
  }

  // Create contract instance
  const contract = new ethers.Contract(contractAddress, CONTRACT_ABI, wallet);

  // Estimate gas first for optimization
  let estimatedGas;
  try {
    estimatedGas = await contract.updatePlayerData.estimateGas(address, scoreDelta, txDelta);
    console.log(`⛽ Estimated gas: ${estimatedGas.toString()}`);
  } catch (gasError) {
    console.log('⚠️  Gas estimation failed, using default');
    estimatedGas = BigInt(100000); // Conservative default
  }

  // Add 20% buffer to estimated gas
  const gasLimit = estimatedGas + (estimatedGas * BigInt(20) / BigInt(100));
  
  // Submit transaction with optimized settings
  console.log('📤 Submitting transaction...');
  const startTime = Date.now();
  
  const tx = await contract.updatePlayerData(
    address,
    scoreDelta,
    txDelta,
    {
      gasLimit: gasLimit,
      // Use higher gas price for faster confirmation
      gasPrice: ethers.parseUnits('60', 'gwei') // 60 gwei for fast confirmation
    }
  );

  const submitTime = Date.now() - startTime;
  console.log(`⏳ Transaction submitted in ${submitTime}ms: ${tx.hash}`);
  
  // Don't wait for confirmation - return immediately for faster UX
  console.log('🚀 Transaction sent! Confirmation will happen in background.');
  
  // Optional: Start background confirmation monitoring
  tx.wait().then((receipt) => {
    const totalTime = Date.now() - startTime;
    console.log(`✅ Transaction confirmed in ${totalTime}ms! Block: ${receipt.blockNumber}`);
    console.log(`⛽ Gas used: ${receipt.gasUsed.toString()}/${gasLimit.toString()}`);
  }).catch((error) => {
    console.error('❌ Transaction confirmation failed:', error);
  });
  
  return tx.hash;
}

function getStartTime(period, now) {
  const startTime = new Date(now);
  
  if (period === 'daily') {
    // Start of current day (UTC)
    startTime.setUTCHours(0, 0, 0, 0);
  } else {
    // Start of current week (Monday UTC)
    const dayOfWeek = startTime.getUTCDay();
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday = 0
    startTime.setUTCDate(startTime.getUTCDate() - daysToSubtract);
    startTime.setUTCHours(0, 0, 0, 0);
  }
  
  return startTime;
}

app.listen(PORT, () => {
  console.log(`Development API server running on http://localhost:${PORT}`);
});

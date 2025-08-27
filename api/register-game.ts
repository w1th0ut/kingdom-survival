import type { VercelRequest, VercelResponse } from '@vercel/node';

// Contract ABI embedded directly for registerGame function
const GAME_REGISTER_ABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "_game", "type": "address" },
      { "internalType": "string", "name": "_name", "type": "string" },
      { "internalType": "string", "name": "_image", "type": "string" },
      { "internalType": "string", "name": "_url", "type": "string" }
    ],
    "name": "registerGame",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "name": "games",
    "outputs": [
      { "internalType": "address", "name": "game", "type": "address" },
      { "internalType": "string", "name": "image", "type": "string" },
      { "internalType": "string", "name": "name", "type": "string" },
      { "internalType": "string", "name": "url", "type": "string" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
    const { name, image, url } = req.body;

    // Validate required fields
    if (!name || !image || !url) {
      return res.status(400).json({ 
        error: 'Missing required fields: name, image, url' 
      });
    }

    const privateKey = process.env.GAME_SIGNER_PRIVATE_KEY;
    const rpcUrl = process.env.MONAD_RPC_URL || 'https://testnet-rpc.monad.xyz';
    const contractAddress = process.env.CONTRACT_ADDRESS || '0xceCBFF203C8B6044F52CE23D914A1bfD997541A4';

    if (!privateKey) {
      return res.status(500).json({ 
        error: 'GAME_SIGNER_PRIVATE_KEY not configured' 
      });
    }

    // Import ethers dynamically
    const { ethers } = await import('ethers');

    // Create provider and wallet
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    
    // The game address is the wallet address (server address)
    const gameAddress = wallet.address;

    // Create contract instance
    const contract = new ethers.Contract(contractAddress, GAME_REGISTER_ABI, wallet);

    console.log('Registering game with address:', gameAddress);
    console.log('Game details:', { name, image, url });

    // Check if game is already registered
    try {
      const existingGame = await contract.games(gameAddress);
      if (existingGame.game !== '0x0000000000000000000000000000000000000000') {
        return res.status(400).json({
          error: 'Game already registered',
          gameAddress,
          existingGame: {
            name: existingGame.name,
            image: existingGame.image,
            url: existingGame.url,
          }
        });
      }
    } catch (error) {
      console.log('Game not registered yet, proceeding with registration');
    }

    // Register the game
    const tx = await contract.registerGame(
      gameAddress, // _game (server address)
      name,        // _name
      image,       // _image
      url,         // _url
      {
        gasLimit: 500000, // Set appropriate gas limit
      }
    );

    console.log('Registration transaction submitted:', tx.hash);

    // Wait for confirmation
    const receipt = await tx.wait();
    
    console.log('Registration confirmed in block:', receipt.blockNumber);

    return res.status(200).json({
      success: true,
      message: 'Game registered successfully',
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
      gameAddress,
      gameDetails: {
        name,
        image,
        url,
      },
    });

  } catch (error) {
    console.error('Register game error:', error);
    
    // Check if it's a revert error
    if (error instanceof Error && error.message.includes('revert')) {
      return res.status(400).json({ 
        error: 'Transaction reverted',
        message: error.message,
        details: 'Game might already be registered or insufficient permissions'
      });
    }
    
    return res.status(500).json({ 
      error: 'Internal server error',
      message: (error as Error).message 
    });
  }
}

import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';

// In-memory storage for demo (use proper database/cache in production)
const nonces = new Map<string, { nonce: string; timestamp: number }>();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { address } = req.method === 'POST' ? req.body : req.query;

    if (!address || typeof address !== 'string') {
      return res.status(400).json({ error: 'Address is required' });
    }

    // Validate address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return res.status(400).json({ error: 'Invalid address format' });
    }

    // Clean up old nonces (older than 10 minutes)
    const now = Date.now();
    for (const [addr, data] of nonces.entries()) {
      if (now - data.timestamp > 10 * 60 * 1000) {
        nonces.delete(addr);
      }
    }

    // Generate new nonce
    const nonce = crypto.randomBytes(32).toString('hex');
    const timestamp = Date.now();

    // Store nonce
    nonces.set(address.toLowerCase(), { nonce, timestamp });

    // Create message for signing
    const message = `Kingdom: Survival - Sign in\nAddress: ${address}\nNonce: ${nonce}\nTimestamp: ${timestamp}`;

    return res.status(200).json({
      success: true,
      nonce,
      message,
      timestamp,
      expiresIn: 600, // 10 minutes
    });

  } catch (error) {
    console.error('Nonce generation error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: (error as Error).message 
    });
  }
}

// Export for use in other endpoints
export function validateNonce(address: string, nonce: string): boolean {
  const storedData = nonces.get(address.toLowerCase());
  
  if (!storedData) {
    return false;
  }

  // Check if nonce matches
  if (storedData.nonce !== nonce) {
    return false;
  }

  // Check if not expired (10 minutes)
  const now = Date.now();
  if (now - storedData.timestamp > 10 * 60 * 1000) {
    nonces.delete(address.toLowerCase());
    return false;
  }

  // Remove nonce after use (one-time use)
  nonces.delete(address.toLowerCase());
  
  return true;
}

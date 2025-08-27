import type { VercelRequest, VercelResponse } from '@vercel/node';

// In-memory storage for demo (use proper database in production)
let scores: any[] = [];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { period = 'all' } = req.query;

    if (period !== 'daily' && period !== 'weekly' && period !== 'all') {
      return res.status(400).json({ error: 'Invalid period. Must be "daily", "weekly", or "all"' });
    }

    let filteredScores = scores;

    // Filter scores by time period (only if not 'all')
    if (period !== 'all') {
      const now = new Date();
      const startTime = getStartTime(period as 'daily' | 'weekly', now);
      
      filteredScores = scores.filter(score => {
        const scoreDate = new Date(score.timestamp);
        return scoreDate >= startTime;
      });
    }

    // Group by address and sum scores
    const playerTotals = new Map<string, {
      address: string;
      username: string;
      totalScore: number;
      totalTransactions: number;
      lastPlayed: number;
    }>();

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
      message: (error as Error).message 
    });
  }
}

function getStartTime(period: 'daily' | 'weekly', now: Date): Date {
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

// Export scores for use in other endpoints
export { scores };

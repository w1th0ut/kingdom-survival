// Game related TypeScript type definitions

export interface GameObject {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Player extends GameObject {
  health: number;
  maxHealth: number;
  speed: number;
  lastShot: number;
}

export interface Enemy extends GameObject {
  health: number;
  speed: number;
  type: string;
  points: number;
  sprite?: Phaser.GameObjects.Image;
}

export interface Bullet extends GameObject {
  speed: number;
  damage: number;
  isPlayer: boolean;
  sprite?: Phaser.GameObjects.Image;
}

export interface Skill {
  name: string;
  duration: number;
  cooldown: number;
  lastUsed: number;
  isActive: boolean;
}

export interface GameStats {
  score: number;
  kills: number;
  accuracy: number;
  shotsFired: number;
  shotsHit: number;
  combo: number;
  maxCombo: number;
  timeRemaining: number;
  wave: number;
}

export interface ScoreSubmission {
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

export interface LeaderboardEntry {
  rank: number;
  username: string;
  score: number;
  address: string;
  timestamp: number;
}

// Phaser scene names
export const SCENES = {
  BOOT: 'BootScene',
  HOME: 'HomeScene',
  GAME: 'GameScene',
  RESULTS: 'ResultsScene',
  LEADERBOARD: 'LeaderboardScene',
} as const;

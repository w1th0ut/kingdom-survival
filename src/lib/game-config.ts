// Game configuration for Kingdom Survival
export const GAME_CONFIG = {
  // Contract configuration
  CONTRACT_ADDRESS: "0xceCBFF203C8B6044F52CE23D914A1bfD997541A4",
  
  // Game settings
  GAME_DURATION: 90 * 1000,
  CANVAS: {
    WIDTH: 800,
    HEIGHT: 600,
  },
  
  // Player settings
  PLAYER: {
    SPEED: 5,
    SIZE: 30,
    HEALTH: 100,
    FIRE_RATE: 150, // milliseconds between shots
  },
  
  // Enemy settings
  ENEMY: {
    SPEED: 2,
    SIZE: 25,
    SPAWN_RATE: 0.02, // probability per frame
    HEALTH: 1,
  },
  
  // Wave settings
  WAVES: {
    INTERVAL: 10000, // 10 seconds
    SPAWN_MULTIPLIER: 1.2, // increase spawn rate each wave
    SPEED_MULTIPLIER: 1.1, // increase enemy speed each wave
  },
  
  // Bullet settings
  BULLET: {
    SPEED: 7,
    SIZE: 4,
    DAMAGE: 1,
  },
  
  // Freeze skill settings
  FREEZE_SKILL: {
    DURATION: 2500, // 2.5 seconds
    COOLDOWN: 18000, // 18 seconds
  },
  
  // Score settings
  SCORE: {
    PER_KILL: 10,
    COMBO_MULTIPLIER: 1.5,
    COMBO_TIMEOUT: 3000, // 3 seconds
  },
  
  // Submission settings
  SCORE_SUBMISSION: {
    SCORE_THRESHOLD: 50, // Submit score every 50 points
    TRANSACTION_THRESHOLD: 1,
    MAX_CPS: 8, // Maximum clicks per second allowed
    MIN_DURATION: 10000, // Minimum game duration
    MAX_DURATION: 12000000, // Maximum game duration
  },
  
  // Game metadata
  METADATA: {
    name: "Kingdom Survival",
    url: import.meta.env.VITE_VERCEL_URL || "http://localhost:5173",
    image: "https://kingdom-survival.vercel.app/banner.png", // Replace with actual game icon
  },
} as const;

// Cross App ID for Monad Games ID
export const MONAD_GAMES_CROSS_APP_ID = "cmd8euall0037le0my79qpz42";

// API endpoints
export const API_BASE_URL = import.meta.env.VITE_API_BASE || "/api";

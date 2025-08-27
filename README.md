# Kingdom: Survival

A 2D tower defense game built with Phaser 3, React, TypeScript, and Privy Global Wallet integration. Players defend their crystal tower against waves of enemies, earning scores that are submitted on-chain to the Monad Games ID contract.

## 🎮 Game Features

- **Tower defense gameplay** with progressive waves and boss battles
- **Click-to-shoot mechanics** with enemy spawning and collision detection
- **Three skill types**: Freeze (3s duration), Damage Boost (10s duration), and Heal
- **Multiple enemy types**: Small Goblins, Large Goblins, Flying Devils, and Boss Golems
- **Real-time HUD** showing score, kills, time survived, and skill cooldowns
- **Customizable balance** through game configuration

## 🔧 Tech Stack

### Frontend
- **Phaser 3** - 2D game engine with scene-based architecture
- **React** - UI framework for authentication and overlays
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and development server
- **Privy Global Wallet** - Web3 authentication with Monad Games ID integration

### Backend
- **Vercel Functions** - Serverless API endpoints
- **ethers.js** - Ethereum/Monad blockchain interactions
- **Node.js/Express** - API server for score submission and leaderboards

### Blockchain
- **Monad Testnet** - Layer 1 blockchain for score storage
- **Monad Games ID Contract** - Player data and leaderboard management
- **EIP-191 Signatures** - Secure score submission verification

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Vercel account for deployment
- Privy account and app setup
- Monad testnet wallet with MON tokens (for game registration)

### Environment Setup

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd kingdom-survival
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env.local
   ```

   Fill in the required variables:
   ```env
   # Frontend
   VITE_PRIVY_APP_ID=your_privy_app_id
   VITE_CROSS_APP_ID=cmd8euall0037le0my79qpz42
   VITE_API_BASE=https://your-domain.vercel.app

   # Backend
   PRIVY_APP_ID=your_privy_app_id
   PRIVY_APP_SECRET=your_privy_app_secret
   MONAD_RPC_URL=https://testnet-rpc.monad.xyz
   GAME_SIGNER_PRIVATE_KEY=your_game_signer_private_key
   CONTRACT_ADDRESS=0xceCBFF203C8B6044F52CE23D914A1bfD997541A4
   CORS_ORIGIN=https://your-domain.vercel.app
   ```

3. **Development server:**
   ```bash
   npm run dev
   ```

## 🔐 Authentication Flow

### Privy Integration
The game uses Privy Global Wallet with Monad Games ID cross-app authentication:

```typescript
// Privy configuration
const config = {
  loginMethods: ['email', 'google', `privy:${MONAD_GAMES_CROSS_APP_ID}`],
  loginMethodsAndOrder: {
    primary: ['email', 'google', `privy:${MONAD_GAMES_CROSS_APP_ID}`],
  },
  embeddedWallets: {
    createOnLogin: 'users-without-wallets',
  },
};
```

### Username Resolution
After authentication, the game resolves usernames from Monad Games ID:

```typescript
// Check for cross-app account
const crossAppAccount = user.linkedAccounts.find(
  account => account.type === 'cross_app' && 
            account.providerApp?.id === MONAD_GAMES_CROSS_APP_ID
);

// Get embedded wallet address
const address = user.embeddedWallets?.[0]?.address;

// Resolve username
const response = await fetch(
  `https://monad-games-id-site.vercel.app/api/check-wallet?wallet=${address}`
);
```

## 🎯 Game Architecture

### Scene Structure
```
BootScene -> HomeScene -> TowerDefenseScene -> ResultsScene
                ↓            ↓
            LeaderboardScene ←--
```

1. **BootScene**: Asset loading and initialization
2. **HomeScene**: Main menu with authentication status
3. **TowerDefenseScene**: Core tower defense gameplay
4. **ResultsScene**: Score display and submission
5. **LeaderboardScene**: Daily/weekly rankings

### Game Mechanics

#### Player Actions
- **Clicking**: Shoots bullets from crystal towards cursor position
- **Spacebar**: Activates Freeze skill (enemies stop for 3s)
- **Skill Buttons**: Use Freeze, Heal, and Damage Boost skills

#### Enemy System
- Four enemy types with different health and point values:
  - Small Goblin: 4 HP, 10 points
  - Large Goblin: 10 HP, 25 points
  - Flying Devil: 6 HP, 15 points
  - Boss Golem: 50 HP, 100 points
- Boss waves every 30 seconds
- Enemy spawn rate increases over time

#### Tower Defense
- Defend your crystal tower with 100 HP
- Enemies deal damage when they reach your tower:
  - Small/Large Goblins: 5 damage per second
  - Flying Devils: 6 damage per second  
  - Boss Golems: 10 damage per attack (every 0.8s)
- Game ends when tower health reaches zero

#### Skill System
- **Freeze Skill (50 points)**: Freezes all enemies for 3 seconds
- **Heal Skill (100 points)**: Restores 50 tower health
- **Damage Boost (70 points)**: Doubles damage for 10 seconds
- Skills can be activated via buttons or spacebar (freeze only)

#### Boss Battles
- Boss waves occur every 30 seconds
- Bosses have 50 HP and require multiple hits
- Boss health bar displayed at top of screen
- Victory rewards 100 points

## 📊 Score Submission & Security

### Client-Side Flow
1. Game ends with statistics collection
2. Create canonical message for signing
3. Request signature from Privy wallet
4. Submit payload + signature to backend

### Server-Side Validation
```typescript
// Sanity checks
- Duration: 60-120 seconds
- Max CPS: ≤8 clicks per second
- Max score: ≤2000 points
- Address format validation

// Signature verification (EIP-191)
const recoveredAddress = ethers.verifyMessage(message, signature);
const isValid = recoveredAddress.toLowerCase() === address.toLowerCase();
```

### Blockchain Integration
After validation, scores are submitted to Monad Games ID contract:

```solidity
function updatePlayerData(
    address player,
    uint256 scoreAmount,    // Delta (increment)
    uint256 transactionAmount // Delta (increment)
) external onlyGame
```

## 📡 API Endpoints

### `/api/submit-score` (POST)
Validates and submits player scores to blockchain.

**Payload:**
```json
{
  "address": "0x...",
  "username": "player123",
  "scoreDelta": 150,
  "txDelta": 1,
  "durationMs": 90000,
  "cpsMax": 6,
  "seed": "daily_seed_hash",
  "timestamp": 1640995200000,
  "signature": "0x..."
}
```

### `/api/leaderboard` (GET)
Returns ranked player data for daily/weekly periods.

**Query:** `?period=daily|weekly`

### `/api/register-game` (POST)
Admin endpoint to register the game in Monad Games ID contract.

### `/api/auth/nonce` (GET/POST)
Generates nonces for signature-based authentication.

## 🏆 Leaderboard System

### Data Structure
- **Off-chain storage**: Fast queries and caching
- **On-chain verification**: Immutable score history
- **Dual periods**: Daily and weekly rankings
- **Real-time updates**: Scores appear immediately after submission

### External Verification
Players can verify scores on the public Monad Games ID leaderboard:
`https://monad-games-id-site.vercel.app/`

## 🔧 Deployment

### Vercel Deployment
1. **Connect repository to Vercel**
2. **Set environment variables** in Vercel dashboard
3. **Deploy**: Vercel auto-detects Vite configuration

### Game Registration
After deployment, register the game on-chain:

```bash
curl -X POST https://your-domain.vercel.app/api/register-game \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Kingdom: Survival",
    "image": "https://your-domain.vercel.app/icon.png",
    "url": "https://your-domain.vercel.app"
  }'
```

## 🧪 Testing

### Local Development
```bash
npm run dev    # Start development server
npm run build  # Build for production
npm run preview # Preview production build
```

### Game Testing Checklist
- [ ] Authentication with Monad Games ID works
- [ ] Username resolution and display
- [ ] Game mechanics (shooting, tower defense, skills)
- [ ] Enemy spawning and AI (movement, attacking)
- [ ] Boss wave system and health bars
- [ ] Skill system (freeze, heal, damage boost)
- [ ] Score calculation and kill counting
- [ ] Score submission with signature
- [ ] Leaderboard display (daily/weekly)
- [ ] Responsive design on mobile/desktop

## 📋 Configuration

### Game Balance
Adjust gameplay parameters in `src/lib/game-config.ts`:

```typescript
export const GAME_CONFIG = {
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
  
  // Skill settings
  FREEZE_SKILL: {
    DURATION: 2500, // 2.5 seconds
    COOLDOWN: 18000, // 18 seconds
  },
};
```

### Anti-Cheat Settings
```typescript
SCORE_SUBMISSION: {
  SCORE_THRESHOLD: 50,     // Submit score every 50 points
  TRANSACTION_THRESHOLD: 1,
  MAX_CPS: 8,              // Maximum clicks per second allowed
  MIN_DURATION: 10000,     // Minimum game duration (10 seconds)
  MAX_DURATION: 12000000,  // Maximum game duration (2 hours)
}
```

## 🔍 Troubleshooting

### Common Issues

**Build Errors:**
- Ensure TypeScript types are correctly configured
- Check that all Phaser assets load properly

**Authentication Issues:**
- Verify Privy App ID and Cross App ID configuration
- Check CORS settings for API calls

**Blockchain Errors:**
- Ensure game signer wallet has sufficient MON tokens
- Verify contract address and ABI are correct
- Check Monad testnet RPC connectivity

**Score Submission Failures:**
- Validate signature format and message structure
- Check backend validation logic
- Ensure proper error handling for blockchain calls

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

- **Documentation**: This README and inline code comments
- **Issues**: Use GitHub issues for bug reports
- **Privy Support**: https://docs.privy.io/
- **Monad Testnet**: https://docs.monad.xyz/

---

Built with ❤️ for the Monad Games ID ecosystem

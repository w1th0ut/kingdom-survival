import Phaser from 'phaser';
import { SCENES } from '../types/game';
import type { GameStats } from '../types/game';
import { DirectBlockchainSubmissionService, getExplorerUrl } from '../lib/direct-blockchain-submission';
import type { DirectSubmissionConfig } from '../lib/direct-blockchain-submission';

export class ResultsScene extends Phaser.Scene {
  private userData: any = null;
  private stats: GameStats = {} as GameStats;
  private gameSeed: string = '';
  private duration: number = 0;
  private maxCps: number = 0;
  private submitted: boolean = false;

  constructor() {
    super({ key: SCENES.RESULTS });
  }

  init(data?: any) {
    if (data) {
      this.userData = data.user;
      this.stats = data.stats;
      this.gameSeed = data.seed;
      this.duration = data.duration;
      this.maxCps = data.maxCps;
    }
    this.submitted = false;
  }

  create() {
    const { width, height } = this.cameras.main;

    
    // Background
    this.add.image(width / 2, height / 2, 'background');

    // Results title
    const title = this.add.text(width / 2, 80, 'GAME OVER', {
      fontSize: '48px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);

    // Survival time
    const survivalTime = Math.floor(this.duration / 1000);
    const timeText = this.add.text(width / 2, 140, `Survived: ${survivalTime} seconds`, {
      fontSize: '24px',
      color: '#a3a3a3',
    });
    timeText.setOrigin(0.5);

    // DEBUG: Show user state on screen
    if (this.userData && this.userData.address) {
      const debugText = this.add.text(width / 2, 170, `Logged in: ${this.userData.username || 'Unknown'} (${this.userData.address.slice(0, 8)}...)`, {
        fontSize: '14px',
        color: '#4ade80',
      });
      debugText.setOrigin(0.5);
    } else {
      const debugText = this.add.text(width / 2, 170, `Not logged in or missing user data`, {
        fontSize: '14px',
        color: '#ef4444',
      });
      debugText.setOrigin(0.5);
    }

    // Stats panel
    this.createStatsPanel();

    // Buttons
    this.createButtons();

    // Submit score automatically if user is logged in
    const canSubmit = this.userData && this.userData.address && !this.submitted;
    
    if (canSubmit) {
      this.submitScore();
    }
  }

  private createStatsPanel() {
    const { width } = this.cameras.main;
    const panelY = 200;

    // Stats background
    const panel = this.add.graphics();
    panel.fillStyle(0x1e1b4b, 0.8);
    panel.fillRoundedRect(width / 2 - 200, panelY, 400, 220, 10);

    // Stats text
    const stats = [
      `Final Score: ${this.stats.score}`,
      `Enemies Killed: ${this.stats.kills}`,
      `Accuracy: ${this.stats.accuracy.toFixed(1)}%`,
      `Max Combo: ${this.stats.maxCombo}`,
      `Waves Survived: ${this.stats.wave}`,
      `Shots Fired: ${this.stats.shotsFired}`,
    ];

    stats.forEach((stat, index) => {
      const text = this.add.text(width / 2, panelY + 30 + (index * 30), stat, {
        fontSize: '18px',
        color: '#ffffff',
      });
      text.setOrigin(0.5);
    });
  }

  private createButtons() {
    const { width, height } = this.cameras.main;

    // Submit Score button (if logged in and not submitted)
    if (this.userData && this.userData.address && !this.submitted) {
      const submitButton = this.add.image(width / 2, height - 180, 'button');
      submitButton.setInteractive({ cursor: 'pointer' });

      const submitText = this.add.text(width / 2, height - 180, 'SUBMIT SCORE', {
        fontSize: '20px',
        color: '#ffffff',
        fontStyle: 'bold',
      });
      submitText.setOrigin(0.5);

      submitButton.on('pointerdown', () => {
        this.submitScore();
      });

      submitButton.on('pointerover', () => {
        submitButton.setTint(0x4ade80);
      });

      submitButton.on('pointerout', () => {
        submitButton.clearTint();
      });
    }

    // Play Again button
    const playAgainButton = this.add.image(width / 2, height - 120, 'button');
    playAgainButton.setInteractive({ cursor: 'pointer' });

    const playAgainText = this.add.text(width / 2, height - 120, 'PLAY AGAIN', {
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    playAgainText.setOrigin(0.5);

    playAgainButton.on('pointerdown', () => {
      this.scene.start(SCENES.HOME, { user: this.userData });
    });

    playAgainButton.on('pointerover', () => {
      playAgainButton.setTint(0x8b5cf6);
    });

    playAgainButton.on('pointerout', () => {
      playAgainButton.clearTint();
    });

    // Leaderboard button
    const leaderboardButton = this.add.image(width / 2, height - 60, 'leaderboard_btn');
    leaderboardButton.setScale(0.8);
    leaderboardButton.setInteractive({ cursor: 'pointer' });

    leaderboardButton.on('pointerdown', () => {
      this.scene.start(SCENES.LEADERBOARD, { user: this.userData });
    });

    leaderboardButton.on('pointerover', () => {
      leaderboardButton.setScale(0.9);
      leaderboardButton.setTint(0xdddddd);
    });

    leaderboardButton.on('pointerout', () => {
      leaderboardButton.setScale(0.8);
      leaderboardButton.clearTint();
    });

    // Not logged in message
    if (!this.userData || !this.userData.address) {
      const loginMessage = this.add.text(width / 2, height - 200, 
        'Sign in with Monad Games ID to submit your score!', {
        fontSize: '16px',
        color: '#fbbf24',
        align: 'center',
      });
      loginMessage.setOrigin(0.5);
    }
  }

  private async submitScore() {
    if (this.submitted || !this.userData || !this.userData.address) {
      return;
    }

    this.submitted = true;

    try {
      // Show submitting message
      const { width } = this.cameras.main;
      const submittingText = this.add.text(width / 2, 450, 'Submitting score to blockchain...', {
        fontSize: '18px',
        color: '#fbbf24',
      });
      submittingText.setOrigin(0.5);

      
      // Prepare submission data
      const payload = {
        address: this.userData.address,
        username: this.userData.username || 'Anonymous',
        scoreDelta: this.stats.score,        // Final score → scoreDelta 
        txDelta: this.stats.kills,           // Kills → txDelta (becomes transactionAmount in contract)
        durationMs: this.duration,
        cpsMax: this.maxCps,
        seed: this.gameSeed,
        timestamp: Date.now(),
      };


      // Show detailed status
      submittingText.setText(`Submitting via secure backend...\nScore: ${payload.scoreDelta} | Kills: ${payload.txDelta}`);

      // Submit to secure backend API (private key safe on server)
      const response = await fetch('/api/submit-score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...payload,
          signature: 'mock_signature', // For development - replace with real signature in production
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        const txHash = result.transactionHash;
        submittingText.setText(`✅ Score submitted to blockchain!\n${txHash ? `Tx: ${txHash.slice(0, 8)}...${txHash.slice(-6)} (pending...)` : 'Processing...'}`);
        submittingText.setColor('#4ade80');
        
        // Show transaction link if available
        if (txHash) {
          const explorerText = this.add.text(width / 2, 480, 
            '🔍 View on Monad Explorer (may show pending)', {
            fontSize: '14px',
            color: '#6366f1',
          });
          explorerText.setOrigin(0.5);
          explorerText.setInteractive({ cursor: 'pointer' });
          explorerText.on('pointerdown', () => {
            window.open(`https://testnet-explorer.monad.xyz/tx/${txHash}`, '_blank');
          });
          
          // Show status message
          const statusText = this.add.text(width / 2, 505, 
            '⏳ Confirmation will complete in ~5-15 seconds', {
            fontSize: '11px',
            color: '#a3a3a3',
          });
          statusText.setOrigin(0.5);
        }

        // Show leaderboard link
        const verifyText = this.add.text(width / 2, txHash ? 510 : 480, 
          '📊 Check Public Leaderboard', {
          fontSize: '12px',
          color: '#6366f1',
        });
        verifyText.setOrigin(0.5);
        verifyText.setInteractive({ cursor: 'pointer' });
        verifyText.on('pointerdown', () => {
          window.open('https://monad-games-id-site.vercel.app/', '_blank');
        });

      } else {
        const errorMessage = result.error || result.message || 'Failed to submit score';
        submittingText.setText(`❌ Submission failed:\n${errorMessage}`);
        submittingText.setColor('#ef4444');
        
        // Show help text
        const helpText = this.add.text(width / 2, 480, 
          'Check server configuration and private key setup', {
          fontSize: '12px',
          color: '#fbbf24',
        });
        helpText.setOrigin(0.5);
      }

    } catch (error) {
      console.error('❌ Score submission error:', error);
      
      const { width } = this.cameras.main;
      let errorMessage = 'Network error or server unavailable';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      const errorText = this.add.text(width / 2, 450, 
        `❌ Error:\n${errorMessage}`, {
        fontSize: '16px',
        color: '#ef4444',
        align: 'center',
        wordWrap: { width: 600 },
      });
      errorText.setOrigin(0.5);
      
      // Show help text
      const helpText = this.add.text(width / 2, 500, 
        'Check console for details or verify server is running', {
        fontSize: '12px',
        color: '#a3a3a3',
        align: 'center',
      });
      helpText.setOrigin(0.5);
    }
  }
}

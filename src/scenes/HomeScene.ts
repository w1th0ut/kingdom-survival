import Phaser from 'phaser';
import { SCENES } from '../types/game';
import { AssetLoader } from '../utils/AssetLoader';
import { AudioManager } from '../utils/AudioManager';

export class HomeScene extends Phaser.Scene {
  private userData: any = null;
  private playButton?: Phaser.GameObjects.Image;
  private leaderboardButton?: Phaser.GameObjects.Image;
  private userText?: Phaser.GameObjects.Text;

  constructor() {
    super({ key: SCENES.HOME });
  }

  init(data?: any) {
    if (data && data.user) {
      this.userData = data.user;
    }
  }

  preload() {
    // Load all game assets including home screen assets
    AssetLoader.preloadGameAssets(this);
    
    // Load audio assets
    AudioManager.getInstance().preloadAudio(this);
  }

  create() {
    const { width, height } = this.cameras.main;

    // Start main menu music
    AudioManager.getInstance().playMainMenuMusic(this);

    // Background using your custom main_menu.png - resize to fit screen
    const background = this.add.image(width / 2, height / 2, 'main_menu');
    background.setDisplaySize(width, height); // Scale background to fit screen dimensions

    // Play/Survival button using custom play button
    this.playButton = this.add.image(width / 2, 380, 'play_btn');
    this.playButton.setInteractive({ cursor: 'pointer' });
    this.playButton.setScale(1.0); // Adjust scale if needed

    this.playButton.on('pointerdown', () => {
      this.startGame();
    });

    this.playButton.on('pointerover', () => {
      this.playButton!.setScale(1.1); // Scale up on hover
      this.playButton!.setTint(0xdddddd); // Light tint on hover
    });

    this.playButton.on('pointerout', () => {
      this.playButton!.setScale(1.0); // Reset scale
      this.playButton!.clearTint();
    });

    // Leaderboard button using custom leaderboard button
    this.leaderboardButton = this.add.image(width / 2, 460, 'leaderboard_btn');
    this.leaderboardButton.setInteractive({ cursor: 'pointer' });
    this.leaderboardButton.setScale(1.0); // Adjust scale if needed

    this.leaderboardButton.on('pointerdown', () => {
      this.scene.start(SCENES.LEADERBOARD, { user: this.userData });
    });

    this.leaderboardButton.on('pointerover', () => {
      this.leaderboardButton!.setScale(1.1); // Scale up on hover
      this.leaderboardButton!.setTint(0xdddddd); // Light tint on hover
    });

    this.leaderboardButton.on('pointerout', () => {
      this.leaderboardButton!.setScale(1.0); // Reset scale
      this.leaderboardButton!.clearTint();
    });

    // Listen for user updates from the React layer
    this.events.on('userUpdated', this.onUserUpdated, this);
  }

  private updateUserDisplay() {
    if (!this.userText) return;

    if (this.userData && this.userData.address) {
      if (this.userData.hasUsername && this.userData.username) {
        this.userText.setText(`Welcome, ${this.userData.username}!`);
        this.userText.setColor('#4ade80');
      } else {
        this.userText.setText(`Connected: ${this.userData.address.slice(0, 6)}...${this.userData.address.slice(-4)}`);
        this.userText.setColor('#fbbf24');
      }
    } else {
      this.userText.setText('Not signed in');
      this.userText.setColor('#a3a3a3');
    }
  }

  private onUserUpdated(user: any) {
    this.userData = user;
    this.updateUserDisplay();
  }

  private startGame() {
    // Generate seed for fairness
    const seed = this.generateSeed();
    
    // Fade from main menu music to battle music
    AudioManager.getInstance().fadeFromMainMenuToBattle(this);
    
    this.scene.start(SCENES.GAME, {
      user: this.userData,
      seed: seed,
    });
  }

  private generateSeed(): string {
    // For now, use timestamp + random. In production, this should use
    // keccak(blockHash_day || userAddress) as specified
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    return `${timestamp}_${random}`;
  }

  // Method to be called from React layer
  public updateUser(user: any) {
    this.userData = user;
    this.updateUserDisplay();
  }

  shutdown() {
    this.events.off('userUpdated', this.onUserUpdated, this);
  }
}

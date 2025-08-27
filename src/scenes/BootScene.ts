import Phaser from 'phaser';
import { SCENES } from '../types/game';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.BOOT });
  }

  preload() {
    // Create simple geometric shapes as placeholders for sprites
    this.load.image('logo', 'data:image/svg+xml;base64,' + btoa(`
      <svg width="200" height="100" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="100" fill="#2563eb"/>
        <text x="100" y="50" font-family="Arial" font-size="20" fill="white" text-anchor="middle" dominant-baseline="middle">Kingdom: Survival</text>
      </svg>
    `));
    
    // Create loading bar
    const loadingBar = this.add.graphics();
    const loadingBox = this.add.graphics();
    
    loadingBox.fillStyle(0x222222);
    loadingBox.fillRect(240, 270, 320, 50);
    
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    const loadingText = this.make.text({
      x: width / 2,
      y: height / 2 - 50,
      text: 'Loading...',
      style: {
        font: '20px monospace',
        color: '#ffffff'
      }
    });
    loadingText.setOrigin(0.5, 0.5);
    
    const percentText = this.make.text({
      x: width / 2,
      y: height / 2 - 5,
      text: '0%',
      style: {
        font: '18px monospace',
        color: '#ffffff'
      }
    });
    percentText.setOrigin(0.5, 0.5);
    
    const assetText = this.make.text({
      x: width / 2,
      y: height / 2 + 50,
      text: '',
      style: {
        font: '18px monospace',
        color: '#ffffff'
      }
    });
    assetText.setOrigin(0.5, 0.5);
    
    // Update loading bar
    this.load.on('progress', (value: number) => {
      percentText.setText((value * 100).toFixed(0) + '%');
      loadingBar.clear();
      loadingBar.fillStyle(0xffffff);
      loadingBar.fillRect(250, 280, 300 * value, 30);
    });
    
    this.load.on('fileprogress', (file: any) => {
      assetText.setText('Loading asset: ' + file.key);
    });
    
    this.load.on('complete', () => {
      loadingBar.destroy();
      loadingBox.destroy();
      loadingText.destroy();
      percentText.destroy();
      assetText.destroy();
    });

    // Load game assets
    this.loadGameAssets();
    
    // Load leaderboard background
    this.load.image('leaderboard_background', '/assets/images/backgrounds/leaderboard_background.png');
    
    // Load exit button
    this.load.image('exit_btn', '/assets/images/ui/buttons/exit.png');
  }

  private loadGameAssets() {
    // Create placeholder sprites using Graphics API
    this.load.image('player', 'data:image/svg+xml;base64,' + btoa(`
      <svg width="30" height="30" xmlns="http://www.w3.org/2000/svg">
        <rect width="30" height="30" fill="#4ade80" rx="5"/>
        <circle cx="15" cy="15" r="8" fill="#22c55e"/>
      </svg>
    `));

    this.load.image('enemy', 'data:image/svg+xml;base64,' + btoa(`
      <svg width="25" height="25" xmlns="http://www.w3.org/2000/svg">
        <rect width="25" height="25" fill="#ef4444" rx="3"/>
        <polygon points="12.5,5 20,20 5,20" fill="#dc2626"/>
      </svg>
    `));

    this.load.image('bullet', 'data:image/svg+xml;base64,' + btoa(`
      <svg width="4" height="10" xmlns="http://www.w3.org/2000/svg">
        <rect width="4" height="10" fill="#fbbf24" rx="2"/>
      </svg>
    `));

    this.load.image('enemy-bullet', 'data:image/svg+xml;base64,' + btoa(`
      <svg width="4" height="10" xmlns="http://www.w3.org/2000/svg">
        <rect width="4" height="10" fill="#f87171" rx="2"/>
      </svg>
    `));

    // Background
    this.load.image('background', 'data:image/svg+xml;base64,' + btoa(`
      <svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#1e1b4b;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#312e81;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="800" height="600" fill="url(#bg)"/>
        <circle cx="100" cy="100" r="2" fill="white" opacity="0.3"/>
        <circle cx="200" cy="150" r="1" fill="white" opacity="0.3"/>
        <circle cx="300" cy="200" r="2" fill="white" opacity="0.3"/>
        <circle cx="400" cy="250" r="1" fill="white" opacity="0.3"/>
        <circle cx="500" cy="300" r="2" fill="white" opacity="0.3"/>
      </svg>
    `));

    // UI Elements
    this.load.image('button', 'data:image/svg+xml;base64,' + btoa(`
      <svg width="200" height="50" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="50" fill="#4338ca" rx="25"/>
        <rect x="2" y="2" width="196" height="46" fill="none" stroke="#6366f1" stroke-width="2" rx="23"/>
      </svg>
    `));

    this.load.image('skill-button', 'data:image/svg+xml;base64,' + btoa(`
      <svg width="60" height="60" xmlns="http://www.w3.org/2000/svg">
        <circle cx="30" cy="30" r="30" fill="#1e40af"/>
        <circle cx="30" cy="30" r="25" fill="#3b82f6"/>
        <text x="30" y="35" font-family="Arial" font-size="12" fill="white" text-anchor="middle">F</text>
      </svg>
    `));
  }

  create() {
    // Simple fade transition
    this.cameras.main.fadeIn(1000, 0, 0, 0);
    
    // Add some text to show the scene is working
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    this.add.text(width / 2, height / 2, 'Kingdom: Survival', {
      font: '48px Arial',
      color: '#ffffff'
    }).setOrigin(0.5, 0.5);
    
    this.add.text(width / 2, height / 2 + 60, 'Loading Complete!', {
      font: '24px Arial',
      color: '#6366f1'
    }).setOrigin(0.5, 0.5);
    
    this.add.text(width / 2, height / 2 + 120, 'Click anywhere to continue', {
      font: '16px Arial',
      color: '#a3a3a3'
    }).setOrigin(0.5, 0.5);
    
    // Add click handler to go to HomeScene
    this.input.on('pointerdown', () => {
      this.scene.start(SCENES.HOME);
    });
    
    // Auto-transition after 3 seconds
    this.time.delayedCall(3000, () => {
      this.scene.start(SCENES.HOME);
    });
  }
}

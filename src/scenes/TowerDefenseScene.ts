import Phaser from 'phaser';
import { SCENES } from '../types/game';
import { AssetLoader } from '../utils/AssetLoader';
import { AudioManager } from '../utils/AudioManager';

export class TowerDefenseScene extends Phaser.Scene {
  private userData: any = null;
  private gameSeed: string = '';
  
  // Game objects
  private tower!: Phaser.GameObjects.Image;
  private crystal!: Phaser.GameObjects.Sprite;
  private ground!: Phaser.GameObjects.Image;
  private enemies: Phaser.GameObjects.Sprite[] = [];
  private projectiles: Phaser.GameObjects.Image[] = [];
  
  // Enemy types
  private enemyTypes = {
    SMALL: { width: 48, height: 48, health: 4, sprite: 'small_goblin', walkAnim: 'small_goblin_walking', attackAnim: 'small_goblin_attacking', score: 10 },
    LARGE: { width: 64, height: 64, health: 10, sprite: 'big_goblin', walkAnim: 'big_goblin_walking', attackAnim: 'big_goblin_attacking', score: 25 },
    BOSS: { width: 96, height: 96, health: 50, sprite: 'boss_golem', walkAnim: 'golem_walking', attackAnim: 'golem_attacking', score: 100 },
    FLYING_DEVIL: { width: 56, height: 56, health: 6, sprite: 'flying_devil', walkAnim: 'flying_devil_flying', attackAnim: 'flying_devil_attacking', score: 15 }
  };
  
  // Game state
  private score: number = 0;
  private kills: number = 0;
  private timeSurvived: number = 0;
  private towerHealth: number = 100;
  private maxTowerHealth: number = 100;
  private isFreezeActive: boolean = false;
  private freezeEndTime: number = 0;
  private isDamageBoostActive: boolean = false;
  private damageBoostEndTime: number = 0;
  private damageMultiplier: number = 1;
  private gameEnded: boolean = false;
  private isBossWave: boolean = false;
  private currentBoss: Phaser.GameObjects.Sprite | null = null;
  
  // Boss spawning system
  private nextBossTime: number = 30; // First boss at 30 seconds
  private bossWaveNumber: number = 1;
  private bossSpawnTimer: Phaser.Time.TimerEvent | null = null;
  
  // Firing rate limiting (5 CPS = 200ms cooldown)
  private lastShotTime: number = 0;
  private shotCooldown: number = 200; // 200ms = 5 shots per second max
  private canShoot: boolean = true;
  
  // UI elements
  private scoreText!: Phaser.GameObjects.Text;
  private killsText!: Phaser.GameObjects.Text;
  private timeText!: Phaser.GameObjects.Text;
  private waveText!: Phaser.GameObjects.Text;
  private healthBar!: Phaser.GameObjects.Graphics;
  private healthBarBg!: Phaser.GameObjects.Graphics;
  // Skill buttons
  private freezeSkillButton!: Phaser.GameObjects.Rectangle;
  private freezeSkillIcon!: Phaser.GameObjects.Image;
  private freezeSkillCost!: Phaser.GameObjects.Text;
  private freezeStatusText!: Phaser.GameObjects.Text;
  
  private healSkillButton!: Phaser.GameObjects.Rectangle;
  private healSkillIcon!: Phaser.GameObjects.Image;
  private healSkillCost!: Phaser.GameObjects.Text;
  
  private damageBoostButton!: Phaser.GameObjects.Rectangle;
  private damageBoostIcon!: Phaser.GameObjects.Image;
  private damageBoostCost!: Phaser.GameObjects.Text;
  private damageBoostStatusText!: Phaser.GameObjects.Text;
  
  // Timers
  private gameTimer!: Phaser.Time.TimerEvent;
  private enemySpawner!: Phaser.Time.TimerEvent;

  constructor() {
    super({ key: SCENES.GAME });
  }

  init(data?: any) {
    if (data) {
      this.userData = data.user;
      this.gameSeed = data.seed || '';
    }
    
    // DEBUG: Log user data received
    
    // Reset all game state when scene starts
    this.score = 0;
    this.kills = 0;
    this.timeSurvived = 0;
    this.towerHealth = 100;
    this.enemies = [];
    this.projectiles = [];
    this.isFreezeActive = false;
    this.freezeEndTime = 0;
    this.isDamageBoostActive = false;
    this.damageBoostEndTime = 0;
    this.damageMultiplier = 1;
    this.gameEnded = false;
    this.isBossWave = false;
    this.currentBoss = null;
    
    // Reset boss spawning system
    this.nextBossTime = 30; // First boss at 30 seconds
    this.bossWaveNumber = 1;
    if (this.bossSpawnTimer) {
      this.bossSpawnTimer.destroy();
      this.bossSpawnTimer = null;
    }
    
    // Reset firing rate limit
    this.lastShotTime = 0;
    this.canShoot = true;
  }

  preload() {
    // Load all game assets
    AssetLoader.preloadGameAssets(this);
    
    // Load audio assets
    AudioManager.getInstance().preloadAudio(this);
    
    // Load skill icons
    this.load.image('freeze_icon', '/assets/images/ui/skill_icons/freeze.png');
    this.load.image('heal_icon', '/assets/images/ui/skill_icons/heal.png');
    this.load.image('speed_icon', '/assets/images/ui/skill_icons/speed.png');
  }

  create() {
    const { width, height } = this.cameras.main;

    // Start battle music if not already playing
    const currentMusic = AudioManager.getInstance().getCurrentMusicKey();
    if (currentMusic !== 'battle-music') {
      AudioManager.getInstance().playBattleMusic(this);
    }

    // Create animations
    AssetLoader.createAnimations(this);

    // Background
    this.add.image(width / 2, height / 2, 'game_background');
    
    // Ground
    this.ground = this.add.image(width / 2, height - 50, 'ground');
    this.ground.setDisplaySize(width, 100); // Scale ground to fit screen width
    
    // Castle/Tower on the left
    this.createTower();
    
    // UI
    this.createUI();
    
    // Input for shooting
    this.input.on('pointerdown', this.shootProjectile, this);
    
    // Keyboard controls
    this.setupKeyboard();
    
    // Start timers
    this.startGameTimers();
  }

  private createTower() {
    const { height } = this.cameras.main;
    const groundLevel = AssetLoader.getGroundLevel(this);
    
    // Main tower (fortress) - position it higher above ground
    this.tower = this.add.image(80, groundLevel - 140, 'fortress');
    this.tower.setScale(0.7); // Slightly smaller scale
    
    // Crystal on top of tower (animated) - higher above tower
    this.crystal = this.add.sprite(70, groundLevel - 280, 'crystal_anim1');
    this.crystal.setScale(0.5); // Smaller crystal
    this.crystal.play('crystal_glowing');
  }

  private createUI() {
    const { width, height } = this.cameras.main;
    
    // Score and kills
    this.scoreText = this.add.text(20, 20, 'Score: 0', {
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2
    });
    
    this.killsText = this.add.text(20, 50, 'Kills: 0', {
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2
    });
    
    // Time survived
    this.timeText = this.add.text(width - 20, 20, 'Survived: 0s', {
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2
    });
    this.timeText.setOrigin(1, 0);
    
    // Wave indicator
    this.waveText = this.add.text(width / 2, 20, 'Wave 1', {
      fontSize: '24px',
      color: '#ffff00',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    });
    this.waveText.setOrigin(0.5, 0);
    
    // Tower health bar
    this.healthBarBg = this.add.graphics();
    this.healthBarBg.fillStyle(0x000000);
    this.healthBarBg.fillRect(15, 90, 154, 24);
    
    this.healthBar = this.add.graphics();
    this.updateHealthBar();
    
    this.add.text(20, 95, 'Tower Health', {
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    
    // Create skill panel
    this.createSkillPanel();
  }

  private setupKeyboard() {
    if (this.input.keyboard) {
      const spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
      spaceKey.on('down', () => {
        this.activateFreeze();
      });
    }
  }
  
  private createSkillPanel() {
    const { height } = this.cameras.main;
    
    // Skill panel positions
    const basePanelY = height - 40;
    const skillSize = 45;
    const skillSpacing = 55;
    const startX = 80 - skillSpacing; // Center the 3 skills around tower position
    
    // Create 3 skill slots
    this.createFreezeSkill(startX, basePanelY, skillSize);
    this.createHealSkill(startX + skillSpacing, basePanelY, skillSize);
    this.createDamageBoostSkill(startX + skillSpacing * 2, basePanelY, skillSize);
  }
  
  private createFreezeSkill(x: number, y: number, size: number) {
    // Skill slot background
    const skillSlot = this.add.rectangle(x, y, size + 4, size + 4, 0x8B4513);
    skillSlot.setStrokeStyle(2, 0x654321);
    
    // Freeze skill button
    this.freezeSkillButton = this.add.rectangle(x, y, size, size, 0x4A90E2);
    this.freezeSkillButton.setStrokeStyle(2, 0x2980B9);
    this.freezeSkillButton.setInteractive({ useHandCursor: true });
    
    // Freeze skill icon
    this.freezeSkillIcon = this.add.image(x, y - 3, 'freeze_icon');
    this.freezeSkillIcon.setScale(0.35);
    this.freezeSkillIcon.setOrigin(0.5);
    
    // Skill cost text
    this.freezeSkillCost = this.add.text(x, y + 10, '50', {
      fontSize: '10px',
      color: '#ffff00',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 1
    });
    this.freezeSkillCost.setOrigin(0.5);
    
    // Status text
    this.freezeStatusText = this.add.text(x, y + 25, '', {
      fontSize: '10px',
      color: '#00ffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 1
    });
    this.freezeStatusText.setOrigin(0.5);
    
    // Event handlers
    this.freezeSkillButton.on('pointerdown', () => this.activateFreeze());
    this.freezeSkillButton.on('pointerover', () => {
      if (!this.isFreezeActive && this.score >= 50) {
        this.freezeSkillButton.setFillStyle(0x5DADE2);
        this.freezeSkillIcon.setScale(0.4);
      }
    });
    this.freezeSkillButton.on('pointerout', () => {
      this.updateFreezeSkillAppearance();
      this.freezeSkillIcon.setScale(0.35);
    });
  }
  
  private createHealSkill(x: number, y: number, size: number) {
    // Skill slot background
    const skillSlot = this.add.rectangle(x, y, size + 4, size + 4, 0x8B4513);
    skillSlot.setStrokeStyle(2, 0x654321);
    
    // Heal skill button
    this.healSkillButton = this.add.rectangle(x, y, size, size, 0x27AE60);
    this.healSkillButton.setStrokeStyle(2, 0x229954);
    this.healSkillButton.setInteractive({ useHandCursor: true });
    
    // Heal skill icon
    this.healSkillIcon = this.add.image(x, y - 3, 'heal_icon');
    this.healSkillIcon.setScale(0.5);
    this.healSkillIcon.setOrigin(0.5);
    
    // Skill cost text
    this.healSkillCost = this.add.text(x, y + 10, '100', {
      fontSize: '10px',
      color: '#ffff00',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 1
    });
    this.healSkillCost.setOrigin(0.5);
    
    // Event handlers
    this.healSkillButton.on('pointerdown', () => this.activateHeal());
    this.healSkillButton.on('pointerover', () => {
      if (this.score >= 100 && this.towerHealth < this.maxTowerHealth) {
        this.healSkillButton.setFillStyle(0x2ECC71);
        this.healSkillIcon.setScale(0.55);
      }
    });
    this.healSkillButton.on('pointerout', () => {
      this.updateHealSkillAppearance();
      this.healSkillIcon.setScale(0.5);
    });
  }
  
  private createDamageBoostSkill(x: number, y: number, size: number) {
    // Skill slot background
    const skillSlot = this.add.rectangle(x, y, size + 4, size + 4, 0x8B4513);
    skillSlot.setStrokeStyle(2, 0x654321);
    
    // Damage boost skill button
    this.damageBoostButton = this.add.rectangle(x, y, size, size, 0xE67E22);
    this.damageBoostButton.setStrokeStyle(2, 0xD68910);
    this.damageBoostButton.setInteractive({ useHandCursor: true });
    
    // Damage boost skill icon
    this.damageBoostIcon = this.add.image(x, y - 3, 'speed_icon');
    this.damageBoostIcon.setScale(0.5);
    this.damageBoostIcon.setOrigin(0.5);
    
    // Skill cost text
    this.damageBoostCost = this.add.text(x, y + 10, '70', {
      fontSize: '10px',
      color: '#ffff00',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 1
    });
    this.damageBoostCost.setOrigin(0.5);
    
    // Status text
    this.damageBoostStatusText = this.add.text(x, y + 25, '', {
      fontSize: '10px',
      color: '#ff6600',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 1
    });
    this.damageBoostStatusText.setOrigin(0.5);
    
    // Event handlers
    this.damageBoostButton.on('pointerdown', () => this.activateDamageBoost());
    this.damageBoostButton.on('pointerover', () => {
      if (!this.isDamageBoostActive && this.score >= 70) {
        this.damageBoostButton.setFillStyle(0xF39C12);
        this.damageBoostIcon.setScale(0.55);
      }
    });
    this.damageBoostButton.on('pointerout', () => {
      this.updateDamageBoostSkillAppearance();
      this.damageBoostIcon.setScale(0.5);
    });
  }
  
  private updateFreezeSkillAppearance() {
    if (this.isFreezeActive) {
      this.freezeSkillButton.setFillStyle(0x7F8C8D);
      this.freezeSkillButton.setStrokeStyle(2, 0x95A5A6);
      this.freezeSkillIcon.setTint(0xBDC3C7);
      this.freezeSkillCost.setVisible(false);
    } else if (this.score >= 50) {
      this.freezeSkillButton.setFillStyle(0x4A90E2);
      this.freezeSkillButton.setStrokeStyle(2, 0x2980B9);
      this.freezeSkillIcon.clearTint();
      this.freezeSkillCost.setVisible(true);
      this.freezeSkillCost.setColor('#ffff00');
    } else {
      this.freezeSkillButton.setFillStyle(0xE74C3C);
      this.freezeSkillButton.setStrokeStyle(2, 0xC0392B);
      this.freezeSkillIcon.setTint(0xF8F9FA);
      this.freezeSkillCost.setVisible(true);
      this.freezeSkillCost.setColor('#ffffff');
    }
  }
  
  private updateHealSkillAppearance() {
    if (this.towerHealth >= this.maxTowerHealth) {
      // Full health - gray and disabled
      this.healSkillButton.setFillStyle(0x7F8C8D);
      this.healSkillButton.setStrokeStyle(2, 0x95A5A6);
      this.healSkillIcon.setTint(0xBDC3C7);
      this.healSkillCost.setColor('#888888');
    } else if (this.score >= 100) {
      // Available - green and clickable
      this.healSkillButton.setFillStyle(0x27AE60);
      this.healSkillButton.setStrokeStyle(2, 0x229954);
      this.healSkillIcon.clearTint();
      this.healSkillCost.setColor('#ffff00');
    } else {
      // Not enough points - red and disabled
      this.healSkillButton.setFillStyle(0xE74C3C);
      this.healSkillButton.setStrokeStyle(2, 0xC0392B);
      this.healSkillIcon.setTint(0xF8F9FA);
      this.healSkillCost.setColor('#ffffff');
    }
  }
  
  private updateDamageBoostSkillAppearance() {
    if (this.isDamageBoostActive) {
      this.damageBoostButton.setFillStyle(0x7F8C8D);
      this.damageBoostButton.setStrokeStyle(2, 0x95A5A6);
      this.damageBoostIcon.setTint(0xBDC3C7);
      this.damageBoostCost.setVisible(false);
    } else if (this.score >= 70) {
      this.damageBoostButton.setFillStyle(0xE67E22);
      this.damageBoostButton.setStrokeStyle(2, 0xD68910);
      this.damageBoostIcon.clearTint();
      this.damageBoostCost.setVisible(true);
      this.damageBoostCost.setColor('#ffff00');
    } else {
      this.damageBoostButton.setFillStyle(0xE74C3C);
      this.damageBoostButton.setStrokeStyle(2, 0xC0392B);
      this.damageBoostIcon.setTint(0xF8F9FA);
      this.damageBoostCost.setVisible(true);
      this.damageBoostCost.setColor('#ffffff');
    }
  }
  
  private activateFreeze() {
    // Check if player has enough points and freeze is not active
    if (this.score < 50) {
      // Show temporary message
      const warningText = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2, 
        'Need 50 points for freeze!', {
        fontSize: '24px',
        color: '#ff0000',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 2
      });
      warningText.setOrigin(0.5);
      
      this.time.delayedCall(1500, () => {
        warningText.destroy();
      });
      return;
    }
    
    if (this.isFreezeActive) {
      return;
    }
    
    // Deduct points and activate freeze
    this.score -= 50;
    this.scoreText.setText(`Score: ${this.score}`);
    this.isFreezeActive = true;
    this.freezeEndTime = this.time.now + 3000; // 3 seconds freeze
    
    // Freeze all existing enemies (stop movement AND attack)
    this.enemies.forEach(enemy => {
      // Stop current movement
      this.tweens.killTweensOf(enemy);
      
      // Stop animations and apply freeze tint
      enemy.stop();
      enemy.setTint(0x00ffff);
      
      // Freeze attacking enemies too - pause their damage timers
      if ((enemy as any).damageTimer) {
        (enemy as any).damageTimer.paused = true;
      }
    });
    
    // Visual effect
    const freezeEffect = this.add.circle(this.cameras.main.width / 2, this.cameras.main.height / 2, 50, 0x00ffff, 0.3);
    this.tweens.add({
      targets: freezeEffect,
      scaleX: 10,
      scaleY: 10,
      alpha: 0,
      duration: 500,
      onComplete: () => freezeEffect.destroy()
    });
    
    
    // Update skill button appearance
    this.updateFreezeSkillAppearance();
    
    // Unfreeze after 3 seconds
    this.time.delayedCall(3000, () => {
      this.deactivateFreeze();
    });
  }
  
  private deactivateFreeze() {
    this.isFreezeActive = false;
    this.freezeEndTime = 0;
    
    // Unfreeze and resume all enemy activities
    this.enemies.forEach(enemy => {
      const enemyType = (enemy as any).enemyType;
      const isAttached = (enemy as any).isAttached;
      const isFlying = (enemy as any).isFlying;
      
      // Resume attack timers for attached enemies
      if ((enemy as any).damageTimer) {
        (enemy as any).damageTimer.paused = false;
      }
      
      // Clear freeze tint
      enemy.clearTint();
      
      // Check if enemy is already attached (near tower)
      if (isAttached || enemy.x <= 125) {
        // Enemy is already attached, play attack animation
        enemy.play(enemyType.attackAnim);
        
        // Resume attack floating for flying devils
        if (isFlying && (enemy as any).attackFloatTween) {
          // Recreate attack float tween if it was destroyed
          const floatAmplitude = 15;
          const floatSpeed = 1500;
          
          const attackFloatTween = this.tweens.add({
            targets: enemy,
            y: enemy.y + floatAmplitude,
            duration: floatSpeed,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
          });
          
          (enemy as any).attackFloatTween = attackFloatTween;
        }
      } else {
        // Enemy is still moving, resume walking animation and movement
        enemy.play(enemyType.walkAnim);
        
        // Resume movement - check if it's a boss, flying enemy, or regular enemy
        if ((enemy as any).isBoss) {
          this.moveBossTowardsTower(enemy);
        } else if (isFlying) {
          this.moveFlyingEnemyTowardsTower(enemy, this.cameras.main.width);
        } else {
          this.moveEnemyTowardsTower(enemy, this.cameras.main.width);
        }
      }
    });
    
    // Update skill button appearance
    this.updateFreezeSkillAppearance();
    
  }
  
  private activateHeal() {
    if (this.score < 100) {
      const warningText = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2, 
        'Need 100 points for heal!', {
        fontSize: '24px',
        color: '#ff0000',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 2
      });
      warningText.setOrigin(0.5);
      
      this.time.delayedCall(1500, () => {
        warningText.destroy();
      });
      return;
    }
    
    if (this.towerHealth >= this.maxTowerHealth) {
      return;
    }
    
    // Deduct points and heal tower
    this.score -= 100;
    this.scoreText.setText(`Score: ${this.score}`);
    this.towerHealth = Math.min(this.maxTowerHealth, this.towerHealth + 50); // Heal 50 HP
    this.updateHealthBar();
    
    // Visual healing effect
    const healEffect = this.add.circle(this.tower.x, this.tower.y, 30, 0x00ff00, 0.6);
    this.tweens.add({
      targets: healEffect,
      scaleX: 2,
      scaleY: 2,
      alpha: 0,
      duration: 800,
      onComplete: () => healEffect.destroy()
    });
    
    // Tower flash green
    this.tower.setTint(0x00ff00);
    this.time.delayedCall(300, () => {
      this.tower.clearTint();
    });
    
  }
  
  private activateDamageBoost() {
    if (this.score < 70) {
      const warningText = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2, 
        'Need 70 points for damage boost!', {
        fontSize: '24px',
        color: '#ff0000',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 2
      });
      warningText.setOrigin(0.5);
      
      this.time.delayedCall(1500, () => {
        warningText.destroy();
      });
      return;
    }
    
    if (this.isDamageBoostActive) {
      return;
    }
    
    // Deduct points and activate damage boost
    this.score -= 70;
    this.scoreText.setText(`Score: ${this.score}`);
    this.isDamageBoostActive = true;
    this.damageBoostEndTime = this.time.now + 10000; // 10 seconds boost
    this.damageMultiplier = 2; // 2x damage
    
    // Visual effect
    const boostEffect = this.add.circle(this.tower.x, this.tower.y, 25, 0xff6600, 0.5);
    this.tweens.add({
      targets: boostEffect,
      scaleX: 3,
      scaleY: 3,
      alpha: 0,
      duration: 600,
      onComplete: () => boostEffect.destroy()
    });
    
    this.updateDamageBoostSkillAppearance();
    
    // Deactivate after 10 seconds
    this.time.delayedCall(10000, () => {
      this.deactivateDamageBoost();
    });
  }
  
  private deactivateDamageBoost() {
    this.isDamageBoostActive = false;
    this.damageBoostEndTime = 0;
    this.damageMultiplier = 1;
    
    this.updateDamageBoostSkillAppearance();
  }
  
  private startGameTimers() {
    // Survival timer (counts up instead of down)
    this.gameTimer = this.time.addEvent({
      delay: 1000,
      callback: this.updateSurvivalTimer,
      callbackScope: this,
      loop: true
    });
    
    // Enemy spawner - starts slow, gets faster
    this.enemySpawner = this.time.addEvent({
      delay: 2000,
      callback: this.spawnEnemy,
      callbackScope: this,
      loop: true
    });
    
    // Speed up enemy spawning every 15 seconds (separate from boss waves)
    this.time.addEvent({
      delay: 15000, // Every 15 seconds
      callback: this.increaseDifficulty,
      callbackScope: this,
      loop: true
    });
    
    // Schedule first boss at 30 seconds
    this.scheduleBoss();
  }
  
  private increaseDifficulty() {
    if (this.gameEnded || this.isBossWave) return;
    
    const currentDelay = this.enemySpawner.delay;
    if (currentDelay > 200) { // Max 5 CPS (1000ms / 5 = 200ms)
      const newDelay = Math.max(200, currentDelay - 200); // Spawn faster each difficulty increase
      
      // Destroy the old timer
      this.enemySpawner.destroy();
      
      // Create a new timer with the updated delay
      this.enemySpawner = this.time.addEvent({
        delay: newDelay,
        callback: this.spawnEnemy,
        callbackScope: this,
        loop: true
      });
    
      const spawnRate = (1000 / newDelay).toFixed(1);
    }
  }
    
    private scheduleBoss() {
    if (this.gameEnded) return;
    
    
    // Calculate delay from current survival time to next boss time
    const delayInMs = (this.nextBossTime - this.timeSurvived) * 1000;
    
    // Only schedule if the boss time hasn't passed yet
    if (delayInMs > 0) {
      this.bossSpawnTimer = this.time.addEvent({
        delay: delayInMs,
        callback: () => {
          if (!this.gameEnded && !this.isBossWave) {
            this.startBossWave(this.bossWaveNumber);
          }
        },
        callbackScope: this
      });
    } else {
      // If the boss time has already passed, schedule it immediately
      if (!this.gameEnded && !this.isBossWave) {
        this.startBossWave(this.bossWaveNumber);
      }
    }
  }
  
  private startBossWave(waveNumber: number) {
    if (this.gameEnded || this.isBossWave) return;
    
    this.isBossWave = true;
    
    // Stop regular enemy spawning for boss wave
    this.enemySpawner.paused = true;
    
    // Update wave text
    this.waveText.setText(`Boss Wave ${waveNumber}`);
    
    // Show boss warning alert
    this.showBossAlert(waveNumber, () => {
      // Spawn boss after alert
      this.time.delayedCall(1000, () => {
        this.spawnBoss(waveNumber);
      });
    });
    
  }
  
  
  private showBossAlert(waveNumber: number, onComplete: () => void) {
    const { width, height } = this.cameras.main;
    
    // Dark screen overlay
    const alertOverlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);
    
    // Warning text
    const warningText = this.add.text(width / 2, height / 2 - 80, 'WARNING!', {
      fontSize: '48px',
      color: '#ff0000',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    });
    warningText.setOrigin(0.5);
    
    // Boss incoming text
    const bossText = this.add.text(width / 2, height / 2 - 20, `BOSS INCOMING`, {
      fontSize: '32px',
      color: '#ffff00',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    });
    bossText.setOrigin(0.5);
    
    // Wave number
    const waveText = this.add.text(width / 2, height / 2 + 20, `Wave ${waveNumber} Boss`, {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2
    });
    waveText.setOrigin(0.5);
    
    // Boss stats
    const statsText = this.add.text(width / 2, height / 2 + 60, 'HP: 50 | Damage: High | Reward: 100 Points', {
      fontSize: '18px',
      color: '#cccccc',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2
    });
    statsText.setOrigin(0.5);
    
    // Flashing animation for warning
    this.tweens.add({
      targets: [warningText, bossText],
      alpha: 0.3,
      duration: 500,
      yoyo: true,
      repeat: 3,
      ease: 'Power2'
    });
    
    // Screen shake effect
    this.cameras.main.shake(300, 0.02);
    
    // Remove alert after 3 seconds
    this.time.delayedCall(3000, () => {
      alertOverlay.destroy();
      warningText.destroy();
      bossText.destroy();
      waveText.destroy();
      statsText.destroy();
      onComplete();
    });
  }
  
  private spawnBoss(waveNumber: number) {
    if (this.gameEnded) return;
    
    const { width } = this.cameras.main;
    const bossType = this.enemyTypes.BOSS;
    
    // Calculate proper ground position for boss using config
    const bossY = AssetLoader.getEnemyGroundY(this, 'BOSS');
    
    // Create boss sprite
    const boss = this.add.sprite(width + 50, bossY, bossType.sprite);
    
    // Set scale using AssetLoader config
    const bossScale = AssetLoader.getEnemyScale('BOSS');
    boss.setScale(bossScale);
    boss.setFlipX(true); // Mirror to face left
    
    // Add boss properties
    (boss as any).maxHealth = bossType.health;
    (boss as any).currentHealth = bossType.health;
    (boss as any).enemyType = bossType;
    (boss as any).enemyTypeKey = 'BOSS'; // Store type key for hitbox calculation
    (boss as any).isAttached = false;
    (boss as any).isBoss = true;
    
    // Add to enemies array and set as current boss
    this.enemies.push(boss);
    this.currentBoss = boss;
    
    // Boss health bar
    this.createBossHealthBar(boss);
    
    // Start boss walking animation and movement
    if (!this.isFreezeActive) {
      boss.play(bossType.walkAnim);
      this.moveBossTowardsTower(boss);
    } else {
      // If freeze is active, stop animation and apply tint
      boss.stop();
      boss.setTint(0x00ffff);
    }
    
    // Boss entrance effect
    const entranceEffect = this.add.circle(boss.x, boss.y, 80, 0x800080, 0.3);
    this.tweens.add({
      targets: entranceEffect,
      scaleX: 2,
      scaleY: 2,
      alpha: 0,
      duration: 1000,
      onComplete: () => entranceEffect.destroy()
    });
    
    
    // Show boss notification
    const bossNotification = this.add.text(width / 2, this.cameras.main.height / 2 - 100, 
      `BOSS FIGHT!`, {
      fontSize: '42px',
      color: '#ff00ff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    });
    bossNotification.setOrigin(0.5);
    
    this.tweens.add({
      targets: bossNotification,
      scaleX: 1.3,
      scaleY: 1.3,
      alpha: 0,
      duration: 2500,
      ease: 'Power2',
      onComplete: () => bossNotification.destroy()
    });
  }
  
  private createBossHealthBar(boss: Phaser.GameObjects.Sprite) {
    const { width } = this.cameras.main;
    
    // Boss health bar background
    const bossHealthBg = this.add.graphics();
    bossHealthBg.fillStyle(0x000000);
    bossHealthBg.fillRect(width / 2 - 152, 70, 304, 20);
    (boss as any).healthBarBg = bossHealthBg;
    
    // Boss health bar
    const bossHealthBar = this.add.graphics();
    (boss as any).healthBar = bossHealthBar;
    
    // Boss health label
    const bossLabel = this.add.text(width / 2, 60, 'BOSS', {
      fontSize: '16px',
      color: '#ff00ff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2
    });
    bossLabel.setOrigin(0.5);
    (boss as any).healthLabel = bossLabel;
    
    this.updateBossHealthBar(boss);
  }
  
  private updateBossHealthBar(boss: Phaser.GameObjects.Sprite) {
    const healthBar = (boss as any).healthBar;
    const currentHealth = (boss as any).currentHealth;
    const maxHealth = (boss as any).maxHealth;
    const { width } = this.cameras.main;
    
    healthBar.clear();
    const healthPercent = currentHealth / maxHealth;
    const barWidth = 300;
    const healthWidth = barWidth * healthPercent;
    
    // Boss health bar color (purple to red)
    let color = 0x800080; // Purple
    if (healthPercent < 0.3) color = 0xff0000; // Red
    else if (healthPercent < 0.6) color = 0xff4080; // Pink
    
    healthBar.fillStyle(color);
    healthBar.fillRect(width / 2 - 150, 72, healthWidth, 16);
    
    // Health text
    const healthText = (boss as any).healthText;
    if (healthText) {
      healthText.destroy();
    }
    
    const newHealthText = this.add.text(width / 2, 80, `${currentHealth}/${maxHealth}`, {
      fontSize: '12px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 1
    });
    newHealthText.setOrigin(0.5);
    (boss as any).healthText = newHealthText;
  }
  
  private moveBossTowardsTower(boss: Phaser.GameObjects.Sprite) {
    const targetX = 130; // Stop near tower
    
    // Boss moves slower than regular enemies
    this.tweens.add({
      targets: boss,
      x: targetX,
      duration: 8000, // 8 seconds to reach tower (slower)
      onComplete: () => {
        // Boss reached tower - start attacking
        this.attachBossToTower(boss);
      }
    });
  }
  
  private attachBossToTower(boss: Phaser.GameObjects.Sprite) {
    if (!this.enemies.includes(boss) || this.gameEnded) return;
    
    const bossType = (boss as any).enemyType;
    (boss as any).isAttached = true;
    
    
    // Change boss animation to attacking
    boss.play(bossType.attackAnim);
    
    // Boss does more damage than regular enemies
    const bossDamageTimer = this.time.addEvent({
      delay: 800, // Faster attack rate
      callback: () => {
        if (this.gameEnded) {
          bossDamageTimer.destroy();
          return;
        }
        
        if (this.enemies.includes(boss) && boss.active) {
          this.damageTower(10); // Boss does 10 damage per attack (double regular)
          
          // Extra screen shake for boss attacks
          this.cameras.main.shake(100, 0.01);
        } else {
          bossDamageTimer.destroy();
        }
      },
      callbackScope: this,
      loop: true
    });
    
    // Store timer reference on boss
    (boss as any).damageTimer = bossDamageTimer;
  }
  
  private onBossDefeated(boss: Phaser.GameObjects.Sprite) {
    // Clean up boss UI elements
    const healthBar = (boss as any).healthBar;
    const healthBarBg = (boss as any).healthBarBg;
    const healthLabel = (boss as any).healthLabel;
    const healthText = (boss as any).healthText;
    
    if (healthBar) healthBar.destroy();
    if (healthBarBg) healthBarBg.destroy();
    if (healthLabel) healthLabel.destroy();
    if (healthText) healthText.destroy();
    
    // Calculate next boss spawn time (30 seconds from now)
    this.nextBossTime = this.timeSurvived + 30;
    this.bossWaveNumber++;
    
    // Reset boss state
    this.isBossWave = false;
    this.currentBoss = null;
    
    // Resume regular enemy spawning
    this.enemySpawner.paused = false;
    
    // Schedule next boss
    this.scheduleBoss();
    
    // Boss victory notification
    const { width, height } = this.cameras.main;
    const victoryText = this.add.text(width / 2, height / 2 - 50, 
      'BOSS DEFEATED!', {
      fontSize: '36px',
      color: '#00ff00',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    });
    victoryText.setOrigin(0.5);
    
    const rewardText = this.add.text(width / 2, height / 2, 
      '+100 POINTS!', {
      fontSize: '24px',
      color: '#ffff00',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2
    });
    rewardText.setOrigin(0.5);
    
    // Show next boss info
    const nextBossText = this.add.text(width / 2, height / 2 + 30, 
      `Next boss in 30 seconds (at ${this.nextBossTime}s)`, {
      fontSize: '16px',
      color: '#ffaa00',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2
    });
    nextBossText.setOrigin(0.5);
    
    // Animate victory texts
    this.tweens.add({
      targets: [victoryText, rewardText, nextBossText],
      scaleX: 1.2,
      scaleY: 1.2,
      alpha: 0,
      duration: 3000,
      ease: 'Power2',
      onComplete: () => {
        victoryText.destroy();
        rewardText.destroy();
        nextBossText.destroy();
      }
    });
    
  }

  private shootProjectile(pointer: Phaser.Input.Pointer) {
    // Check firing rate limit (5 CPS = 200ms cooldown)
    const currentTime = this.time.now;
    if (!this.canShoot || currentTime - this.lastShotTime < this.shotCooldown) {
      // Optionally show brief visual feedback for blocked shots
      if (currentTime - this.lastShotTime < this.shotCooldown) {
        // Brief red tint on crystal to indicate cooldown
        this.crystal.setTint(0xff4444);
        this.time.delayedCall(50, () => {
          this.crystal.clearTint();
        });
      }
      return; // Too soon, ignore this shot
    }
    
    // Update last shot time and set cooldown
    this.lastShotTime = currentTime;
    this.canShoot = false;
    
    // Re-enable shooting after cooldown
    this.time.delayedCall(this.shotCooldown, () => {
      this.canShoot = true;
    });
    
    const crystalX = this.crystal.x;
    const crystalY = this.crystal.y; // Shoot from crystal
    
    // Calculate direction to pointer
    const dx = pointer.x - crystalX;
    const dy = pointer.y - crystalY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Normalize direction
    const dirX = dx / distance;
    const dirY = dy / distance;
    
    // Create projectile from crystal position
    const projectile = this.add.image(crystalX, crystalY, 'projectile');
    projectile.setScale(0.8);
    this.projectiles.push(projectile);
    
    // Crystal shooting effect (brief scale up)
    this.crystal.setScale(0.5);
    this.time.delayedCall(100, () => {
      this.crystal.setScale(0.4);
    });
    
    // Animate projectile
    this.tweens.add({
      targets: projectile,
      x: crystalX + dirX * 800, // Shoot far
      y: crystalY + dirY * 800,
      duration: 1000,
      onComplete: () => {
        projectile.destroy();
        const index = this.projectiles.indexOf(projectile);
        if (index > -1) this.projectiles.splice(index, 1);
      }
    });
    
  }

  private spawnEnemy() {
    // Don't spawn regular enemies during boss wave
    if (this.isBossWave) {
      return;
    }
    
    const { width } = this.cameras.main;
    
    // Randomly choose enemy type (60% small, 25% large, 15% flying devil)
    const enemyRandom = Math.random();
    let enemyType;
    let enemyTypeKey;
    
    if (enemyRandom < 0.6) {
      enemyType = this.enemyTypes.SMALL;
      enemyTypeKey = 'SMALL';
    } else if (enemyRandom < 0.85) {
      enemyType = this.enemyTypes.LARGE;
      enemyTypeKey = 'LARGE';
    } else {
      enemyType = this.enemyTypes.FLYING_DEVIL;
      enemyTypeKey = 'FLYING_DEVIL';
    }
    
    // Calculate proper position for enemy using config
    const enemyY = AssetLoader.getEnemyGroundY(this, enemyTypeKey);
    
    // Create enemy sprite with proper sizing
    const enemy = this.add.sprite(width + 50, enemyY, enemyType.sprite);
    
    // Set scale using AssetLoader config
    const enemyScale = AssetLoader.getEnemyScale(enemyTypeKey);
    enemy.setScale(enemyScale);
    
    enemy.setFlipX(true); // Mirror to face left
    
    // Add health and type properties to enemy
    (enemy as any).maxHealth = enemyType.health;
    (enemy as any).currentHealth = enemyType.health;
    (enemy as any).enemyType = enemyType;
    (enemy as any).enemyTypeKey = enemyTypeKey; // Store type key for hitbox calculation
    (enemy as any).isAttached = false;
    (enemy as any).isBoss = false;
    (enemy as any).isFlying = (enemyTypeKey === 'FLYING_DEVIL'); // Mark flying enemies
    
    this.enemies.push(enemy);
    
    // Only move enemy if freeze is not active
    if (!this.isFreezeActive) {
      enemy.play(enemyType.walkAnim);
      // Use different movement pattern for flying devils
      if (enemyTypeKey === 'FLYING_DEVIL') {
        this.moveFlyingEnemyTowardsTower(enemy, width);
      } else {
        this.moveEnemyTowardsTower(enemy, width);
      }
    } else {
      // If freeze is active, stop animation and apply tint
      enemy.stop();
      enemy.setTint(0x00ffff);
    }
  }
  
  private moveEnemyTowardsTower(enemy: Phaser.GameObjects.Sprite, width: number) {
    const speed = Phaser.Math.Between(50, 150);
    const targetX = 120; // Stop closer to tower
    
    this.tweens.add({
      targets: enemy,
      x: targetX,
      duration: (enemy.x - targetX) * (1000 / speed),
      onComplete: () => {
        // Enemy reached tower - start attacking
        this.attachEnemyToTower(enemy);
      }
    });
  }
  
  private moveFlyingEnemyTowardsTower(enemy: Phaser.GameObjects.Sprite, width: number) {
    const speed = Phaser.Math.Between(80, 120); // Flying devils are faster
    const targetX = 110; // Flying devils stop a bit closer to tower
    
    // Add some floating motion for flying enemies
    const floatAmplitude = 30; // How much up/down movement
    const floatSpeed = 2000; // How fast the floating motion is
    
    // Start floating motion
    const floatTween = this.tweens.add({
      targets: enemy,
      y: enemy.y + floatAmplitude,
      duration: floatSpeed,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    // Store float tween reference for cleanup
    (enemy as any).floatTween = floatTween;
    
    // Move horizontally towards tower
    this.tweens.add({
      targets: enemy,
      x: targetX,
      duration: (enemy.x - targetX) * (1000 / speed),
      onComplete: () => {
        // Stop floating when attached to tower
        if (floatTween) {
          floatTween.destroy();
        }
        
        // Flying devil reached tower - start attacking
        this.attachFlyingEnemyToTower(enemy);
      }
    });
  }
  
  private attachEnemyToTower(enemy: Phaser.GameObjects.Sprite) {
    if (!this.enemies.includes(enemy)) return;
    
    const enemyType = (enemy as any).enemyType;
    (enemy as any).isAttached = true;
    
    
    // Change enemy animation to attacking
    enemy.play(enemyType.attackAnim);
    
    // Create continuous damage timer for this enemy
    const damageTimer = this.time.addEvent({
      delay: 1000, // 1 damage per second
      callback: () => {
        if (this.gameEnded) {
          damageTimer.destroy();
          return;
        }
        
        if (this.enemies.includes(enemy) && enemy.active) {
          this.damageTower(5); // Reduced damage per second
        } else {
          damageTimer.destroy(); // Stop timer if enemy is destroyed
        }
      },
      callbackScope: this,
      loop: true
    });
    
    // Store timer reference on enemy for cleanup
    (enemy as any).damageTimer = damageTimer;
  }
  
  private attachFlyingEnemyToTower(enemy: Phaser.GameObjects.Sprite) {
    if (!this.enemies.includes(enemy)) return;
    
    const enemyType = (enemy as any).enemyType;
    (enemy as any).isAttached = true;
    
    // Change flying devil animation to attacking
    enemy.play(enemyType.attackAnim);
    
    // Start floating motion while attacking (smaller amplitude)
    const floatAmplitude = 15; // Smaller floating motion when attacking
    const floatSpeed = 1500; // Faster floating motion when attacking
    
    const attackFloatTween = this.tweens.add({
      targets: enemy,
      y: enemy.y + floatAmplitude,
      duration: floatSpeed,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    // Store attack float tween reference for cleanup
    (enemy as any).attackFloatTween = attackFloatTween;
    
    // Create continuous damage timer for flying devil
    const damageTimer = this.time.addEvent({
      delay: 900, // Flying devils attack slightly faster
      callback: () => {
        if (this.gameEnded) {
          damageTimer.destroy();
          return;
        }
        
        if (this.enemies.includes(enemy) && enemy.active) {
          this.damageTower(6); // Flying devils do slightly more damage
        } else {
          damageTimer.destroy(); // Stop timer if enemy is destroyed
        }
      },
      callbackScope: this,
      loop: true
    });
    
    // Store timer reference on enemy for cleanup
    (enemy as any).damageTimer = damageTimer;
  }

  private damageTower(damage: number, attackingEnemy?: Phaser.GameObjects.Rectangle) {
    // Don't take damage if game has already ended
    if (this.gameEnded) {
      return;
    }
    
    this.towerHealth -= damage;
    this.updateHealthBar();
    
    // Flash tower red
    this.tower.setTint(0xff0000);
    this.time.delayedCall(200, () => {
      if (!this.gameEnded) {
        this.tower.clearTint();
      }
    });
    
    
    if (this.towerHealth <= 0 && !this.gameEnded) {
      this.endGame('Tower Destroyed!');
    }
  }

  private updateHealthBar() {
    this.healthBar.clear();
    const healthPercent = this.towerHealth / this.maxTowerHealth;
    const barWidth = 150;
    const healthWidth = barWidth * healthPercent;
    
    // Health bar color based on health
    let color = 0x00ff00; // Green
    if (healthPercent < 0.3) color = 0xff0000; // Red
    else if (healthPercent < 0.6) color = 0xffff00; // Yellow
    
    this.healthBar.fillStyle(color);
    this.healthBar.fillRect(17, 92, healthWidth, 20);
  }

  private updateSurvivalTimer() {
    // Don't update timer if game has ended
    if (this.gameEnded) {
      return;
    }
    
    this.timeSurvived++;
    this.timeText.setText(`Survived: ${this.timeSurvived}s`);
    
    // Update wave indicator based on survival time (not boss waves)
    const currentWave = Math.floor(this.timeSurvived / 15) + 1;
    if (!this.isBossWave) {
      this.waveText.setText(`Wave ${currentWave}`);
    }
    
    // Check if it's time for the scheduled boss
    if (!this.isBossWave && this.timeSurvived >= this.nextBossTime) {
      this.startBossWave(this.bossWaveNumber);
    }
  }

  private endGame(result: string) {
    // Prevent multiple calls to endGame
    if (this.gameEnded) {
      return;
    }
    
    this.gameEnded = true;
    
    // Stop all timers first
    this.gameTimer?.destroy();
    this.enemySpawner?.destroy();
    if (this.bossSpawnTimer) {
      this.bossSpawnTimer.destroy();
      this.bossSpawnTimer = null;
    }
    
    // Stop all enemy damage timers
    this.enemies.forEach(enemy => {
      if ((enemy as any).damageTimer) {
        (enemy as any).damageTimer.destroy();
      }
    });
    
    // Stop all tweens (including any audio fade tweens)
    this.tweens.killAll();
    
    // Remove existing input listeners
    this.input.removeAllListeners();
    
    // Immediately stop battle music and play game over music
    AudioManager.getInstance().playGameOverMusicImmediately(this);
    
    // DEBUG: Log user data being passed to results
    
    // Show original game over screen with score submission
    this.createGameOverScreen(result);
  }
  
  private createGameOverScreen(result: string) {
    const { width, height } = this.cameras.main;
    
    // Dark overlay background
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.85);
    
    // Game Over panel background (stone-like)
    const panelWidth = 400;
    const panelHeight = 350;
    const panel = this.add.rectangle(width / 2, height / 2, panelWidth, panelHeight, 0x4a4a4a);
    panel.setStrokeStyle(4, 0x2a2a2a);
    
    // Inner panel border
    const innerPanel = this.add.rectangle(width / 2, height / 2, panelWidth - 20, panelHeight - 20, 0x5a5a5a);
    innerPanel.setStrokeStyle(2, 0x6a6a6a);
    
    // Game Over Title
    const titleColor = result === 'Victory!' ? '#00ff00' : '#ff0000';
    const titleText = result === 'Victory!' ? 'VICTORY!' : 'GAME OVER';
    
    this.add.text(width / 2, height / 2 - 120, titleText, {
      fontSize: '42px',
      color: titleColor,
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);
    
    // Stats display
    this.add.text(width / 2, height / 2 - 70, `Final Score: ${this.score}`, {
      fontSize: '22px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);
    
    this.add.text(width / 2, height / 2 - 40, `Enemies Defeated: ${this.kills}`, {
      fontSize: '18px',
      color: '#cccccc',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);
    
    this.add.text(width / 2, height / 2 - 15, `Time Survived: ${this.timeSurvived}s`, {
      fontSize: '18px',
      color: '#cccccc',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);
    
    this.add.text(width / 2, height / 2 + 10, `Reached Wave: ${Math.floor(this.timeSurvived / 30) + 1}`, {
      fontSize: '18px',
      color: '#cccccc',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);
    
    // Submit score silently in background if user is logged in
    if (this.userData && this.userData.address) {
      this.submitScore();
    }
    
    // Create buttons
    this.createGameOverButtons(width, height, result);
  }
  
  private createGameOverButtons(width: number, height: number, result: string) {
    const buttonWidth = 160;
    const buttonHeight = 35;
    const buttonY1 = height / 2 + 40;
    const buttonY2 = height / 2 + 85;
    const buttonY3 = height / 2 + 130;
    
    // Retry button (only show if game over, not victory)
    if (result !== 'Victory!') {
      const retryButton = this.add.image(width / 2, buttonY1, 'retry_btn');
      retryButton.setScale(0.8);
      retryButton.setInteractive({ cursor: 'pointer' });
      
      // Hover effects
      retryButton.on('pointerover', () => {
        retryButton.setScale(0.9);
        retryButton.setTint(0xdddddd);
      });
      
      retryButton.on('pointerout', () => {
        retryButton.setScale(0.8);
        retryButton.clearTint();
      });
      
      retryButton.on('pointerdown', () => {
        // Start battle music for retry
        AudioManager.getInstance().playBattleMusic(this);
        this.scene.restart();
      });
    }
    
    // Leaderboard button
    const leaderY = result !== 'Victory!' ? buttonY2 : buttonY1;
    const leaderboardButton = this.add.image(width / 2, leaderY, 'leaderboard_btn');
    leaderboardButton.setScale(0.8);
    leaderboardButton.setInteractive({ cursor: 'pointer' });
    
    // Hover effects
    leaderboardButton.on('pointerover', () => {
      leaderboardButton.setScale(0.9);
      leaderboardButton.setTint(0xdddddd);
    });
    
    leaderboardButton.on('pointerout', () => {
      leaderboardButton.setScale(0.8);
      leaderboardButton.clearTint();
    });
    
    leaderboardButton.on('pointerdown', () => {
      // Fade to main menu music when going to leaderboard
      AudioManager.getInstance().fadeToMainMenu(this);
      this.scene.start(SCENES.LEADERBOARD, { user: this.userData, score: this.score, kills: this.kills });
    });
    
    // Main Menu button
    const menuY = result !== 'Victory!' ? buttonY3 : buttonY2;
    const exitButton = this.add.image(width / 2, menuY, 'exit_btn');
    exitButton.setScale(0.8);
    exitButton.setInteractive({ cursor: 'pointer' });
    
    // Hover effects
    exitButton.on('pointerover', () => {
      exitButton.setScale(0.9);
      exitButton.setTint(0xdddddd);
    });
    
    exitButton.on('pointerout', () => {
      exitButton.setScale(0.8);
      exitButton.clearTint();
    });
    
    exitButton.on('pointerdown', () => {
      // Fade to main menu music when going back to home
      AudioManager.getInstance().fadeToMainMenu(this);
      this.scene.start(SCENES.HOME, { user: this.userData });
    });
  }

  update() {
    // Update freeze status and skill button
    if (this.isFreezeActive) {
      const remainingTime = Math.max(0, Math.ceil((this.freezeEndTime - this.time.now) / 1000));
      this.freezeStatusText.setText(`${remainingTime}s`);
    } else {
      this.freezeStatusText.setText('');
    }
    
    // Update damage boost status
    if (this.isDamageBoostActive) {
      const remainingTime = Math.max(0, Math.ceil((this.damageBoostEndTime - this.time.now) / 1000));
      this.damageBoostStatusText.setText(`${remainingTime}s`);
    } else {
      this.damageBoostStatusText.setText('');
    }
    
    // Update all skill button appearances when score changes
    this.updateFreezeSkillAppearance();
    this.updateHealSkillAppearance();
    this.updateDamageBoostSkillAppearance();
    
    // Check projectile collisions with enemies
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const projectile = this.projectiles[i];
      
      for (let j = this.enemies.length - 1; j >= 0; j--) {
        const enemy = this.enemies[j];
        
        // Get enemy-specific hitbox radius and center coordinates
        const enemyTypeKey = (enemy as any).enemyTypeKey || 'SMALL';
        const hitboxRadius = AssetLoader.getEnemyHitboxRadius(enemyTypeKey);
        const hitboxCenter = AssetLoader.getEnemyHitboxCenter(enemy, enemyTypeKey);
        
        const distance = Phaser.Math.Distance.Between(
          projectile.x, projectile.y,
          hitboxCenter.x, hitboxCenter.y
        );
        
        if (distance < hitboxRadius) {
          // Hit! Damage enemy instead of instant kill
          const currentHealth = (enemy as any).currentHealth;
          const enemyType = (enemy as any).enemyType;
          
          (enemy as any).currentHealth -= this.damageMultiplier; // Apply damage multiplier
          
          // Small hit effect
          const hitEffect = this.add.circle(enemy.x, enemy.y, 8, 0xffff00, 0.8);
          this.tweens.add({
            targets: hitEffect,
            scaleX: 1.5,
            scaleY: 1.5,
            alpha: 0,
            duration: 150,
            onComplete: () => hitEffect.destroy()
          });
          
          // Remove projectile
          projectile.destroy();
          this.projectiles.splice(i, 1);
          
          // Check if enemy is dead
          if ((enemy as any).currentHealth <= 0) {
            // Enemy killed!
            this.score += enemyType.score;
            this.kills++;
            
            // Update UI
            this.scoreText.setText(`Score: ${this.score}`);
            this.killsText.setText(`Kills: ${this.kills}`);
            
            // Big explosion effect
            const explosion = this.add.circle(enemy.x, enemy.y, 15, 0xffffff);
            this.tweens.add({
              targets: explosion,
              scaleX: 2,
              scaleY: 2,
              alpha: 0,
              duration: 200,
              onComplete: () => explosion.destroy()
            });
            
            // Check if this was a boss
            if ((enemy as any).isBoss) {
              this.onBossDefeated(enemy);
            }
            
            // Clean up enemy damage timer if it exists
            if ((enemy as any).damageTimer) {
              (enemy as any).damageTimer.destroy();
            }
            
            // Remove enemy
            enemy.destroy();
            this.enemies.splice(j, 1);
            
          } else {
            // Update boss health bar if it's a boss
            if ((enemy as any).isBoss) {
              this.updateBossHealthBar(enemy);
            }
          }
          
          break;
        }
      }
    }
  }
  
  private async submitScore() {
    const { width } = this.cameras.main;
    
    const statusText = this.add.text(width / 2, this.cameras.main.height / 2 + 60, '', {
      fontSize: '14px',
      color: '#ffffff',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 1
    }).setOrigin(0.5);
    
    
    try {
      // Prepare submission data
      const payload = {
        address: this.userData.address,
        username: this.userData.username || 'Anonymous',
        scoreDelta: this.score,        
        txDelta: this.kills,           
        durationMs: this.timeSurvived * 1000,
        cpsMax: 5,
        seed: this.gameSeed,
        timestamp: Date.now(),
      };
      
      // DEBUG: Log payload details
      
      // Submit to backend API
      const response = await fetch('/api/submit-score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...payload,
          signature: 'mock_signature',
        }),
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        const txHash = result.transactionHash;
        
      } else {
        const errorMessage = result.error || result.message || 'Submission failed';
        statusText.setText(`❌ Submission failed:\n${errorMessage}`);
        statusText.setColor('#ef4444');
      }
      
    } catch (error) {
      console.error('❌ Score submission error:', error);
      statusText.setText(`❌ Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      statusText.setColor('#ef4444');
    }
  }
}

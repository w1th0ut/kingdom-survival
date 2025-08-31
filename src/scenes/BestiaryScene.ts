import Phaser from 'phaser';
import { SCENES, type Monster } from '../types/game';
import { AudioManager } from '../utils/AudioManager';

export class BestiaryScene extends Phaser.Scene {
  private userData: any = null;
  private monstersData: Monster[] = [];
  private currentMonsterIndex: number = 0;
  private monsterSprite?: Phaser.GameObjects.Image;
  private nameText?: Phaser.GameObjects.Text;
  private descriptionText?: Phaser.GameObjects.Text;
  private healthText?: Phaser.GameObjects.Text;
  private damageText?: Phaser.GameObjects.Text;
  private counterText?: Phaser.GameObjects.Text;
  private infoPanel?: Phaser.GameObjects.Graphics;

  constructor() {
    super({ key: SCENES.BESTIARY });
  }

  init(data?: any) {
    if (data && data.user) {
      this.userData = data.user;
    }
    this.initMonsterData();
  }

  preload() {
    // Load audio assets
    AudioManager.getInstance().preloadAudio(this);
  }

  create() {
    const { width, height } = this.cameras.main;

    // Play main menu music if not already playing
    const currentMusic = AudioManager.getInstance().getCurrentMusicKey();
    if (currentMusic !== 'main-menu-music') {
      AudioManager.getInstance().playMainMenuMusic(this);
    }

    // Background using bestiary_background.png
    const background = this.add.image(width / 2, height / 2, 'bestiary_background');
    background.setDisplaySize(width, height);

    // Title
    const title = this.add.text(width / 2, 50, 'BESTIARY', {
      fontSize: '36px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);

    // Navigation instructions
    const navigationText = this.add.text(width / 2, 80, 'Click on the monster to view next creature', {
      fontSize: '16px',
      color: '#000000',
    });
    navigationText.setOrigin(0.5);

    // Create static UI elements
    this.createStaticUI();

    // Create back button
    this.createBackButton();

    // Display initial monster
    this.updateMonsterDisplay();
  }

  private initMonsterData() {
    this.monstersData = [
      {
        id: 'small_goblin',
        name: 'Small Goblin',
        description: 'A weak but fast goblin warrior. These creatures are numerous and attack in groups. They move quickly but have low health.',
        health: 4,
        damage: 5,
        sprite: 'small_goblin',
        type: 'SMALL',
        imageScale: 0.4
      },
      {
        id: 'big_goblin',
        name: 'Big Goblin',
        description: 'A larger, stronger variant of the goblin. These creatures have more health and deal more damage than their smaller cousins.',
        health: 10,
        damage: 5,
        sprite: 'big_goblin',
        type: 'LARGE',
        imageScale: 0.5
      },
      {
        id: 'boss_golem',
        name: 'Stone Golem',
        description: 'A massive stone creature animated by dark magic. Very slow but extremely durable with devastating attacks.',
        health: 50,
        damage: 10,
        sprite: 'boss_golem',
        type: 'BOSS',
        imageScale: 0.45,
        xOffset: -50
      },
      {
        id: 'boss_devil',
        name: 'Demon Lord',
        description: 'A powerful demon from the underworld. This boss enemy has incredible strength and magical abilities.',
        health: 50,
        damage: 10,
        sprite: 'boss_devil',
        type: 'BOSS_DEVIL',
        imageScale: 1.3,
        xOffset: -40
      },
      {
        id: 'flying_devil',
        name: 'Flying Demon',
        description: 'A winged demon that attacks from the air. Fast and agile, making it difficult to hit but easier to kill.',
        health: 6,
        damage: 6,
        sprite: 'flying_devil',
        type: 'FLYING_DEVIL',
        imageScale: 1
      }
    ];
  }

  private createStaticUI() {
    const { width, height } = this.cameras.main;
    const panelX = width * 0.65;
    const panelY = height / 2 - 50;

    // Create semi-transparent panel background (static)
    this.infoPanel = this.add.graphics();
    this.infoPanel.fillStyle(0x1a1a2e, 0.9);
    this.infoPanel.fillRoundedRect(panelX - 200, panelY - 150, 400, 300, 10);

    // Monster counter (will be updated later)
    this.counterText = this.add.text(width / 2, height - 120, '', {
      fontSize: '16px',
      color: '#000000',
    });
    this.counterText.setOrigin(0.5);
  }


  private updateMonsterDisplay() {
    const { width, height } = this.cameras.main;
    const currentMonster = this.monstersData[this.currentMonsterIndex];

    // Monster sprite in the center-left area
    if (this.monsterSprite) {
      this.monsterSprite.destroy();
    }
    
    const monsterX = (width / 4) + (currentMonster.xOffset || 0);
    this.monsterSprite = this.add.image(monsterX, height / 2, currentMonster.sprite);
    this.monsterSprite.setScale(currentMonster.imageScale);
    this.monsterSprite.setInteractive({ cursor: 'pointer' });
    
    // Click on monster to cycle through
    this.monsterSprite.on('pointerdown', () => {
      this.nextMonster();
    });

    // Monster information panel on the right side
    const panelX = width * 0.65;
    const panelY = height / 2 - 50;

    // Monster name
    if (this.nameText) {
      this.nameText.destroy();
    }
    this.nameText = this.add.text(panelX, panelY - 120, currentMonster.name, {
      fontSize: '28px',
      color: '#ffd700',
      fontStyle: 'bold',
    });
    this.nameText.setOrigin(0.5);

    // Monster description (word wrapped)
    if (this.descriptionText) {
      this.descriptionText.destroy();
    }
    this.descriptionText = this.add.text(panelX, panelY - 80, currentMonster.description, {
      fontSize: '16px',
      color: '#ffffff',
      wordWrap: { width: 350 },
      align: 'center',
    });
    this.descriptionText.setOrigin(0.5);

    // Health stat
    if (this.healthText) {
      this.healthText.destroy();
    }
    this.healthText = this.add.text(panelX - 100, panelY + 40, `Health: ${currentMonster.health}`, {
      fontSize: '18px',
      color: '#ff6b6b',
      fontStyle: 'bold',
    });
    this.healthText.setOrigin(0.5);

    // Damage stat  
    if (this.damageText) {
      this.damageText.destroy();
    }
    this.damageText = this.add.text(panelX + 100, panelY + 40, `Damage: ${currentMonster.damage}`, {
      fontSize: '18px',
      color: '#ffa726',
      fontStyle: 'bold',
    });
    this.damageText.setOrigin(0.5);

    // Update monster counter
    if (this.counterText) {
      this.counterText.setText(`${this.currentMonsterIndex + 1} / ${this.monstersData.length}`);
    }
  }

  private createBackButton() {
    const { width, height } = this.cameras.main;

    const backButton = this.add.image(width / 2, height - 50, 'exit_btn');
    backButton.setScale(0.8);
    backButton.setInteractive({ cursor: 'pointer' });

    backButton.on('pointerdown', () => {
      this.scene.start(SCENES.HOME, { user: this.userData });
    });

    backButton.on('pointerover', () => {
      backButton.setTint(0xcccccc);
    });

    backButton.on('pointerout', () => {
      backButton.clearTint();
    });
  }

  private nextMonster() {
    this.currentMonsterIndex = (this.currentMonsterIndex + 1) % this.monstersData.length;
    this.updateMonsterDisplay();
  }
}

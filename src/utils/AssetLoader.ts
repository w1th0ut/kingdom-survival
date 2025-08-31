import Phaser from 'phaser';

export class AssetLoader {
  static preloadGameAssets(scene: Phaser.Scene) {
    // Backgrounds
    scene.load.image('game_background', '/assets/images/backgrounds/game_background.png');
    scene.load.image('main_menu', '/assets/images/backgrounds/main_menu.png');
    scene.load.image('leaderboard_background', '/assets/images/backgrounds/leaderboard_background.png');

    // UI Objects
    scene.load.image('fortress', '/assets/images/ui/objects/fortress.png');
    scene.load.image('crystal', '/assets/images/ui/objects/crystal.png');
    scene.load.image('ground', '/assets/images/ui/objects/ground.png');
    scene.load.image('projectile', '/assets/images/ui/objects/projectile.png');

    // UI Buttons
    scene.load.image('continue_btn', '/assets/images/ui/buttons/continue.png');
    scene.load.image('exit_btn', '/assets/images/ui/buttons/exit.png');
    scene.load.image('leaderboard_btn', '/assets/images/ui/buttons/leaderboard.png');
    scene.load.image('play_btn', '/assets/images/ui/buttons/play.png');
    scene.load.image('retry_btn', '/assets/images/ui/buttons/retry.png');

    // Enemy Static Images
    scene.load.image('small_goblin', '/assets/images/enemies/small_goblin.png');
    scene.load.image('big_goblin', '/assets/images/enemies/big_goblin.png');
    scene.load.image('boss_golem', '/assets/images/enemies/boss_golem.png');
    scene.load.image('boss_devil', '/assets/images/enemies/boss_devil.png');
    scene.load.image('flying_devil', '/assets/images/enemies/flying_devil.png');

    // Small Goblin Walk Animation
    scene.load.image('small_goblin_walk1', '/assets/images/effects/small_monster_walk/small_goblin_animation.png');
    scene.load.image('small_goblin_walk2', '/assets/images/effects/small_monster_walk/small_goblin_animation2.png');
    scene.load.image('small_goblin_walk3', '/assets/images/effects/small_monster_walk/small_goblin_animation3.png');
    scene.load.image('small_goblin_walk4', '/assets/images/effects/small_monster_walk/small_goblin_animation4.png');

    // Small Goblin Attack Animation
    scene.load.image('small_goblin_attack1', '/assets/images/effects/small_goblin_attack/small_goblin_attack.png');
    scene.load.image('small_goblin_attack2', '/assets/images/effects/small_goblin_attack/small_goblin_attack2.png');
    scene.load.image('small_goblin_attack3', '/assets/images/effects/small_goblin_attack/small_goblin_attack3.png');
    scene.load.image('small_goblin_attack4', '/assets/images/effects/small_goblin_attack/small_goblin_attack4.png');

    // Big Goblin Walk Animation
    scene.load.image('big_goblin_walk1', '/assets/images/effects/big_goblin_walk/big_goblin_walk.png');
    scene.load.image('big_goblin_walk2', '/assets/images/effects/big_goblin_walk/big_goblin_walk2.png');
    scene.load.image('big_goblin_walk3', '/assets/images/effects/big_goblin_walk/big_goblin_walk3.png');
    scene.load.image('big_goblin_walk4', '/assets/images/effects/big_goblin_walk/big_goblin_walk4.png');

    // Big Goblin Attack Animation
    scene.load.image('big_goblin_attack1', '/assets/images/effects/big_goblin_attack/big_goblin_attack.png');
    scene.load.image('big_goblin_attack2', '/assets/images/effects/big_goblin_attack/big_goblin_attack2.png');
    scene.load.image('big_goblin_attack3', '/assets/images/effects/big_goblin_attack/big_goblin_attack3.png');
    scene.load.image('big_goblin_attack4', '/assets/images/effects/big_goblin_attack/big_goblin_attack4.png');

    // Boss Golem Walk Animation
    scene.load.image('golem_walk1', '/assets/images/effects/golem_walk/golem_walk.png');
    scene.load.image('golem_walk2', '/assets/images/effects/golem_walk/golem_walk2.png');
    scene.load.image('golem_walk3', '/assets/images/effects/golem_walk/golem_walk3.png');
    scene.load.image('golem_walk4', '/assets/images/effects/golem_walk/golem_walk4.png');

    // Boss Golem Attack Animation
    scene.load.image('golem_attack1', '/assets/images/effects/golem_attack/golem_attack.png');
    scene.load.image('golem_attack2', '/assets/images/effects/golem_attack/golem_attack2.png');
    scene.load.image('golem_attack3', '/assets/images/effects/golem_attack/golem_attack3.png');
    scene.load.image('golem_attack4', '/assets/images/effects/golem_attack/golem_attack4.png');

    // Boss Devil Walk Animation
    scene.load.image('devil_walk1', '/assets/images/effects/devil_walk/devil_walk.png');
    scene.load.image('devil_walk2', '/assets/images/effects/devil_walk/devil_walk2.png');
    scene.load.image('devil_walk3', '/assets/images/effects/devil_walk/devil_walk3.png');
    scene.load.image('devil_walk4', '/assets/images/effects/devil_walk/devil_walk4.png');

    // Boss Devil Attack Animation
    scene.load.image('devil_attack1', '/assets/images/effects/devil_attack/devil_attack.png');
    scene.load.image('devil_attack2', '/assets/images/effects/devil_attack/devil_attack2.png');
    scene.load.image('devil_attack3', '/assets/images/effects/devil_attack/devil_attack3.png');
    scene.load.image('devil_attack4', '/assets/images/effects/devil_attack/devil_attack4.png');

    // Flying Devil Fly Animation
    scene.load.image('flying_devil_fly1', '/assets/images/effects/flying_devil_fly/flying_devil.png');
    scene.load.image('flying_devil_fly2', '/assets/images/effects/flying_devil_fly/flying_devil2.png');
    scene.load.image('flying_devil_fly3', '/assets/images/effects/flying_devil_fly/flying_devil3.png');
    scene.load.image('flying_devil_fly4', '/assets/images/effects/flying_devil_fly/flying_devil4.png');

    // Flying Devil Attack Animation
    scene.load.image('flying_devil_attack1', '/assets/images/effects/flying_devil_attack/flying_devil.png');
    scene.load.image('flying_devil_attack2', '/assets/images/effects/flying_devil_attack/flying_devil2.png');
    scene.load.image('flying_devil_attack3', '/assets/images/effects/flying_devil_attack/flying_devil3.png');
    scene.load.image('flying_devil_attack4', '/assets/images/effects/flying_devil_attack/flying_devil4.png');

    // Crystal Animation
    scene.load.image('crystal_anim1', '/assets/images/effects/crystal/crystal_animation.png');
    scene.load.image('crystal_anim2', '/assets/images/effects/crystal/crystal_animation1.png');
    scene.load.image('crystal_anim3', '/assets/images/effects/crystal/crystal_animation2.png');
    scene.load.image('crystal_anim4', '/assets/images/effects/crystal/crystal_animation3.png');
  }

  static createAnimations(scene: Phaser.Scene) {
    // Small Goblin Walking Animation (mirrored to left)
    scene.anims.create({
      key: 'small_goblin_walking',
      frames: [
        { key: 'small_goblin_walk1' },
        { key: 'small_goblin_walk2' },
        { key: 'small_goblin_walk3' },
        { key: 'small_goblin_walk4' }
      ],
      frameRate: 8,
      repeat: -1
    });

    // Small Goblin Attack Animation (mirrored to left)
    scene.anims.create({
      key: 'small_goblin_attacking',
      frames: [
        { key: 'small_goblin_attack1' },
        { key: 'small_goblin_attack2' },
        { key: 'small_goblin_attack3' },
        { key: 'small_goblin_attack4' }
      ],
      frameRate: 6,
      repeat: -1
    });

    // Big Goblin Walking Animation (mirrored to left)
    scene.anims.create({
      key: 'big_goblin_walking',
      frames: [
        { key: 'big_goblin_walk1' },
        { key: 'big_goblin_walk2' },
        { key: 'big_goblin_walk3' },
        { key: 'big_goblin_walk4' }
      ],
      frameRate: 7,
      repeat: -1
    });

    // Big Goblin Attack Animation (mirrored to left)
    scene.anims.create({
      key: 'big_goblin_attacking',
      frames: [
        { key: 'big_goblin_attack1' },
        { key: 'big_goblin_attack2' },
        { key: 'big_goblin_attack3' },
        { key: 'big_goblin_attack4' }
      ],
      frameRate: 5,
      repeat: -1
    });

    // Boss Golem Walking Animation (mirrored to left)
    scene.anims.create({
      key: 'golem_walking',
      frames: [
        { key: 'golem_walk1' },
        { key: 'golem_walk2' },
        { key: 'golem_walk3' },
        { key: 'golem_walk4' }
      ],
      frameRate: 6,
      repeat: -1
    });

    // Boss Golem Attack Animation (mirrored to left)
    scene.anims.create({
      key: 'golem_attacking',
      frames: [
        { key: 'golem_attack1' },
        { key: 'golem_attack2' },
        { key: 'golem_attack3' },
        { key: 'golem_attack4' }
      ],
      frameRate: 4,
      repeat: -1
    });

    // Boss Devil Walking Animation (mirrored to left)
    scene.anims.create({
      key: 'devil_walking',
      frames: [
        { key: 'devil_walk1' },
        { key: 'devil_walk2' },
        { key: 'devil_walk3' },
        { key: 'devil_walk4' }
      ],
      frameRate: 6,
      repeat: -1
    });

    // Boss Devil Attack Animation (mirrored to left)
    scene.anims.create({
      key: 'devil_attacking',
      frames: [
        { key: 'devil_attack1' },
        { key: 'devil_attack2' },
        { key: 'devil_attack3' },
        { key: 'devil_attack4' }
      ],
      frameRate: 5,
      repeat: -1
    });

    // Flying Devil Fly Animation (mirrored to left)
    scene.anims.create({
      key: 'flying_devil_flying',
      frames: [
        { key: 'flying_devil_fly1' },
        { key: 'flying_devil_fly2' },
        { key: 'flying_devil_fly3' },
        { key: 'flying_devil_fly4' }
      ],
      frameRate: 8,
      repeat: -1
    });

    // Flying Devil Attack Animation (menggunakan frames khusus attack)
    scene.anims.create({
      key: 'flying_devil_attacking',
      frames: [
        { key: 'flying_devil_attack1' },
        { key: 'flying_devil_attack2' },
        { key: 'flying_devil_attack3' },
        { key: 'flying_devil_attack4' }
      ],
      frameRate: 12, // Lebih cepat saat menyerang
      repeat: -1
    });

    // Crystal Animation
    scene.anims.create({
      key: 'crystal_glowing',
      frames: [
        { key: 'crystal_anim1' },
        { key: 'crystal_anim2' },
        { key: 'crystal_anim3' },
        { key: 'crystal_anim4' }
      ],
      frameRate: 10,
      repeat: -1
    });
  }

  // Helper function to calculate ground level based on image
  static getGroundLevel(scene: Phaser.Scene): number {
    const { height } = scene.cameras.main;
    // Assuming ground image height is about 100 pixels
    return height - 50; // Center of ground area
  }

  // Enemy configuration with individual positioning and scaling
  static enemyConfig = {
    SMALL: {
      scale: 0.2,
      groundOffset: 100, // Ketinggian dari ground level untuk monster kecil
      hitboxRadius: 40, // Radius hitbox untuk collision detection
      hitboxOffsetX: 0, // Offset X koordinat hitbox dari center sprite (pixel)
      hitboxOffsetY: 30, // Offset Y koordinat hitbox dari center sprite (pixel)
    },
    LARGE: {
      scale: 0.3,
      groundOffset: 140, // Ketinggian dari ground level untuk monster besar
      hitboxRadius: 60, // Radius hitbox untuk collision detection
      hitboxOffsetX: 0, // Offset X koordinat hitbox dari center sprite (pixel)
      hitboxOffsetY: 30, // Offset Y koordinat hitbox dari center sprite (pixel)
    },
    BOSS: {
      scale: 0.4,
      groundOffset: 150, // Ketinggian dari ground level untuk boss
      hitboxRadius: 100, // Radius hitbox untuk collision detection
      hitboxOffsetX: 0, // Offset X koordinat hitbox dari center sprite (pixel)
      hitboxOffsetY: -5, // Offset Y koordinat hitbox dari center sprite (sedikit ke atas)
    },
    BOSS_DEVIL: {
      scale: 0.7,
      groundOffset: 150, // Ketinggian dari ground level untuk boss devil
      hitboxRadius: 100, // Radius hitbox untuk collision detection
      hitboxOffsetX: 0, // Offset X koordinat hitbox dari center sprite (pixel)
      hitboxOffsetY: -5, // Offset Y koordinat hitbox dari center sprite (sedikit ke atas)
    },
    FLYING_DEVIL: {
      scale: 1,
      groundOffset: 400, // Terbang tinggi di udara, jauh dari ground
      hitboxRadius: 60, // Diperbesar hitbox dari 50 menjadi 60
      hitboxOffsetX: 0, // Offset X koordinat hitbox dari center sprite (pixel)
      hitboxOffsetY: 0, // Offset Y koordinat hitbox dari center sprite (pixel)
    }
  };

  // Helper function to get enemy ground position based on enemy type
  static getEnemyGroundY(scene: Phaser.Scene, enemyType: string): number {
    const groundLevel = this.getGroundLevel(scene);
    const config = this.enemyConfig[enemyType as keyof typeof this.enemyConfig];
    
    if (!config) {
      console.warn(`Enemy type ${enemyType} not found in config, using default offset`);
      return groundLevel - 30;
    }
    
    return groundLevel - config.groundOffset;
  }

  // Helper function to get enemy scale
  static getEnemyScale(enemyType: string): number {
    const config = this.enemyConfig[enemyType as keyof typeof this.enemyConfig];
    
    if (!config) {
      console.warn(`Enemy type ${enemyType} not found in config, using default scale`);
      return 0.3;
    }
    
    return config.scale;
  }

  // Helper function to get enemy hitbox radius
  static getEnemyHitboxRadius(enemyType: string): number {
    const config = this.enemyConfig[enemyType as keyof typeof this.enemyConfig];
    
    if (!config) {
      console.warn(`Enemy type ${enemyType} not found in config, using default hitbox radius`);
      return 25;
    }
    
    return config.hitboxRadius;
  }

  // Helper function to get enemy hitbox X offset
  static getEnemyHitboxOffsetX(enemyType: string): number {
    const config = this.enemyConfig[enemyType as keyof typeof this.enemyConfig];
    
    if (!config) {
      console.warn(`Enemy type ${enemyType} not found in config, using default hitbox offset X`);
      return 0;
    }
    
    return config.hitboxOffsetX;
  }

  // Helper function to get enemy hitbox Y offset
  static getEnemyHitboxOffsetY(enemyType: string): number {
    const config = this.enemyConfig[enemyType as keyof typeof this.enemyConfig];
    
    if (!config) {
      console.warn(`Enemy type ${enemyType} not found in config, using default hitbox offset Y`);
      return 0;
    }
    
    return config.hitboxOffsetY;
  }

  // Helper function to get enemy hitbox center coordinates
  static getEnemyHitboxCenter(enemy: Phaser.GameObjects.Sprite, enemyType: string): { x: number, y: number } {
    const offsetX = this.getEnemyHitboxOffsetX(enemyType);
    const offsetY = this.getEnemyHitboxOffsetY(enemyType);
    
    return {
      x: enemy.x + offsetX,
      y: enemy.y + offsetY
    };
  }
}

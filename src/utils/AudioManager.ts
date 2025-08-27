export class AudioManager {
  private static instance: AudioManager;
  private currentMusic: Phaser.Sound.BaseSound | null = null;
  private isMusicEnabled: boolean = true;
  private musicVolume: number = 0.6;
  
  // Track paths
  private readonly MUSIC_PATHS = {
    MAIN_MENU: '/assets/sounds/main-menu.mp3',
    BATTLE: '/assets/sounds/battle.mp3',
    GAME_OVER: '/assets/sounds/game-over.mp3'
  };

  private constructor() {}

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  /**
   * Preload all audio files
   */
  public preloadAudio(scene: Phaser.Scene): void {
    scene.load.audio('main-menu-music', this.MUSIC_PATHS.MAIN_MENU);
    scene.load.audio('battle-music', this.MUSIC_PATHS.BATTLE);
    scene.load.audio('game-over-music', this.MUSIC_PATHS.GAME_OVER);
  }

  /**
   * Play background music with looping
   */
  public playMusic(scene: Phaser.Scene, musicKey: string, loop: boolean = true): void {
    if (!this.isMusicEnabled) {
      return;
    }

    // Stop current music if playing
    this.stopMusic();

    try {
      // Check if audio exists in cache
      if (!scene.cache.audio.exists(musicKey)) {
        return;
      }

      // Create and play new music
      this.currentMusic = scene.sound.add(musicKey, {
        volume: this.musicVolume,
        loop: loop
      });

      // Add error handling for play
      this.currentMusic.on('complete', () => {
        if (!loop) {
          this.currentMusic = null;
        }
      });

      this.currentMusic.play();
      
    } catch (error) {
      console.error(`Failed to play music: ${musicKey}`, error);
    }
  }

  /**
   * Stop current music
   */
  public stopMusic(): void {
    if (this.currentMusic) {
      this.currentMusic.stop();
      this.currentMusic.destroy();
      this.currentMusic = null;
    }
  }

  /**
   * Fade out current music and play new music
   */
  public fadeToMusic(scene: Phaser.Scene, musicKey: string, loop: boolean = true, fadeDuration: number = 1000): void {
    if (!this.isMusicEnabled) {
      return;
    }

    if (this.currentMusic && this.currentMusic.isPlaying) {
      const currentMusicRef = this.currentMusic;
      
      // Fade out current music
      scene.tweens.add({
        targets: currentMusicRef,
        volume: 0,
        duration: fadeDuration,
        onComplete: () => {
          this.stopMusic();
          // Play new music after fade out
          setTimeout(() => {
            this.playMusic(scene, musicKey, loop);
          }, 100); // Small delay to ensure clean transition
        }
      });
    } else {
      // No current music, just play new music
      this.playMusic(scene, musicKey, loop);
    }
  }

  /**
   * Play main menu music (looped)
   */
  public playMainMenuMusic(scene: Phaser.Scene): void {
    this.playMusic(scene, 'main-menu-music', true);
  }

  /**
   * Play battle music (looped)
   */
  public playBattleMusic(scene: Phaser.Scene): void {
    this.playMusic(scene, 'battle-music', true);
  }

  /**
   * Play game over music (once)
   */
  public playGameOverMusic(scene: Phaser.Scene): void {
    this.playMusic(scene, 'game-over-music', false);
  }

  /**
   * Immediately stop current music and play game over music (for game over scenario)
   */
  public playGameOverMusicImmediately(scene: Phaser.Scene): void {
    // Stop current music immediately without fade
    this.stopMusic();
    
    // Small delay to ensure clean audio transition
    setTimeout(() => {
      this.playGameOverMusic(scene);
    }, 100);
  }

  /**
   * Fade from battle music to game over music (legacy method, use playGameOverMusicImmediately instead)
   */
  public fadeFromBattleToGameOver(scene: Phaser.Scene): void {
    this.playGameOverMusicImmediately(scene);
  }

  /**
   * Fade from any music to main menu music
   */
  public fadeToMainMenu(scene: Phaser.Scene): void {
    this.fadeToMusic(scene, 'main-menu-music', true, 1000);
  }

  /**
   * Fade from main menu to battle music
   */
  public fadeFromMainMenuToBattle(scene: Phaser.Scene): void {
    this.fadeToMusic(scene, 'battle-music', true, 1000);
  }

  /**
   * Set music volume (0-1)
   */
  public setMusicVolume(volume: number): void {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    if (this.currentMusic) {
      (this.currentMusic as any).volume = this.musicVolume;
    }
  }

  /**
   * Toggle music on/off
   */
  public toggleMusic(): void {
    this.isMusicEnabled = !this.isMusicEnabled;
    
    if (!this.isMusicEnabled) {
      this.stopMusic();
    }
  }

  /**
   * Check if music is currently playing
   */
  public isMusicPlaying(): boolean {
    return this.currentMusic !== null && this.currentMusic.isPlaying;
  }

  /**
   * Get current playing music key
   */
  public getCurrentMusicKey(): string | null {
    if (this.currentMusic) {
      return (this.currentMusic as any).key || null;
    }
    return null;
  }

  /**
   * Clean up resources (call this when shutting down)
   */
  public destroy(): void {
    this.stopMusic();
  }
}

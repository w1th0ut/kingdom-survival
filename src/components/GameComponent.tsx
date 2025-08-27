import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { HomeScene } from '../scenes/HomeScene';
import { TowerDefenseScene } from '../scenes/TowerDefenseScene';
import { ResultsScene } from '../scenes/ResultsScene';
import { LeaderboardScene } from '../scenes/LeaderboardScene';
import { GAME_CONFIG } from '../lib/game-config';

interface GameComponentProps {
  user?: any;
}

export function GameComponent({ user }: GameComponentProps) {
  const gameRef = useRef<Phaser.Game | null>(null);
  const [isReady, setIsReady] = React.useState(false);
  const homeSceneRef = useRef<HomeScene | null>(null);

  useEffect(() => {
    // Set ready after a short delay to ensure DOM is ready
    const timer = setTimeout(() => setIsReady(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isReady) return;

    // Create Phaser game config
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: GAME_CONFIG.CANVAS.WIDTH,
      height: GAME_CONFIG.CANVAS.HEIGHT,
      parent: 'phaser-game',
      backgroundColor: '#1a1a2e',
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: false,
        },
      },
        scene: [HomeScene, TowerDefenseScene, ResultsScene, LeaderboardScene],
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
    };

    // Create the game instance
    if (!gameRef.current) {
      gameRef.current = new Phaser.Game(config);
      
      // Store reference to HomeScene after a small delay to ensure scenes are ready
      setTimeout(() => {
        const homeScene = gameRef.current?.scene.getScene('HomeScene') as HomeScene;
        if (homeScene) {
          homeSceneRef.current = homeScene;
          // If we already have user data, update it immediately
          if (user) {
            homeScene.updateUser(user);
          }
        }
      }, 500);
    }

    // Cleanup on unmount
    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
        homeSceneRef.current = null;
      }
    };
  }, [isReady, user]);
  
  // Update HomeScene when user data changes
  useEffect(() => {
    if (homeSceneRef.current && user) {
      homeSceneRef.current.updateUser(user);
    }
  }, [user]);

  return (
    <div className="game-container">
      <div id="phaser-game" className="game-canvas" />
      {!isReady && (
        <div className="loading-overlay">
          <div className="loading-spinner">Loading...</div>
        </div>
      )}
    </div>
  );
}

import React from 'react';
import { Toaster } from 'react-hot-toast';
import { GameComponent } from './components/GameComponent';
import { AuthComponent } from './components/AuthComponent';
// Initialize wallet setup tools for browser console access
import './utils/wallet-setup';
import './utils/transaction-monitor';
import './App.css';

export function App() {
  const [user, setUser] = React.useState<any>(null);

  const handleUserChange = (userData: any) => {
    setUser(userData);
  };

  return (
    <div className="app" suppressHydrationWarning={true}>
      <header className="app-header">
        <div className="container">
          <h1 className="app-title">Kingdom Survival</h1>
          <div className="auth-section" suppressHydrationWarning={true}>
            <AuthComponent onUserChange={handleUserChange} />
          </div>
        </div>
      </header>

      <main className="app-main">
        <div className="container">
          <GameComponent user={user} />
        </div>
      </main>

      <footer className="app-footer">
        <div className="container">
          <p className="footer-text">
            Made by <a href="https://github.com/w1th0ut">@w1th0ut</a> 💜 • Powered by Monad Games ID
          </p>
          <div className="footer-links">
            <a 
              href="https://monad-games-id-site.vercel.app/leaderboard?page=1&gameId=219&sortBy=scores" 
              target="_blank" 
              rel="noopener noreferrer"
              className="footer-link"
            >
              Public Leaderboard
            </a>
          </div>
        </div>
      </footer>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1e1b4b',
            color: '#ffffff',
            border: '1px solid #4338ca',
          },
          success: {
            iconTheme: {
              primary: '#4ade80',
              secondary: '#ffffff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#ffffff',
            },
          },
        }}
      />
    </div>
  );
}

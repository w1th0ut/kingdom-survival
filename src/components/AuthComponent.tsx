import React, { useEffect, useState } from 'react';
import { usePrivy, CrossAppAccountWithMetadata } from '@privy-io/react-auth';
import { MONAD_GAMES_CROSS_APP_ID } from '../lib/game-config';

interface AuthComponentProps {
  onUserChange?: (user: any) => void;
}

export function AuthComponent({ onUserChange }: AuthComponentProps) {
  const [isClient, setIsClient] = useState(false);
  const [accountAddress, setAccountAddress] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [hasUsername, setHasUsername] = useState<boolean>(false);
  
  // Always use real Privy - no more mock mode
  const privyAuth = usePrivy();
  

  // Fix hydration mismatch by ensuring client-side rendering
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Get Monad Games ID wallet address and username according to docs
  React.useEffect(() => {
    const getMonadGamesData = async () => {
      if (privyAuth.authenticated && privyAuth.user && privyAuth.ready && isClient) {
        // Check if user has linkedAccounts
        if (privyAuth.user.linkedAccounts.length > 0) {
          // Get the cross app account created using Monad Games ID
          const crossAppAccount: CrossAppAccountWithMetadata = privyAuth.user.linkedAccounts.filter(
            account => account.type === 'cross_app' && account.providerApp.id === MONAD_GAMES_CROSS_APP_ID
          )[0] as CrossAppAccountWithMetadata;
          
          if (crossAppAccount && crossAppAccount.embeddedWallets.length > 0) {
            const walletAddress = crossAppAccount.embeddedWallets[0].address;
            
            // Only update if address changed to prevent infinite loop
            if (walletAddress !== accountAddress) {
              setAccountAddress(walletAddress);
              
              // Get username from Monad Games ID API only for new address
              try {
                const response = await fetch(`https://monad-games-id-site.vercel.app/api/check-wallet?wallet=${walletAddress}`);
                const data = await response.json();
                
                if (data.hasUsername) {
                  setUsername(data.user.username);
                  setHasUsername(true);
                } else {
                  setUsername('');
                  setHasUsername(false);
                }
              } catch (error) {
                console.error('Error fetching username:', error);
                setUsername('');
                setHasUsername(false);
              }
            }
          } else {
            console.warn('No Monad Games ID cross-app account found');
          }
        } else {
          console.warn('You need to link your Monad Games ID account to continue.');
        }
      }
    };
    
    getMonadGamesData();
  }, [isClient, privyAuth.authenticated, privyAuth.ready, privyAuth.user?.id, accountAddress]);
  
  // Send user data to parent component
  React.useEffect(() => {
    if (onUserChange && isClient) {
      if (privyAuth.authenticated && accountAddress) {
        const realUser = {
          id: privyAuth.user?.id,
          address: accountAddress, // Use Monad Games ID wallet address
          username: username,
          hasUsername: hasUsername,
          isLoading: false,
        };
        onUserChange(realUser);
      } else if (!privyAuth.authenticated) {
        onUserChange(null);
      }
    }
  }, [isClient, privyAuth.authenticated, accountAddress, username, hasUsername]);

  const handleLogin = () => {
    privyAuth.login();
  };

  const handleLogout = () => {
    privyAuth.logout();
  };

  const openMonadGamesId = () => {
    window.open('https://monad-games-id-site.vercel.app/', '_blank');
  };

  // Show loading while client is initializing or Privy is not ready
  if (!isClient || !privyAuth.ready) {
    return (
      <div className="auth-component">
        <div className="loading">Loading authentication...</div>
      </div>
    );
  }
  
  if (!privyAuth.authenticated) {
    return (
      <div className="auth-component">
        <button 
          onClick={handleLogin}
          className="login-btn"
        >
          🎮 Sign in with Monad Games ID
        </button>
      </div>
    );
  }

  return (
    <div className="auth-component">
      <div className="user-info">
        {hasUsername && username ? (
          <div className="welcome">
            Welcome, <strong>{username}</strong>!
          </div>
        ) : (
          <div className="no-username">
            <div className="address">
              Connected: {accountAddress ? 
                `${accountAddress.slice(0, 6)}...${accountAddress.slice(-4)}` :
                'Connecting to Monad Games ID...'
              }
            </div>
            {accountAddress && (
              <button 
                onClick={openMonadGamesId}
                className="register-username-btn"
              >
                Register Username
              </button>
            )}
          </div>
        )}
        
        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </div>
    </div>
  );
}

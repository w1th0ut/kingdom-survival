import { usePrivy } from '@privy-io/react-auth';
import { useEffect, useState } from 'react';

interface MonadGamesUser {
  address?: string;
  username?: string;
  hasUsername: boolean;
  isLoading: boolean;
  error?: string;
}

export function useMonadGamesUser(): MonadGamesUser {
  // Try to detect if we're using mock provider
  const isMockMode = !import.meta.env.VITE_PRIVY_APP_ID || import.meta.env.VITE_PRIVY_APP_ID === 'your-privy-app-id-here';
  
  let privyData;
  let mockData;
  
  try {
    privyData = usePrivy();
  } catch {
    // usePrivy failed, we're in mock mode
  }
  
  const { user, authenticated, ready } = isMockMode && mockData ? mockData : privyData || { user: null, authenticated: false, ready: true };
  
  const [userState, setUserState] = useState<MonadGamesUser>({
    isLoading: true,
    hasUsername: false,
  });

  useEffect(() => {
    if (!ready) {
      return;
    }

    if (!authenticated || !user) {
      setUserState({
        isLoading: false,
        hasUsername: false,
      });
      return;
    }

    const fetchUserData = async () => {
      try {
        setUserState(prev => ({ ...prev, isLoading: true }));

        // For development, skip cross-app check and get wallet address directly
        const wallet = user.wallet;
        const address = wallet?.address;

        if (!address) {
          setUserState({
            isLoading: false,
            hasUsername: false,
            error: 'No embedded wallet address found',
          });
          return;
        }

        // Check if user has username registered in Monad Games ID
        const response = await fetch(
          `https://monad-games-id-site.vercel.app/api/check-wallet?wallet=${address}`
        );
        
        if (!response.ok) {
          throw new Error('Failed to check username');
        }

        const data = await response.json();
        
        setUserState({
          isLoading: false,
          address,
          username: data.hasUsername ? data.username : undefined,
          hasUsername: data.hasUsername,
        });
      } catch (error) {
        console.error('Error fetching user data:', error);
        setUserState({
          isLoading: false,
          hasUsername: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    };

    fetchUserData();
  }, [user, authenticated, ready]);

  return userState;
}

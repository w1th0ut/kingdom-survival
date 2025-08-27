import React from 'react';
import { PrivyProvider } from '@privy-io/react-auth';
import { MONAD_GAMES_CROSS_APP_ID } from '../lib/game-config';

interface AppPrivyProviderProps {
  children: React.ReactNode;
}

export function AppPrivyProvider({ children }: AppPrivyProviderProps) {
  const privyAppId = import.meta.env.VITE_PRIVY_APP_ID;

  if (!privyAppId) {
    throw new Error('VITE_PRIVY_APP_ID is required. Please set it in your .env file.');
  }

  return (
    <PrivyProvider
      appId={privyAppId}
      config={{
        loginMethodsAndOrder: {
          // Don't forget to enable Monad Games ID support in:
          // Global Wallet > Integrations > Monad Games ID (click on the slide to enable)
          primary: [`privy:${MONAD_GAMES_CROSS_APP_ID}`, 'email', 'detected_ethereum_wallets'], // Monad Games ID first, then fallback options
        },
        appearance: {
          theme: 'dark',
          accentColor: '#6366f1',
          showWalletLoginFirst: false,
        },
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
          requireUserPasswordOnCreate: false,
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}

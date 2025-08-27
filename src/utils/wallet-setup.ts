import { DirectBlockchainSubmissionService } from '../lib/direct-blockchain-submission';
import type { DirectSubmissionConfig } from '../lib/direct-blockchain-submission';

export class WalletSetup {
  /**
   * Generate a new wallet for development purposes
   */
  static generateNewWallet(): {
    address: string;
    privateKey: string;
    mnemonic: string;
    setupInstructions: string[];
  } {
    const walletInfo = DirectBlockchainSubmissionService.createNewWallet();
    
    const instructions = [
      '🎯 New wallet generated successfully!',
      '',
      '📋 Setup Instructions:',
      '1. Copy the private key below to your .env file',
      '2. Add this line to .env: VITE_USER_PRIVATE_KEY=' + walletInfo.privateKey,
      '3. Get MON tokens from the faucet: https://testnet-faucet.monad.xyz',
      '4. Use this address to request tokens: ' + walletInfo.address,
      '5. Wait for tokens to arrive (usually takes 2-5 minutes)',
      '6. Test your setup using the validateConfiguration() function',
      '',
      '⚠️  SECURITY WARNING:',
      '- NEVER share your private key with anyone',
      '- NEVER commit your .env file to version control',
      '- This wallet is for TESTNET only, never use on mainnet',
      '',
      '💾 Save this mnemonic phrase securely:',
      '"' + walletInfo.mnemonic + '"',
    ];
    
    return {
      ...walletInfo,
      setupInstructions: instructions,
    };
  }

  /**
   * Validate the current wallet configuration
   */
  static async validateConfiguration(): Promise<{
    isValid: boolean;
    status: string;
    details: any;
    issues: string[];
    suggestions: string[];
  }> {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let status = '';
    let details: any = {};

    try {
      // Check environment variables
      const privateKey = import.meta.env.VITE_USER_PRIVATE_KEY;
      const rpcUrl = import.meta.env.VITE_MONAD_RPC_URL;
      const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;

      if (!privateKey) {
        issues.push('VITE_USER_PRIVATE_KEY is not set in .env file');
        suggestions.push('Add VITE_USER_PRIVATE_KEY=your_private_key to your .env file');
      } else if (privateKey === 'your_user_private_key_here') {
        issues.push('VITE_USER_PRIVATE_KEY is set to default placeholder value');
        suggestions.push('Replace the placeholder with your actual private key');
      }

      if (!rpcUrl) {
        issues.push('VITE_MONAD_RPC_URL is not set');
        suggestions.push('Add VITE_MONAD_RPC_URL=https://testnet-rpc.monad.xyz to your .env file');
      }

      if (!contractAddress) {
        issues.push('VITE_CONTRACT_ADDRESS is not set');
        suggestions.push('Add VITE_CONTRACT_ADDRESS=0xceCBFF203C8B6044F52CE23D914A1bfD997541A4 to your .env file');
      }

      // If we have a private key, validate the wallet
      if (privateKey && privateKey !== 'your_user_private_key_here') {
        const config: DirectSubmissionConfig = {
          privateKey,
          rpcUrl,
          contractAddress,
        };

        const walletValidation = await DirectBlockchainSubmissionService.validateWallet(config);
        details.wallet = walletValidation;

        if (!walletValidation.isValid) {
          issues.push(walletValidation.error || 'Wallet validation failed');
          
          if (walletValidation.balance && parseFloat(walletValidation.balance) < 0.01) {
            suggestions.push('Get MON tokens from https://testnet-faucet.monad.xyz');
            suggestions.push(`Send tokens to: ${walletValidation.address}`);
          }
        } else {
          status = `✅ Wallet ready! Balance: ${walletValidation.balance} MON`;
        }

        // Get network information
        try {
          const networkInfo = await DirectBlockchainSubmissionService.getNetworkInfo(rpcUrl);
          details.network = networkInfo;
        } catch (networkError) {
          issues.push('Unable to connect to Monad network');
          suggestions.push('Check your internet connection and RPC URL');
        }
      }

      const isValid = issues.length === 0;
      
      if (!status) {
        status = isValid ? '✅ Configuration is valid and ready to use!' : '❌ Configuration issues found';
      }

      return {
        isValid,
        status,
        details,
        issues,
        suggestions,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown validation error';
      
      return {
        isValid: false,
        status: '❌ Validation failed',
        details: { error: errorMessage },
        issues: ['Validation error: ' + errorMessage],
        suggestions: ['Check your .env file configuration and try again'],
      };
    }
  }

  /**
   * Print setup instructions to console
   */
  static printSetupInstructions(): void {
    // Setup instructions removed - debug logging no longer needed
  }

  /**
   * Get faucet information and instructions
   */
  static getFaucetInfo(): {
    faucetUrl: string;
    instructions: string[];
    tips: string[];
  } {
    return {
      faucetUrl: 'https://testnet-faucet.monad.xyz',
      instructions: [
        '1. Visit https://testnet-faucet.monad.xyz',
        '2. Connect your wallet or enter your address',
        '3. Complete any required verification (if prompted)',
        '4. Request MON tokens',
        '5. Wait 2-5 minutes for tokens to arrive',
        '6. Check your balance on the explorer: https://testnet-explorer.monad.xyz',
      ],
      tips: [
        '💡 You typically get 1-10 MON tokens per request',
        '💡 This is usually enough for 100-1000 transactions',
        '💡 Each score submission uses ~21,000-50,000 gas',
        '💡 If the faucet is rate-limited, try again in a few hours',
        '💡 You can also ask for tokens in the Monad Discord community',
      ],
    };
  }

  /**
   * Get troubleshooting guide
   */
  static getTroubleshootingGuide(): {
    category: string;
    issues: Array<{
      problem: string;
      solutions: string[];
    }>;
  }[] {
    return [
      {
        category: 'Environment Configuration',
        issues: [
          {
            problem: 'Private key not set or using placeholder value',
            solutions: [
              'Generate a new wallet using WalletSetup.generateNewWallet()',
              'Copy the private key to your .env file',
              'Make sure it starts with 0x and is 66 characters long',
            ],
          },
          {
            problem: 'RPC URL connection issues',
            solutions: [
              'Verify VITE_MONAD_RPC_URL=https://testnet-rpc.monad.xyz in .env',
              'Check your internet connection',
              'Try restarting your development server',
            ],
          },
        ],
      },
      {
        category: 'Wallet Balance',
        issues: [
          {
            problem: 'Insufficient MON balance',
            solutions: [
              'Visit https://testnet-faucet.monad.xyz to get tokens',
              'Wait 5-10 minutes after requesting tokens',
              'Check balance on https://testnet-explorer.monad.xyz',
              'Try requesting tokens again if balance is still 0',
            ],
          },
          {
            problem: 'Tokens not arriving from faucet',
            solutions: [
              'Double-check your wallet address is correct',
              'Wait longer (sometimes takes 10-15 minutes)',
              'Try a different wallet address',
              'Ask for help in the Monad Discord community',
            ],
          },
        ],
      },
      {
        category: 'Game Integration',
        issues: [
          {
            problem: 'Score submission fails during game',
            solutions: [
              'Check browser console for error messages',
              'Validate your configuration with WalletSetup.validateConfiguration()',
              'Ensure your wallet has sufficient MON balance',
              'Try playing the game again',
            ],
          },
          {
            problem: 'Transaction takes too long to confirm',
            solutions: [
              'This is normal - Monad testnet can be slow sometimes',
              'Wait up to 2-3 minutes for confirmation',
              'Check the transaction on the explorer',
              'The game will show the transaction hash when ready',
            ],
          },
        ],
      },
    ];
  }
}

// Utility functions for console debugging
declare global {
  interface Window {
    walletSetup: typeof WalletSetup;
    generateNewWallet: () => ReturnType<typeof WalletSetup.generateNewWallet>;
    validateConfig: () => ReturnType<typeof WalletSetup.validateConfiguration>;
    setupHelp: () => void;
  }
}

// Make functions available in browser console for debugging
if (typeof window !== 'undefined') {
  window.walletSetup = WalletSetup;
  window.generateNewWallet = WalletSetup.generateNewWallet;
  window.validateConfig = WalletSetup.validateConfiguration;
  window.setupHelp = WalletSetup.printSetupInstructions;
}

export default WalletSetup;

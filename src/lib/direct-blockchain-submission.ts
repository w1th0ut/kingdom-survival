import { ethers } from 'ethers';
import { GAME_CONTRACT_ABI } from './contract-abi';

export interface DirectSubmissionConfig {
  privateKey: string;
  rpcUrl?: string;
  contractAddress?: string;
  gasLimit?: number;
}

export interface DirectSubmissionPayload {
  playerAddress: string;
  scoreAmount: number;
  transactionAmount: number;
}

export class DirectBlockchainSubmissionService {
  private static readonly DEFAULT_RPC_URL = 'https://testnet-rpc.monad.xyz';
  private static readonly DEFAULT_CONTRACT_ADDRESS = '0xceCBFF203C8B6044F52CE23D914A1bfD997541A4';
  private static readonly DEFAULT_GAS_LIMIT = 300000;

  /**
   * Submit score directly to the blockchain using a private key
   */
  static async submitScore(
    config: DirectSubmissionConfig,
    payload: DirectSubmissionPayload
  ): Promise<{
    success: boolean;
    transactionHash?: string;
    error?: string;
    gasUsed?: number;
    receipt?: ethers.TransactionReceipt;
  }> {
    try {
      // Validate inputs
      if (!config.privateKey) {
        throw new Error('Private key is required for direct blockchain submission');
      }

      if (!ethers.isAddress(payload.playerAddress)) {
        throw new Error('Invalid player address format');
      }

      if (payload.scoreAmount < 0 || payload.transactionAmount < 0) {
        throw new Error('Score and transaction amounts must be non-negative');
      }

      // Set up provider and wallet
      const rpcUrl = config.rpcUrl || this.DEFAULT_RPC_URL;
      const contractAddress = config.contractAddress || this.DEFAULT_CONTRACT_ADDRESS;
      const gasLimit = config.gasLimit || this.DEFAULT_GAS_LIMIT;

      const provider = new ethers.JsonRpcProvider(rpcUrl);
      
      // Create wallet from private key
      const wallet = new ethers.Wallet(config.privateKey, provider);

      // Check wallet balance
      const balance = await provider.getBalance(wallet.address);
      const balanceInMON = ethers.formatEther(balance);

      if (balance < ethers.parseEther('0.01')) {
        throw new Error(`Insufficient MON balance. Current: ${balanceInMON} MON, Required: at least 0.01 MON`);
      }

      // Create contract instance
      const contract = new ethers.Contract(contractAddress, GAME_CONTRACT_ABI, wallet);

      // Estimate gas first
      let estimatedGas: bigint;
      try {
        estimatedGas = await contract.updatePlayerData.estimateGas(
          payload.playerAddress,
          payload.scoreAmount,
          payload.transactionAmount
        );
      } catch (gasError) {
        console.error('Gas estimation failed:', gasError);
        estimatedGas = BigInt(gasLimit);
      }

      // Submit transaction

      const tx = await contract.updatePlayerData(
        payload.playerAddress,
        payload.scoreAmount,
        payload.transactionAmount,
        {
          gasLimit: estimatedGas > BigInt(gasLimit) ? estimatedGas : BigInt(gasLimit),
        }
      );

      // Wait for transaction confirmation
      const receipt = await tx.wait();

      if (!receipt) {
        throw new Error('Transaction failed to get receipt');
      }


      return {
        success: true,
        transactionHash: receipt.hash,
        gasUsed: Number(receipt.gasUsed),
        receipt,
      };

    } catch (error) {
      console.error('❌ Direct blockchain submission failed:', error);
      
      let errorMessage = 'Unknown error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Check if wallet has sufficient balance and is properly configured
   */
  static async validateWallet(config: DirectSubmissionConfig): Promise<{
    isValid: boolean;
    balance?: string;
    address?: string;
    error?: string;
  }> {
    try {
      const rpcUrl = config.rpcUrl || this.DEFAULT_RPC_URL;
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const wallet = new ethers.Wallet(config.privateKey, provider);
      
      const balance = await provider.getBalance(wallet.address);
      const balanceInMON = ethers.formatEther(balance);

      return {
        isValid: balance >= ethers.parseEther('0.01'),
        balance: balanceInMON,
        address: wallet.address,
        error: balance < ethers.parseEther('0.01') 
          ? `Insufficient balance. Current: ${balanceInMON} MON, Required: at least 0.01 MON`
          : undefined,
      };

    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Wallet validation failed',
      };
    }
  }

  /**
   * Get current network information
   */
  static async getNetworkInfo(rpcUrl?: string): Promise<{
    chainId: number;
    name: string;
    blockNumber: number;
  }> {
    const provider = new ethers.JsonRpcProvider(rpcUrl || this.DEFAULT_RPC_URL);
    const network = await provider.getNetwork();
    const blockNumber = await provider.getBlockNumber();

    return {
      chainId: Number(network.chainId),
      name: network.name,
      blockNumber,
    };
  }

  /**
   * Create a utility to generate a new wallet (for development purposes)
   */
  static createNewWallet(): {
    address: string;
    privateKey: string;
    mnemonic: string;
  } {
    const wallet = ethers.Wallet.createRandom();
    return {
      address: wallet.address,
      privateKey: wallet.privateKey,
      mnemonic: wallet.mnemonic?.phrase || 'No mnemonic available',
    };
  }
}

/**
 * Utility function to format transaction hash for explorer links
 */
export function getExplorerUrl(txHash: string): string {
  return `https://testnet-explorer.monad.xyz/tx/${txHash}`;
}

/**
 * Utility function to get address explorer link
 */
export function getAddressExplorerUrl(address: string): string {
  return `https://testnet-explorer.monad.xyz/address/${address}`;
}

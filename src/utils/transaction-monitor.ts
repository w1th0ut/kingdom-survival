import { ethers } from 'ethers';

export interface TransactionStatus {
  hash: string;
  status: 'pending' | 'confirmed' | 'failed';
  blockNumber?: number;
  gasUsed?: number;
  confirmations?: number;
  timestamp?: number;
  error?: string;
}

export interface MonitoringCallbacks {
  onStatusChange?: (status: TransactionStatus) => void;
  onConfirmation?: (receipt: ethers.TransactionReceipt) => void;
  onError?: (error: Error) => void;
  onProgress?: (confirmations: number, requiredConfirmations: number) => void;
}

export class TransactionMonitor {
  private provider: ethers.JsonRpcProvider;
  private monitoringIntervals: Map<string, NodeJS.Timeout> = new Map();
  
  constructor(rpcUrl: string = 'https://testnet-rpc.monad.xyz') {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
  }

  /**
   * Monitor a transaction until it's confirmed
   */
  async monitorTransaction(
    txHash: string, 
    callbacks: MonitoringCallbacks = {},
    options: {
      requiredConfirmations?: number;
      timeoutMs?: number;
      pollIntervalMs?: number;
    } = {}
  ): Promise<TransactionStatus> {
    const {
      requiredConfirmations = 3,
      timeoutMs = 300000, // 5 minutes default timeout
      pollIntervalMs = 2000, // 2 seconds polling interval
    } = options;

    return new Promise((resolve, reject) => {
      let status: TransactionStatus = {
        hash: txHash,
        status: 'pending',
        timestamp: Date.now(),
      };

      // Initial status callback
      callbacks.onStatusChange?.(status);

      const startTime = Date.now();
      let timeoutHandle: NodeJS.Timeout;
      let pollHandle: NodeJS.Timeout = setTimeout(() => {}, 0);

      // Timeout handler
      if (timeoutMs > 0) {
        timeoutHandle = setTimeout(() => {
          this.cleanup(txHash);
          const error = new Error(`Transaction ${txHash} timed out after ${timeoutMs}ms`);
          callbacks.onError?.(error);
          reject(error);
        }, timeoutMs);
      }

      // Polling function
      const poll = async () => {
        try {
          // Get transaction receipt
          const receipt = await this.provider.getTransactionReceipt(txHash);
          
          if (!receipt) {
            // Transaction is still pending
            const elapsed = Date.now() - startTime;
            
            // Schedule next poll
            pollHandle = setTimeout(poll, pollIntervalMs);
            return;
          }

          // Transaction is mined
          const currentBlock = await this.provider.getBlockNumber();
          const confirmations = Math.max(0, currentBlock - receipt.blockNumber + 1);
          
          status = {
            hash: txHash,
            status: receipt.status === 1 ? 'confirmed' : 'failed',
            blockNumber: receipt.blockNumber,
            gasUsed: Number(receipt.gasUsed),
            confirmations,
            timestamp: Date.now(),
          };

          if (receipt.status !== 1) {
            // Transaction failed
            status.error = 'Transaction execution failed';
            callbacks.onStatusChange?.(status);
            callbacks.onError?.(new Error(status.error));
            this.cleanup(txHash);
            resolve(status);
            return;
          }

          // Transaction succeeded, check confirmations
          callbacks.onStatusChange?.(status);
          callbacks.onProgress?.(confirmations, requiredConfirmations);

          if (confirmations >= requiredConfirmations) {
            // Fully confirmed
            callbacks.onConfirmation?.(receipt);
            this.cleanup(txHash);
            resolve(status);
            return;
          } else {
            // Need more confirmations
            pollHandle = setTimeout(poll, pollIntervalMs);
          }

        } catch (error) {
          console.error('❌ Error polling transaction:', error);
          const err = error instanceof Error ? error : new Error('Unknown polling error');
          callbacks.onError?.(err);
          this.cleanup(txHash);
          reject(err);
        }
      };

      // Start polling
      poll();

      // Store handles for cleanup
      this.monitoringIntervals.set(txHash, pollHandle);
      if (timeoutHandle!) {
        this.monitoringIntervals.set(txHash + '_timeout', timeoutHandle);
      }
    });
  }

  /**
   * Create a user-friendly status updater for UI
   */
  createStatusUpdater(
    onUpdate: (message: string, type: 'info' | 'success' | 'error' | 'warning') => void
  ): MonitoringCallbacks {
    return {
      onStatusChange: (status) => {
        switch (status.status) {
          case 'pending':
            onUpdate('⏳ Transaction submitted to blockchain...', 'info');
            break;
          case 'confirmed':
            onUpdate(`✅ Transaction confirmed in block ${status.blockNumber}`, 'success');
            break;
          case 'failed':
            onUpdate(`❌ Transaction failed: ${status.error}`, 'error');
            break;
        }
      },
      onProgress: (confirmations, required) => {
        if (confirmations < required) {
          onUpdate(`🔄 Waiting for confirmations: ${confirmations}/${required}`, 'info');
        }
      },
      onError: (error) => {
        onUpdate(`❌ Error: ${error.message}`, 'error');
      },
    };
  }

  /**
   * Get current transaction status (one-time check)
   */
  async getTransactionStatus(txHash: string): Promise<TransactionStatus> {
    try {
      const receipt = await this.provider.getTransactionReceipt(txHash);
      
      if (!receipt) {
        return {
          hash: txHash,
          status: 'pending',
          timestamp: Date.now(),
        };
      }

      const currentBlock = await this.provider.getBlockNumber();
      const confirmations = Math.max(0, currentBlock - receipt.blockNumber + 1);

      return {
        hash: txHash,
        status: receipt.status === 1 ? 'confirmed' : 'failed',
        blockNumber: receipt.blockNumber,
        gasUsed: Number(receipt.gasUsed),
        confirmations,
        timestamp: Date.now(),
        error: receipt.status !== 1 ? 'Transaction execution failed' : undefined,
      };

    } catch (error) {
      return {
        hash: txHash,
        status: 'failed',
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Stop monitoring a specific transaction
   */
  stopMonitoring(txHash: string): void {
    this.cleanup(txHash);
  }

  /**
   * Stop monitoring all transactions
   */
  stopAllMonitoring(): void {
    for (const [key, handle] of this.monitoringIntervals) {
      clearTimeout(handle);
    }
    this.monitoringIntervals.clear();
  }

  /**
   * Get network information
   */
  async getNetworkInfo(): Promise<{
    chainId: number;
    name: string;
    blockNumber: number;
    avgBlockTime: number;
  }> {
    const network = await this.provider.getNetwork();
    const blockNumber = await this.provider.getBlockNumber();
    
    // Estimate average block time (Monad testnet is ~1-2 seconds)
    const avgBlockTime = 1500; // milliseconds
    
    return {
      chainId: Number(network.chainId),
      name: network.name,
      blockNumber,
      avgBlockTime,
    };
  }

  /**
   * Estimate confirmation time
   */
  async estimateConfirmationTime(requiredConfirmations: number = 3): Promise<{
    estimatedTimeMs: number;
    estimatedTimeFormatted: string;
  }> {
    const networkInfo = await this.getNetworkInfo();
    const estimatedTimeMs = requiredConfirmations * networkInfo.avgBlockTime;
    
    const seconds = Math.round(estimatedTimeMs / 1000);
    const estimatedTimeFormatted = seconds < 60 
      ? `${seconds} seconds`
      : `${Math.round(seconds / 60)} minutes`;

    return {
      estimatedTimeMs,
      estimatedTimeFormatted,
    };
  }

  private cleanup(txHash: string): void {
    const handle = this.monitoringIntervals.get(txHash);
    const timeoutHandle = this.monitoringIntervals.get(txHash + '_timeout');
    
    if (handle) {
      clearTimeout(handle);
      this.monitoringIntervals.delete(txHash);
    }
    
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
      this.monitoringIntervals.delete(txHash + '_timeout');
    }
  }
}

/**
 * Global transaction monitor instance
 */
export const globalTransactionMonitor = new TransactionMonitor();

/**
 * Utility function to monitor a transaction with simple callbacks
 */
export async function monitorTransaction(
  txHash: string,
  onUpdate: (message: string, type: 'info' | 'success' | 'error' | 'warning') => void,
  options?: {
    requiredConfirmations?: number;
    timeoutMs?: number;
  }
): Promise<TransactionStatus> {
  const monitor = globalTransactionMonitor;
  const callbacks = monitor.createStatusUpdater(onUpdate);
  
  return monitor.monitorTransaction(txHash, callbacks, options);
}

// Make available in browser console for debugging
if (typeof window !== 'undefined') {
  (window as any).transactionMonitor = globalTransactionMonitor;
  (window as any).monitorTx = monitorTransaction;
}

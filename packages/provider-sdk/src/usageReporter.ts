/**
 * UsageReporter - Reports usage and claims funds from escrows
 * 
 * This class is used to report tool usage and claim funds from escrows.
 */

import { EscrowClient } from './clients/EscrowClient.js';
import { Uint128 } from './types/common.js';

/**
 * Options for posting usage
 */
export interface PostUsageOptions {
  /** Optional memo to include in the transaction */
  memo?: string;
  
  /** Optional gas limit for the transaction */
  gasLimit?: number;
}

/**
 * Parameters for posting usage
 */
export interface PostUsageParams {
  /** Escrow ID to claim funds from */
  escrowId: number | string;
  
  /** Usage fee amount to claim (in smallest denomination) */
  usageFee: Uint128 | string;
  
  /** Optional parameters for the transaction */
  options?: PostUsageOptions;
}

/**
 * Result of posting usage
 */
export interface PostUsageResult {
  /** Transaction hash */
  txHash: string;
  
  /** Gas used by the transaction */
  gasUsed?: number;
  
  /** Fee amount paid for the transaction */
  fee?: string;
}

/**
 * Reports usage and claims funds from escrows
 */
export class UsageReporter {
  private readonly escrowClient: EscrowClient;
  
  /**
   * Create a new UsageReporter
   * 
   * @param escrowClient - The escrow contract client
   */
  constructor(escrowClient: EscrowClient) {
    this.escrowClient = escrowClient;
    
    // Verify we have a signing client
    if (!this.escrowClient.getClient() || !('execute' in this.escrowClient.getClient())) {
      throw new Error('UsageReporter requires a signing client');
    }
  }
  
  /**
   * Post usage and claim funds from an escrow
   * 
   * @param senderAddress - Address of the sender (provider)
   * @param params - Usage parameters
   * @returns Promise that resolves to the transaction result
   */
  async postUsage(
    senderAddress: string,
    params: PostUsageParams
  ): Promise<PostUsageResult> {
    const escrowId = typeof params.escrowId === 'string' ? parseInt(params.escrowId, 10) : params.escrowId;
    // Options are no longer used directly in the EscrowClient call
    
    try {
      const result = await this.escrowClient.releaseFunds(
        senderAddress,
        escrowId,
        params.usageFee.toString()
      );
      
      return {
        txHash: result.transactionHash,
        gasUsed: result.gasUsed,
        fee: "0", // In a real implementation, you might calculate this from gasUsed and gasPrice
      };
    } catch (error) {
      throw new Error(`Failed to post usage: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

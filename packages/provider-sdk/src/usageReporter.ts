/**
 * UsageReporter - Reports usage and claims funds from escrows
 *
 * This class is used to report tool usage and claim funds from escrows.
 * It handles the process of submitting blockchain transactions to transfer
 * fees from an escrow to the provider after services have been rendered.
 *
 * @example
 * ```typescript
 * // Create a usage reporter with an escrow client
 * const reporter = new UsageReporter(escrowClient);
 *
 * // Post usage and claim funds
 * const result = await reporter.postUsage('neutron1yourprovideraddress', {
 *   escrowId: '123',
 *   usageFee: '500000', // 0.5 NTRN if 1 NTRN = 1_000_000 untrn
 *   options: {
 *     memo: 'Tool usage payment'
 *   }
 * });
 *
 * console.log(`Transaction hash: ${result.txHash}`);
 * console.log(`Gas used: ${result.gasUsed}`);
 * ```
 */

import { EscrowClient } from './clients/EscrowClient.js';
import { Uint128 } from './types/common.js';

/**
 * Options for posting usage
 *
 * Additional parameters that can be included when posting usage
 * to customize the transaction process.
 */
export interface PostUsageOptions {
  /** Optional memo to include in the transaction */
  memo?: string;

  /** Optional gas limit for the transaction */
  gasLimit?: number;
}

/**
 * Parameters for posting usage
 *
 * Contains all the information needed to post tool usage and claim
 * funds from an escrow.
 */
export interface PostUsageParams {
  /** Escrow ID to claim funds from (numeric ID as number or string) */
  escrowId: number | string;

  /**
   * Usage fee amount to claim (in smallest denomination)
   * Must be less than or equal to the maximum fee in the escrow
   */
  usageFee: Uint128 | string;

  /** Optional parameters for the transaction */
  options?: PostUsageOptions;
}

/**
 * Result of posting usage
 *
 * Contains information about the transaction that was submitted
 * to claim funds from an escrow.
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
 *
 * This class is responsible for posting tool usage and claiming funds
 * from escrows. It uses the EscrowClient to submit transactions to the
 * blockchain.
 */
export class UsageReporter {
  private readonly escrowClient: EscrowClient;

  /**
   * Create a new UsageReporter
   *
   * @param escrowClient - The escrow contract client (must have a signing client)
   * @throws Error if the client does not support signing transactions
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
   * This method submits a transaction to the blockchain to release funds from
   * an escrow to the provider after services have been rendered. The transaction
   * must be signed by the provider's address.
   *
   * @param senderAddress - Address of the sender (provider)
   * @param params - Usage parameters including escrow ID and usage fee
   * @returns Promise that resolves to the transaction result
   *
   * @throws Error if the transaction fails or if there are connection issues
   */
  async postUsage(senderAddress: string, params: PostUsageParams): Promise<PostUsageResult> {
    const escrowId =
      typeof params.escrowId === 'string' ? parseInt(params.escrowId, 10) : params.escrowId;
    // Options are no longer used directly in the EscrowClient call

    try {
      const result = await this.escrowClient.releaseFunds(
        senderAddress,
        escrowId,
        params.usageFee.toString(),
      );

      return {
        txHash: result.transactionHash,
        gasUsed: result.gasUsed,
        fee: '0', // In a real implementation, you might calculate this from gasUsed and gasPrice
      };
    } catch (error) {
      throw new Error(
        `Failed to post usage: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}

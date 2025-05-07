/**
 * EscrowVerifier - Verifies escrow validity and authorization
 *
 * This class verifies that an escrow exists, is valid, and
 * is authorized for a specific provider. It performs validation checks including:
 * - Existence of the escrow
 * - Matching of the provider address
 * - Validation of auth token
 * - Verification that the escrow has not expired
 *
 * @example
 * ```typescript
 * // Create an escrow verifier
 * const escrowVerifier = new EscrowVerifier(escrowClient);
 *
 * // Verify an escrow
 * const result = await escrowVerifier.verifyEscrow({
 *   escrowId: '123',
 *   authToken: 'xyz-token',
 *   providerAddr: 'neutron1yourprovideraddress'
 * });
 *
 * if (result.isValid) {
 *   // Escrow is valid, proceed with service
 *   console.log(`Escrow ${result.escrow.escrow_id} is valid`);
 * } else {
 *   // Escrow is invalid
 *   console.log(`Verification failed: ${result.error}`);
 * }
 * ```
 */

import { EscrowClient } from './clients/EscrowClient.js';
import type { EscrowResponse } from './types/escrow.js';

/**
 * Result of an escrow verification
 *
 * Contains information about whether the escrow is valid, any error messages,
 * the escrow details (if found), and the current block height.
 */
export interface VerificationResult {
  /** Whether the escrow is valid */
  isValid: boolean;

  /** Error message if the escrow is invalid */
  error?: string;

  /** The escrow details if valid */
  escrow?: EscrowResponse;

  /** Current block height at time of verification */
  blockHeight?: number;
}

/**
 * Parameters for verifying an escrow
 *
 * Contains all the information needed to verify an escrow's validity and
 * authorization for a specific provider.
 */
export interface VerifyEscrowParams {
  /** Escrow ID to verify (numeric ID as a number or string) */
  escrowId: number | string;

  /** Auth token used when creating the escrow */
  authToken: string;

  /** Provider address that should be authorized for this escrow */
  providerAddr: string;

  /**
   * Optional current block height, will be queried from the chain if not provided.
   * Useful for testing or when block height is already known.
   */
  nowBlockHeight?: number;
}

/**
 * Verifies escrow validity and authorization
 *
 * This class is responsible for verifying that an escrow exists, has not expired,
 * and is authorized for a specific provider. It uses the EscrowClient to query
 * escrow information from the blockchain.
 */
export class EscrowVerifier {
  private readonly escrowClient: EscrowClient;

  /**
   * Create a new EscrowVerifier
   *
   * @param escrowClient - The escrow contract client used to query escrow information
   */
  constructor(escrowClient: EscrowClient) {
    this.escrowClient = escrowClient;
  }

  /**
   * Verify that an escrow exists, is valid, and is authorized
   * for the specified provider.
   *
   * This method performs multiple validation checks:
   * 1. Verifies the escrow exists
   * 2. Checks if the escrow has expired
   * 3. Validates that the provider address matches
   * 4. Confirms the auth token matches
   *
   * @param params - Parameters for verification including escrow ID, auth token, and provider address
   * @returns Promise that resolves to a verification result with validation status and details
   *
   * @throws Will throw an error if there are issues connecting to the blockchain
   */
  async verifyEscrow(params: VerifyEscrowParams): Promise<VerificationResult> {
    const escrowId =
      typeof params.escrowId === 'string' ? parseInt(params.escrowId, 10) : params.escrowId;

    try {
      // Get the escrow from the contract
      const escrow = await this.escrowClient.getEscrow(escrowId);

      // Get current block height if not provided
      let blockHeight = params.nowBlockHeight;
      if (blockHeight === undefined) {
        const client = this.escrowClient.getClient();
        if (!client) {
          return {
            isValid: false,
            error: 'No client available to query block height',
          };
        }
        blockHeight = await client.getHeight();
      }

      // Check if escrow is expired
      if (escrow.expires < blockHeight) {
        return {
          isValid: false,
          error: 'Escrow is expired',
          escrow,
          blockHeight,
        };
      }

      // Check if provider address matches
      if (escrow.provider !== params.providerAddr) {
        return {
          isValid: false,
          error: 'Provider address mismatch',
          escrow,
          blockHeight,
        };
      }

      // Check if auth token matches
      // Note: in a real implementation, you might want to use a crypto-safe comparison
      if (escrow.auth_token !== params.authToken) {
        return {
          isValid: false,
          error: 'Auth token mismatch',
          escrow,
          blockHeight,
        };
      }

      // All checks passed
      return {
        isValid: true,
        escrow,
        blockHeight,
      };
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}

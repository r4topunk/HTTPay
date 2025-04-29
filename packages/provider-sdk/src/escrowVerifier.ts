/**
 * EscrowVerifier - Verifies escrow validity and authorization
 * 
 * This class verifies that an escrow exists, is valid, and
 * is authorized for a specific provider.
 */

import { EscrowClient } from './clients/EscrowClient.js';
import { EscrowResponse } from './types/escrow.js';

/**
 * Result of an escrow verification
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
 */
export interface VerifyEscrowParams {
  /** Escrow ID to verify */
  escrowId: number | string;
  
  /** Auth token used when creating the escrow */
  authToken: string;
  
  /** Provider address that should be authorized for this escrow */
  providerAddr: string;
  
  /** 
   * Optional current block height, will be queried from the chain if not provided
   * Useful for testing or when block height is already known
   */
  nowBlockHeight?: number;
}

/**
 * Verifies escrow validity and authorization
 */
export class EscrowVerifier {
  private readonly escrowClient: EscrowClient;
  
  /**
   * Create a new EscrowVerifier
   * 
   * @param escrowClient - The escrow contract client
   */
  constructor(escrowClient: EscrowClient) {
    this.escrowClient = escrowClient;
  }
  
  /**
   * Verify that an escrow exists, is valid, and is authorized
   * for the specified provider.
   * 
   * @param params - Parameters for verification
   * @returns Promise that resolves to a verification result
   */
  async verifyEscrow(params: VerifyEscrowParams): Promise<VerificationResult> {
    const escrowId = typeof params.escrowId === 'string' ? parseInt(params.escrowId, 10) : params.escrowId;
    
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
            error: 'No client available to query block height'
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
          blockHeight
        };
      }
      
      // Check if provider address matches
      if (escrow.provider !== params.providerAddr) {
        return {
          isValid: false,
          error: 'Provider address mismatch',
          escrow,
          blockHeight
        };
      }
      
      // Check if auth token matches
      // Note: in a real implementation, you might want to use a crypto-safe comparison
      if (escrow.auth_token !== params.authToken) {
        return {
          isValid: false,
          error: 'Auth token mismatch',
          escrow,
          blockHeight
        };
      }
      
      // All checks passed
      return {
        isValid: true,
        escrow,
        blockHeight
      };
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
}

/**
 * Escrow contract client
 * 
 * Provides a high-level API for interacting with the Escrow contract.
 */

import { CosmWasmClient, SigningCosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { Coin } from '@cosmjs/stargate';
import { Uint128 } from '../types/common.js';
import { EscrowExecuteMsg, EscrowResponse } from '../types/escrow.js';

/**
 * Client for interacting with the ToolPay Escrow contract
 */
export class EscrowClient {
  private readonly client: CosmWasmClient | SigningCosmWasmClient;
  private readonly contractAddress: string;

  /**
   * Create a new EscrowClient
   * 
   * @param client - CosmWasm client (signing or non-signing)
   * @param contractAddress - Address of the Escrow contract
   */
  constructor(client: CosmWasmClient | SigningCosmWasmClient, contractAddress: string) {
    this.client = client;
    this.contractAddress = contractAddress;
  }

  /**
   * Get the Escrow contract address
   * 
   * @returns The contract address
   */
  getContractAddress(): string {
    return this.contractAddress;
  }

  /**
   * Query information about a specific escrow
   * 
   * @param escrowId - ID of the escrow to query
   * @returns Escrow information if found
   */
  async getEscrow(escrowId: number): Promise<EscrowResponse> {
    return await this.client.queryContractSmart(this.contractAddress, {
      get_escrow: { escrow_id: escrowId }
    });
  }

  /**
   * Check if the client is a signing client
   * 
   * @private
   * @throws Error if the client is not a signing client
   */
  private getSigningClient(): SigningCosmWasmClient {
    if (!('execute' in this.client)) {
      throw new Error('This method requires a signing client');
    }
    return this.client as SigningCosmWasmClient;
  }

  /**
   * Lock funds for a tool provider with an authentication token
   * 
   * @param toolId - The tool ID in the registry
   * @param maxFee - The maximum fee the caller is willing to pay
   * @param authToken - Authentication token for the tool to verify the escrow
   * @param expires - Block height when this escrow expires
   * @param funds - Funds to send with the transaction (should include the maxFee)
   * @returns Transaction hash
   */
  async lockFunds(
    senderAddress: string,
    toolId: string,
    maxFee: Uint128,
    authToken: string,
    expires: number,
    funds: Coin[]
  ): Promise<string> {
    const signingClient = this.getSigningClient();

    const msg: EscrowExecuteMsg = {
      lock_funds: {
        tool_id: toolId,
        max_fee: maxFee,
        auth_token: authToken,
        expires,
      }
    };

    const result = await signingClient.execute(
      senderAddress,
      this.contractAddress,
      msg,
      'auto',
      undefined,
      funds
    );

    return result.transactionHash;
  }

  /**
   * Release locked funds to the provider after tool usage
   * 
   * @param senderAddress - The address executing the transaction
   * @param escrowId - The escrow ID to release funds from
   * @param usageFee - The actual usage fee to charge (must be ≤ max_fee)
   * @param funds - Funds to send with the transaction (if required)
   * @returns Transaction hash
   */
  async releaseFunds(
    senderAddress: string,
    escrowId: number,
    usageFee: Uint128,
    funds: Coin[] = []
  ): Promise<string> {
    const signingClient = this.getSigningClient();

    const msg: EscrowExecuteMsg = {
      release: {
        escrow_id: escrowId,
        usage_fee: usageFee,
      }
    };

    const result = await signingClient.execute(
      senderAddress,
      this.contractAddress,
      msg,
      'auto',
      undefined,
      funds
    );

    return result.transactionHash;
  }

  /**
   * Refund locked funds to the caller if the escrow has expired
   * 
   * @param senderAddress - The address executing the transaction
   * @param escrowId - The escrow ID to refund
   * @param funds - Funds to send with the transaction (if required)
   * @returns Transaction hash
   */
  async refundExpired(
    senderAddress: string,
    escrowId: number,
    funds: Coin[] = []
  ): Promise<string> {
    const signingClient = this.getSigningClient();

    const msg: EscrowExecuteMsg = {
      refund_expired: {
        escrow_id: escrowId,
      }
    };

    const result = await signingClient.execute(
      senderAddress,
      this.contractAddress,
      msg,
      'auto',
      undefined,
      funds
    );

    return result.transactionHash;
  }
}

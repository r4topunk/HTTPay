/**
 * Registry contract client
 * 
 * Provides a high-level API for interacting with the Registry contract.
 */

import { CosmWasmClient, SigningCosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import type { Coin } from '@cosmjs/stargate';
import type { Uint128 } from '../types/common.js';
import type { RegistryExecuteMsg, ToolResponse } from '../types/registry.js';

/**
 * Client for interacting with the ToolPay Registry contract
 */
export class RegistryClient {
  private readonly client: CosmWasmClient | SigningCosmWasmClient;
  private readonly contractAddress: string;

  /**
   * Create a new RegistryClient
   * 
   * @param client - CosmWasm client (signing or non-signing)
   * @param contractAddress - Address of the Registry contract
   */
  constructor(client: CosmWasmClient | SigningCosmWasmClient, contractAddress: string) {
    this.client = client;
    this.contractAddress = contractAddress;
  }

  /**
   * Get the Registry contract address
   * 
   * @returns The contract address
   */
  getContractAddress(): string {
    return this.contractAddress;
  }

  /**
   * Query information about a registered tool
   * 
   * @param toolId - ID of the tool to query
   * @returns Tool information if found
   */
  async getTool(toolId: string): Promise<ToolResponse> {
    const query = {
      get_tool: { tool_id: toolId }
    };
    return await this.client.queryContractSmart(this.contractAddress, query);
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
   * Register a new tool
   * 
   * @param senderAddress - Address of the sender
   * @param toolId - Unique tool identifier (max 16 characters)
   * @param price - Price to use the tool (in base denom)
   * @param funds - Funds to send with the transaction (if required)
   * @returns Transaction hash
   */
  async registerTool(
    senderAddress: string,
    toolId: string,
    price: Uint128,
    funds: Coin[] = []
  ): Promise<string> {
    const signingClient = this.getSigningClient();
    
    const msg: RegistryExecuteMsg = {
      register_tool: {
        tool_id: toolId,
        price,
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
   * Update the price of an existing tool
   * 
   * @param senderAddress - Address of the sender
   * @param toolId - ID of the tool to update
   * @param price - New price for the tool (in base denom)
   * @param funds - Funds to send with the transaction (if required)
   * @returns Transaction hash
   */
  async updatePrice(
    senderAddress: string,
    toolId: string,
    price: Uint128,
    funds: Coin[] = []
  ): Promise<string> {
    const signingClient = this.getSigningClient();
    
    const msg: RegistryExecuteMsg = {
      update_price: {
        tool_id: toolId,
        price,
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
   * Pause an active tool (make it unavailable for use)
   * 
   * @param senderAddress - Address of the sender
   * @param toolId - ID of the tool to pause
   * @param funds - Funds to send with the transaction (if required)
   * @returns Transaction hash
   */
  async pauseTool(
    senderAddress: string,
    toolId: string,
    funds: Coin[] = []
  ): Promise<string> {
    const signingClient = this.getSigningClient();
    
    const msg: RegistryExecuteMsg = {
      pause_tool: {
        tool_id: toolId,
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
   * Resume a paused tool (make it available for use)
   * 
   * @param senderAddress - Address of the sender
   * @param toolId - ID of the tool to resume
   * @param funds - Funds to send with the transaction (if required)
   * @returns Transaction hash
   */
  async resumeTool(
    senderAddress: string,
    toolId: string,
    funds: Coin[] = []
  ): Promise<string> {
    const signingClient = this.getSigningClient();
    
    const msg: RegistryExecuteMsg = {
      resume_tool: {
        tool_id: toolId,
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

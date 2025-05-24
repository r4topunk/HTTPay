/**
 * CosmosKit integration utilities
 * 
 * This file provides utilities to bridge between CosmosKit and the PayPerTool SDK,
 * especially handling version compatibility issues between different SigningCosmWasmClient
 * implementations.
 */

import { ConfigurationError } from './errors';

/**
 * CosmosKit integration context
 * Holds the necessary references to work with CosmosKit
 */
export interface CosmosKitContext {
  /** Function to get the signing client from CosmosKit */
  getSigningClient: () => Promise<any>;
  
  /** Wallet address from CosmosKit */
  walletAddress: string;
}

/**
 * Creates a context object for CosmosKit integration
 * 
 * @param getSigningClient - Function to get CosmosKit's signing client
 * @param walletAddress - Wallet address from CosmosKit
 * @returns CosmosKit integration context
 * @throws ConfigurationError if parameters are invalid
 */
export function createCosmosKitContext(
  getSigningClient: () => Promise<any>,
  walletAddress: string
): CosmosKitContext {
  if (!getSigningClient) {
    throw new ConfigurationError('getSigningClient function cannot be null or undefined');
  }
  
  if (!walletAddress) {
    throw new ConfigurationError('walletAddress cannot be null or undefined');
  }
  
  return {
    getSigningClient,
    walletAddress
  };
}

/**
 * Execute a message via CosmosKit
 * 
 * This function handles sending a transaction using CosmosKit's signing client
 * rather than the SDK's built-in client to avoid version compatibility issues.
 * 
 * @param cosmosKitContext - CosmosKit integration context
 * @param contractAddress - Smart contract address
 * @param msg - Message to send to the contract
 * @param gasLimit - Gas limit for the transaction
 * @param funds - Funds to send with the transaction (optional)
 * @returns Result of the execution
 * @throws Error if execution fails
 */
export async function executeViaCosmosKit(
  cosmosKitContext: CosmosKitContext,
  contractAddress: string,
  msg: Record<string, unknown>,
  gasLimit: number,
  funds: { denom: string; amount: string }[] = []
): Promise<any> {
  const { getSigningClient, walletAddress } = cosmosKitContext;

  debugger;
  
  const signingClient = await getSigningClient();
  if (!signingClient) {
    throw new Error('Failed to get signing client from CosmosKit');
  }
  
  return signingClient.execute(
    walletAddress,
    contractAddress,
    msg,
    gasLimit,
    undefined, // memo
    funds
  );
}

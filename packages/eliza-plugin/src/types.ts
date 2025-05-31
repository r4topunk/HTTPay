/**
 * HTTPay Eliza Plugin Types
 * Core type definitions for the HTTPay plugin MVP
 */

/**
 * HTTPay Tool interface - represents a tool from the registry
 */
export interface HTTPayTool {
  toolId: string
  name: string
  description: string
  price: string
  provider: string
  endpoint?: string
  denom?: string
}

/**
 * Plugin state interface - stores conversation state
 */
export interface HTTPayMVPState {
  selectedTool?: {
    toolId: string
    name: string
    description: string
    price: string
    provider: string
  }
}

/**
 * Action parameter types
 */
export interface ListToolsParams {
  // No parameters needed for listing tools
}

export interface SelectToolParams {
  toolId: string
}

export interface ConfirmPaymentParams {
  // Uses the selected tool from state
}

/**
 * HTTPay service configuration
 */
export interface HTTPayConfig {
  privateKey: string
  rpcEndpoint: string
  registryAddress: string
  escrowAddress: string
  gasPrice?: string
  gasAdjustment?: number
}

/**
 * Transaction result interface
 */
export interface TransactionResult {
  success: boolean
  txHash?: string
  error?: string
  escrowId?: number
  authToken?: string
  tool?: {
    toolId: string
    name: string
    endpoint?: string
    provider: string
    price: string
  }
}

/**
 * Environment variables schema
 */
export interface HTTPayEnvConfig {
  HTTPAY_PRIVATE_KEY: string
  HTTPAY_RPC_ENDPOINT: string
  HTTPAY_REGISTRY_CONTRACT: string
  HTTPAY_ESCROW_CONTRACT: string
}

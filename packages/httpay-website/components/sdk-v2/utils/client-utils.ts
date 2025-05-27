import { CosmWasmClient, SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { RegistryClient, RegistryQueryClient, EscrowClient, EscrowQueryClient } from "httpay-sdk";
import type { HTTPaySDKConfig, HTTPayClients } from "../types";

/**
 * Create read-only (query) clients for HTTPay contracts
 */
export async function createQueryClients(config: HTTPaySDKConfig): Promise<{
  cosmWasmClient: CosmWasmClient;
  registryQuery: RegistryQueryClient;
  escrowQuery: EscrowQueryClient;
}> {
  const cosmWasmClient = await CosmWasmClient.connect(config.rpcEndpoint);
  
  const registryQuery = new RegistryQueryClient(cosmWasmClient, config.registryAddress);
  const escrowQuery = new EscrowQueryClient(cosmWasmClient, config.escrowAddress);
  
  return {
    cosmWasmClient,
    registryQuery,
    escrowQuery,
  };
}

/**
 * Create signing clients for HTTPay contracts
 */
export function createSigningClients(
  signingClient: SigningCosmWasmClient,
  walletAddress: string,
  config: HTTPaySDKConfig
): {
  registry: RegistryClient;
  escrow: EscrowClient;
} {
  const registry = new RegistryClient(signingClient, walletAddress, config.registryAddress);
  const escrow = new EscrowClient(signingClient, walletAddress, config.escrowAddress);
  
  return {
    registry,
    escrow,
  };
}

/**
 * Create empty clients object
 */
export function createEmptyClients(): HTTPayClients {
  return {
    registryQuery: null,
    escrowQuery: null,
    registry: null,
    escrow: null,
    cosmWasmClient: null,
    signingClient: null,
  };
}

/**
 * Handle and normalize errors from SDK operations
 */
export function handleSDKError(error: unknown, operation: string): Error {
  if (error instanceof Error) {
    return new Error(`${operation}: ${error.message}`);
  }
  
  if (typeof error === "string") {
    return new Error(`${operation}: ${error}`);
  }
  
  if (error && typeof error === "object" && "message" in error) {
    return new Error(`${operation}: ${String(error.message)}`);
  }
  
  return new Error(`${operation}: Unknown error occurred`);
}

/**
 * Extract escrow ID from transaction attributes
 */
export function extractEscrowIdFromTx(txHash: string, events: any[]): number | null {
  try {
    for (const event of events) {
      if (event.type === "wasm") {
        for (const attr of event.attributes) {
          if (attr.key === "escrow_id") {
            return parseInt(attr.value, 10);
          }
        }
      }
    }
  } catch (error) {
    console.warn("Failed to extract escrow ID from transaction:", error);
  }
  
  return null;
}

/**
 * Convert base64 string to regular string
 */
export function fromBase64(base64String: string): string {
  try {
    return Buffer.from(base64String, "base64").toString("utf-8");
  } catch {
    return base64String; // Return as-is if not valid base64
  }
}

/**
 * Convert string to base64
 */
export function toBase64(input: string): string {
  return Buffer.from(input, "utf-8").toString("base64");
}

/**
 * Validate wallet address format
 */
export function isValidAddress(address: string, prefix = "neutron"): boolean {
  const regex = new RegExp(`^${prefix}1[a-z0-9]{38,58}$`);
  return regex.test(address);
}

/**
 * Format token amount for display
 */
export function formatTokenAmount(amount: string, decimals = 6): string {
  const num = Number(amount) / Math.pow(10, decimals);
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(num);
}

/**
 * Parse token amount from user input to smallest unit
 */
export function parseTokenAmount(amount: string, decimals = 6): string {
  const num = Number(amount);
  if (isNaN(num) || num < 0) {
    throw new Error("Invalid amount");
  }
  
  return Math.floor(num * Math.pow(10, decimals)).toString();
}

/**
 * Get short address for display (e.g., "neutron1abc...xyz")
 */
export function getShortAddress(address: string, startChars = 10, endChars = 6): string {
  if (address.length <= startChars + endChars) {
    return address;
  }
  
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

/**
 * Calculate blocks until expiration
 */
export function getBlocksUntilExpiration(expirationBlock: number, currentBlock: number): number {
  return Math.max(0, expirationBlock - currentBlock);
}

/**
 * Estimate time until expiration (assuming ~6 second block time)
 */
export function estimateTimeUntilExpiration(expirationBlock: number, currentBlock: number): string {
  const blocks = getBlocksUntilExpiration(expirationBlock, currentBlock);
  const seconds = blocks * 6; // Approximate block time
  
  if (seconds < 60) {
    return `${seconds}s`;
  }
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m`;
  }
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ${minutes % 60}m`;
  }
  
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
}

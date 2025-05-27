import * as z from "zod";
import { CosmWasmClient, SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { 
  RegistryClient, 
  RegistryQueryClient 
} from "../Registry/Registry.client";
import * as RegistryTypes from "../Registry/Registry.types";
import { 
  EscrowClient, 
  EscrowQueryClient
} from "../Escrow/Escrow.client";
import * as EscrowTypes from "../Escrow/Escrow.types";

// SDK Configuration
export interface HTTPaySDKConfig {
  rpcEndpoint: string;
  chainId: string;
  registryAddress: string;
  escrowAddress: string;
  gasPrice: string;
  gasAdjustment: number;
}

// Client types
export interface HTTPayClients {
  // Query clients (read-only)
  registryQuery: RegistryQueryClient | null;
  escrowQuery: EscrowQueryClient | null;
  
  // Signing clients (for transactions)
  registry: RegistryClient | null;
  escrow: EscrowClient | null;
  
  // Base clients
  cosmWasmClient: CosmWasmClient | null;
  signingClient: SigningCosmWasmClient | null;
}

// Form schemas and types
export const toolRegistrationSchema = z.object({
  toolId: z.string().min(3, "Tool ID must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  price: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Price must be a positive number"),
  endpoint: z.string().url("Please enter a valid URL"),
  denom: z.string().optional(),
});

export const escrowCreationSchema = z.object({
  toolId: z.string().min(1, "Tool ID is required"),
  maxFee: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Max fee must be a positive number"),
  authToken: z.string().min(1, "Auth token is required"),
  ttl: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, "TTL must be a positive number"),
});

export const escrowVerificationSchema = z.object({
  escrowId: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Escrow ID must be a positive number"),
  authToken: z.string().min(1, "Auth token is required"),
  providerAddr: z.string().min(1, "Provider address is required"),
});

export const usagePostingSchema = z.object({
  escrowId: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Escrow ID must be a positive number"),
  usageFee: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Usage fee must be a positive number"),
});

// Form types
export type ToolRegistrationForm = z.infer<typeof toolRegistrationSchema>;
export type EscrowCreationForm = z.infer<typeof escrowCreationSchema>;
export type EscrowVerificationForm = z.infer<typeof escrowVerificationSchema>;
export type UsagePostingForm = z.infer<typeof usagePostingSchema>;

// API types - Use the types from httpay-sdk
export type Tool = RegistryTypes.ToolResponse;
export type Escrow = EscrowTypes.EscrowResponse;

// Filter types
export interface EscrowsFilter {
  caller?: string;
  provider?: string;
  startAfter?: number;
  limit?: number;
}

// Connection state type
export interface ConnectionState {
  isConnected: boolean;
  hasSigningCapabilities: boolean;
  walletAddress: string | null;
  currentBlockHeight: number | null;
}

// Result types
export interface LockFundsResult {
  transactionHash: string;
  escrowId: number;
  denom?: string;
}

export interface PostUsageResult {
  transactionHash: string;
  claimedAmount: string;
}

export interface VerificationResult {
  isValid: boolean;
  error?: string;
  escrow?: Escrow;
  blockHeight?: number;
}

export interface RegistrationResult {
  transactionHash: string;
  toolId: string;
}

export interface ReleaseResult {
  transactionHash: string;
  releasedAmount: string;
  escrowId: number;
}

// Loading states
export interface LoadingStates {
  connecting: boolean;
  wallet: boolean;
  tools: boolean;
  escrows: boolean;
  registerTool: boolean;
  updateEndpoint: boolean;
  lockFunds: boolean;
  verifyEscrow: boolean;
  postUsage: boolean;
  pauseTool: boolean;
  resumeTool: boolean;
  updatePrice: boolean;
  updateDenom: boolean;
  refundEscrow: boolean;
  claimFees: boolean;
  [key: string]: boolean;
}

// Main context type
export interface HTTPaySDKContextType {
  // Configuration
  config: HTTPaySDKConfig;
  setConfig: (config: HTTPaySDKConfig) => void;
  
  // Connection state
  isConnected: boolean;
  hasSigningCapabilities: boolean;
  
  // Clients
  clients: HTTPayClients;
  
  // Wallet integration
  walletAddress: string | null;
  isWalletConnected: boolean;
  isWalletConnecting: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  
  // Data
  tools: Tool[];
  escrows: Escrow[];
  hasMoreEscrows: boolean;
  currentBlockHeight: number | null;
  
  // Loading states
  loading: LoadingStates;
  setLoadingState: (key: string, loading: boolean) => void;
  
  // Connection methods
  initializeSDK: () => Promise<void>;
  initializeWalletSDK: () => Promise<void>;
  forceReconnectWallet: () => Promise<void>;
  
  // Registry methods
  loadTools: () => Promise<void>;
  registerTool: (toolData: ToolRegistrationForm) => Promise<void>;
  updateEndpoint: (toolId: string, endpoint: string) => Promise<void>;
  updatePrice: (toolId: string, price: string) => Promise<void>;
  updateDenom: (toolId: string, denom: string) => Promise<void>;
  pauseTool: (toolId: string) => Promise<void>;
  resumeTool: (toolId: string) => Promise<void>;
  
  // Escrow methods
  loadEscrows: (filter?: EscrowsFilter) => Promise<void>;
  loadMoreEscrows: () => Promise<void>;
  resetEscrowsFilter: () => Promise<void>;
  lockFunds: (escrowData: EscrowCreationForm) => Promise<LockFundsResult | undefined>;
  verifyEscrow: (verificationData: EscrowVerificationForm) => Promise<VerificationResult>;
  postUsage: (usageData: UsagePostingForm) => Promise<void>;
  refundExpired: (escrowId: number) => Promise<void>;
  claimFees: (denom?: string) => Promise<void>;
  
  // Utility methods
  getCurrentBlockHeight: () => Promise<number>;
  handleError: (error: Error | unknown, operation: string) => void;
}

import { HTTPaySDK, HTTPaySDKConfig } from "httpay";
import type { ToolResponse, EscrowResponse } from "httpay";
import * as z from "zod";

// Form schema for tool registration
export const registerToolSchema = z.object({
  toolId: z.string().min(3, {
    message: "Tool ID must be at least 3 characters.",
  }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }),
  price: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Price must be a positive number.",
  }),
  endpoint: z.string().url({
    message: "Please enter a valid URL.",
  }),
});

export type RegisterToolFormData = z.infer<typeof registerToolSchema>;

export interface ToolRegistrationForm {
  toolId: string;
  price: string;
  description: string;
  endpoint: string;
}

export interface EscrowCreationForm {
  toolId: string;
  maxFee: string;
  authToken: string;
  ttl: string;
}

export interface EscrowVerificationForm {
  escrowId: string;
  authToken: string;
  providerAddr: string;
}

export interface UsagePostingForm {
  escrowId: string;
  usageFee: string;
}

// Use the ToolResponse from the provider SDK directly
export type Tool = ToolResponse;

// API Response types for tool endpoint testing
export interface APISuccessResponse {
  [key: string]: unknown;
}

export interface APIErrorResponse {
  error: true;
  message: string;
  timestamp: string;
}

export type APIResponse = APISuccessResponse | APIErrorResponse;

// Use the EscrowResponse from the provider SDK directly
export type Escrow = EscrowResponse;

export interface EscrowsFilter {
  caller?: string;
  provider?: string;
  startAfter?: number;
  limit?: number;
}

export interface SDKContextType {
  sdk: HTTPaySDK | null;
  isConnected: boolean;
  hasSigningCapabilities: boolean;
  loading: Record<string, boolean>;
  tools: Tool[];
  escrows: Escrow[];
  hasMoreEscrows: boolean;
  sdkConfig: HTTPaySDKConfig;
  walletAddress: string | undefined;
  isWalletConnected: boolean;
  isWalletConnecting: boolean;
  isWalletDisconnected: boolean;
  isWalletError: boolean;
  currentBlockHeight: number | null;
  
  // Actions
  setSdkConfig: (config: HTTPaySDKConfig) => void;
  initializeSDK: () => Promise<void>;
  initSDKWithWallet: () => Promise<HTTPaySDK | null>;
  forceReconnectWallet: () => Promise<void>;
  registerTool: (toolData: ToolRegistrationForm) => Promise<void>;
  updateEndpoint: (toolId: string, endpoint: string) => Promise<void>;
  loadTools: () => Promise<void>;
  lockFunds: (escrowData: EscrowCreationForm) => Promise<void>;
  loadEscrows: (filter?: EscrowsFilter) => Promise<void>;
  loadMoreEscrows: () => Promise<void>;
  resetEscrowsFilter: () => void;
  verifyEscrow: (verificationData: EscrowVerificationForm) => Promise<void>;
  postUsage: (usageData: UsagePostingForm) => Promise<void>;
  connectWallet: () => void;
  disconnectWallet: () => void;
  setLoadingState: (key: string, value: boolean) => void;
  handleError: (error: Error | unknown, operation: string) => void;
}

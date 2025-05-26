import { HTTPaySDK, HTTPaySDKConfig } from "httpay";

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

export interface Tool {
  tool_id: string;
  price: string;
  provider: string;
  is_active: boolean;
  description?: string;
  endpoint: string;
}

export interface Escrow {
  escrow_id: number;
  caller: string;
  provider: string;
  max_fee: string;
  denom: string;
  expires: number;
  auth_token: string;
}

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
  handleError: (error: any, operation: string) => void;
}

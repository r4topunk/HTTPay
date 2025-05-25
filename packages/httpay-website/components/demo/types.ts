import { HTTPaySDK, HTTPaySDKConfig } from "httpay";

export interface ToolRegistrationForm {
  toolId: string;
  price: string;
  description: string;
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
}

export interface Escrow {
  id: string;
  tool_id: string;
  max_fee: string;
}

export interface SDKContextType {
  sdk: HTTPaySDK | null;
  isConnected: boolean;
  hasSigningCapabilities: boolean;
  loading: Record<string, boolean>;
  tools: Tool[];
  escrows: Escrow[];
  sdkConfig: HTTPaySDKConfig;
  walletAddress: string | undefined;
  walletStatus: string;
  
  // Actions
  setSdkConfig: (config: HTTPaySDKConfig) => void;
  initializeSDK: () => Promise<void>;
  initSDKWithWallet: () => Promise<HTTPaySDK | null>;
  forceReconnectWallet: () => Promise<void>;
  registerTool: (toolData: ToolRegistrationForm) => Promise<void>;
  loadTools: () => Promise<void>;
  lockFunds: (escrowData: EscrowCreationForm) => Promise<void>;
  loadEscrows: () => Promise<void>;
  verifyEscrow: (verificationData: EscrowVerificationForm) => Promise<void>;
  postUsage: (usageData: UsagePostingForm) => Promise<void>;
  connectWallet: () => void;
  disconnectWallet: () => void;
  setLoadingState: (key: string, value: boolean) => void;
  handleError: (error: any, operation: string) => void;
}

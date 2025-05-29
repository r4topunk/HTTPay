export interface HTTPayConfig {
  rpcEndpoint: string;
  registryAddress: string;
  escrowAddress: string;
  chainId?: string;
  gasPrice?: string;
  gasAdjustment?: number;
}

export interface ToolConfig {
  toolId: string;
  provider: {
    privateKey: string;
    address?: string;
  };
}

export interface PaymentValidationResult {
  isValid: boolean;
  escrow?: {
    id: number;
    provider: string;
    maxFee: string;
    expires: any;
  };
  error?: string;
}

export interface PaymentProcessResult {
  success: boolean;
  txHash?: string;
  fee?: string;
  error?: string;
}

export interface PaymentRequest {
  escrowId: string | number;
  authToken: string;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  escrow?: {
    id: number;
    provider: string;
    maxFee: string;
    expires: any;
  };
  usage?: {
    timestamp: string;
    fee: string;
    transactionHash: string;
  };
  error?: string;
  message?: string;
  details?: any;
}

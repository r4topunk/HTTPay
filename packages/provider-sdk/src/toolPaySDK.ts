/**
 * import { CosmWasmClient, SigningCosmWasmClient } from '@cosmjs/cosmwasm-stargate';olPaySDK Main Class
 * 
 * This is the main entry point for the ToolPay Provider SDK.
 * It combines all the components into a unified API.
 */

import { CosmWasmClient, SigningCosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { EscrowClient } from './clients/EscrowClient.js';
import { RegistryClient } from './clients/RegistryClient.js';
import { EscrowVerifier, VerifyEscrowParams } from './escrowVerifier.js';
import { UsageReporter, PostUsageParams } from './usageReporter.js';
import { SDK_VERSION } from './index.js';
import { 
  validateConfig, 
  createWalletFromMnemonic, 
  createSigningClientFromWallet, 
  normalizeError,
  // Import error classes (not as types)
  ConfigurationError,
  NetworkError
} from './utils/index.js';

/**
 * Configuration for the ToolPaySDK
 */
export interface ToolPaySDKConfig {
  /** RPC endpoint URL for connecting to the chain */
  rpcEndpoint: string;
  
  /** Chain ID */
  chainId: string;
  
  /** Registry contract address */
  registryAddress: string;
  
  /** Escrow contract address */
  escrowAddress: string;
  
  /** Optional: Gas adjustment factor (default: 1.3) */
  gasAdjustment?: number;
  
  /** Optional: Custom client (if you need specialized configuration) */
  customClient?: CosmWasmClient | SigningCosmWasmClient;
}

/**
 * Main SDK class for ToolPay Provider SDK
 */
export class ToolPaySDK {
  /** SDK version for compatibility checks */
  static readonly VERSION = SDK_VERSION;
  
  /** Configuration for this SDK instance */
  private readonly config: ToolPaySDKConfig;
  
  /** Client for CosmWasm interaction */
  private client?: CosmWasmClient | SigningCosmWasmClient;
  
  /** Registry contract client */
  private registryClient?: RegistryClient;
  
  /** Escrow contract client */
  private escrowClient?: EscrowClient;
  
  /** Escrow verifier for checking escrow validity */
  private _escrowVerifier?: EscrowVerifier;
  
  /** Usage reporter for posting usage and claiming funds */
  private _usageReporter?: UsageReporter;
  
  /**
   * Create a new ToolPaySDK instance
   * 
   * @param config - SDK configuration
   */
  constructor(config: ToolPaySDKConfig) {
    try {
      // Validate the configuration before proceeding
      validateConfig(config);
      
      this.config = {
        gasAdjustment: 1.3,
        ...config
      };
      
      // Use custom client if provided
      if (config.customClient) {
        this.client = config.customClient;
        this.initializeClients();
      }
    } catch (error: unknown) {
      // Use our type guard from normalizeError to safely extract message
      function hasMessage(obj: unknown): obj is { message: string } {
        return typeof obj === 'object' && obj !== null && 'message' in obj && 
          typeof (obj as { message: unknown }).message === 'string';
      }
      
      const errorMessage = hasMessage(error) ? error.message : 'Unknown error';
      throw new ConfigurationError(`Failed to initialize ToolPaySDK: ${errorMessage}`, 
        { originalError: error });
    }
  }
  
  /**
   * Get the SDK version
   */
  get version(): string {
    return ToolPaySDK.VERSION;
  }
  
  /**
   * Connect to the chain using a read-only client
   * 
   * @returns This SDK instance for chaining
   */
  async connect(): Promise<ToolPaySDK> {
    try {
      if (!this.client) {
        this.client = await CosmWasmClient.connect(this.config.rpcEndpoint);
        this.initializeClients();
      }
      return this;
    } catch (error: unknown) {
      // Use the same type guard for consistent error handling
      function hasMessage(obj: unknown): obj is { message: string } {
        return typeof obj === 'object' && obj !== null && 'message' in obj && 
          typeof (obj as { message: unknown }).message === 'string';
      }
      
      const errorMessage = hasMessage(error) ? error.message : 'Unknown error';
      throw new NetworkError(`Failed to connect to RPC endpoint: ${errorMessage}`, 
        { endpoint: this.config.rpcEndpoint, originalError: error });
    }
  }
  
  /**
   * Connect to the chain with a signing client using a mnemonic
   * 
   * @param mnemonic - The wallet mnemonic phrase
   * @param prefix - Optional bech32 prefix (default: "neutron")
   * @returns This SDK instance for chaining
   */
  async connectWithMnemonic(mnemonic: string, prefix = 'neutron'): Promise<ToolPaySDK> {
    try {
      if (!this.client || !('execute' in this.client)) {
        // Use our helper function from utils
        const wallet = await createWalletFromMnemonic(mnemonic, { prefix });
        
        // Connect to the chain with a signing client
        this.client = await createSigningClientFromWallet(
          this.config.rpcEndpoint,
          wallet,
          undefined, // Default gas price
          { prefix }
        );
        
        this.initializeClients();
      }
      
      return this;
    } catch (error: unknown) {
      throw normalizeError(error, 'Failed to connect with mnemonic');
    }
  }
  
  /**
   * Connect to the chain with an existing signing client
   * 
   * @param signingClient - An existing SigningCosmWasmClient
   * @returns This SDK instance for chaining
   */
  connectWithSigningClient(signingClient: SigningCosmWasmClient): ToolPaySDK {
    if (!signingClient) {
      throw new ConfigurationError('Signing client cannot be null or undefined');
    }
    
    this.client = signingClient;
    this.initializeClients();
    return this;
  }
  
  /**
   * Get wallet address from the current signing client
   * 
   * @returns The first address in the connected wallet, or null if no signing client
   */
  async getWalletAddress(): Promise<string | null> {
    if (!this.hasSigningCapability()) {
      return null;
    }
    
    try {
      // Since we can't access the signer directly, we'll use a workaround
      // We can get the wallet address from transaction simulation or other methods
      // For now, we'll just return null with a note that this needs implementation
      console.warn('getWalletAddress needs implementation - signer is private');
      return null;
      
      // Alternative implementation could use:
      // 1. Store the wallet when connecting with mnemonic
      // 2. Use getAccount() method if it exists
      // 3. Use a different approach to access the address
    } catch (error: unknown) {
      throw normalizeError(error, 'Failed to get wallet address');
    }
  }
  
  /**
   * Initialize client instances for contracts
   * 
   * @private
   */
  private initializeClients(): void {
    if (!this.client) {
      throw new ConfigurationError('Client not initialized. Call connect() first.');
    }
    
    this.registryClient = new RegistryClient(this.client, this.config.registryAddress);
    this.escrowClient = new EscrowClient(this.client, this.config.escrowAddress);
    
    // Initialize core components
    this._escrowVerifier = new EscrowVerifier(this.escrowClient);
    
    // Only create UsageReporter if we have a signing client
    if ('execute' in this.client) {
      this._usageReporter = new UsageReporter(this.escrowClient);
    }
  }
  
  /**
   * Get the registry client
   * 
   * @returns Registry client instance
   */
  get registry(): RegistryClient {
    if (!this.registryClient) {
      throw new ConfigurationError('Registry client not initialized. Call connect() first.');
    }
    return this.registryClient;
  }
  
  /**
   * Get the escrow client
   * 
   * @returns Escrow client instance
   */
  get escrow(): EscrowClient {
    if (!this.escrowClient) {
      throw new ConfigurationError('Escrow client not initialized. Call connect() first.');
    }
    return this.escrowClient;
  }
  
  /**
   * Get the escrow verifier
   * 
   * @returns Escrow verifier instance
   */
  get escrowVerifier(): EscrowVerifier {
    if (!this._escrowVerifier) {
      throw new ConfigurationError('Escrow verifier not initialized. Call connect() first.');
    }
    return this._escrowVerifier;
  }
  
  /**
   * Get the usage reporter (requires signing client)
   * 
   * @returns Usage reporter instance
   */
  get usageReporter(): UsageReporter {
    if (!this._usageReporter) {
      throw new ConfigurationError(
        'Usage reporter not initialized. Call connectWithMnemonic() or connectWithSigningClient() first.'
      );
    }
    return this._usageReporter;
  }
  
  /**
   * Verify an escrow (convenience method)
   * 
   * @param params - Verification parameters
   * @returns Promise with verification result
   */
  async verifyEscrow(params: VerifyEscrowParams) {
    try {
      return await this.escrowVerifier.verifyEscrow(params);
    } catch (error: unknown) {
      throw normalizeError(error, 'Failed to verify escrow');
    }
  }
  
  /**
   * Post usage and claim funds (convenience method)
   * 
   * @param senderAddress - Address of the sender
   * @param params - Usage parameters
   * @returns Promise with posting result
   */
  async postUsage(senderAddress: string, params: PostUsageParams) {
    try {
      return await this.usageReporter.postUsage(senderAddress, params);
    } catch (error: unknown) {
      throw normalizeError(error, 'Failed to post usage');
    }
  }
  
  /**
   * Get the current client
   * 
   * @returns CosmWasm client
   */
  getClient(): CosmWasmClient | SigningCosmWasmClient | undefined {
    return this.client;
  }
  
  /**
   * Check if the SDK has a signing client
   * 
   * @returns True if the client supports signing transactions
   */
  hasSigningCapability(): boolean {
    return !!this.client && 'execute' in this.client;
  }
}

/**
 * ToolPaySDK Main Class
 * 
 * This is the main entry point for the ToolPay Provider SDK.
 * It combines all the components into a unified API.
 */

import { CosmWasmClient, SigningCosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';

import { EscrowClient } from './clients/EscrowClient.js';
import { RegistryClient } from './clients/RegistryClient.js';
import { EscrowVerifier, VerifyEscrowParams } from './escrowVerifier.js';
import { UsageReporter, PostUsageParams } from './usageReporter.js';
import { SDK_VERSION } from './index.js';

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
    this.config = {
      gasAdjustment: 1.3,
      ...config
    };
    
    // Use custom client if provided
    if (config.customClient) {
      this.client = config.customClient;
      this.initializeClients();
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
    if (!this.client) {
      this.client = await CosmWasmClient.connect(this.config.rpcEndpoint);
      this.initializeClients();
    }
    return this;
  }
  
  /**
   * Connect to the chain with a signing client using a mnemonic
   * 
   * @param mnemonic - The wallet mnemonic phrase
   * @param prefix - Optional bech32 prefix (default: "neutron")
   * @returns This SDK instance for chaining
   */
  async connectWithMnemonic(mnemonic: string, prefix = 'neutron'): Promise<ToolPaySDK> {
    if (!this.client || !('execute' in this.client)) {
      const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
        prefix,
      });
      
      // Connect to the chain with a signing client
      this.client = await SigningCosmWasmClient.connectWithSigner(
        this.config.rpcEndpoint,
        wallet
      );
      
      this.initializeClients();
    }
    
    return this;
  }
  
  /**
   * Connect to the chain with an existing signing client
   * 
   * @param signingClient - An existing SigningCosmWasmClient
   * @returns This SDK instance for chaining
   */
  connectWithSigningClient(signingClient: SigningCosmWasmClient): ToolPaySDK {
    this.client = signingClient;
    this.initializeClients();
    return this;
  }
  
  /**
   * Initialize client instances for contracts
   * 
   * @private
   */
  private initializeClients(): void {
    if (!this.client) {
      throw new Error('Client not initialized. Call connect() first.');
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
      throw new Error('Registry client not initialized. Call connect() first.');
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
      throw new Error('Escrow client not initialized. Call connect() first.');
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
      throw new Error('Escrow verifier not initialized. Call connect() first.');
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
      throw new Error('Usage reporter not initialized. Call connectWithMnemonic() or connectWithSigningClient() first.');
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
    return this.escrowVerifier.verifyEscrow(params);
  }
  
  /**
   * Post usage and claim funds (convenience method)
   * 
   * @param senderAddress - Address of the sender
   * @param params - Usage parameters
   * @returns Promise with posting result
   */
  async postUsage(senderAddress: string, params: PostUsageParams) {
    return this.usageReporter.postUsage(senderAddress, params);
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

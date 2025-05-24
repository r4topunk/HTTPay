/**
 * HTTPaySDK Main Class
 *
 * This is the main entry point for the HTTPay Provider SDK.
 * It combines all the components into a unified API for interacting
 * with HTTPay smart contracts on the Neutron blockchain.
 *
 * @example
 * ```typescript
 * // Initialize the SDK
 * const sdk = new HTTPaySDK({
 *   rpcEndpoint: 'https://rpc-pion-1.neutron.org',
 *   chainId: 'pion-1',
 *   registryAddress: 'neutron1...',
 *   escrowAddress: 'neutron1...',
 * });
 *
 * // Connect to the blockchain
 * await sdk.connect();
 *
 * // Verify an escrow
 * const verification = await sdk.verifyEscrow({
 *   escrowId: '123',
 *   authToken: 'your-auth-token',
 *   providerAddr: 'neutron1youraddress',
 * });
 *
 * // Connect with a wallet to perform transactions
 * await sdk.connectWithMnemonic('your mnemonic phrase here');
 *
 * // Post usage and claim funds
 * const result = await sdk.postUsage('neutron1youraddress', {
 *   escrowId: '123',
 *   usageFee: '500000',
 * });
 * ```
 */

import { CosmWasmClient, SigningCosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { EscrowClient } from './clients/EscrowClient';
import { RegistryClient } from './clients/RegistryClient';
import { EscrowVerifier } from './escrowVerifier';
import type { VerifyEscrowParams } from './escrowVerifier';
import { UsageReporter } from './usageReporter';
import type { PostUsageParams } from './usageReporter';
import { SDK_VERSION } from './version';
import {
  validateConfig,
  createWalletFromMnemonic,
  createWalletFromPrivateKey,
  createSigningClientFromWallet,
  normalizeError,
  createCosmosKitContext,
  executeViaCosmosKit,
  // Import types
  CosmosKitContext,
  // Import error classes (not as types)
  ConfigurationError,
  NetworkError,
} from './utils/index';

/**
 * Configuration for the HTTPaySDK
 *
 * Contains all the parameters needed to connect to the blockchain and
 * interact with HTTPay smart contracts.
 */
export interface HTTPaySDKConfig {
  /** RPC endpoint URL for connecting to the chain */
  rpcEndpoint: string;

  /** Chain ID */
  chainId: string;

  /** Registry contract address */
  registryAddress: string;

  /** Escrow contract address */
  escrowAddress: string;

  /** Optional: Gas price in denom format (e.g., "0.025untrn") */
  gasPrice?: string;

  /** Optional: Gas adjustment factor (default: 1.3) */
  gasAdjustment?: number;

  /** Optional: Custom client (if you need specialized configuration) */
  customClient?: CosmWasmClient | SigningCosmWasmClient;
}

/**
 * Main SDK class for HTTPay Provider SDK
 *
 * This class provides a unified API for interacting with HTTPay smart contracts.
 * It combines all the components of the SDK (EscrowVerifier, UsageReporter, etc.)
 * into a single interface with convenient methods for common operations.
 */
export class HTTPaySDK {
  /** SDK version for compatibility checks */
  static readonly VERSION = SDK_VERSION;

  /** Configuration for this SDK instance */
  private readonly config: HTTPaySDKConfig;

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
   * CosmosKit context for handling wallet integrations
   * @private
   */
  private _cosmosKitContext?: CosmosKitContext;

  /**
   * Create a new HTTPaySDK instance
   *
   * @param config - SDK configuration with network and contract details
   * @throws ConfigurationError if the configuration is invalid
   */
  constructor(config: HTTPaySDKConfig) {
    try {
      // Validate the configuration before proceeding
      validateConfig(config);

      this.config = {
        gasAdjustment: 1.3,
        ...config,
      };

      // Use custom client if provided
      if (config.customClient) {
        this.client = config.customClient;
        this.initializeClients();
      }
    } catch (error: unknown) {
      // Use our type guard from normalizeError to safely extract message
      function hasMessage(obj: unknown): obj is { message: string } {
        return (
          typeof obj === 'object' &&
          obj !== null &&
          'message' in obj &&
          typeof (obj as { message: unknown }).message === 'string'
        );
      }

      const errorMessage = hasMessage(error) ? error.message : 'Unknown error';
      throw new ConfigurationError(`Failed to initialize HTTPaySDK: ${errorMessage}`, {
        originalError: error,
      });
    }
  }

  /**
   * Get the SDK version
   *
   * @returns The version of the SDK
   */
  get version(): string {
    return HTTPaySDK.VERSION;
  }

  /**
   * Connect to the chain using a read-only client
   *
   * This method establishes a connection to the blockchain using
   * a non-signing client that can only query data but not send transactions.
   *
   * @returns This SDK instance for chaining
   * @throws NetworkError if connection fails
   */
  async connect(): Promise<HTTPaySDK> {
    try {
      if (!this.client) {
        this.client = await CosmWasmClient.connect(this.config.rpcEndpoint);
        this.initializeClients();
      }
      return this;
    } catch (error: unknown) {
      // Use the same type guard for consistent error handling
      function hasMessage(obj: unknown): obj is { message: string } {
        return (
          typeof obj === 'object' &&
          obj !== null &&
          'message' in obj &&
          typeof (obj as { message: unknown }).message === 'string'
        );
      }

      const errorMessage = hasMessage(error) ? error.message : 'Unknown error';
      throw new NetworkError(`Failed to connect to RPC endpoint: ${errorMessage}`, {
        endpoint: this.config.rpcEndpoint,
        originalError: error,
      });
    }
  }

  /**
   * Connect to the chain with a signing client using a mnemonic
   *
   * This method establishes a connection to the blockchain using
   * a signing client that can send transactions. The client is created
   * from a mnemonic phrase that represents a wallet.
   *
   * @param mnemonic - The wallet mnemonic phrase
   * @param prefix - Optional bech32 prefix (default: "neutron")
   * @returns This SDK instance for chaining
   * @throws NetworkError if connection fails
   */
  async connectWithMnemonic(mnemonic: string, prefix = 'neutron'): Promise<HTTPaySDK> {
    try {
      if (!this.client || !('execute' in this.client)) {
        // Use our helper function from utils
        const wallet = await createWalletFromMnemonic(mnemonic, { prefix });

        // Connect to the chain with a signing client
        this.client = await createSigningClientFromWallet(
          this.config.rpcEndpoint,
          wallet,
          this.config.gasPrice, // Use gas price from config
          { prefix },
        );

        this.initializeClients();
      }

      return this;
    } catch (error: unknown) {
      throw normalizeError(error, 'Failed to connect with mnemonic');
    }
  }

  /**
   * Connect to the chain with a signing client using a private key
   *
   * This method establishes a connection to the blockchain using
   * a signing client that can send transactions. The client is created
   * from a hex-encoded private key.
   *
   * @param privateKeyHex - The hex-encoded private key (without 0x prefix)
   * @param prefix - Optional bech32 prefix (default: "neutron")
   * @returns This SDK instance for chaining
   * @throws NetworkError if connection fails
   */
  async connectWithPrivateKey(privateKeyHex: string, prefix = 'neutron'): Promise<HTTPaySDK> {
    try {
      if (!this.client || !('execute' in this.client)) {
        // Use our helper function from utils
        const wallet = await createWalletFromPrivateKey(privateKeyHex, { prefix });

        // Connect to the chain with a signing client
        this.client = await createSigningClientFromWallet(
          this.config.rpcEndpoint,
          wallet,
          this.config.gasPrice, // Use gas price from config
          { prefix },
        );

        this.initializeClients();
      }

      return this;
    } catch (error: unknown) {
      throw normalizeError(error, 'Failed to connect with private key');
    }
  }

  /**
   * Connect to the chain with an existing signing client
   *
   * This method uses an existing SigningCosmWasmClient instance
   * to interact with the blockchain. This is useful if you have
   * specific requirements for client initialization or if you're
   * sharing a client across multiple SDKs.
   *
   * @param signingClient - An existing SigningCosmWasmClient
   * @returns This SDK instance for chaining
   * @throws ConfigurationError if the signing client is invalid
   */
  connectWithSigningClient(signingClient: SigningCosmWasmClient): HTTPaySDK {
    if (!signingClient) {
      throw new ConfigurationError('Signing client cannot be null or undefined');
    }

    this.client = signingClient;
    this.initializeClients();
    return this;
  }

  /**
   * Connect to the chain with CosmosKit integration
   * 
   * This method handles compatibility between CosmosKit and the SDK by creating
   * a context that can be used for transactions without directly using CosmosKit's
   * SigningCosmWasmClient (which may have version incompatibilities).
   * 
   * @param getSigningClient - Function to get CosmosKit's signing client when needed
   * @param walletAddress - The wallet address from CosmosKit
   * @returns This SDK instance for chaining
   * @throws ConfigurationError if parameters are invalid
   */
  connectWithCosmosKit(
    getSigningClient: () => Promise<any>,
    walletAddress: string
  ): HTTPaySDK {
    this._cosmosKitContext = createCosmosKitContext(getSigningClient, walletAddress);
    return this;
  }

  /**
   * Get wallet address from the current signing client
   *
   * Attempts to retrieve the wallet address associated with the
   * current signing client, if available.
   *
   * @returns The first address in the connected wallet, or null if no signing client
   * @throws NetworkError if retrieving the address fails
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
   * This method creates client instances for the Registry and Escrow
   * contracts, as well as the EscrowVerifier and UsageReporter.
   *
   * @private
   * @throws ConfigurationError if the client is not initialized
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
   * @throws ConfigurationError if the client is not initialized
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
   * @throws ConfigurationError if the client is not initialized
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
   * @throws ConfigurationError if the client is not initialized
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
   * @throws ConfigurationError if a signing client is not initialized
   */
  get usageReporter(): UsageReporter {
    if (!this._usageReporter) {
      throw new ConfigurationError(
        'Usage reporter not initialized. Call connectWithMnemonic() or connectWithSigningClient() first.',
      );
    }
    return this._usageReporter;
  }

  /**
   * Verify an escrow (convenience method)
   *
   * This is a convenience method that delegates to the EscrowVerifier.
   * It verifies that an escrow exists, is valid, and is authorized
   * for a specific provider.
   *
   * @param params - Verification parameters
   * @returns Promise with verification result
   * @throws Error if verification fails
   */
  async verifyEscrow(params: VerifyEscrowParams) {
    try {
      // Delegate to prototype to ensure mocks on prototype are invoked
      return await EscrowVerifier.prototype.verifyEscrow.call(this.escrowVerifier, params);
    } catch (error: unknown) {
      throw normalizeError(error, 'Failed to verify escrow');
    }
  }

  /**
   * Post usage and claim funds (convenience method)
   *
   * This is a convenience method that delegates to the UsageReporter.
   * It submits a transaction to claim funds from an escrow after
   * services have been rendered.
   *
   * @param senderAddress - Address of the sender
   * @param params - Usage parameters
   * @returns Promise with posting result
   * @throws Error if posting usage fails
   */
  async postUsage(senderAddress: string, params: PostUsageParams) {
    try {
      // Delegate to prototype to ensure mocks on prototype are invoked
      return await UsageReporter.prototype.postUsage.call(
        this.usageReporter,
        senderAddress,
        params,
      );
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

  /**
   * Check if the SDK has CosmosKit integration
   * 
   * @returns True if CosmosKit integration is available
   */
  hasCosmosKitIntegration(): boolean {
    return !!this._cosmosKitContext;
  }

  /**
   * Execute a contract message using CosmosKit
   * 
   * This method uses CosmosKit's signing client to execute a contract message,
   * avoiding version incompatibilities between CosmosKit and the SDK.
   * 
   * @param contractAddress - Contract address
   * @param msg - Message to send
   * @param gasLimit - Gas limit for the transaction
   * @param funds - Funds to send with the transaction
   * @returns Result of the execution
   * @throws Error if CosmosKit integration is not available or execution fails
   */
  async executeWithCosmosKit(
    contractAddress: string,
    msg: Record<string, unknown>,
    gasLimit: number,
    funds: { denom: string; amount: string }[] = []
  ): Promise<any> {
    if (!this._cosmosKitContext) {
      throw new ConfigurationError(
        'CosmosKit integration not available. Call connectWithCosmosKit() first.'
      );
    }
    
    return executeViaCosmosKit(
      this._cosmosKitContext,
      contractAddress,
      msg,
      gasLimit,
      funds
    );
  }
}

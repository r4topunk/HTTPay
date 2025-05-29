import { CosmWasmClient, SigningCosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { DirectSecp256k1Wallet } from '@cosmjs/proto-signing';
import { GasPrice } from '@cosmjs/stargate';

import { EscrowQueryClient, EscrowClient } from '../Escrow/Escrow.client';
import { RegistryQueryClient } from '../Registry/Registry.client';
import type { EscrowResponse } from '../Escrow/Escrow.types';

import type {
  HTTPayConfig,
  ToolConfig,
  PaymentValidationResult,
  PaymentProcessResult,
  PaymentRequest
} from './types';

/**
 * High-level HTTPay provider class that simplifies contract interactions
 */
export class HTTPayProvider {
  private config: HTTPayConfig;
  private tool: ToolConfig;
  private cosmWasmClient?: CosmWasmClient;
  private signingClient?: SigningCosmWasmClient;
  private providerAddress?: string;

  constructor(config: HTTPayConfig, tool: ToolConfig) {
    this.config = config;
    this.tool = tool;
  }

  /**
   * Initialize the provider with blockchain connections
   */
  async initialize(): Promise<void> {
    // Create CosmWasm client
    this.cosmWasmClient = await CosmWasmClient.connect(this.config.rpcEndpoint);

    // Create signing client with provider wallet
    const { client, address } = await this.createSigningClient();
    this.signingClient = client;
    this.providerAddress = address;
  }

  /**
   * Validate payment credentials (escrow ID and auth token)
   */
  async validatePayment(payment: PaymentRequest): Promise<PaymentValidationResult> {
    if (!this.cosmWasmClient) {
      throw new Error('HTTPayProvider not initialized. Call initialize() first.');
    }

    try {
      const escrowId = typeof payment.escrowId === 'string' 
        ? parseInt(payment.escrowId, 10) 
        : payment.escrowId;

      if (isNaN(escrowId)) {
        return {
          isValid: false,
          error: 'Invalid escrowId format - must be a number'
        };
      }

      const escrowQueryClient = new EscrowQueryClient(
        this.cosmWasmClient,
        this.config.escrowAddress
      );

      const escrowResponse: EscrowResponse = await escrowQueryClient.getEscrow({
        escrowId: escrowId
      });

      // Validate auth token (simple comparison for now)
      if (escrowResponse.auth_token !== payment.authToken) {
        return {
          isValid: false,
          error: 'Invalid authentication token'
        };
      }

      // Check if funds are sufficient (escrow exists means it's active)
      const maxFee = parseFloat(escrowResponse.max_fee || '0');
      if (maxFee <= 0) {
        return {
          isValid: false,
          error: 'Insufficient funds in escrow'
        };
      }

      return {
        isValid: true,
        escrow: {
          id: escrowId,
          provider: escrowResponse.provider || '',
          maxFee: escrowResponse.max_fee || '0',
          expires: escrowResponse.expires
        }
      };

    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Unknown validation error'
      };
    }
  }

  /**
   * Get tool pricing from registry
   */
  async getToolPrice(): Promise<{ price?: string; error?: string }> {
    if (!this.cosmWasmClient) {
      throw new Error('HTTPayProvider not initialized. Call initialize() first.');
    }

    try {
      const registryQueryClient = new RegistryQueryClient(
        this.cosmWasmClient,
        this.config.registryAddress
      );

      const toolResponse = await registryQueryClient.getTool({ 
        toolId: this.tool.toolId 
      });

      if (!toolResponse?.price) {
        return { error: 'Tool price not found in registry' };
      }

      return { price: toolResponse.price };

    } catch (error) {
      return { 
        error: error instanceof Error ? error.message : 'Failed to fetch tool price'
      };
    }
  }

  /**
   * Process payment by releasing escrow funds
   */
  async processPayment(escrowId: number, usageFee: string): Promise<PaymentProcessResult> {
    if (!this.signingClient || !this.providerAddress) {
      throw new Error('HTTPayProvider not initialized. Call initialize() first.');
    }

    try {
      const escrowClient = new EscrowClient(
        this.signingClient,
        this.providerAddress,
        this.config.escrowAddress
      );

      const result = await escrowClient.release(
        {
          escrowId: escrowId,
          usageFee: usageFee
        },
        'auto'
      );

      return {
        success: true,
        txHash: result.transactionHash,
        fee: usageFee
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment processing failed'
      };
    }
  }

  /**
   * Complete payment flow: validate + process
   */
  async handlePayment(payment: PaymentRequest): Promise<{
    validation: PaymentValidationResult;
    processing?: PaymentProcessResult;
    price?: string;
  }> {
    // Step 1: Validate payment credentials
    const validation = await this.validatePayment(payment);
    if (!validation.isValid) {
      return { validation };
    }

    // Step 2: Get tool price
    const priceResult = await this.getToolPrice();
    if (priceResult.error) {
      return {
        validation: {
          isValid: false,
          error: `Failed to get tool price: ${priceResult.error}`
        }
      };
    }

    // Step 3: Process payment
    const escrowId = typeof payment.escrowId === 'string' 
      ? parseInt(payment.escrowId, 10) 
      : payment.escrowId;

    const processing = await this.processPayment(escrowId, priceResult.price!);

    return {
      validation,
      processing,
      price: priceResult.price
    };
  }

  /**
   * Private helper to create signing client
   */
  private async createSigningClient(): Promise<{ client: SigningCosmWasmClient; address: string }> {
    const privateKey = this.tool.provider.privateKey;
    
    if (!privateKey || !/^[0-9a-fA-F]{64}$/.test(privateKey)) {
      throw new Error('Invalid private key. Must be a 64-character hex string.');
    }

    const privateKeyBytes = new Uint8Array(
      privateKey.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []
    );
    
    const wallet = await DirectSecp256k1Wallet.fromKey(privateKeyBytes, 'neutron');
    const [providerAccount] = await wallet.getAccounts();
    
    const gasPrice = this.config.gasPrice || '0.025untrn';
    const client = await SigningCosmWasmClient.connectWithSigner(
      this.config.rpcEndpoint,
      wallet,
      { gasPrice: GasPrice.fromString(gasPrice) }
    );

    return { client, address: providerAccount.address };
  }
}

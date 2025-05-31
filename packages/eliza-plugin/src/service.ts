import {
  CosmWasmClient,
  SigningCosmWasmClient,
} from "@cosmjs/cosmwasm-stargate"
import { DirectSecp256k1Wallet } from "@cosmjs/proto-signing"
import { GasPrice } from "@cosmjs/stargate"
import { RegistryQueryClient, EscrowClient, EscrowQueryClient } from "httpay"
import { logger } from "@elizaos/core"
import type { HTTPayConfig, HTTPayTool, TransactionResult } from "./types.js"

/**
 * HTTPay Service - Core service for interacting with HTTPay contracts
 * Provides tool listing and escrow creation functionality
 */
export class HTTPayService {
  private config: HTTPayConfig
  private cosmWasmClient?: CosmWasmClient
  private signingClient?: SigningCosmWasmClient
  private wallet?: DirectSecp256k1Wallet
  private registryClient?: RegistryQueryClient
  private escrowClient?: EscrowClient
  private escrowQueryClient?: EscrowQueryClient
  private walletAddress?: string
  private selectedTool?: HTTPayTool // Store selected tool for state persistence

  constructor(config: HTTPayConfig) {
    this.config = {
      gasPrice: "0.025untrn",
      gasAdjustment: 1.5,
      ...config,
    }
  }

  /**
   * Initialize the service - set up clients and wallet
   */
  async initialize(): Promise<void> {
    try {
      logger.info("Initializing HTTPay service...")

      // Create wallet from private key using helper
      const { wallet, address } = await this.createWalletFromPrivateKey(this.config.privateKey)
      this.wallet = wallet
      this.walletAddress = address
      logger.info(`Wallet address: ${this.walletAddress}`)

      // Initialize CosmWasm clients
      this.cosmWasmClient = await CosmWasmClient.connect(
        this.config.rpcEndpoint
      )

      this.signingClient = await SigningCosmWasmClient.connectWithSigner(
        this.config.rpcEndpoint,
        this.wallet,
        {
          gasPrice: GasPrice.fromString(this.config.gasPrice!),
        }
      )

      // Initialize contract clients
      this.registryClient = new RegistryQueryClient(
        this.cosmWasmClient,
        this.config.registryAddress
      )

      this.escrowClient = new EscrowClient(
        this.signingClient,
        this.walletAddress,
        this.config.escrowAddress
      )

      this.escrowQueryClient = new EscrowQueryClient(
        this.cosmWasmClient,
        this.config.escrowAddress
      )

      logger.info("HTTPay service initialized successfully")
    } catch (error) {
      logger.error("Failed to initialize HTTPay service:", error)
      throw new Error(`HTTPay service initialization failed: ${error.message}`)
    }
  }

  /**
   * List all available tools from the registry
   */
  async listTools(): Promise<HTTPayTool[]> {
    try {
      if (!this.registryClient) {
        throw new Error("HTTPay service not initialized")
      }

      logger.info("Fetching tools from registry...")
      const toolsResponse = await this.registryClient.getTools()

      // Transform the response to our tool interface
      const tools: HTTPayTool[] = toolsResponse.tools.map((tool) => ({
        toolId: tool.tool_id,
        name: tool.tool_id, // Use tool_id as name for MVP
        description: tool.description || "No description available",
        price: tool.price,
        provider: tool.provider,
        endpoint: tool.endpoint,
        denom: tool.denom,
      }))

      logger.info(`Found ${tools.length} tools`)
      return tools
    } catch (error) {
      logger.error("Failed to list tools:", error)
      throw new Error(`Failed to fetch tools: ${error.message}`)
    }
  }

  /**
   * Get a specific tool by ID
   */
  async getTool(toolId: string): Promise<HTTPayTool | null> {
    try {
      if (!this.registryClient) {
        throw new Error("HTTPay service not initialized")
      }

      logger.info(`Fetching tool: ${toolId}`)
      const toolResponse = await this.registryClient.getTool({ toolId })

      // toolResponse is directly a ToolResponse object
      const tool: HTTPayTool = {
        toolId: toolResponse.tool_id,
        name: toolResponse.tool_id,
        description: toolResponse.description || "No description available",
        price: toolResponse.price,
        provider: toolResponse.provider,
        endpoint: toolResponse.endpoint,
        denom: toolResponse.denom,
      }

      return tool
    } catch (error) {
      logger.error(`Failed to get tool ${toolId}:`, error)
      return null // Return null if tool not found
    }
  }

  /**
   * Create an escrow payment for a tool
   */
  async createEscrow(
    toolId: string,
    maxFee?: string
  ): Promise<TransactionResult> {
    try {
      if (!this.escrowClient || !this.walletAddress) {
        throw new Error("HTTPay service not initialized")
      }

      // Get tool to determine price if maxFee not provided
      const tool = await this.getTool(toolId)
      if (!tool) {
        throw new Error(`Tool ${toolId} not found`)
      }

      const fee = maxFee || tool.price
      logger.info(`Creating escrow for tool ${toolId} with fee ${fee}`)

      // Validate fee format (basic validation)
      if (!fee || isNaN(parseFloat(fee)) || parseFloat(fee) <= 0) {
        throw new Error('Invalid fee amount')
      }

      // Calculate expires (50 blocks from now for MVP)
      const expires = 50 // Simple approach for MVP
      const authToken = `auth_${Date.now()}_${Math.random().toString(36).substring(2)}`

      const result = await this.escrowClient.lockFunds(
        {
          toolId,
          maxFee: fee,
          authToken,
          expires,
        },
        "auto",
        undefined,
        [{ denom: tool.denom || "untrn", amount: fee }]
      )

      logger.info(`Escrow created successfully. TX: ${result.transactionHash}`)
      // Log only safe transaction details (avoid BigInt serialization issues)
      logger.info(`Transaction height: ${result.height}`)
      logger.info(`Gas used: ${result.gasUsed}/${result.gasWanted}`)

      // Extract escrow ID from transaction events
      let escrowId: number | undefined

      if (result.events) {
        // Look for the wasm-toolpay.locked event
        for (const event of result.events) {
          if (event.type === 'wasm-toolpay.locked' || event.type === 'wasm') {
            for (const attr of event.attributes) {
              if (attr.key === 'escrow_id' && attr.value) {
                const parsedId = parseInt(attr.value)
                if (!isNaN(parsedId)) {
                  escrowId = parsedId
                  logger.info(`Extracted escrow ID: ${escrowId}`)
                  break
                }
              }
            }
          }
          if (escrowId) break // Exit outer loop if found
        }
      }

      // If we couldn't extract escrow ID from events, try to parse logs
      if (!escrowId && result.logs) {
        for (const log of result.logs) {
          for (const event of log.events) {
            if (event.type === 'wasm' || event.type.includes('toolpay')) {
              for (const attr of event.attributes) {
                if (attr.key === 'escrow_id' && attr.value) {
                  const parsedId = parseInt(attr.value)
                  if (!isNaN(parsedId)) {
                    escrowId = parsedId
                    logger.info(`Extracted escrow ID from logs: ${escrowId}`)
                    break
                  }
                }
              }
            }
          }
          if (escrowId) break // Exit outer loop if found
        }
      }

      if (!escrowId) {
        logger.warn("Could not extract escrow ID from transaction events")
        // For now, we'll still return success but without escrow ID
      }

      return {
        success: true,
        txHash: result.transactionHash,
        escrowId,
        // Add additional useful information
        authToken,
        tool: {
          toolId: tool.toolId,
          name: tool.name,
          endpoint: tool.endpoint,
          provider: tool.provider,
          price: tool.price,
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      logger.error(`Failed to create escrow for ${toolId}:`, errorMessage)
      return {
        success: false,
        error: errorMessage,
      }
    }
  }

  /**
   * Get escrow details by ID
   */
  async getEscrow(escrowId: number): Promise<any> {
    try {
      if (!this.escrowQueryClient) {
        throw new Error("HTTPay service not initialized")
      }

      logger.info(`Fetching escrow details: ${escrowId}`)
      const escrowResponse = await this.escrowQueryClient.getEscrow({ escrowId })
      
      return escrowResponse
    } catch (error) {
      logger.error(`Failed to get escrow ${escrowId}:`, error)
      throw new Error(`Failed to fetch escrow: ${error.message}`)
    }
  }

  /**
   * List escrows for the current wallet
   */
  async getMyEscrows(limit?: number): Promise<any> {
    try {
      if (!this.escrowQueryClient || !this.walletAddress) {
        throw new Error("HTTPay service not initialized")
      }

      logger.info(`Fetching escrows for caller: ${this.walletAddress}`)
      const escrowsResponse = await this.escrowQueryClient.getEscrows({
        caller: this.walletAddress,
        limit: limit || 50
      })
      
      return escrowsResponse
    } catch (error) {
      logger.error("Failed to get user escrows:", error)
      throw new Error(`Failed to fetch escrows: ${error.message}`)
    }
  }

  /**
   * List escrows for a specific provider
   */
  async getProviderEscrows(provider: string, limit?: number): Promise<any> {
    try {
      if (!this.escrowQueryClient) {
        throw new Error("HTTPay service not initialized")
      }

      logger.info(`Fetching escrows for provider: ${provider}`)
      const escrowsResponse = await this.escrowQueryClient.getEscrows({
        provider,
        limit: limit || 50
      })
      
      return escrowsResponse
    } catch (error) {
      logger.error(`Failed to get provider escrows for ${provider}:`, error)
      throw new Error(`Failed to fetch provider escrows: ${error.message}`)
    }
  }

  /**
   * Validate escrow credentials (similar to HTTPayProvider but for consumers)
   */
  async validateEscrowAccess(escrowId: number, authToken: string): Promise<{
    isValid: boolean;
    error?: string;
    escrow?: any;
  }> {
    try {
      if (!this.escrowQueryClient) {
        throw new Error("HTTPay service not initialized")
      }

      const escrowResponse = await this.escrowQueryClient.getEscrow({ escrowId })

      // Validate auth token
      if (escrowResponse.auth_token !== authToken) {
        return {
          isValid: false,
          error: 'Invalid authentication token'
        }
      }

      // Check if escrow is still active (not expired)
      // Note: In a real implementation, you'd want to check block height
      return {
        isValid: true,
        escrow: escrowResponse
      }

    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Unknown validation error'
      }
    }
  }

  /**
   * Set the selected tool (for persistence across message cycles)
   */
  setSelectedTool(tool: HTTPayTool): void {
    this.selectedTool = tool
    logger.info(`HTTPay Service: Selected tool stored: ${tool.toolId}`)
  }

  /**
   * Get the selected tool
   */
  getSelectedTool(): HTTPayTool | undefined {
    return this.selectedTool
  }

  /**
   * Clear the selected tool
   */
  clearSelectedTool(): void {
    this.selectedTool = undefined
    logger.info("HTTPay Service: Selected tool cleared")
  }

  /**
   * Get wallet address
   */
  getWalletAddress(): string | undefined {
    return this.walletAddress
  }

  /**
   * Check if service is initialized
   */
  isInitialized(): boolean {
    return !!(this.cosmWasmClient && this.signingClient && this.walletAddress)
  }

  /**
   * Create wallet helper (extracted from initialize for reusability)
   */
  private async createWalletFromPrivateKey(privateKey: string, prefix: string = "neutron"): Promise<{
    wallet: DirectSecp256k1Wallet;
    address: string;
  }> {
    // Validate private key format
    if (!privateKey || !/^[0-9a-fA-F]{64}$/.test(privateKey)) {
      throw new Error('Invalid private key. Must be a 64-character hex string.')
    }

    const privateKeyBytes = new Uint8Array(
      privateKey.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []
    )
    
    const wallet = await DirectSecp256k1Wallet.fromKey(privateKeyBytes, prefix)
    const [account] = await wallet.getAccounts()
    
    return { wallet, address: account.address }
  }

  /**
   * Safe JSON stringify that handles BigInt values
   */
  private safeStringify(obj: any): string {
    return JSON.stringify(obj, (key, value) => {
      // Convert BigInt to string for serialization
      if (typeof value === 'bigint') {
        return value.toString()
      }
      return value
    }, 2)
  }
}

import {
  CosmWasmClient,
  SigningCosmWasmClient,
} from "@cosmjs/cosmwasm-stargate"
import { DirectSecp256k1HdWallet, DirectSecp256k1Wallet } from "@cosmjs/proto-signing"
import { GasPrice } from "@cosmjs/stargate"
import { RegistryQueryClient, EscrowClient } from "httpay"
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
  private walletAddress?: string

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

      // Create wallet from private key
      const privateKeyBytes = new Uint8Array(
        this.config.privateKey.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []
      );
      this.wallet = await DirectSecp256k1Wallet.fromKey(
        privateKeyBytes,
        "neutron"
      )

      const accounts = await this.wallet.getAccounts()
      this.walletAddress = accounts[0].address
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

      // Extract escrow ID from events (simplified for MVP)
      const escrowId = Date.now() // Placeholder for MVP

      return {
        success: true,
        txHash: result.transactionHash,
        escrowId,
      }
    } catch (error) {
      logger.error(`Failed to create escrow for ${toolId}:`, error)
      return {
        success: false,
        error: error.message,
      }
    }
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
}

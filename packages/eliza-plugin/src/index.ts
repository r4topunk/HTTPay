import type { Plugin } from "@elizaos/core"
import {
  type Action,
  type IAgentRuntime,
  type Memory,
  Service,
  type State,
  logger,
} from "@elizaos/core"
import { z } from "zod"

// Import HTTPay components
import { HTTPayService } from "./service.js"
import { validateEnvironment } from "./utils.js"
import type { HTTPayMVPState } from "./types.js"

// Import actions
import { listToolsAction } from "./actions/listTools.js"
import { selectToolAction } from "./actions/selectTool.js"
import { confirmPaymentAction } from "./actions/confirmPayment.js"

/**
 * HTTPay configuration schema
 */
const httpayConfigSchema = z.object({
  HTTPAY_PRIVATE_KEY: z
    .string()
    .min(64, "Private key must be 64 characters (32 bytes in hex)")
    .max(64, "Private key must be 64 characters (32 bytes in hex)"),
  HTTPAY_RPC_ENDPOINT: z
    .string()
    .url("Must be a valid RPC endpoint URL")
    .default("https://rpc.neutron.org"),
  HTTPAY_REGISTRY_CONTRACT: z
    .string()
    .min(1, "Registry contract address is required"),
  HTTPAY_ESCROW_CONTRACT: z
    .string()
    .min(1, "Escrow contract address is required"),
})

/**
 * HTTPay Service for Eliza
 * Integrates HTTPay SDK with Eliza runtime
 */
class HTTPayElizaService extends Service {
  private httpayService?: HTTPayService

  static serviceType = "httpay"

  capabilityDescription =
    "HTTPay integration service for blockchain tool payments"

  constructor(runtime: IAgentRuntime) {
    super(runtime)
  }

  static async start(runtime: IAgentRuntime) {
    logger.info("Starting HTTPay service...")
    const service = new HTTPayElizaService(runtime)
    await service.initialize(runtime)
    return service
  }

  static async stop(runtime: IAgentRuntime) {
    logger.info("Stopping HTTPay service...")
    // Cleanup if needed
  }

  async stop() {
    logger.info("HTTPay service stopped")
    // Cleanup if needed
  }

  async initialize(runtime: IAgentRuntime): Promise<void> {
    try {
      logger.info("Initializing HTTPay Eliza service...")

      // Validate environment configuration
      const config = validateEnvironment()

      // Create and initialize HTTPay service
      this.httpayService = new HTTPayService({
        privateKey: config.HTTPAY_PRIVATE_KEY,
        rpcEndpoint: config.HTTPAY_RPC_ENDPOINT,
        registryAddress: config.HTTPAY_REGISTRY_CONTRACT,
        escrowAddress: config.HTTPAY_ESCROW_CONTRACT,
      })

      await this.httpayService.initialize()

      logger.info("HTTPay Eliza service initialized successfully")
    } catch (error) {
      logger.error("Failed to initialize HTTPay Eliza service:", error)
      throw error
    }
  }

  // Expose HTTPay service methods
  async listTools() {
    return this.httpayService?.listTools() || []
  }

  async getTool(toolId: string) {
    return this.httpayService?.getTool(toolId) || null
  }

  async createEscrow(toolId: string, maxFee?: string) {
    if (!this.httpayService) {
      throw new Error("HTTPay service not initialized")
    }
    return this.httpayService.createEscrow(toolId, maxFee)
  }

  getWalletAddress() {
    return this.httpayService?.getWalletAddress()
  }

  isInitialized() {
    return this.httpayService?.isInitialized() || false
  }
}

/**
 * State initialization for HTTPay
 */
async function initializeState(
  runtime: IAgentRuntime,
  message: Memory
): Promise<State> {
  const state = await runtime.composeState(message)

  // Initialize HTTPay state if not present
  if (!state.httpay) {
    state.httpay = {} as HTTPayMVPState
  }

  return state
}

/**
 * HTTPay Plugin for Eliza
 * Enables AI agents to discover, select, and pay for blockchain tools
 */
export const httpayPlugin: Plugin = {
  name: "httpay",
  description:
    "HTTPay integration plugin - enables AI agents to discover, select, and pay for blockchain tools using escrow payments",

  actions: [listToolsAction, selectToolAction, confirmPaymentAction],

  evaluators: [],
  providers: [],

  services: [HTTPayElizaService],
}

// Export everything for use
export default httpayPlugin
export * from "./types.js"
export * from "./service.js"
export * from "./utils.js"
export { listToolsAction, selectToolAction, confirmPaymentAction }

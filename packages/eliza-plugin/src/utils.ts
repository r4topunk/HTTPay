import { z } from "zod"
import { logger } from "@elizaos/core"
import type { HTTPayEnvConfig } from "./types.js"

/**
 * Environment validation schema
 */
const envSchema = z.object({
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
 * Validate and parse environment variables
 */
export function validateEnvironment(): HTTPayEnvConfig {
  try {
    const env = {
      HTTPAY_PRIVATE_KEY: process.env.HTTPAY_PRIVATE_KEY,
      HTTPAY_RPC_ENDPOINT:
        process.env.HTTPAY_RPC_ENDPOINT || "https://rpc.neutron.org",
      HTTPAY_REGISTRY_CONTRACT: process.env.HTTPAY_REGISTRY_CONTRACT,
      HTTPAY_ESCROW_CONTRACT: process.env.HTTPAY_ESCROW_CONTRACT,
    }

    const result = envSchema.parse(env)
    logger.info("Environment validation successful")
    return result
  } catch (error) {
    logger.error("Environment validation failed:", error)
    throw new Error(`Environment configuration error: ${error.message}`)
  }
}

/**
 * Format price for display
 */
export function formatPrice(price: string, denom: string = "untrn"): string {
  try {
    const amount = parseInt(price)
    if (isNaN(amount)) {
      return `${price} ${denom}`
    }

    // Convert microunits to units (assuming 6 decimal places)
    const formatted = (amount / 1_000_000).toFixed(6)
    const unit = denom.startsWith("u") ? denom.slice(1).toUpperCase() : denom

    return `${formatted} ${unit}`
  } catch (error) {
    logger.warn(`Failed to format price ${price}:`, error)
    return `${price} ${denom}`
  }
}

/**
 * Format tool information for display
 */
export function formatToolInfo(tool: {
  toolId: string
  name: string
  description: string
  price: string
  provider: string
  denom?: string
}): string {
  const formattedPrice = formatPrice(tool.price, tool.denom)

  return `🔧 ${tool.name} (ID: ${tool.toolId})
📄 ${tool.description}
💰 Price: ${formattedPrice}
👤 Provider: ${tool.provider}`
}

/**
 * Format tools list for display
 */
export function formatToolsList(
  tools: Array<{
    toolId: string
    name: string
    description: string
    price: string
    provider: string
    denom?: string
  }>
): string {
  if (tools.length === 0) {
    return "❌ No tools available in the registry."
  }

  const header = `🛠️ Available HTTPay Tools (${tools.length} total)\n\n`

  const toolsList = tools
    .map((tool, index) => {
      const formattedPrice = formatPrice(tool.price, tool.denom)
      return `${index + 1}. ${tool.name} - ${formattedPrice}
   📄 ${tool.description}
   🆔 Tool ID: ${tool.toolId}
   👤 Provider: ${tool.provider}`
    })
    .join("\n\n")

  return (
    header +
    toolsList +
    '\n\n💡 Use "Select tool [tool-id]" to choose a tool for payment.'
  )
}

/**
 * Format transaction confirmation
 */
export function formatTransactionResult(result: {
  success: boolean
  txHash?: string
  error?: string
  escrowId?: number
  authToken?: string
  tool?: {
    toolId: string
    name: string
    endpoint?: string
    provider: string
    price: string
  }
}): string {
  if (!result.success) {
    return `❌ Transaction Failed
🚫 Error: ${result.error || "Unknown error occurred"}`
  }

  const tool = result.tool
  const escrowInfo = result.escrowId ? `🆔 Escrow ID: ${result.escrowId}` : "🆔 Escrow ID: (extracting...)"

  let responseText = `✅ Payment Escrow Created Successfully!

🔗 Transaction Hash: ${result.txHash}
${escrowInfo}
💡 Your payment is now secured in escrow and will be released when the service is provided.`

  if (tool) {
    responseText += `

📋 Service Details:
🔧 Tool: ${tool.name} (${tool.toolId})
💰 Locked Amount: ${formatPrice(tool.price)}
👤 Provider: ${tool.provider}`

    if (tool.endpoint) {
      responseText += `
🌐 API Endpoint: ${tool.endpoint}`
    }

    if (result.authToken) {
      responseText += `

🔑 Authentication Token: \`${result.authToken}\`
💡 Use this token when calling the API endpoint to authorize your payment.`
    }

    responseText += `

🚀 Next Steps:
1. Call the API endpoint with your auth token
2. The provider will verify your payment and provide the service
3. Payment will be automatically released upon service completion`
  }

  return responseText
}

/**
 * Truncate long strings for display
 */
export function truncateString(str: string, maxLength: number = 100): string {
  if (str.length <= maxLength) {
    return str
  }
  return str.substring(0, maxLength - 3) + "..."
}

/**
 * Validate tool ID format
 */
export function isValidToolId(toolId: string): boolean {
  // Basic validation - tool IDs should be non-empty strings
  return typeof toolId === "string" && toolId.trim().length > 0
}

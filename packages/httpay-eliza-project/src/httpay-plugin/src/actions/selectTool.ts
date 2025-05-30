import type {
  Action,
  IAgentRuntime,
  Memory,
  State,
  HandlerCallback,
} from "@elizaos/core"
import { logger } from "@elizaos/core"
import { z } from "zod"
import type { HTTPayService } from "../service.js"
import type { HTTPayMVPState } from "../types.js"
import { formatToolInfo, isValidToolId } from "../utils.js"

/**
 * SELECT_HTTPAY_TOOL Action - Select a tool and store it in conversation state
 */
export const selectToolAction: Action = {
  name: "SELECT_HTTPAY_TOOL",
  description:
    "Select a specific tool from the HTTPay registry and store it on state for later payment",

  validate: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State
  ): Promise<boolean> => {
    try {
      logger.info("Validating SELECT_HTTPAY_TOOL action")
      const text = message.content.text.toLowerCase().trim()

      // Don't trigger if this looks like a list request
      const listPattern = /^(?:list|show|display|get|see|view)\s+(?:available\s+)?tools?$/
      if (listPattern.test(text)) {
        logger.info("SELECT_HTTPAY_TOOL: Detected list request, skipping")
        return false
      }

      // Don't trigger if this looks like a confirmation without tool selection
      const confirmPattern = /^(?:confirm|yes|y|proceed|pay|make\s+payment)$/
      if (confirmPattern.test(text)) {
        logger.info("SELECT_HTTPAY_TOOL: Detected confirmation request, skipping")
        return false
      }

      // Look for specific tool selection patterns
      const toolIdMatch = text.match(
        /^(?:select|choose|pick|use)\s+(?:tool\s+)?([a-zA-Z0-9\-_]+)$/
      )

      logger.info("SELECT_HTTPAY_TOOL: Tool ID match", toolIdMatch)

      if (!toolIdMatch) {
        logger.info("SELECT_HTTPAY_TOOL: No tool ID match found")
        return false
      }

      const toolId = toolIdMatch[1]
      logger.info(`SELECT_HTTPAY_TOOL: Extracted tool ID: ${toolId}`)
      
      // Additional validation: ensure it's not a common word that might be misinterpreted
      const commonWords = ['tools', 'list', 'confirm', 'payment', 'yes', 'no']
      if (commonWords.includes(toolId)) {
        logger.info(`SELECT_HTTPAY_TOOL: Rejected common word: ${toolId}`)
        return false
      }
      
      const isValid = isValidToolId(toolId)
      logger.info(`SELECT_HTTPAY_TOOL: Tool ID validation result: ${isValid}`)
      return isValid
    } catch (error) {
      logger.error("SELECT_HTTPAY_TOOL validation failed:", error)
      return false
    }
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    options: any,
    callback?: HandlerCallback
  ): Promise<boolean> => {
    try {
      logger.info("=== SELECT_HTTPAY_TOOL HANDLER STARTED ===")
      logger.info("Executing SELECT_HTTPAY_TOOL action")
      logger.info(`SELECT_HTTPAY_TOOL handler: Processing message: "${message.content.text}"`)
      logger.info("SELECT_HTTPAY_TOOL handler: Current state:", JSON.stringify(state?.httpay || {}, null, 2))

      // Extract tool ID from the message
      const text = message.content.text.toLowerCase()
      logger.info("SELECT_HTTPAY_TOOL handler: Parsed text:", text)
      
      const toolIdMatch = text.match(
        /(?:select|choose|pick|use)\s+(?:tool\s+)?([a-zA-Z0-9\-_]+)/
      )
      logger.info("SELECT_HTTPAY_TOOL handler: Tool ID match result:", toolIdMatch)

      if (!toolIdMatch) {
        logger.error("SELECT_HTTPAY_TOOL handler: No tool ID match found in text")
        const errorMsg =
          '❌ Please specify a tool ID. Example: "select tool weather-api"'
        if (callback) {
          callback({
            text: errorMsg,
            content: { type: "error", error: "No tool ID specified" },
          })
        }
        return false
      }

      const toolId = toolIdMatch[1]
      logger.info("SELECT_HTTPAY_TOOL handler: Extracted tool ID:", toolId)

      // Get the HTTPay service
      logger.info("SELECT_HTTPAY_TOOL handler: Getting HTTPay service from runtime")
      const httpayService = runtime.getService("httpay") as any
      logger.info("SELECT_HTTPAY_TOOL handler: HTTPay service obtained:", !!httpayService)
      logger.info("SELECT_HTTPAY_TOOL handler: Service initialized:", httpayService?.isInitialized())

      if (!httpayService?.isInitialized()) {
        logger.error("SELECT_HTTPAY_TOOL handler: Service not available or not initialized")
        const errorMsg =
          "❌ HTTPay service not available. Please check configuration."
        if (callback) {
          callback({
            text: errorMsg,
            content: { type: "error", error: "Service not available" },
          })
        }
        return false
      }

      // Fetch the tool details
      logger.info("SELECT_HTTPAY_TOOL handler: Fetching tool details for:", toolId)
      const tool = await httpayService.getTool(toolId)
      logger.info("SELECT_HTTPAY_TOOL handler: Tool fetch result:", !!tool)

      if (!tool) {
        const errorMsg = `❌ Tool "${toolId}" not found in the registry.
💡 Use "list tools" to see available tools.`
        if (callback) {
          callback({
            text: errorMsg,
            content: { type: "error", error: "Tool not found" },
          })
        }
        return false
      }

      // Store the selected tool in state
      const httpayState: HTTPayMVPState = state.httpay || {}
      httpayState.selectedTool = {
        toolId: tool.toolId,
        name: tool.name,
        description: tool.description,
        price: tool.price,
        provider: tool.provider,
      }

      // Update the state
      state.httpay = httpayState
      
      // ALSO store in the service for persistence across message cycles
      const httpayElizaService = runtime.getService("httpay") as any
      if (httpayElizaService?.setSelectedTool) {
        httpayElizaService.setSelectedTool(tool)
        logger.info("SELECT_HTTPAY_TOOL: Tool also stored in service for persistence")
      }
      
      logger.info(`SELECT_HTTPAY_TOOL: Successfully stored tool in state:`, httpayState.selectedTool)

      // Format the response
      const responseText = `✅ Tool Selected Successfully!

${formatToolInfo(tool)}

💡 You can now use "confirm payment" to create an escrow transaction for this tool.`

      if (callback) {
        callback({
          text: responseText,
          content: {
            type: "tool_selected",
            selectedTool: httpayState.selectedTool,
          },
        })
      }

      logger.info(`Tool ${toolId} selected successfully`)
      return true
    } catch (error) {
      logger.error("SELECT_HTTPAY_TOOL action failed:", error)

      const errorMsg = `❌ Failed to select tool
🚫 Error: ${error.message}
💡 Please try again or check if the tool ID is correct.`

      if (callback) {
        callback({
          text: errorMsg,
          content: { type: "error", error: error.message },
        })
      }
      return false
    }
  },

  examples: [
    [
      {
        name: "{{user1}}",
        content: { text: "select tool weather-api" },
      },
      {
        name: "{{agent}}",
        content: {
          actions: ["SELECT_HTTPAY_TOOL"]
        },
      },
    ],
    [
      {
        name: "{{user1}}",
        content: { text: "choose data-analyzer" },
      },
      {
        name: "{{agent}}",
        content: {
          actions: ["SELECT_HTTPAY_TOOL"],
        },
      },
    ],
    [
      {
        name: "{{user1}}",
        content: { text: "pick tool weather-service" },
      },
      {
        name: "{{agent}}",
        content: {
          actions: ["SELECT_HTTPAY_TOOL"],
        },
      },
    ],
    [
      {
        name: "{{user1}}",
        content: { text: "use crypto-tracker" },
      },
      {
        name: "{{agent}}",
        content: {
          actions: ["SELECT_HTTPAY_TOOL"],
        },
      },
    ],
  ],
}

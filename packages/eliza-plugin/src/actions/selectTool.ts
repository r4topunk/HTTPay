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
    message: Memory
  ): Promise<boolean> => {
    try {
      logger.info("Validating SELECT_HTTPAY_TOOL action")
      // Extract tool ID from the message
      const text = message.content.text.toLowerCase()

      // Look for patterns like "select tool weather-api" or "choose weather-api"
      const toolIdMatch = text.match(
        /(?:select|choose|pick|use)\s+(?:tool\s+)?([a-zA-Z0-9\-_]+)/
      )

      logger.info("SELECT_HTTPAY_TOOL: Tool ID match", toolIdMatch)

      if (!toolIdMatch) {
        return false
      }

      const toolId = toolIdMatch[1]
      return isValidToolId(toolId)
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
      logger.info("Executing SELECT_HTTPAY_TOOL action")

      // Extract tool ID from the message
      const text = message.content.text.toLowerCase()
      const toolIdMatch = text.match(
        /(?:select|choose|pick|use)\s+(?:tool\s+)?([a-zA-Z0-9\-_]+)/
      )

      if (!toolIdMatch) {
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

      // Get the HTTPay service
      const httpayService = runtime.getService(
        "httpay"
      ) as unknown as HTTPayService

      if (!httpayService?.isInitialized()) {
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
      const tool = await httpayService.getTool(toolId)

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
        content: { text: "Choose data-analyzer" },
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
        content: { text: "Pick tool invalid-tool" },
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

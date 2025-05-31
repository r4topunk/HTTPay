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
import { formatToolsList } from "../utils.js"

/**
 * LIST_HTTPAY_TOOLS Action - Display available tools from HTTPay registry
 */
export const listToolsAction: Action = {
  name: "LIST_HTTPAY_TOOLS",
  description:
    "List all available tools from the HTTPay registry with their prices and descriptions",

  validate: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State
  ): Promise<boolean> => {
    try {
      const text = message.content.text.toLowerCase().trim()
      
      // Only validate for messages that clearly ask for listing tools
      // Make patterns more specific to avoid conflicts
      const listPatterns = [
        /^(?:list|show|display|get|see|view)\s+(?:available\s+)?tools?$/,
        /^what\s+tools?\s+(?:are\s+)?(?:available|exist)\??$/,
        /^show\s+me\s+(?:the\s+)?tools?$/,
        /^(?:available|existing)\s+tools?\??$/,
        /^tools?\s+(?:list|available)$/,
        /^list$/,  // Just "list" in context
        /^tools?$/  // Just "tools" in context
      ]
      
      const matches = listPatterns.some(pattern => pattern.test(text))
      
      // Additional check: don't trigger if this looks like a tool selection
      const selectPattern = /(?:select|choose|pick|use)\s+(?:tool\s+)?[a-zA-Z0-9\-_]+/
      const isSelection = selectPattern.test(text)
      
      // Additional check: don't trigger if this looks like a confirmation
      const confirmPattern = /(?:confirm|yes|pay|proceed)/
      const isConfirmation = confirmPattern.test(text)
      
      return matches && !isSelection && !isConfirmation
    } catch (error) {
      logger.error("LIST_HTTPAY_TOOLS validation failed:", error)
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
      logger.info("Executing LIST_HTTPAY_TOOLS action")

      // Get the HTTPay service from runtime
      const httpayService = runtime.getService(
        "httpay"
      ) as unknown as HTTPayService

      if (!httpayService) {
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

      if (!httpayService.isInitialized()) {
        const errorMsg =
          "❌ HTTPay service not initialized. Please check your configuration."
        if (callback) {
          callback({
            text: errorMsg,
            content: { type: "error", error: "Service not initialized" },
          })
        }
        return false
      }

      // Fetch tools from the registry
      const tools = await httpayService.listTools()

      // Format the tools list for display
      const formattedList = formatToolsList(tools)

      // Send the response
      if (callback) {
        callback({
          text: formattedList,
          content: {
            type: "tools_list",
            tools: tools.map((tool) => ({
              toolId: tool.toolId,
              name: tool.name,
              description: tool.description,
              price: tool.price,
              provider: tool.provider,
              denom: tool.denom,
            })),
          },
        })
      }

      logger.info(`Listed ${tools.length} tools successfully`)
      return true
    } catch (error) {
      logger.error("LIST_HTTPAY_TOOLS action failed:", error)

      const errorMsg = `❌ Failed to list tools
🚫 Error: ${error.message}
💡 Please check your HTTPay configuration and network connection.`

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
        content: { text: "list available tools" },
      },
      {
        name: "{{agent}}",
        content: {
          actions: ["LIST_HTTPAY_TOOLS"],
        },
      },
    ],
    [
      {
        name: "{{user1}}",
        content: { text: "what tools are available?" },
      },
      {
        name: "{{agent}}",
        content: {
          actions: ["LIST_HTTPAY_TOOLS"],
        },
      },
    ],
    [
      {
        name: "{{user1}}",
        content: { text: "show me the tools" },
      },
      {
        name: "{{agent}}",
        content: {
          actions: ["LIST_HTTPAY_TOOLS"],
        },
      },
    ],
    [
      {
        name: "{{user1}}",
        content: { text: "tools" },
      },
      {
        name: "{{agent}}",
        content: {
          actions: ["LIST_HTTPAY_TOOLS"],
        },
      },
    ],
    [
      {
        name: "{{user1}}",
        content: { text: "list" },
      },
      {
        name: "{{agent}}",
        content: {
          actions: ["LIST_HTTPAY_TOOLS"],
        },
      },
    ],
  ],
}

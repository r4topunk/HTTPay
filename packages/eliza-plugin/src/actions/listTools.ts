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
    message: Memory
  ): Promise<boolean> => {
    // This action can always be called - no specific validation needed
    return true
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

      const errorMsg = `❌ **Failed to list tools**
🚫 Error: ${error.message}
💡 *Please check your HTTPay configuration and network connection.*`

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
        content: { text: "List available tools" },
      },
      {
        name: "{{agent}}",
        content: {
          text: '🛠️ **Available HTTPay Tools** (3 total)\n\n1. **weather-api** - 1.000000 NTRN\n   📄 Get weather data for any location\n   🆔 Tool ID: `weather-api`\n   👤 Provider: neutron1abc...\n\n💡 *Use "Select tool [tool-id]" to choose a tool for payment.*',
          action: "LIST_HTTPAY_TOOLS",
        },
      },
    ],
    [
      {
        name: "{{user1}}",
        content: { text: "What tools are available?" },
      },
      {
        name: "{{agent}}",
        content: {
          text: '🛠️ **Available HTTPay Tools** (2 total)\n\n1. **data-analyzer** - 0.500000 NTRN\n   📄 Advanced data analysis service\n   🆔 Tool ID: `data-analyzer`\n   👤 Provider: neutron1def...\n\n💡 *Use "Select tool [tool-id]" to choose a tool for payment.*',
          action: "LIST_HTTPAY_TOOLS",
        },
      },
    ],
    [
      {
        name: "{{user1}}",
        content: { text: "Show me the tools" },
      },
      {
        name: "{{agent}}",
        content: {
          text: '🛠️ **Available HTTPay Tools** (1 total)\n\n1. **ai-assistant** - 2.000000 NTRN\n   📄 AI-powered assistant for various tasks\n   🆔 Tool ID: `ai-assistant`\n   👤 Provider: neutron1ghi...\n\n💡 *Use "Select tool [tool-id]" to choose a tool for payment.*',
          action: "LIST_HTTPAY_TOOLS",
        },
      },
    ],
  ],
}

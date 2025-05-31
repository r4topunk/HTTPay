import type {
  Action,
  IAgentRuntime,
  Memory,
  State,
  HandlerCallback,
} from "@elizaos/core";
import { logger } from "@elizaos/core";
import { z } from "zod";
import type { HTTPayService } from "../service.js";
import { formatToolsList } from "../utils.js";

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
      logger.info("LIST_HTTPAY_TOOLS: Starting validation");
      const text = message.content.text.toLowerCase().trim();
      logger.info(`LIST_HTTPAY_TOOLS: Validating text: "${text}"`);

      // Only validate for messages that clearly ask for listing tools
      // Make patterns more specific to avoid conflicts
      const listPatterns = [
        /^(?:list|show|display|get|see|view)\s+(?:available\s+)?tools?$/,
        /^what\s+tools?\s+(?:are\s+)?(?:available|exist)\??$/,
        /^show\s+me\s+(?:the\s+)?tools?$/,
        /^(?:available|existing)\s+tools?\??$/,
        /^tools?\s+(?:list|available)$/,
        /^list$/, // Just "list" in context
        /^tools?$/, // Just "tools" in context
      ];

      const matches = listPatterns.some((pattern) => pattern.test(text));
      logger.info(`LIST_HTTPAY_TOOLS: Pattern matches: ${matches}`);

      // Additional check: don't trigger if this looks like a tool selection
      const selectPattern =
        /(?:select|choose|pick|use)\s+(?:tool\s+)?[a-zA-Z0-9\-_]+/;
      const isSelection = selectPattern.test(text);
      logger.info(`LIST_HTTPAY_TOOLS: Is selection pattern: ${isSelection}`);

      // Additional check: don't trigger if this looks like a confirmation
      const confirmPattern = /(?:confirm|yes|pay|proceed)/;
      const isConfirmation = confirmPattern.test(text);
      logger.info(
        `LIST_HTTPAY_TOOLS: Is confirmation pattern: ${isConfirmation}`
      );

      const shouldValidate = matches && !isSelection && !isConfirmation;
      logger.info(`LIST_HTTPAY_TOOLS: Validation result: ${shouldValidate}`);

      return shouldValidate;
    } catch (error) {
      logger.error("LIST_HTTPAY_TOOLS: Validation failed:", error);
      return false;
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
      logger.info("LIST_HTTPAY_TOOLS: Starting action execution");
      logger.info(
        `LIST_HTTPAY_TOOLS: Message response: ${message.content.text}`
      );
      logger.info(`LIST_HTTPAY_TOOLS: Options: ${JSON.stringify(options)}`);

      // Get the HTTPay service from runtime
      logger.info(
        "LIST_HTTPAY_TOOLS: Attempting to get HTTPay service from runtime"
      );
      const httpayService = runtime.getService(
        "httpay"
      ) as unknown as HTTPayService;

      if (!httpayService) {
        logger.error("LIST_HTTPAY_TOOLS: HTTPay service not found in runtime");
        const errorMsg =
          "❌ HTTPay service not available. Please check configuration.";
        if (callback) {
          callback({
            text: errorMsg,
            type: "error",
            error: "Service not available",
          });
        }
        return false;
      }

      logger.info(
        "LIST_HTTPAY_TOOLS: HTTPay service found, checking initialization"
      );
      if (!httpayService.isInitialized()) {
        logger.error("LIST_HTTPAY_TOOLS: HTTPay service not initialized");
        const errorMsg =
          "❌ HTTPay service not initialized. Please check your configuration.";
        if (callback) {
          callback({
            text: errorMsg,
            type: "error",
            error: "Service not initialized",
          });
        }
        return false;
      }

      // Fetch tools from the registry
      logger.info("LIST_HTTPAY_TOOLS: Fetching tools from registry");
      const startTime = Date.now();
      const tools = await httpayService.listTools();
      const fetchTime = Date.now() - startTime;
      logger.info(
        `LIST_HTTPAY_TOOLS: Successfully fetched ${tools.length} tools in ${fetchTime}ms`
      );

      if (tools.length === 0) {
        logger.warn("LIST_HTTPAY_TOOLS: No tools found in registry");
      } else {
        logger.info(
          `LIST_HTTPAY_TOOLS: Tools found: ${tools.map((t) => t.name).join(", ")}`
        );
      }

      // Format the tools list for display
      logger.info("LIST_HTTPAY_TOOLS: Formatting tools list for display");
      const formattedList = formatToolsList(tools);
      logger.info(
        `LIST_HTTPAY_TOOLS: Formatted list length: ${formattedList.length} characters`
      );
      logger.info(
        `LIST_HTTPAY_TOOLS: Formatted list response: ${formattedList}`
      );

      // Send the response
      logger.info("LIST_HTTPAY_TOOLS: Sending response via callback");
      if (callback) {
        await callback({
          thought: formattedList,
          actions: ["LIST_HTTPAY_TOOLS"],
        });
        logger.info("LIST_HTTPAY_TOOLS: Response sent successfully");
      } else {
        logger.warn(
          "LIST_HTTPAY_TOOLS: No callback provided, response not sent"
        );
      }

      logger.info(
        `LIST_HTTPAY_TOOLS: Action completed successfully - listed ${tools.length} tools`
      );
      return true;
    } catch (error) {
      logger.error("LIST_HTTPAY_TOOLS: Action execution failed:", error);
      logger.error(
        `LIST_HTTPAY_TOOLS: Error details - Type: ${error.constructor.name}, Message: ${error.message}`
      );
      if (error.stack) {
        logger.info(`LIST_HTTPAY_TOOLS: Error stack trace: ${error.stack}`);
      }

      const errorMsg = `❌ Failed to list tools
🚫 Error: ${error.message}
💡 Please check your HTTPay configuration and network connection.`;

      logger.info(`LIST_HTTPAY_TOOLS: Sending error response via callback`);
      if (callback) {
        callback({
          text: errorMsg,
          type: "error",
          error: error.message,
        });
        logger.info("LIST_HTTPAY_TOOLS: Error response sent");
      } else {
        logger.warn(
          "LIST_HTTPAY_TOOLS: No callback provided for error response"
        );
      }

      logger.error(
        "LIST_HTTPAY_TOOLS: Action execution failed and returned false"
      );
      return false;
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
};

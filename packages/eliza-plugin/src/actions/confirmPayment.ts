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
import { formatTransactionResult, formatPrice } from "../utils.js"

/**
 * CONFIRM_HTTPAY_PAYMENT Action - Create escrow transaction for the selected tool and test the API
 */
export const confirmPaymentAction: Action = {
  name: "CONFIRM_HTTPAY_PAYMENT",
  description:
    "Confirm payment, create an escrow transaction for the selected tool, and test the tool's API with the escrow credentials. Run only after the user writes 'confirm'.",

  validate: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State
  ): Promise<boolean> => {
    try {
      // First check if there's a selected tool in state
      const httpayState: HTTPayMVPState = state?.httpay || {}
      if (!httpayState.selectedTool) {
        return false
      }

      // Then check if the message contains confirmation patterns
      const text = message.content.text.toLowerCase()
      const confirmPatterns = [
        /^(?:yes|y)$/,
        /^confirm(?:\s+payment)?$/,
        /^(?:proceed|go\s+ahead)$/,
        /^(?:pay|make\s+payment)$/,
        /^(?:pay\s+for\s+it)$/,
        /^(?:do\s+it)$/,
        /confirm.*payment/,
        /make.*payment/,
        /pay.*(?:for|it)/
      ]

      return confirmPatterns.some(pattern => pattern.test(text))
    } catch (error) {
      logger.error("CONFIRM_HTTPAY_PAYMENT validation failed:", error)
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
      logger.info("Executing CONFIRM_HTTPAY_PAYMENT action")
      logger.info("CONFIRM_HTTPAY_PAYMENT: Current state:", JSON.stringify(state?.httpay || {}, null, 2))

      // Get the selected tool from state
      const httpayState: HTTPayMVPState = state?.httpay || {}
      let selectedTool = httpayState.selectedTool

      // If not found in state, try to get from service (fallback for persistence)
      if (!selectedTool) {
        logger.info("CONFIRM_HTTPAY_PAYMENT: No tool in state, checking service...")
        const httpayElizaService = runtime.getService("httpay") as any
        if (httpayElizaService?.getSelectedTool) {
          const serviceTool = httpayElizaService.getSelectedTool()
          if (serviceTool) {
            selectedTool = {
              toolId: serviceTool.toolId,
              name: serviceTool.name,
              description: serviceTool.description,
              price: serviceTool.price,
              provider: serviceTool.provider,
            }
            logger.info("CONFIRM_HTTPAY_PAYMENT: Found tool in service:", selectedTool)
          }
        }
      } else {
        logger.info("CONFIRM_HTTPAY_PAYMENT: Found tool in state:", selectedTool)
      }

      if (!selectedTool) {
        const errorMsg = `❌ No tool selected
💡 Please select a tool first using "select tool [tool-id]" or "list tools" to see available options.`

        if (callback) {
          callback({
            text: errorMsg,
            content: { type: "error", error: "No tool selected" },
          })
        }
        return false
      }

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

      // Show confirmation details before proceeding
      const walletAddress = httpayService.getWalletAddress()
      const formattedPrice = formatPrice(selectedTool.price)

      const confirmationText = `💰 Payment Confirmation

🔧 Tool: ${selectedTool.name} (${selectedTool.toolId})
💵 Amount: ${formattedPrice}
👤 Provider: ${selectedTool.provider}
🏦 From Wallet: ${walletAddress}

🔄 Creating escrow transaction...`

      // Send confirmation message
      if (callback) {
        callback({
          text: confirmationText,
          content: {
            type: "payment_confirmation",
            tool: selectedTool,
            walletAddress,
          },
        })
      }

      // Create the escrow transaction
      const result = await httpayService.createEscrow(
        selectedTool.toolId,
        selectedTool.price
      )

      // Format and send the result
      const resultText = formatTransactionResult(result)

      if (callback) {
        callback({
          text: resultText,
          content: {
            type: "transaction_result",
            success: result.success,
            txHash: result.txHash,
            escrowId: result.escrowId,
            error: result.error,
          },
        })
      }

      if (result.success && result.escrowId && result.authToken && result.tool?.endpoint) {
        // Test the API after successful escrow creation
        logger.info("Testing API after successful escrow creation...")
        
        if (callback) {
          callback({
            text: "🧪 Testing API with escrow credentials...",
            content: {
              type: "api_testing",
              escrowId: result.escrowId,
              authToken: result.authToken,
            },
          })
        }

        try {
          // Build the API URL with escrow credentials
          const apiUrl = `${result.tool.endpoint}?escrowId=${result.escrowId}&authToken=${result.authToken}`
          
          logger.info(`Making API request to: ${apiUrl}`)

          // Make the API request
          const apiResponse = await fetch(apiUrl, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
          })

          const responseData = await apiResponse.json()

          if (!apiResponse.ok) {
            const errorMessage = (responseData as any)?.message || apiResponse.statusText
            throw new Error(`HTTP ${apiResponse.status}: ${errorMessage}`)
          }

          // Present the raw API response to the user
          const apiResultText = `✅ API Test Successful!

🔧 Tool: ${selectedTool.name} (${selectedTool.toolId})
🔗 Endpoint: ${result.tool.endpoint}
📊 Raw API Response:

\`\`\`json
${JSON.stringify(responseData, null, 2)}
\`\`\`

💰 Payment completed and tool accessed successfully!`

          if (callback) {
            callback({
              text: apiResultText,
              content: {
                type: "api_success",
                tool: selectedTool,
                escrowId: result.escrowId,
                apiResponse: responseData,
                endpoint: result.tool.endpoint,
              },
            })
          }

          logger.info(`API test successful for tool ${selectedTool.toolId}`)

        } catch (apiError) {
          const apiErrorMsg = `⚠️ API Test Failed

The escrow was created successfully, but the API test failed:
🚫 Error: ${apiError instanceof Error ? apiError.message : String(apiError)}

This might be because:
• The tool's API endpoint is not responding
• The tool hasn't implemented escrow validation yet
• Network connectivity issues

Your payment is secure - the escrow holds your funds until the tool is accessed successfully.`

          if (callback) {
            callback({
              text: apiErrorMsg,
              content: {
                type: "api_error",
                tool: selectedTool,
                escrowId: result.escrowId,
                error: apiError instanceof Error ? apiError.message : String(apiError),
                endpoint: result.tool.endpoint,
              },
            })
          }

          logger.error(`API test failed for tool ${selectedTool.toolId}:`, apiError)
        }

        // Clear the selected tool from state after processing (successful or failed API test)
        httpayState.selectedTool = undefined
        state.httpay = httpayState

        // Also clear from service
        const httpayElizaService = runtime.getService("httpay") as any
        if (httpayElizaService?.clearSelectedTool) {
          httpayElizaService.clearSelectedTool()
          logger.info("CONFIRM_HTTPAY_PAYMENT: Cleared tool from service after processing")
        }

        logger.info(
          `Payment confirmed for tool ${selectedTool.toolId}, TX: ${result.txHash}`
        )
      } else if (result.success) {
        // Escrow successful but missing data for API test
        const warningMsg = `✅ Escrow created successfully, but API test skipped.

Some required information is missing:
${!result.escrowId ? "• Escrow ID not found\n" : ""}${!result.authToken ? "• Auth token not generated\n" : ""}${!result.tool?.endpoint ? "• Tool endpoint not available\n" : ""}

Your payment is secure and the escrow has been created.`

        if (callback) {
          callback({
            text: warningMsg,
            content: {
              type: "escrow_success_no_api",
              tool: selectedTool,
              escrowId: result.escrowId,
            },
          })
        }

        // Clear the selected tool from state
        httpayState.selectedTool = undefined
        state.httpay = httpayState

        const httpayElizaService = runtime.getService("httpay") as any
        if (httpayElizaService?.clearSelectedTool) {
          httpayElizaService.clearSelectedTool()
        }

        logger.info(`Escrow created for tool ${selectedTool.toolId}, but API test skipped`)
      } else {
        logger.error(
          `Payment failed for tool ${selectedTool.toolId}: ${result.error}`
        )
      }

      return result.success
    } catch (error) {
      logger.error("CONFIRM_HTTPAY_PAYMENT action failed:", error)

      const errorMsg = `❌ Payment Failed
🚫 Error: ${error.message}
💡 Please check your wallet balance and network connection, then try again.`

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
        content: { text: "Confirm payment" },
      },
      {
        name: "{{agent}}",
        content: {
          actions: ["CONFIRM_HTTPAY_PAYMENT"],
        },
      },
    ],
    [
      {
        name: "{{user1}}",
        content: { text: "Pay for it" },
      },
      {
        name: "{{agent}}",
        content: {
          actions: ["CONFIRM_HTTPAY_PAYMENT"],
        },
      },
    ],
    [
      {
        name: "{{user1}}",
        content: { text: "Make payment" },
      },
      {
        name: "{{agent}}",
        content: {
          actions: ["CONFIRM_HTTPAY_PAYMENT"],
        },
      },
    ],
  ],
}

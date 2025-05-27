/**
 * HTTPay SDK v2 - Refactored Context with React Best Practices
 * 
 * This is the refactored version of the HTTPay SDK context that follows React best practices:
 * - Smaller, focused components instead of one large context
 * - Proper separation of concerns
 * - TypeScript-first approach with comprehensive type safety
 * - Uses httpay-sdk v2 instead of the legacy provider-sdk
 * - Better error handling and loading states
 * - Proper dependency injection for better testability
 */

// Main provider and hook
export { HTTPaySDKProvider, useHTTPaySDK, useSDK } from "./providers/httpay-sdk-provider";

// Specialized hooks (can be used independently if needed)
export { useRegistry } from "./hooks/use-registry";
export { useEscrow } from "./hooks/use-escrow";
export { useWalletIntegration } from "./hooks/use-wallet-integration";
export { useBlockHeight } from "./hooks/use-block-height";

// Types and schemas
export * from "./types";

// Utility functions
export * from "./utils/client-utils";

// Re-export some common types for convenience
export type {
  HTTPaySDKConfig,
  HTTPayClients,
  ConnectionState,
  LoadingStates,
  HTTPaySDKContextType,
  Tool,
  Escrow,
  ToolRegistrationForm,
  EscrowCreationForm,
  EscrowVerificationForm,
  UsagePostingForm,
  EscrowsFilter,
  LockFundsResult,
  VerificationResult,
  ReleaseResult,
  RegistrationResult,
} from "./types";

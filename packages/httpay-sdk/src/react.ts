/**
 * HTTPay SDK v2 - React Integration
 * 
 * This module provides React components, hooks, and utilities for integrating
 * with the HTTPay protocol. It follows React best practices with:
 * - Smaller, focused components instead of monolithic contexts
 * - Proper separation of concerns
 * - TypeScript-first approach with comprehensive type safety
 * - Better error handling and loading states
 * - Proper dependency injection for better testability
 */

// Main provider and hook
export { HTTPaySDKProvider, useHTTPaySDK, useSDK } from "./providers/httpay-sdk-provider";

// Specialized hooks (can be used independently if needed)
export { useRegistry, type ToastFunction } from "./hooks/use-registry";
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
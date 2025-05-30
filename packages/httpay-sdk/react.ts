/**
 * HTTPay SDK v2 - React Entry Point
 * 
 * This entry point includes React Query hooks and React components.
 * Use this when building React applications.
 * 
 * Usage:
 *   import { useEscrow, useRegistry } from 'httpay/react';
 *   import { EscrowClient } from 'httpay'; // Core client without React deps
 */

// Export React Query hooks
export * from './src/Escrow/Escrow.react-query';
export * from './src/Registry/Registry.react-query';

// Export React integration components and hooks
export * from './src/react';

// Export organized namespace with React Query hooks (backward compatibility)
export { contracts as EscrowContracts } from './src/Escrow';
export { contracts as RegistryContracts } from './src/Registry';

// Re-export core types that React components need
export type {
  Tool,
  Escrow as EscrowType,
  ToolRegistrationForm,
  EscrowCreationForm,
  EscrowVerificationForm,
  UsagePostingForm,
  EscrowsFilter,
  LockFundsResult,
  VerificationResult,
  ReleaseResult,
  RegistrationResult,
} from './src/types';

// Re-export core clients for convenience
export { EscrowClient, EscrowQueryClient } from './src/Escrow/Escrow.client';
export { RegistryClient, RegistryQueryClient } from './src/Registry/Registry.client';

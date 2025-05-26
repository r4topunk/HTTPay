/**
 * HTTPay SDK - TypeScript SDK for HTTPay CosmWasm contracts
 * 
 * This package provides TypeScript bindings, client libraries, and React Query hooks
 * for interacting with HTTPay's Escrow and Registry CosmWasm contracts.
 */

// Export Escrow contract types with prefix to avoid conflicts
export * as EscrowTypes from './Escrow/Escrow.types';
export * from './Escrow/Escrow.client';
export * from './Escrow/Escrow.react-query';

// Export Registry contract types with prefix to avoid conflicts  
export * as RegistryTypes from './Registry/Registry.types';
export * from './Registry/Registry.client';
export * from './Registry/Registry.react-query';

// Export organized namespace (backward compatibility)
export { contracts as Escrow } from './Escrow';
export { contracts as Registry } from './Registry';

// Re-export everything under HTTPay namespace for better organization
export * as HTTPay from './namespace';

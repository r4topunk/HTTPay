/**
 * HTTPay V2 SDK - TypeScript SDK for HTTPay CosmWasm contracts
 * 
 * This package provides TypeScript bindings, client libraries, and React Query hooks
 * for interacting with HTTPay's Escrow and Registry CosmWasm contracts.
 */

// Export Escrow contract types with prefix to avoid conflicts
export * as EscrowTypes from './src/Escrow/Escrow.types';
export * from './src/Escrow/Escrow.client';
export * from './src/Escrow/Escrow.react-query';

// Export Registry contract types with prefix to avoid conflicts  
export * as RegistryTypes from './src/Registry/Registry.types';
export * from './src/Registry/Registry.client';
export * from './src/Registry/Registry.react-query';

// Export organized namespace (backward compatibility)
export { contracts as Escrow } from './src/Escrow';
export { contracts as Registry } from './src/Registry';

// Export React integration
export * as ReactSDK from './src/react';

// Re-export everything under HTTPay namespace for better organization
export * as HTTPay from './namespace';

// Export high-level abstractions for simplified API usage
export * from './src/abstractions';

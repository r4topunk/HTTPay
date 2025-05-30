/**
 * HTTPay V2 SDK - TypeScript SDK for HTTPay CosmWasm contracts
 * 
 * This is the core SDK that works in any JavaScript environment (browser, Node.js, etc.)
 * without React dependencies. For React-specific exports, import from 'httpay/react'.
 */

// Export core contract types and clients (no React dependencies)
export * as EscrowTypes from './src/Escrow/Escrow.types';
export * from './src/Escrow/Escrow.client';

export * as RegistryTypes from './src/Registry/Registry.types';
export * from './src/Registry/Registry.client';

// Export core abstractions for simplified API usage
export * from './src/abstractions';

// Re-export everything under HTTPay namespace for better organization
export * as HTTPay from './namespace';

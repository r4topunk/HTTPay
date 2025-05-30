/**
 * HTTPay SDK V2 - Source Exports
 * 
 * This file exports all components and utilities from the SDK source.
 */

// Export React integration
export * from './react';

// Export high-level abstractions (for backend/API usage)
export * from './abstractions';

// Export contract clients and types
export * as RegistryTypes from './Registry/Registry.types';
export * from './Registry/Registry.client';
export * from './Registry/Registry.react-query';

export * as EscrowTypes from './Escrow/Escrow.types';
export * from './Escrow/Escrow.client';
export * from './Escrow/Escrow.react-query';

// Export organized namespace (backward compatibility)
export { contracts as Escrow } from './Escrow';
export { contracts as Registry } from './Registry';

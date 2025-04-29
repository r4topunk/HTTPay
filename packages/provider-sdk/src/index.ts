/**
 * ToolPay Provider SDK
 *
 * The main entry point for the ToolPay Provider SDK. This SDK enables tool providers
 * to interact with ToolPay smart contracts (Registry and Escrow) on Neutron.
 *
 * @packageDocumentation
 */

// Export main SDK class
export { ToolPaySDK } from './toolPaySDK.js';

// Export core functionality
export { EscrowVerifier } from './escrowVerifier.js';
export { UsageReporter } from './usageReporter.js';

// Export contract clients
export { RegistryClient, EscrowClient } from './clients/index.js';

// Export types
export * from './types/index.js';
export * from './escrowVerifier.js';
export * from './usageReporter.js';
export * from './toolPaySDK.js';

// Version export
export const SDK_VERSION = '0.1.0';
export function getSDKInfo(): string {
  return `ToolPay Provider SDK v${SDK_VERSION}`;
}

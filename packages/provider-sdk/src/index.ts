/**
 * Pay-Per-Tool Provider SDK
 *
 * The main entry point for the Pay-Per-Tool Provider SDK. This SDK enables tool providers
 * to interact with Pay-Per-Tool smart contracts (Registry and Escrow) on Neutron.
 *
 * @packageDocumentation
 */

// Export main SDK class
export { Pay-Per-ToolSDK } from './toolPaySDK';

// Export core functionality
export { EscrowVerifier } from './escrowVerifier';
export { UsageReporter } from './usageReporter';

// Export contract clients
export { RegistryClient, EscrowClient } from './clients/index';

// Export types
export * from './types/index';
export * from './escrowVerifier';
export * from './usageReporter';
export * from './toolPaySDK';

// Version export
export const SDK_VERSION = '0.1.0';
export function getSDKInfo(): string {
  return `Pay-Per-Tool Provider SDK v${SDK_VERSION}`;
}

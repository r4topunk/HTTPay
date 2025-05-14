/**
 * PayPerTool Provider SDK
 *
 * The main entry point for the PayPerTool Provider SDK. This SDK enables tool providers
 * to interact with PayPerTool smart contracts (Registry and Escrow) on Neutron.
 *
 * @packageDocumentation
 */

// Export main SDK class
export { PayPerToolSDK } from './PayPerToolSDK';

// Export core functionality
export { EscrowVerifier } from './escrowVerifier';
export { UsageReporter } from './usageReporter';

// Export contract clients
export { RegistryClient, EscrowClient } from './clients/index';

// Export types
export * from './types/index';
export * from './escrowVerifier';
export * from './usageReporter';
export * from './PayPerToolSDK';

// Version export
export const SDK_VERSION = '0.1.0';
export function getSDKInfo(): string {
  return `PayPerTool Provider SDK v${SDK_VERSION}`;
}

/**
 * HTTPay Provider SDK
 *
 * The main entry point for the HTTPay Provider SDK. This SDK enables tool providers
 * to interact with HTTPay smart contracts (Registry and Escrow) on Neutron.
 *
 * @packageDocumentation
 */

// Export main SDK class
export { HTTPaySDK } from './HTTPaySDK';

// Export core functionality
export { EscrowVerifier } from './escrowVerifier';
export { UsageReporter } from './usageReporter';

// Export contract clients
export { RegistryClient, EscrowClient } from './clients/index';

// Export types
export * from './types/index';
export * from './escrowVerifier';
export * from './usageReporter';
export * from './HTTPaySDK';

// Version export
export { SDK_VERSION, getSDKInfo } from './version';

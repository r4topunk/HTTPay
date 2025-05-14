/**
 * Configuration utilities for PayPerToolSDK
 */

import type { PayPerToolSDKConfig } from '../PayPerToolSDK.js';

/**
 * Validates PayPerTool SDK configuration
 *
 * @param config - The configuration object to validate
 * @throws Error if the configuration is invalid
 */
export function validateConfig(config: PayPerToolSDKConfig): void {
  if (!config) {
    throw new Error('Configuration object is required');
  }

  // Validate RPC endpoint
  if (!config.rpcEndpoint) {
    throw new Error('RPC endpoint is required in configuration');
  }

  if (typeof config.rpcEndpoint !== 'string') {
    throw new Error('RPC endpoint must be a string');
  }

  if (!config.rpcEndpoint.startsWith('http://') && !config.rpcEndpoint.startsWith('https://')) {
    throw new Error('RPC endpoint must be a valid URL starting with http:// or https://');
  }

  // Validate chain ID
  if (!config.chainId) {
    throw new Error('Chain ID is required in configuration');
  }

  if (typeof config.chainId !== 'string') {
    throw new Error('Chain ID must be a string');
  }

  // Validate contract addresses
  if (!config.registryAddress) {
    throw new Error('Registry contract address is required in configuration');
  }

  if (typeof config.registryAddress !== 'string') {
    throw new Error('Registry contract address must be a string');
  }

  // Simple validation for Neutron addresses (neutron1...)
  if (!config.registryAddress.startsWith('neutron1')) {
    throw new Error('Registry address must be a valid Neutron address (starting with neutron1)');
  }

  if (!config.escrowAddress) {
    throw new Error('Escrow contract address is required in configuration');
  }

  if (typeof config.escrowAddress !== 'string') {
    throw new Error('Escrow contract address must be a string');
  }

  // Simple validation for Neutron addresses (neutron1...)
  if (!config.escrowAddress.startsWith('neutron1')) {
    throw new Error('Escrow address must be a valid Neutron address (starting with neutron1)');
  }

  // Validate optional gas adjustment if provided
  if (config.gasAdjustment !== undefined) {
    if (typeof config.gasAdjustment !== 'number') {
      throw new Error('Gas adjustment must be a number');
    }

    if (config.gasAdjustment <= 0) {
      throw new Error('Gas adjustment must be positive');
    }
  }
}

/**
 * Get default configuration values for network
 *
 * @param network - 'mainnet', 'testnet', or 'local'
 * @returns Partial configuration with network-specific values
 */
export function getNetworkDefaults(
  network: 'mainnet' | 'testnet' | 'local',
): Partial<PayPerToolSDKConfig> {
  switch (network) {
    case 'mainnet':
      return {
        rpcEndpoint: 'https://rpc.neutron.org',
        chainId: 'neutron-1',
        gasPrice: '0.0053untrn',
      };
    case 'testnet':
      return {
        rpcEndpoint: 'https://rpc-falcron.pion-1.ntrn.tech:443',
        chainId: 'pion-1',
        gasPrice: '0.0053untrn',
      };
    case 'local':
      return {
        rpcEndpoint: 'http://localhost:26657',
        chainId: 'testing',
        gasPrice: '0.0053untrn',
      };
    default:
      return {};
  }
}

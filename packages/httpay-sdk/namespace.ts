/**
 * Organized namespace exports for HTTPay SDK (Core only - no React dependencies)
 */

import * as EscrowTypes from './src/Escrow/Escrow.types';
import * as EscrowClient from './src/Escrow/Escrow.client';
import * as RegistryTypes from './src/Registry/Registry.types';
import * as RegistryClient from './src/Registry/Registry.client';

export const Escrow = {
  ...EscrowTypes,
  ...EscrowClient,
};

export const Registry = {
  ...RegistryTypes,
  ...RegistryClient,
};

// Default export with all contracts
export default {
  Escrow,
  Registry,
};

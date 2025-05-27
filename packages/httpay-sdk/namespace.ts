/**
 * Organized namespace exports for HTTPay SDK
 */

import { contracts as EscrowContracts } from './src/Escrow';
import { contracts as RegistryContracts } from './src/Registry';

export const Escrow = EscrowContracts.Escrow;
export const Registry = RegistryContracts.Registry;

// Default export with all contracts
export default {
  Escrow: EscrowContracts.Escrow,
  Registry: RegistryContracts.Registry,
};

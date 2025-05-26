/**
 * Organized namespace exports for HTTPay SDK
 */

import { contracts as EscrowContracts } from './Escrow';
import { contracts as RegistryContracts } from './Registry';

export const Escrow = EscrowContracts.Escrow;
export const Registry = RegistryContracts.Registry;

// Default export with all contracts
export default {
  Escrow: EscrowContracts.Escrow,
  Registry: RegistryContracts.Registry,
};

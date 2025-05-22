/**
 * TypeScript types for the Escrow contract
 * 
 * These types define the messages, queries, and responses for interacting with
 * the Escrow contract.
 */
import type { Uint128 } from "./common.js";

/**
 * InstantiateMsg for the Escrow contract
 */
export interface EscrowInstantiateMsg {
  /** Address of the Registry contract */
  registry_addr: string;
  /** Percentage of each payment to collect (0-100) */
  fee_percentage: number;
}

/**
 * ExecuteMsg for the Escrow contract
 * 
 * A union type representing all possible execute messages that can be sent
 * to the Escrow contract.
 */
export type EscrowExecuteMsg =
  | { 
      lock_funds: { 
        tool_id: string; 
        max_fee: Uint128; 
        auth_token: string; 
        expires: number; // uint64
      } 
    }
  | { 
      release: { 
        escrow_id: number; // uint64
        usage_fee: Uint128; 
      } 
    }
  | { 
      refund_expired: { 
        escrow_id: number; // uint64
      } 
    }
  | {
      claim_fees: {
        denom?: string; // Optional - if not provided, claims all denoms
      }
    };

/**
 * QueryMsg for the Escrow contract
 * 
 * A union type representing all possible query messages that can be sent
 * to the Escrow contract.
 */
export type EscrowQueryMsg = 
  | { get_escrow: { escrow_id: number } } // uint64
  | { get_collected_fees: {} };

/**
 * EscrowResponse from the Escrow contract
 * 
 * This is the return type for a GetEscrow query
 */
export interface EscrowResponse {
  escrow_id: number; // uint64
  caller: string; // Address
  provider: string; // Address
  max_fee: Uint128;
  denom: string;
  expires: number; // uint64
  auth_token: string;
}

/**
 * CollectedFeesResponse from the Escrow contract
 * 
 * This is the return type for a GetCollectedFees query
 */
export interface CollectedFeesResponse {
  /** The contract owner's address */
  owner: string;
  /** The percentage of each payment collected as fees (0-100) */
  fee_percentage: number;
  /** Vector of collected fees by denomination */
  collected_fees: Array<{
    denom: string;
    amount: Uint128;
  }>;
}

/**
 * LockFundsResponse from the Escrow contract
 * 
 * This is the return type for a LockFunds execute method
 * returned in the response data field
 */
export interface LockFundsResponse {
  escrow_id: number; // uint64
  denom: string;
}

/**
 * SudoMsg for the Escrow contract
 * 
 * A union type representing all possible sudo messages that can be sent
 * to the Escrow contract.
 */
export type EscrowSudoMsg = { freeze: {} };

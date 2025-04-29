/**
 * TypeScript types for the Escrow contract
 * 
 * These types define the messages, queries, and responses for interacting with
 * the Escrow contract.
 */
import { Uint128 } from "./common.js";

/**
 * InstantiateMsg for the Escrow contract
 */
export interface EscrowInstantiateMsg {
  /** Address of the Registry contract */
  registry_addr: string;
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
    };

/**
 * QueryMsg for the Escrow contract
 * 
 * A union type representing all possible query messages that can be sent
 * to the Escrow contract.
 */
export type EscrowQueryMsg = { get_escrow: { escrow_id: number } }; // uint64

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
  expires: number; // uint64
  auth_token: string;
}

/**
 * SudoMsg for the Escrow contract
 * 
 * A union type representing all possible sudo messages that can be sent
 * to the Escrow contract.
 */
export type EscrowSudoMsg = { freeze: {} };

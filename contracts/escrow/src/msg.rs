use cosmwasm_schema::{cw_serde, QueryResponses};
use cosmwasm_std::{Addr, Uint128};

/// Message to instantiate the contract
#[cw_serde]
pub struct InstantiateMsg {
    /// Address of the Registry contract
    pub registry_addr: String,
    /// Percentage of fees to collect (0-100)
    pub fee_percentage: u64,
}

#[cw_serde]
pub enum ExecuteMsg {
    /// Locks funds for a tool provider with an authentication token
    LockFunds {
        /// The tool ID in the registry
        tool_id: String,
        /// The maximum fee the caller is willing to pay
        max_fee: Uint128,
        /// Authentication token for the tool to verify the escrow
        auth_token: String,
        /// Block height when this escrow expires
        expires: u64,
    },
    /// Releases locked funds to the provider after tool usage
    Release {
        /// The escrow ID to release funds from
        escrow_id: u64,
        /// The actual usage fee to charge (must be ≤ max_fee)
        usage_fee: Uint128,
    },
    /// Refunds locked funds to the caller if the escrow has expired
    RefundExpired {
        /// The escrow ID to refund
        escrow_id: u64,
    },
    /// Owner only: Claims the accumulated fee from the contract
    ClaimFees {
        /// Optional denom to claim, if None claims all denoms
        denom: Option<String>,
    },
}

#[cw_serde]
#[derive(QueryResponses)]
pub enum QueryMsg {
    /// Gets details about a specific escrow
    #[returns(EscrowResponse)]
    GetEscrow { escrow_id: u64 },
    
    /// Gets information about collected fees
    #[returns(CollectedFeesResponse)]
    GetCollectedFees {},
}

/// Response type for GetEscrow query
#[cw_serde]
pub struct EscrowResponse {
    pub escrow_id: u64,
    pub caller: Addr,
    pub provider: Addr,
    pub max_fee: Uint128,
    pub denom: String,
    pub expires: u64,
    pub auth_token: String,
}

/// Response type for LockFunds execute method
/// This is encoded and returned in the response data field
#[cw_serde]
pub struct LockFundsResponse {
    pub escrow_id: u64,
    pub denom: String,
}

/// Response type for GetCollectedFees query
#[cw_serde]
pub struct CollectedFeesResponse {
    pub owner: Addr,
    pub fee_percentage: u64,
    pub collected_fees: Vec<(String, Uint128)>,
}

/// Message type for sudo calls
#[cw_serde]
pub enum SudoMsg {
    /// Freezes the contract, preventing any new escrows or releases
    Freeze {},
}

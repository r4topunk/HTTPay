use cosmwasm_schema::cw_serde;
use cosmwasm_std::{Addr, Uint128};
use cw_storage_plus::{Item, Map};

/// Escrow information for a locked fund
#[cw_serde]
pub struct Escrow {
    /// Original caller who locked the funds
    pub caller: Addr,
    /// Tool provider who will receive the fee
    pub provider: Addr,
    /// Maximum fee the caller is willing to pay
    pub max_fee: Uint128,
    /// Token denomination for the fee
    pub denom: String,
    /// Authentication token for tool to verify the escrow
    pub auth_token: String,
    /// Block height at which this escrow expires
    pub expires: u64,
}

/// Global contract configuration
#[cw_serde]
pub struct Config {
    /// If true, contract operations are frozen
    pub frozen: bool,
    /// Address of the registry contract
    pub registry_addr: Addr,
}

/// Map of escrow ID to escrow data
pub const ESCROWS: Map<u64, Escrow> = Map::new("escrows");

/// Counter to generate sequential escrow IDs
pub const NEXT_ID: Item<u64> = Item::new("next_id");

/// Global contract configuration
pub const CONFIG: Item<Config> = Item::new("config");


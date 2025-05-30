use cosmwasm_std::{Addr, Uint128};
use cw_storage_plus::Map;
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

/// ToolMeta contains metadata about a registered tool
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct ToolMeta {
    /// Address of the tool provider
    pub provider: Addr,
    /// Price to use the tool, in base currency units
    pub price: Uint128,
    /// Token denomination for the tool price (e.g. "untrn" or IBC denom)
    pub denom: String,
    /// Whether the tool is currently active and available for use
    pub is_active: bool,
    /// Description of the tool (max 256 characters)
    pub description: String,
    /// API endpoint URL for the tool (max 512 characters, must start with https://)
    pub endpoint: String,
}

/// TOOLS maps tool_id strings to their metadata
pub const TOOLS: Map<&str, ToolMeta> = Map::new("tools");


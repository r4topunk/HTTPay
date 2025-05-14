use cosmwasm_schema::{cw_serde, QueryResponses};
use cosmwasm_std::Uint128;

/// InstantiateMsg is empty for the Registry contract MVP
#[cw_serde]
pub struct InstantiateMsg {}

/// ExecuteMsg defines the set of available contract actions
#[cw_serde]
pub enum ExecuteMsg {
    /// Register a new tool with the specified ID and price
    RegisterTool {
        /// Unique tool identifier, max 16 characters
        tool_id: String,
        /// Price to use the tool, in base currency units
        price: Uint128,
        /// Token denomination for the tool price (e.g. "untrn" or IBC denom)
        /// If not provided, defaults to "untrn" for backward compatibility
        denom: Option<String>,
    },
    /// Update the price of an existing tool
    UpdatePrice {
        /// Existing tool identifier
        tool_id: String,
        /// New price for the tool, in base currency units
        price: Uint128,
    },
    /// Update the denom of an existing tool
    UpdateDenom {
        /// Existing tool identifier
        tool_id: String,
        /// New token denomination for the tool price
        denom: String,
    },
    /// Pause an active tool (make it unavailable for use)
    PauseTool {
        /// Tool identifier to pause
        tool_id: String,
    },
    /// Resume a paused tool (make it available for use again)
    ResumeTool {
        /// Tool identifier to resume
        tool_id: String,
    },
}

/// QueryMsg defines the set of available queries on the contract
#[cw_serde]
#[derive(QueryResponses)]
pub enum QueryMsg {
    /// GetTool returns information about a specific tool if it exists
    #[returns(ToolResponse)]
    GetTool {
        /// Tool identifier to query
        tool_id: String,
    },
}

/// ToolResponse is the return type for a GetTool query
#[cw_serde]
pub struct ToolResponse {
    /// Tool identifier
    pub tool_id: String,
    /// Address of the tool provider
    pub provider: String,
    /// Current price to use the tool
    pub price: Uint128,
    /// Token denomination for the tool price
    pub denom: String,
    /// Whether the tool is currently available for use
    pub is_active: bool,
}

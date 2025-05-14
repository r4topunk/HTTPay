use cosmwasm_schema::cw_serde;
use cosmwasm_std::{to_json_binary, Addr, QuerierWrapper, QueryRequest, StdResult, Uint128, WasmQuery};

// Response type from Registry contract for GetTool query
#[cw_serde]
pub struct ToolResponse {
    pub tool_id: String,
    pub provider: Addr,
    pub price: Uint128,
    pub denom: String,
    pub is_active: bool,
}

// Query message for Registry contract
#[cw_serde]
enum RegistryQueryMsg {
    GetTool { tool_id: String },
}

// Helper function to query tool details from Registry contract
pub fn query_tool(
    querier: &QuerierWrapper,
    registry_address: Addr,
    tool_id: String,
) -> StdResult<ToolResponse> {
    let query_msg = RegistryQueryMsg::GetTool { tool_id };
    let request = QueryRequest::Wasm(WasmQuery::Smart {
        contract_addr: registry_address.to_string(),
        msg: to_json_binary(&query_msg)?,
    });

    querier.query(&request)
}

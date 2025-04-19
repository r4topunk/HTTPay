use cosmwasm_std::testing::{mock_dependencies, message_info};
use cosmwasm_std::{Addr, from_json, Uint128};
use crate::contract::{execute_register_tool, query_tool};
use crate::msg::ToolResponse;
use crate::tests::setup_contract::setup_contract;

#[test]
fn query_tool_functionality() {
    let mut deps = mock_dependencies();
    setup_contract(deps.as_mut()).unwrap();

    let info = message_info(&Addr::unchecked("provider1"), &[]);
    let tool_id = "tool1".to_string();
    let price = Uint128::new(100);
    execute_register_tool(deps.as_mut(), info, tool_id.clone(), price).unwrap();

    let query_res = query_tool(deps.as_ref(), tool_id).unwrap();
    let tool_response: ToolResponse = from_json(&query_res).unwrap();

    assert_eq!("provider1", tool_response.provider);
    assert_eq!(Uint128::new(100), tool_response.price);
    assert!(tool_response.is_active);

    let query_res = query_tool(deps.as_ref(), "nonexistent".to_string()).unwrap();
    let tool_response: Option<ToolResponse> = from_json(&query_res).unwrap();

    assert!(tool_response.is_none());
}

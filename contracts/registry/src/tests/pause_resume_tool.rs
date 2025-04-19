use cosmwasm_std::testing::{mock_dependencies, message_info};
use cosmwasm_std::{Addr, from_json, Uint128};
use crate::contract::{execute_pause_tool, execute_register_tool, execute_resume_tool, query_tool};
use crate::msg::ToolResponse;
use crate::tests::setup_contract::setup_contract;

#[test]
fn pause_resume_tool() {
    let mut deps = mock_dependencies();
    setup_contract(deps.as_mut()).unwrap();

    let provider = Addr::unchecked("provider1");
    let info = message_info(&provider, &[]);
    let tool_id = "tool1".to_string();
    let price = Uint128::new(100);
    execute_register_tool(deps.as_mut(), info.clone(), tool_id.clone(), price).unwrap();

    let res = execute_pause_tool(deps.as_mut(), info.clone(), tool_id.clone()).unwrap();
    assert_eq!("pause_tool", res.attributes[0].value);

    let query_res = query_tool(deps.as_ref(), tool_id.clone()).unwrap();
    let tool_response: ToolResponse = from_json(&query_res).unwrap();
    assert!(!tool_response.is_active);

    let res = execute_resume_tool(deps.as_mut(), info, tool_id.clone()).unwrap();
    assert_eq!("resume_tool", res.attributes[0].value);

    let query_res = query_tool(deps.as_ref(), tool_id).unwrap();
    let tool_response: ToolResponse = from_json(&query_res).unwrap();
    assert!(tool_response.is_active);
}

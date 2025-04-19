use cosmwasm_std::testing::{mock_dependencies, message_info};
use cosmwasm_std::{Addr, from_json, Uint128};
use crate::contract::{execute_register_tool, query_tool};
use crate::msg::ToolResponse;
use crate::tests::setup_contract::setup_contract;

#[test]
fn register_tool_success() {
    let mut deps = mock_dependencies();
    setup_contract(deps.as_mut()).unwrap();

    let info = message_info(&Addr::unchecked("provider1"), &[]);
    let tool_id = "tool1".to_string();
    let price = Uint128::new(100);

    let res = execute_register_tool(deps.as_mut(), info, tool_id.clone(), price).unwrap();

    assert_eq!(5, res.attributes.len());
    assert_eq!("register_tool", res.attributes[0].value);
    assert_eq!("tool1", res.attributes[1].value);
    assert_eq!("provider1", res.attributes[2].value);
    assert_eq!("100", res.attributes[3].value);
    assert_eq!("true", res.attributes[4].value);

    let query_res = query_tool(deps.as_ref(), tool_id).unwrap();
    let tool_response: ToolResponse = from_json(&query_res).unwrap();

    assert_eq!("tool1", tool_response.tool_id);
    assert_eq!("provider1", tool_response.provider);
    assert_eq!(Uint128::new(100), tool_response.price);
    assert!(tool_response.is_active);
}

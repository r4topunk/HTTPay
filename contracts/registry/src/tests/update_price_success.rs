use cosmwasm_std::testing::{mock_dependencies, message_info};
use cosmwasm_std::{Addr, from_json, Uint128};
use crate::contract::{execute_register_tool, execute_update_price, query_tool};
use crate::msg::ToolResponse;
use crate::tests::setup_contract::setup_contract;

#[test]
fn update_price_success() {
    let mut deps = mock_dependencies();
    setup_contract(deps.as_mut()).unwrap();

    let provider = Addr::unchecked("provider1");
    let info = message_info(&provider, &[]);
    let tool_id = "tool1".to_string();
    let price = Uint128::new(100);
    execute_register_tool(deps.as_mut(), info.clone(), tool_id.clone(), price).unwrap();

    let new_price = Uint128::new(200);
    let res = execute_update_price(deps.as_mut(), info, tool_id.clone(), new_price).unwrap();

    assert_eq!(3, res.attributes.len());
    assert_eq!("update_price", res.attributes[0].value);
    assert_eq!("tool1", res.attributes[1].value);
    assert_eq!("200", res.attributes[2].value);

    let query_res = query_tool(deps.as_ref(), tool_id).unwrap();
    let tool_response: ToolResponse = from_json(&query_res).unwrap();

    assert_eq!(Uint128::new(200), tool_response.price);
}

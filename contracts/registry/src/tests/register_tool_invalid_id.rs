use cosmwasm_std::testing::{mock_dependencies, message_info};
use cosmwasm_std::{Addr, Uint128};
use crate::contract::execute_register_tool;
use crate::error::ContractError;
use crate::tests::setup_contract::setup_contract;

#[test]
fn register_tool_invalid_id() {
    let mut deps = mock_dependencies();
    setup_contract(deps.as_mut()).unwrap();

    let info = message_info(&Addr::unchecked("provider1"), &[]);
    let tool_id = "this_tool_id_is_way_too_long".to_string();
    let price = Uint128::new(100);

    let err = execute_register_tool(deps.as_mut(), info, tool_id, price).unwrap_err();

    match err {
        ContractError::ToolIdTooLong {} => {}
        e => panic!("Unexpected error: {:?}", e),
    }
}

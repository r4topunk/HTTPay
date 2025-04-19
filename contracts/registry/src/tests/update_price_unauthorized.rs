use cosmwasm_std::testing::{mock_dependencies, message_info};
use cosmwasm_std::{Addr, Uint128};
use crate::contract::{execute_register_tool, execute_update_price};
use crate::error::ContractError;
use crate::tests::setup_contract::setup_contract;

#[test]
fn update_price_unauthorized() {
    let mut deps = mock_dependencies();
    setup_contract(deps.as_mut()).unwrap();

    let info = message_info(&Addr::unchecked("provider1"), &[]);
    let tool_id = "tool1".to_string();
    let price = Uint128::new(100);
    execute_register_tool(deps.as_mut(), info, tool_id.clone(), price).unwrap();

    let info = message_info(&Addr::unchecked("provider2"), &[]);
    let new_price = Uint128::new(200);
    let err = execute_update_price(deps.as_mut(), info, tool_id, new_price).unwrap_err();

    match err {
        ContractError::Unauthorized {} => {}
        e => panic!("Unexpected error: {:?}", e),
    }
}

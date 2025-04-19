use cosmwasm_std::testing::{mock_dependencies, message_info};
use cosmwasm_std::{Addr, Uint128};
use crate::contract::{execute_pause_tool, execute_register_tool, execute_resume_tool};
use crate::error::ContractError;
use crate::tests::setup_contract::setup_contract;

#[test]
fn unauthorized_pause_resume() {
    let mut deps = mock_dependencies();
    setup_contract(deps.as_mut()).unwrap();

    let provider = Addr::unchecked("provider1");
    let info = message_info(&provider, &[]);
    let tool_id = "tool1".to_string();
    let price = Uint128::new(100);
    execute_register_tool(deps.as_mut(), info, tool_id.clone(), price).unwrap();

    let unauthorized_info = message_info(&Addr::unchecked("provider2"), &[]);
    let err = execute_pause_tool(deps.as_mut(), unauthorized_info.clone(), tool_id.clone()).unwrap_err();

    match err {
        ContractError::Unauthorized {} => {}
        e => panic!("Unexpected error: {:?}", e),
    }

    let err = execute_resume_tool(deps.as_mut(), unauthorized_info, tool_id).unwrap_err();

    match err {
        ContractError::Unauthorized {} => {}
        e => panic!("Unexpected error: {:?}", e),
    }
}

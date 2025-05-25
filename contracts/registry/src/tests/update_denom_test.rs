//! # Update Denom Test
//! 
//! This module tests the Registry contract's update_denom functionality.
//! 
//! ## Test Coverage
//! 
//! This test verifies that:
//! 1. A tool can be successfully registered with a custom denomination
//! 2. The denomination can be updated by the tool provider
//! 3. Unauthorized users cannot update the denomination
//! 4. The updated denomination is reflected in the tool metadata

use cosmwasm_std::testing::{mock_dependencies, message_info};
use cosmwasm_std::{Addr, from_json, Uint128};
use crate::contract::{execute_register_tool, execute_update_denom, query_tool};
use crate::msg::ToolResponse;
use crate::error::ContractError;
use crate::tests::setup_contract::setup_contract;

/// # Test: Register and Update Denom Success
/// 
/// This test verifies that a tool can be registered with a custom denom
/// and that the denom can be updated by the tool provider.
/// 
/// ## Test Steps:
///
/// 1. Setup the contract with mock dependencies
/// 2. Register a new tool with a custom denom "uatom"
/// 3. Verify the tool has the correct initial denom
/// 4. Update the tool's denom to "uosmo"
/// 5. Verify that the denom was updated correctly
#[test]
fn update_denom_success() {
    // Initialize mock dependencies and set up contract
    let mut deps = mock_dependencies();
    setup_contract(deps.as_mut()).unwrap();

    // Register a tool with custom denom "uatom"
    let provider = Addr::unchecked("provider1");
    let info = message_info(&provider, &[]);
    let tool_id = "tool1".to_string();
    let price = Uint128::new(100);
    let initial_denom = Some("uatom".to_string());
    let description = "A tool with custom denomination".to_string();
    let endpoint = "https://api.provider1.com/denom-tool".to_string();
    
    execute_register_tool(deps.as_mut(), info.clone(), tool_id.clone(), price, initial_denom, description.clone(), endpoint).unwrap();

    // Query the tool to verify the denom
    let query_res = query_tool(deps.as_ref(), tool_id.clone()).unwrap();
    let tool_response: ToolResponse = from_json(&query_res).unwrap();
    
    // Verify the initial denom
    assert_eq!("uatom", tool_response.denom);
    assert_eq!(description, tool_response.description);

    // Update the denom to "uosmo"
    let new_denom = "uosmo".to_string();
    let res = execute_update_denom(deps.as_mut(), info, tool_id.clone(), new_denom.clone()).unwrap();
    
    // Verify response attributes
    assert_eq!("update_denom", res.attributes[0].value);
    assert_eq!(tool_id, res.attributes[1].value);
    assert_eq!(new_denom, res.attributes[2].value);

    // Query the tool again to verify the denom was updated
    let query_res = query_tool(deps.as_ref(), tool_id).unwrap();
    let tool_response: ToolResponse = from_json(&query_res).unwrap();
    
    // Verify the denom was updated
    assert_eq!("uosmo", tool_response.denom);
}

/// # Test: Unauthorized Denom Update
/// 
/// This test verifies that only the original tool provider can update a tool's denom.
/// 
/// ## Test Steps:
///
/// 1. Setup the contract with mock dependencies
/// 2. Register a new tool as provider1 with default denom
/// 3. Attempt to update the denom as provider2
/// 4. Verify that the update fails with Unauthorized error
#[test]
fn update_denom_unauthorized() {
    // Initialize mock dependencies and set up contract
    let mut deps = mock_dependencies();
    setup_contract(deps.as_mut()).unwrap();

    // Register a tool as provider1
    let provider1 = Addr::unchecked("provider1");
    let info1 = message_info(&provider1, &[]);
    let tool_id = "tool1".to_string();
    let price = Uint128::new(100);
    let description = "Tool from provider1".to_string();
    let endpoint = "https://api.provider1.com/test-tool".to_string();
    
    execute_register_tool(deps.as_mut(), info1, tool_id.clone(), price, None, description, endpoint).unwrap();

    // Attempt to update the denom as provider2
    let provider2 = Addr::unchecked("provider2");
    let info2 = message_info(&provider2, &[]);
    let new_denom = "uosmo".to_string();
    
    let err = execute_update_denom(deps.as_mut(), info2, tool_id, new_denom).unwrap_err();
    
    // Verify that the error is the expected Unauthorized error
    match err {
        ContractError::Unauthorized {} => {}
        e => panic!("Unexpected error: {:?}", e),
    }
}

/// # Test: Default Denom in Tool Registration
/// 
/// This test verifies that when a tool is registered without a specified denom,
/// it defaults to "untrn".
/// 
/// ## Test Steps:
///
/// 1. Setup the contract with mock dependencies
/// 2. Register a new tool without specifying a denom
/// 3. Query the tool to verify it has the default "untrn" denom
#[test]
fn register_tool_default_denom() {
    // Initialize mock dependencies and set up contract
    let mut deps = mock_dependencies();
    setup_contract(deps.as_mut()).unwrap();

    // Register a tool without specifying a denom
    let provider = Addr::unchecked("provider1");
    let info = message_info(&provider, &[]);
    let tool_id = "tool1".to_string();
    let price = Uint128::new(100);
    let description = "Tool with default denom".to_string();
    let endpoint = "https://api.provider1.com/default-denom-tool".to_string();
    
    execute_register_tool(deps.as_mut(), info, tool_id.clone(), price, None, description, endpoint).unwrap();

    // Query the tool to verify the denom
    let query_res = query_tool(deps.as_ref(), tool_id).unwrap();
    let tool_response: ToolResponse = from_json(&query_res).unwrap();
    
    // Verify that the default denom is "untrn"
    assert_eq!("untrn", tool_response.denom);
}

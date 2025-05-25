//! # Tool Registration with Invalid ID Test
//! 
//! This module tests the Registry contract's validation of tool IDs during registration.
//! 
//! ## Test Coverage
//! 
//! This test verifies that:
//! 1. The contract rejects tool registration attempts with IDs exceeding the maximum length (16 characters)
//! 2. The proper error type (ToolIdTooLong) is returned when validation fails
//! 
//! ## Relation to Requirements
//! 
//! This test validates the contract's enforcement of tool ID constraints as specified in 
//! Task 2.2 of the implementation plan, which requires validating that tool_id length is 
//! less than or equal to 16 characters.

use cosmwasm_std::testing::{mock_dependencies, message_info};
use cosmwasm_std::{Addr, Uint128};
use crate::contract::execute_register_tool;
use crate::error::ContractError;
use crate::tests::setup_contract::setup_contract;

/// # Test: Tool Registration with Invalid ID
/// 
/// This test ensures that the Registry contract properly validates tool IDs 
/// and rejects those that exceed the maximum allowed length.
/// 
/// ## Test Steps:
/// 
/// 1. Setup the contract with mock dependencies
/// 2. Attempt to register a tool with an ID that exceeds 16 characters
/// 3. Verify that the registration fails with the expected ToolIdTooLong error
/// 4. Ensure no other unexpected errors occur during validation
#[test]
fn register_tool_invalid_id() {
    // Initialize mock dependencies and set up contract
    let mut deps = mock_dependencies();
    setup_contract(deps.as_mut()).unwrap();

    // Prepare message info with provider address and an invalid tool ID (too long)
    let info = message_info(&Addr::unchecked("provider1"), &[]);
    let tool_id = "this_tool_id_is_way_too_long".to_string();
    let price = Uint128::new(100);
    let description = "A test tool description".to_string();
    let endpoint = "https://api.provider1.com/invalid-tool".to_string();

    // Execute tool registration and expect an error
    let err = execute_register_tool(deps.as_mut(), info, tool_id, price, None, description, endpoint).unwrap_err();

    // Verify that the error is the expected ToolIdTooLong error
    match err {
        ContractError::ToolIdTooLong {} => {}
        e => panic!("Unexpected error: {:?}", e),
    }
}

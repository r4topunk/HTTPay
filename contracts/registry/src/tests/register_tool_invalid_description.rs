//! # Tool Registration with Invalid Description Test
//! 
//! This module tests the Registry contract's validation of tool descriptions during registration.
//! 
//! ## Test Coverage
//! 
//! This test verifies that:
//! 1. The contract rejects tool registration attempts with descriptions exceeding the maximum length (256 characters)
//! 2. The proper error type (DescriptionTooLong) is returned when validation fails
//! 
//! ## Relation to Requirements
//! 
//! This test validates the contract's enforcement of tool description constraints, which requires
//! validating that the description length is less than or equal to 256 characters.

use cosmwasm_std::testing::{mock_dependencies, message_info};
use cosmwasm_std::{Addr, Uint128};
use crate::contract::execute_register_tool;
use crate::error::ContractError;
use crate::tests::setup_contract::setup_contract;

/// # Test: Tool Registration with Invalid Description
/// 
/// This test ensures that the Registry contract properly validates tool descriptions 
/// and rejects those that exceed the maximum allowed length.
/// 
/// ## Test Steps:
/// 
/// 1. Setup the contract with mock dependencies
/// 2. Attempt to register a tool with a description that exceeds 256 characters
/// 3. Verify that the registration fails with the expected DescriptionTooLong error
/// 4. Ensure no other unexpected errors occur during validation
#[test]
fn register_tool_invalid_description() {
    // Initialize mock dependencies and set up contract
    let mut deps = mock_dependencies();
    setup_contract(deps.as_mut()).unwrap();

    // Prepare message info with provider address
    let info = message_info(&Addr::unchecked("provider1"), &[]);
    let tool_id = "valid_tool_id".to_string();
    let price = Uint128::new(100);
    
    // Create a description that exceeds 256 characters
    let description = "This description is way too long. It's going to exceed the maximum allowed length of 256 characters. 
    We're going to add a lot more text to make sure it exceeds the limit. 
    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
    Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."
    .to_string();
    
    // Execute tool registration and expect an error
    let err = execute_register_tool(deps.as_mut(), info, tool_id, price, None, description).unwrap_err();

    // Verify that the error is the expected DescriptionTooLong error
    match err {
        ContractError::DescriptionTooLong {} => {}
        e => panic!("Unexpected error: {:?}", e),
    }
}

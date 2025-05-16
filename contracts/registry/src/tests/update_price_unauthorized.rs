//! # Unauthorized Price Update Test
//! 
//! This module tests the Registry contract's authorization checks for price updates.
//! 
//! ## Test Coverage
//! 
//! This test verifies that:
//! 1. Only the original tool provider can update the price of their tool
//! 2. Unauthorized attempts from different addresses are properly rejected
//! 3. The correct error type (Unauthorized) is returned when authorization fails
//! 
//! ## Relation to Requirements
//! 
//! This test validates the contract's authorization mechanism as specified in 
//! Task 2.2 of the implementation plan, which requires the contract to verify 
//! that only the original provider can update a tool's price.

use cosmwasm_std::testing::{mock_dependencies, message_info};
use cosmwasm_std::{Addr, Uint128};
use crate::contract::{execute_register_tool, execute_update_price};
use crate::error::ContractError;
use crate::tests::setup_contract::setup_contract;

/// # Test: Unauthorized Tool Price Update
/// 
/// This test ensures that the Registry contract prevents unauthorized users
/// from updating the price of a tool they don't own.
/// 
/// ## Test Steps:
/// 
/// 1. Setup the contract with mock dependencies
/// 2. Register a new tool "tool1" with provider1 as the owner
/// 3. Attempt to update the tool's price using provider2's address
/// 4. Verify that the update fails with the expected Unauthorized error
/// 5. Ensure no other unexpected errors occur during authorization check
#[test]
fn update_price_unauthorized() {
    // Initialize mock dependencies and set up contract
    let mut deps = mock_dependencies();
    setup_contract(deps.as_mut()).unwrap();

    // Register a tool owned by provider1
    let info = message_info(&Addr::unchecked("provider1"), &[]);
    let tool_id = "tool1".to_string();
    let price = Uint128::new(100);
    let description = "Tool for unauthorized update test".to_string();
    execute_register_tool(deps.as_mut(), info, tool_id.clone(), price, None, description).unwrap();

    // Attempt to update the price using a different provider (provider2)
    let info = message_info(&Addr::unchecked("provider2"), &[]);
    let new_price = Uint128::new(200);
    let err = execute_update_price(deps.as_mut(), info, tool_id, new_price).unwrap_err();

    // Verify that the error is the expected Unauthorized error
    match err {
        ContractError::Unauthorized {} => {}
        e => panic!("Unexpected error: {:?}", e),
    }
}

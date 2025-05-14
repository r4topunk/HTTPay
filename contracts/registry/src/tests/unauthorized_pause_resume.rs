//! # Unauthorized Tool Pause and Resume Test
//! 
//! This module tests the Registry contract's authorization checks for pausing and resuming tools.
//! 
//! ## Test Coverage
//! 
//! This test verifies that:
//! 1. Only the original tool provider can pause their tool
//! 2. Only the original tool provider can resume their tool
//! 3. Unauthorized attempts by different addresses are properly rejected
//! 4. The correct error type (Unauthorized) is returned when authorization fails
//! 
//! ## Relation to Requirements
//! 
//! This test validates the contract's authorization mechanism for the pause/resume functionality
//! as specified in Task 2.2 of the implementation plan, which requires the contract to verify 
//! that only the original provider can manage a tool's active status.

use cosmwasm_std::testing::{mock_dependencies, message_info};
use cosmwasm_std::{Addr, Uint128};
use crate::contract::{execute_pause_tool, execute_register_tool, execute_resume_tool};
use crate::error::ContractError;
use crate::tests::setup_contract::setup_contract;

/// # Test: Unauthorized Tool Pause and Resume Attempts
/// 
/// This test ensures that the Registry contract prevents unauthorized users
/// from pausing or resuming tools they don't own.
/// 
/// ## Test Steps:
/// 
/// 1. Setup the contract with mock dependencies
/// 2. Register a new tool "tool1" with provider1 as the owner
/// 3. Attempt to pause the tool using provider2's address (unauthorized)
/// 4. Verify the pause attempt fails with Unauthorized error
/// 5. Attempt to resume the tool using provider2's address (unauthorized)
/// 6. Verify the resume attempt fails with Unauthorized error
#[test]
fn unauthorized_pause_resume() {
    // Initialize mock dependencies and set up contract
    let mut deps = mock_dependencies();
    setup_contract(deps.as_mut()).unwrap();

    // Register a tool owned by provider1
    let provider = Addr::unchecked("provider1");
    let info = message_info(&provider, &[]);
    let tool_id = "tool1".to_string();
    let price = Uint128::new(100);
    execute_register_tool(deps.as_mut(), info, tool_id.clone(), price, None).unwrap();

    // Create message info for unauthorized provider (provider2)
    let unauthorized_info = message_info(&Addr::unchecked("provider2"), &[]);
    
    // Attempt to pause the tool with unauthorized provider
    let err = execute_pause_tool(deps.as_mut(), unauthorized_info.clone(), tool_id.clone()).unwrap_err();

    // Verify that the error is the expected Unauthorized error
    match err {
        ContractError::Unauthorized {} => {}
        e => panic!("Unexpected error: {:?}", e),
    }

    // Attempt to resume the tool with unauthorized provider
    let err = execute_resume_tool(deps.as_mut(), unauthorized_info, tool_id).unwrap_err();

    // Verify that the error is the expected Unauthorized error
    match err {
        ContractError::Unauthorized {} => {}
        e => panic!("Unexpected error: {:?}", e),
    }
}

//! # Tool Query Functionality Test
//! 
//! This module tests the query functionality of the Registry contract.
//! 
//! ## Test Coverage
//! 
//! This test verifies that:
//! 1. Tools can be successfully queried by their ID after registration
//! 2. The query returns all the correct tool metadata (provider, price, active status)
//! 3. Queries for non-existent tools return None instead of failing
//! 
//! ## Relation to Requirements
//! 
//! This test validates the contract's query functionality as specified in
//! Task 2.2 of the implementation plan, which requires the ability to
//! retrieve tool metadata for integration with the Escrow contract and
//! front-end applications.

use cosmwasm_std::testing::{mock_dependencies, message_info};
use cosmwasm_std::{Addr, from_json, Uint128};
use crate::contract::{execute_register_tool, query_tool};
use crate::msg::ToolResponse;
use crate::tests::setup_contract::setup_contract;

/// # Test: Tool Query Functionality
/// 
/// This test ensures that the Registry contract correctly handles queries
/// for both existing and non-existing tools.
/// 
/// ## Test Steps:
/// 
/// 1. Setup the contract with mock dependencies
/// 2. Register a new tool "tool1" with provider1 as the owner
/// 3. Query the registered tool and verify all metadata is correct
/// 4. Query a non-existent tool and verify None is returned
#[test]
fn query_tool_functionality() {
    // Initialize mock dependencies and set up contract
    let mut deps = mock_dependencies();
    setup_contract(deps.as_mut()).unwrap();

    // Register a tool with initial values
    let info = message_info(&Addr::unchecked("provider1"), &[]);
    let tool_id = "tool1".to_string();
    let price = Uint128::new(100);
    execute_register_tool(deps.as_mut(), info, tool_id.clone(), price).unwrap();

    // Query the registered tool and verify metadata
    let query_res = query_tool(deps.as_ref(), tool_id).unwrap();
    let tool_response: ToolResponse = from_json(&query_res).unwrap();

    // Validate all fields match expected values
    assert_eq!("provider1", tool_response.provider);
    assert_eq!(Uint128::new(100), tool_response.price);
    assert!(tool_response.is_active);

    // Query a non-existent tool
    let query_res = query_tool(deps.as_ref(), "nonexistent".to_string()).unwrap();
    let tool_response: Option<ToolResponse> = from_json(&query_res).unwrap();

    // Verify that query for non-existent tool returns None
    assert!(tool_response.is_none());
}

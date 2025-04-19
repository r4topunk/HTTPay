//! # Tool Registration Success Test
//! 
//! This module tests the successful registration of a tool in the Registry contract.
//! 
//! ## Test Coverage
//! 
//! This test verifies that:
//! 1. A tool can be successfully registered with a valid tool ID and price
//! 2. The correct response attributes are returned after registration
//! 3. The tool metadata is correctly stored and can be queried
//! 4. The tool is marked as active by default upon registration
//! 
//! ## Relation to Requirements
//! 
//! This test ensures that the Registry contract fulfills the basic tool registration 
//! functionality as specified in the project requirements (Task 2.2 in the implementation plan).
//! It validates that providers can register tools with unique IDs and set initial prices.

use cosmwasm_std::testing::{mock_dependencies, message_info};
use cosmwasm_std::{Addr, from_json, Uint128};
use crate::contract::{execute_register_tool, query_tool};
use crate::msg::ToolResponse;
use crate::tests::setup_contract::setup_contract;

/// # Test: Successful Tool Registration
/// 
/// This test verifies that a tool can be successfully registered in the Registry contract
/// and that all the tool metadata is correctly stored.
/// 
/// ## Test Steps:
/// 
/// 1. Setup the contract with mock dependencies
/// 2. Register a new tool "tool1" with price 100 from provider address "provider1"
/// 3. Verify the response attributes from the registration
/// 4. Query the tool metadata to confirm it was stored correctly
/// 5. Verify all tool properties match the expected values
#[test]
fn register_tool_success() {
    // Initialize mock dependencies and set up contract
    let mut deps = mock_dependencies();
    setup_contract(deps.as_mut()).unwrap();

    // Prepare message info with provider address
    let info = message_info(&Addr::unchecked("provider1"), &[]);
    let tool_id = "tool1".to_string();
    let price = Uint128::new(100);

    // Execute tool registration
    let res = execute_register_tool(deps.as_mut(), info, tool_id.clone(), price).unwrap();

    // Verify response attributes
    assert_eq!(5, res.attributes.len());
    assert_eq!("register_tool", res.attributes[0].value);
    assert_eq!("tool1", res.attributes[1].value);
    assert_eq!("provider1", res.attributes[2].value);
    assert_eq!("100", res.attributes[3].value);
    assert_eq!("true", res.attributes[4].value);

    // Query tool metadata and verify it was stored correctly
    let query_res = query_tool(deps.as_ref(), tool_id).unwrap();
    let tool_response: ToolResponse = from_json(&query_res).unwrap();

    // Validate all tool properties
    assert_eq!("tool1", tool_response.tool_id);
    assert_eq!("provider1", tool_response.provider);
    assert_eq!(Uint128::new(100), tool_response.price);
    assert!(tool_response.is_active);
}

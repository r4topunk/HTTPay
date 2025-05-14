//! # Successful Price Update Test
//! 
//! This module tests the successful updating of a tool's price in the Registry contract.
//! 
//! ## Test Coverage
//! 
//! This test verifies that:
//! 1. An authorized tool provider can successfully update their tool's price
//! 2. The correct response attributes are returned after the price update
//! 3. The updated price is correctly stored and can be queried
//! 
//! ## Relation to Requirements
//! 
//! This test ensures that the Registry contract fulfills the price update 
//! functionality as specified in Task 2.2 of the implementation plan,
//! which requires allowing providers to update the price of their tools.

use cosmwasm_std::testing::{mock_dependencies, message_info};
use cosmwasm_std::{Addr, from_json, Uint128};
use crate::contract::{execute_register_tool, execute_update_price, query_tool};
use crate::msg::ToolResponse;
use crate::tests::setup_contract::setup_contract;

/// # Test: Successful Tool Price Update
/// 
/// This test verifies that an authorized provider can successfully update
/// the price of their registered tool.
/// 
/// ## Test Steps:
/// 
/// 1. Setup the contract with mock dependencies
/// 2. Register a new tool "tool1" with initial price 100
/// 3. Update the tool's price to 200 using the same provider address
/// 4. Verify the response attributes from the price update
/// 5. Query the tool metadata to confirm the price was updated correctly
#[test]
fn update_price_success() {
    // Initialize mock dependencies and set up contract
    let mut deps = mock_dependencies();
    setup_contract(deps.as_mut()).unwrap();

    // Register a tool with initial price
    let provider = Addr::unchecked("provider1");
    let info = message_info(&provider, &[]);
    let tool_id = "tool1".to_string();
    let price = Uint128::new(100);
    execute_register_tool(deps.as_mut(), info.clone(), tool_id.clone(), price, None).unwrap();

    // Update the tool's price as the authorized provider
    let new_price = Uint128::new(200);
    let res = execute_update_price(deps.as_mut(), info, tool_id.clone(), new_price).unwrap();

    // Verify response attributes
    assert_eq!(3, res.attributes.len());
    assert_eq!("update_price", res.attributes[0].value);
    assert_eq!("tool1", res.attributes[1].value);
    assert_eq!("200", res.attributes[2].value);

    // Query tool metadata and verify the price was updated correctly
    let query_res = query_tool(deps.as_ref(), tool_id).unwrap();
    let tool_response: ToolResponse = from_json(&query_res).unwrap();

    // Validate the updated price
    assert_eq!(Uint128::new(200), tool_response.price);
}

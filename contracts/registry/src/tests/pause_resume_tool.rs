//! # Tool Pause and Resume Test
//! 
//! This module tests the functionality to pause and resume tools in the Registry contract.
//! 
//! ## Test Coverage
//! 
//! This test verifies that:
//! 1. An authorized tool provider can successfully pause their tool
//! 2. A paused tool is correctly marked as inactive in storage
//! 3. An authorized tool provider can successfully resume their paused tool
//! 4. A resumed tool is correctly marked as active in storage
//! 
//! ## Relation to Requirements
//! 
//! This test validates the contract's tool activation management functionality as specified in
//! Task 2.2 of the implementation plan, which requires the ability to pause and resume tools.
//! This enables providers to temporarily disable their tools while maintaining ownership.

use cosmwasm_std::testing::{mock_dependencies, message_info};
use cosmwasm_std::{Addr, from_json, Uint128};
use crate::contract::{execute_pause_tool, execute_register_tool, execute_resume_tool, query_tool};
use crate::msg::ToolResponse;
use crate::tests::setup_contract::setup_contract;

/// # Test: Tool Pause and Resume Functionality
/// 
/// This test ensures that the Registry contract correctly handles the pausing and resuming
/// of tools by their authorized providers.
/// 
/// ## Test Steps:
/// 
/// 1. Setup the contract with mock dependencies
/// 2. Register a new tool "tool1" with provider1 as the owner
/// 3. Pause the tool and verify it's marked as inactive
/// 4. Resume the tool and verify it's marked as active again
#[test]
fn pause_resume_tool() {
    // Initialize mock dependencies and set up contract
    let mut deps = mock_dependencies();
    setup_contract(deps.as_mut()).unwrap();

    // Register a tool with initial price and active state
    let provider = Addr::unchecked("provider1");
    let info = message_info(&provider, &[]);
    let tool_id = "tool1".to_string();
    let price = Uint128::new(100);
    let description = "Tool that can be paused and resumed".to_string();
    let endpoint = "https://api.provider1.com/pausable-tool".to_string();
    execute_register_tool(deps.as_mut(), info.clone(), tool_id.clone(), price, None, description.clone(), endpoint).unwrap();

    // Pause the tool and verify the response
    let res = execute_pause_tool(deps.as_mut(), info.clone(), tool_id.clone()).unwrap();
    assert_eq!("pause_tool", res.attributes[0].value);

    // Query tool state and verify it's inactive after pausing
    let query_res = query_tool(deps.as_ref(), tool_id.clone()).unwrap();
    let tool_response: ToolResponse = from_json(&query_res).unwrap();
    assert!(!tool_response.is_active);

    // Resume the tool and verify the response
    let res = execute_resume_tool(deps.as_mut(), info, tool_id.clone()).unwrap();
    assert_eq!("resume_tool", res.attributes[0].value);

    // Query tool state and verify it's active again after resuming
    let query_res = query_tool(deps.as_ref(), tool_id).unwrap();
    let tool_response: ToolResponse = from_json(&query_res).unwrap();
    assert!(tool_response.is_active);
}

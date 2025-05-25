//! # Query All Tools Functionality Test
//! 
//! This module tests the query_all_tools functionality of the Registry contract.
//! 
//! ## Test Coverage
//! 
//! This test verifies that:
//! 1. The GetTools query returns all registered tools
//! 2. The response includes correct tool metadata for each tool
//! 3. Empty results are handled properly when no tools are registered
//! 
//! ## Relation to Requirements
//! 
//! This test validates the contract's ability to list all available tools,
//! which is essential for discovery in the UI and integration with other components.

use cosmwasm_std::testing::{mock_dependencies, message_info};
use cosmwasm_std::{from_json, Addr, Uint128};
use crate::contract::{execute_register_tool, query_all_tools};
use crate::msg::ToolsResponse;
use crate::tests::setup_contract::setup_contract;

/// # Test: Query All Tools Functionality
/// 
/// This test ensures that the Registry contract correctly returns all registered tools.
/// 
/// ## Test Steps:
/// 
/// 1. Setup the contract with mock dependencies
/// 2. Register multiple tools with different providers
/// 3. Query all tools and verify the response contains all registered tools
/// 4. Verify each tool's metadata is correct
#[test]
fn query_all_tools_functionality() {
    // Initialize mock dependencies and set up contract
    let mut deps = mock_dependencies();
    setup_contract(deps.as_mut()).unwrap();

    // Check empty state first
    let query_res = query_all_tools(deps.as_ref()).unwrap();
    let tools_response: ToolsResponse = from_json(&query_res).unwrap();
    assert!(tools_response.tools.is_empty(), "Expected empty tools list before registration");

    // Register first tool
    let info1 = message_info(&Addr::unchecked("provider1"), &[]);
    let tool_id1 = "tool1".to_string();
    let price1 = Uint128::new(100);
    let desc1 = "First tool description".to_string();
    let endpoint1 = "https://api.provider1.com/tool1".to_string();
    execute_register_tool(deps.as_mut(), info1, tool_id1.clone(), price1, None, desc1.clone(), endpoint1.clone()).unwrap();

    // Register second tool
    let info2 = message_info(&Addr::unchecked("provider2"), &[]);
    let tool_id2 = "tool2".to_string();
    let price2 = Uint128::new(200);
    let desc2 = "Second tool description".to_string();
    let endpoint2 = "https://api.provider2.com/tool2".to_string();
    let denom2 = Some("uatom".to_string());
    execute_register_tool(deps.as_mut(), info2, tool_id2.clone(), price2, denom2.clone(), desc2.clone(), endpoint2.clone()).unwrap();

    // Register third tool with same provider as first
    let info3 = message_info(&Addr::unchecked("provider1"), &[]);
    let tool_id3 = "tool3".to_string();
    let price3 = Uint128::new(300);
    let desc3 = "Third tool description".to_string();
    let endpoint3 = "https://api.provider1.com/tool3".to_string();
    execute_register_tool(deps.as_mut(), info3, tool_id3.clone(), price3, None, desc3.clone(), endpoint3.clone()).unwrap();

    // Query all tools and verify response
    let query_res = query_all_tools(deps.as_ref()).unwrap();
    let tools_response: ToolsResponse = from_json(&query_res).unwrap();
    
    // Verify we got all 3 tools
    assert_eq!(3, tools_response.tools.len(), "Expected 3 tools in response");
    
    // Find each tool in the response and verify its data
    let tool1 = tools_response.tools.iter().find(|t| t.tool_id == tool_id1)
        .expect("Tool 1 should be in response");
    assert_eq!("provider1", tool1.provider);
    assert_eq!(price1, tool1.price);
    assert_eq!("untrn", tool1.denom); // Default denom
    assert!(tool1.is_active);
    assert_eq!(desc1, tool1.description);
    assert_eq!(endpoint1, tool1.endpoint); // Verify endpoint field
    
    let tool2 = tools_response.tools.iter().find(|t| t.tool_id == tool_id2)
        .expect("Tool 2 should be in response");
    assert_eq!("provider2", tool2.provider);
    assert_eq!(price2, tool2.price);
    assert_eq!("uatom", tool2.denom); // Custom denom
    assert!(tool2.is_active);
    assert_eq!(desc2, tool2.description);
    assert_eq!(endpoint2, tool2.endpoint); // Verify endpoint field
    
    let tool3 = tools_response.tools.iter().find(|t| t.tool_id == tool_id3)
        .expect("Tool 3 should be in response");
    assert_eq!("provider1", tool3.provider);
    assert_eq!(price3, tool3.price);
    assert_eq!("untrn", tool3.denom); // Default denom
    assert!(tool3.is_active);
    assert_eq!(desc3, tool3.description);
    assert_eq!(endpoint3, tool3.endpoint); // Verify endpoint field
}

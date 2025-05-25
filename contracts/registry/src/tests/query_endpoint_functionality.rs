//! # Endpoint Query Functionality Tests
//! 
//! This module tests the query functionality for the endpoint field in Registry contract responses.
//! 
//! ## Test Coverage
//! 
//! This test verifies that:
//! 1. Endpoint field is present in single tool query responses
//! 2. Endpoint field is present in all tools query responses
//! 3. Endpoint data integrity is maintained across various operations
//! 4. Endpoint field updates are reflected in query responses
//! 
//! ## Relation to Requirements
//! 
//! This test validates that the endpoint field is properly included in all
//! query responses as specified in Task 14.1 of the endpoint feature implementation.

use cosmwasm_std::testing::{mock_dependencies, message_info};
use cosmwasm_std::{Addr, from_json, Uint128};
use crate::contract::{
    execute_register_tool, 
    execute_update_endpoint,
    execute_update_price,
    execute_pause_tool,
    execute_resume_tool,
    query_tool, 
    query_all_tools
};
use crate::msg::{ToolResponse, ToolsResponse};
use crate::tests::setup_contract::setup_contract;

/// # Test: Endpoint in Single Tool Query
/// 
/// This test verifies that the endpoint field is correctly included
/// when querying a single tool.
/// 
/// ## Test Steps:
/// 
/// 1. Setup the contract with mock dependencies
/// 2. Register a tool with a specific endpoint
/// 3. Query the tool and verify endpoint is present in response
/// 4. Verify endpoint data integrity
#[test]
fn query_tool_includes_endpoint() {
    // Initialize mock dependencies and set up contract
    let mut deps = mock_dependencies();
    setup_contract(deps.as_mut()).unwrap();

    // Register a tool with specific endpoint
    let info = message_info(&Addr::unchecked("provider1"), &[]);
    let tool_id = "query_test_tool".to_string();
    let price = Uint128::new(150);
    let description = "Tool for endpoint query test".to_string();
    let endpoint = "https://api.query-test.com/v1/tool".to_string();
    
    execute_register_tool(
        deps.as_mut(), 
        info, 
        tool_id.clone(), 
        price, 
        None, 
        description.clone(), 
        endpoint.clone()
    ).unwrap();

    // Query the tool and verify endpoint field
    let query_res = query_tool(deps.as_ref(), tool_id.clone()).unwrap();
    let tool_response: ToolResponse = from_json(&query_res).unwrap();

    // Verify all fields including endpoint
    assert_eq!(tool_id, tool_response.tool_id);
    assert_eq!("provider1", tool_response.provider);
    assert_eq!(price, tool_response.price);
    assert_eq!("untrn", tool_response.denom);
    assert!(tool_response.is_active);
    assert_eq!(description, tool_response.description);
    assert_eq!(endpoint, tool_response.endpoint);
}

/// # Test: Endpoint in All Tools Query
/// 
/// This test verifies that the endpoint field is correctly included
/// when querying all tools.
/// 
/// ## Test Steps:
/// 
/// 1. Setup the contract with mock dependencies
/// 2. Register multiple tools with different endpoints
/// 3. Query all tools and verify endpoint fields are present
/// 4. Verify endpoint data integrity for all tools
#[test]
fn query_all_tools_includes_endpoints() {
    // Initialize mock dependencies and set up contract
    let mut deps = mock_dependencies();
    setup_contract(deps.as_mut()).unwrap();

    // Register multiple tools with different endpoints
    let tools_data = [
        ("provider1", "tool1", "https://api.provider1.com/tool1", "Tool 1 description"),
        ("provider2", "tool2", "https://api.provider2.com/tool2", "Tool 2 description"),
        ("provider1", "tool3", "https://api.provider1.com/tool3", "Tool 3 description"),
    ];

    for (provider, tool_id, endpoint, description) in tools_data.iter() {
        let info = message_info(&Addr::unchecked(*provider), &[]);
        execute_register_tool(
            deps.as_mut(),
            info,
            tool_id.to_string(),
            Uint128::new(100),
            None,
            description.to_string(),
            endpoint.to_string(),
        ).unwrap();
    }

    // Query all tools and verify endpoint fields
    let query_res = query_all_tools(deps.as_ref()).unwrap();
    let tools_response: ToolsResponse = from_json(&query_res).unwrap();
    
    assert_eq!(3, tools_response.tools.len());

    // Verify each tool has the correct endpoint
    for (expected_provider, expected_tool_id, expected_endpoint, expected_description) in tools_data.iter() {
        let tool = tools_response.tools
            .iter()
            .find(|t| t.tool_id == *expected_tool_id)
            .expect(&format!("Tool {} should be in response", expected_tool_id));
        
        assert_eq!(*expected_provider, tool.provider);
        assert_eq!(*expected_endpoint, tool.endpoint);
        assert_eq!(*expected_description, tool.description);
        assert!(tool.is_active);
    }
}

/// # Test: Endpoint Persistence Through Operations
/// 
/// This test verifies that the endpoint field remains intact and correctly
/// reflects updates through various tool operations.
/// 
/// ## Test Steps:
/// 
/// 1. Setup the contract with mock dependencies
/// 2. Register a tool with initial endpoint
/// 3. Perform various operations (price update, pause/resume)
/// 4. Verify endpoint remains unchanged for non-endpoint operations
/// 5. Update endpoint and verify the change is reflected
#[test]
fn endpoint_persistence_through_operations() {
    // Initialize mock dependencies and set up contract
    let mut deps = mock_dependencies();
    setup_contract(deps.as_mut()).unwrap();

    // Register a tool with initial endpoint
    let provider = Addr::unchecked("provider1");
    let info = message_info(&provider, &[]);
    let tool_id = "persistence_test".to_string();
    let price = Uint128::new(100);
    let description = "Tool for endpoint persistence test".to_string();
    let initial_endpoint = "https://api.persistence-test.com/v1".to_string();
    
    execute_register_tool(
        deps.as_mut(), 
        info.clone(), 
        tool_id.clone(), 
        price, 
        None, 
        description.clone(), 
        initial_endpoint.clone()
    ).unwrap();

    // Verify initial state
    let query_res = query_tool(deps.as_ref(), tool_id.clone()).unwrap();
    let tool_response: ToolResponse = from_json(&query_res).unwrap();
    assert_eq!(initial_endpoint, tool_response.endpoint);
    assert!(tool_response.is_active);

    // Update price and verify endpoint is unchanged
    execute_update_price(deps.as_mut(), info.clone(), tool_id.clone(), Uint128::new(200)).unwrap();
    
    let query_res = query_tool(deps.as_ref(), tool_id.clone()).unwrap();
    let tool_response: ToolResponse = from_json(&query_res).unwrap();
    assert_eq!(initial_endpoint, tool_response.endpoint);
    assert_eq!(Uint128::new(200), tool_response.price);

    // Pause tool and verify endpoint is unchanged
    execute_pause_tool(deps.as_mut(), info.clone(), tool_id.clone()).unwrap();
    
    let query_res = query_tool(deps.as_ref(), tool_id.clone()).unwrap();
    let tool_response: ToolResponse = from_json(&query_res).unwrap();
    assert_eq!(initial_endpoint, tool_response.endpoint);
    assert!(!tool_response.is_active);

    // Resume tool and verify endpoint is unchanged
    execute_resume_tool(deps.as_mut(), info.clone(), tool_id.clone()).unwrap();
    
    let query_res = query_tool(deps.as_ref(), tool_id.clone()).unwrap();
    let tool_response: ToolResponse = from_json(&query_res).unwrap();
    assert_eq!(initial_endpoint, tool_response.endpoint);
    assert!(tool_response.is_active);

    // Update endpoint and verify the change
    let new_endpoint = "https://api.persistence-test.com/v2".to_string();
    execute_update_endpoint(deps.as_mut(), info, tool_id.clone(), new_endpoint.clone()).unwrap();
    
    let query_res = query_tool(deps.as_ref(), tool_id).unwrap();
    let tool_response: ToolResponse = from_json(&query_res).unwrap();
    assert_eq!(new_endpoint, tool_response.endpoint);
    assert_eq!(Uint128::new(200), tool_response.price); // Price should remain
    assert!(tool_response.is_active); // Status should remain
}

/// # Test: Endpoint Data Integrity
/// 
/// This test verifies that endpoint data maintains integrity across
/// different tool configurations and edge cases.
/// 
/// ## Test Steps:
/// 
/// 1. Setup the contract with mock dependencies
/// 2. Register tools with various endpoint formats (all valid)
/// 3. Verify each endpoint is stored and retrieved correctly
#[test]
fn endpoint_data_integrity() {
    // Initialize mock dependencies and set up contract
    let mut deps = mock_dependencies();
    setup_contract(deps.as_mut()).unwrap();

    // Test various valid endpoint formats
    let endpoint_test_cases = [
        ("basic", "https://api.example.com/tool"),
        ("port", "https://api.example.com:8080/tool"),
        ("path", "https://api.example.com/v1/tools/process"),
        ("query", "https://api.example.com/tool?version=v1"),
        ("fragment", "https://api.example.com/tool#section"),
        ("long", &format!("https://api.example.com/{}", "a".repeat(460))),
    ];

    for (case_name, endpoint) in endpoint_test_cases.iter() {
        let info = message_info(&Addr::unchecked("provider1"), &[]);
        let tool_id = format!("t{}", case_name); // Use shorter prefix
        
        execute_register_tool(
            deps.as_mut(),
            info,
            tool_id.clone(),
            Uint128::new(100),
            None,
            format!("Tool for {} endpoint test", case_name),
            endpoint.to_string(),
        ).unwrap();

        // Verify the endpoint was stored correctly
        let query_res = query_tool(deps.as_ref(), tool_id).unwrap();
        let tool_response: ToolResponse = from_json(&query_res).unwrap();
        assert_eq!(*endpoint, tool_response.endpoint, "Endpoint mismatch for case: {}", case_name);
    }
}

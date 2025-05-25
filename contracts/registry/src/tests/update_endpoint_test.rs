//! # Update Endpoint Functionality Tests
//! 
//! This module tests the update endpoint functionality of the Registry contract.
//! 
//! ## Test Coverage
//! 
//! This test verifies that:
//! 1. Authorized providers can update their tool's endpoint
//! 2. Unauthorized users cannot update tool endpoints
//! 3. Endpoint validation is applied during updates
//! 4. Updated endpoint is correctly stored and queryable
//! 
//! ## Relation to Requirements
//! 
//! This test validates the endpoint update functionality as specified in
//! Task 14.1 of the endpoint feature implementation, ensuring that tool
//! providers can modify their tool endpoints while maintaining security.

use cosmwasm_std::testing::{mock_dependencies, message_info};
use cosmwasm_std::{Addr, from_json, Uint128};
use crate::contract::{execute_register_tool, execute_update_endpoint, query_tool};
use crate::msg::ToolResponse;
use crate::error::ContractError;
use crate::tests::setup_contract::setup_contract;

/// # Test: Successful Endpoint Update
/// 
/// This test verifies that an authorized provider can successfully update
/// their tool's endpoint.
/// 
/// ## Test Steps:
/// 
/// 1. Setup the contract with mock dependencies
/// 2. Register a new tool with an initial endpoint
/// 3. Update the tool's endpoint using the same provider address
/// 4. Verify the response attributes from the endpoint update
/// 5. Query the tool metadata to confirm the endpoint was updated correctly
#[test]
fn update_endpoint_success() {
    // Initialize mock dependencies and set up contract
    let mut deps = mock_dependencies();
    setup_contract(deps.as_mut()).unwrap();

    // Register a tool with initial endpoint
    let provider = Addr::unchecked("provider1");
    let info = message_info(&provider, &[]);
    let tool_id = "tool1".to_string();
    let price = Uint128::new(100);
    let description = "Tool for endpoint update test".to_string();
    let initial_endpoint = "https://api.provider1.com/v1/tool".to_string();
    
    execute_register_tool(
        deps.as_mut(), 
        info.clone(), 
        tool_id.clone(), 
        price, 
        None, 
        description, 
        initial_endpoint
    ).unwrap();

    // Update the tool's endpoint as the authorized provider
    let new_endpoint = "https://api.provider1.com/v2/tool".to_string();
    let res = execute_update_endpoint(
        deps.as_mut(), 
        info, 
        tool_id.clone(), 
        new_endpoint.clone()
    ).unwrap();

    // Verify response attributes
    assert_eq!(3, res.attributes.len());
    assert_eq!("update_endpoint", res.attributes[0].value);
    assert_eq!("tool1", res.attributes[1].value);
    assert_eq!(new_endpoint, res.attributes[2].value);

    // Query tool metadata and verify the endpoint was updated correctly
    let query_res = query_tool(deps.as_ref(), tool_id).unwrap();
    let tool_response: ToolResponse = from_json(&query_res).unwrap();

    // Validate the updated endpoint
    assert_eq!(new_endpoint, tool_response.endpoint);
}

/// # Test: Unauthorized Endpoint Update
/// 
/// This test verifies that only the original tool provider can update
/// a tool's endpoint.
/// 
/// ## Test Steps:
/// 
/// 1. Setup the contract with mock dependencies
/// 2. Register a new tool as provider1
/// 3. Attempt to update the endpoint as provider2 (unauthorized)
/// 4. Verify that the update fails with Unauthorized error
#[test]
fn update_endpoint_unauthorized() {
    // Initialize mock dependencies and set up contract
    let mut deps = mock_dependencies();
    setup_contract(deps.as_mut()).unwrap();

    // Register a tool as provider1
    let provider1 = Addr::unchecked("provider1");
    let info1 = message_info(&provider1, &[]);
    let tool_id = "tool1".to_string();
    let price = Uint128::new(100);
    let description = "Tool for unauthorized endpoint update test".to_string();
    let endpoint = "https://api.provider1.com/tool".to_string();
    
    execute_register_tool(
        deps.as_mut(), 
        info1, 
        tool_id.clone(), 
        price, 
        None, 
        description, 
        endpoint
    ).unwrap();

    // Attempt to update the endpoint as provider2
    let provider2 = Addr::unchecked("provider2");
    let info2 = message_info(&provider2, &[]);
    let new_endpoint = "https://api.provider2.com/malicious-tool".to_string();
    
    let err = execute_update_endpoint(
        deps.as_mut(), 
        info2, 
        tool_id, 
        new_endpoint
    ).unwrap_err();
    
    // Verify that the error is the expected Unauthorized error
    match err {
        ContractError::Unauthorized {} => {}
        e => panic!("Unexpected error: {:?}", e),
    }
}

/// # Test: Update Endpoint for Non-Existent Tool
/// 
/// This test verifies that attempting to update the endpoint for a
/// non-existent tool fails with ToolNotFound error.
/// 
/// ## Test Steps:
/// 
/// 1. Setup the contract with mock dependencies
/// 2. Attempt to update endpoint for a tool that doesn't exist
/// 3. Verify that the update fails with ToolNotFound error
#[test]
fn update_endpoint_tool_not_found() {
    // Initialize mock dependencies and set up contract
    let mut deps = mock_dependencies();
    setup_contract(deps.as_mut()).unwrap();

    // Attempt to update endpoint for non-existent tool
    let info = message_info(&Addr::unchecked("provider1"), &[]);
    let nonexistent_tool_id = "nonexistent".to_string();
    let endpoint = "https://api.provider1.com/tool".to_string();
    
    let err = execute_update_endpoint(
        deps.as_mut(), 
        info, 
        nonexistent_tool_id, 
        endpoint
    ).unwrap_err();
    
    // Verify that the error is the expected ToolNotFound error
    match err {
        ContractError::ToolNotFound {} => {}
        e => panic!("Unexpected error: {:?}", e),
    }
}

/// # Test: Update Endpoint with Invalid Format
/// 
/// This test verifies that endpoint validation is applied during updates.
/// 
/// ## Test Steps:
/// 
/// 1. Setup the contract with mock dependencies
/// 2. Register a tool with valid endpoint
/// 3. Attempt to update with invalid endpoint format
/// 4. Verify that the update fails with InvalidEndpointFormat error
#[test]
fn update_endpoint_invalid_format() {
    // Initialize mock dependencies and set up contract
    let mut deps = mock_dependencies();
    setup_contract(deps.as_mut()).unwrap();

    // Register a tool with valid endpoint
    let provider = Addr::unchecked("provider1");
    let info = message_info(&provider, &[]);
    let tool_id = "tool1".to_string();
    let price = Uint128::new(100);
    let description = "Tool for invalid endpoint update test".to_string();
    let valid_endpoint = "https://api.provider1.com/tool".to_string();
    
    execute_register_tool(
        deps.as_mut(), 
        info.clone(), 
        tool_id.clone(), 
        price, 
        None, 
        description, 
        valid_endpoint
    ).unwrap();

    // Attempt to update with HTTP endpoint (not HTTPS)
    let invalid_endpoint = "http://api.provider1.com/tool".to_string();
    
    let err = execute_update_endpoint(
        deps.as_mut(), 
        info, 
        tool_id, 
        invalid_endpoint
    ).unwrap_err();
    
    // Verify that the error is the expected InvalidEndpointFormat error
    match err {
        ContractError::InvalidEndpointFormat {} => {}
        e => panic!("Unexpected error: {:?}", e),
    }
}

/// # Test: Update Endpoint with Too Long URL
/// 
/// This test verifies that endpoint length validation is applied during updates.
/// 
/// ## Test Steps:
/// 
/// 1. Setup the contract with mock dependencies
/// 2. Register a tool with valid endpoint
/// 3. Attempt to update with endpoint exceeding 512 characters
/// 4. Verify that the update fails with EndpointTooLong error
#[test]
fn update_endpoint_too_long() {
    // Initialize mock dependencies and set up contract
    let mut deps = mock_dependencies();
    setup_contract(deps.as_mut()).unwrap();

    // Register a tool with valid endpoint
    let provider = Addr::unchecked("provider1");
    let info = message_info(&provider, &[]);
    let tool_id = "tool1".to_string();
    let price = Uint128::new(100);
    let description = "Tool for long endpoint update test".to_string();
    let valid_endpoint = "https://api.provider1.com/tool".to_string();
    
    execute_register_tool(
        deps.as_mut(), 
        info.clone(), 
        tool_id.clone(), 
        price, 
        None, 
        description, 
        valid_endpoint
    ).unwrap();

    // Attempt to update with endpoint that exceeds 512 characters
    let long_endpoint = format!("https://api.provider1.com/{}", "a".repeat(500));
    
    let err = execute_update_endpoint(
        deps.as_mut(), 
        info, 
        tool_id, 
        long_endpoint
    ).unwrap_err();
    
    // Verify that the error is the expected EndpointTooLong error
    match err {
        ContractError::EndpointTooLong {} => {}
        e => panic!("Unexpected error: {:?}", e),
    }
}

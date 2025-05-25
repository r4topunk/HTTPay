//! # Tool Registration Invalid Endpoint Tests
//! 
//! This module tests the endpoint validation functionality during tool registration.
//! 
//! ## Test Coverage
//! 
//! This test verifies that:
//! 1. Tool registration fails when endpoint exceeds 512 characters
//! 2. Tool registration fails when endpoint doesn't start with https://
//! 3. Appropriate error types are returned for each validation failure
//! 
//! ## Relation to Requirements
//! 
//! This test validates the endpoint field validation as specified in the
//! endpoint feature implementation (Task 14.1), ensuring that only valid
//! HTTPS endpoints are accepted for tool registration.

use cosmwasm_std::testing::{mock_dependencies, message_info};
use cosmwasm_std::{Addr, Uint128};
use crate::contract::execute_register_tool;
use crate::error::ContractError;
use crate::tests::setup_contract::setup_contract;

/// # Test: Tool Registration with Endpoint Too Long
/// 
/// This test verifies that tool registration fails when the endpoint
/// exceeds the maximum allowed length of 512 characters.
/// 
/// ## Test Steps:
/// 
/// 1. Setup the contract with mock dependencies
/// 2. Attempt to register a tool with an endpoint > 512 characters
/// 3. Verify that registration fails with EndpointTooLong error
#[test]
fn register_tool_endpoint_too_long() {
    // Initialize mock dependencies and set up contract
    let mut deps = mock_dependencies();
    setup_contract(deps.as_mut()).unwrap();

    // Prepare message info with provider address
    let info = message_info(&Addr::unchecked("provider1"), &[]);
    let tool_id = "tool1".to_string();
    let price = Uint128::new(100);
    let description = "Tool with too long endpoint".to_string();
    
    // Create an endpoint that exceeds 512 characters
    let long_endpoint = format!("https://api.example.com/{}", "a".repeat(500));
    
    // Execute tool registration and expect an error
    let err = execute_register_tool(
        deps.as_mut(), 
        info, 
        tool_id, 
        price, 
        None, 
        description, 
        long_endpoint
    ).unwrap_err();

    // Verify that the error is the expected EndpointTooLong error
    match err {
        ContractError::EndpointTooLong {} => {}
        e => panic!("Unexpected error: {:?}", e),
    }
}

/// # Test: Tool Registration with Invalid Endpoint Format
/// 
/// This test verifies that tool registration fails when the endpoint
/// does not start with "https://".
/// 
/// ## Test Steps:
/// 
/// 1. Setup the contract with mock dependencies
/// 2. Attempt to register tools with various invalid endpoint formats
/// 3. Verify that registration fails with InvalidEndpointFormat error
#[test]
fn register_tool_invalid_endpoint_format() {
    // Initialize mock dependencies and set up contract
    let mut deps = mock_dependencies();
    setup_contract(deps.as_mut()).unwrap();

    let tool_id = "tool1".to_string();
    let price = Uint128::new(100);
    let description = "Tool with invalid endpoint format".to_string();

    // Test with HTTP endpoint (not HTTPS)
    let info = message_info(&Addr::unchecked("provider1"), &[]);
    let http_endpoint = "http://api.example.com/tool".to_string();
    
    let err = execute_register_tool(
        deps.as_mut(), 
        info, 
        tool_id.clone(), 
        price, 
        None, 
        description.clone(), 
        http_endpoint
    ).unwrap_err();

    match err {
        ContractError::InvalidEndpointFormat {} => {}
        e => panic!("Unexpected error for HTTP endpoint: {:?}", e),
    }

    // Test with plain domain (no protocol)
    let info = message_info(&Addr::unchecked("provider1"), &[]);
    let plain_endpoint = "api.example.com/tool".to_string();
    
    let err = execute_register_tool(
        deps.as_mut(), 
        info, 
        "tool2".to_string(), 
        price, 
        None, 
        description.clone(), 
        plain_endpoint
    ).unwrap_err();

    match err {
        ContractError::InvalidEndpointFormat {} => {}
        e => panic!("Unexpected error for plain endpoint: {:?}", e),
    }

    // Test with empty endpoint
    let info = message_info(&Addr::unchecked("provider1"), &[]);
    let empty_endpoint = "".to_string();
    
    let err = execute_register_tool(
        deps.as_mut(), 
        info, 
        "tool3".to_string(), 
        price, 
        None, 
        description, 
        empty_endpoint
    ).unwrap_err();

    match err {
        ContractError::InvalidEndpointFormat {} => {}
        e => panic!("Unexpected error for empty endpoint: {:?}", e),
    }
}

/// # Test: Tool Registration with Valid Endpoint
/// 
/// This test verifies that tool registration succeeds when the endpoint
/// meets all validation criteria.
/// 
/// ## Test Steps:
/// 
/// 1. Setup the contract with mock dependencies
/// 2. Register a tool with a valid HTTPS endpoint
/// 3. Verify that registration succeeds
#[test]
fn register_tool_valid_endpoint() {
    // Initialize mock dependencies and set up contract
    let mut deps = mock_dependencies();
    setup_contract(deps.as_mut()).unwrap();

    // Prepare message info with provider address
    let info = message_info(&Addr::unchecked("provider1"), &[]);
    let tool_id = "tool1".to_string();
    let price = Uint128::new(100);
    let description = "Tool with valid endpoint".to_string();
    let valid_endpoint = "https://api.example.com/tool/v1".to_string();
    
    // Execute tool registration and expect success
    let res = execute_register_tool(
        deps.as_mut(), 
        info, 
        tool_id, 
        price, 
        None, 
        description, 
        valid_endpoint.clone()
    ).unwrap();

    // Verify that the response includes the endpoint in attributes
    assert_eq!(8, res.attributes.len());
    assert_eq!("register_tool", res.attributes[0].value);
    assert_eq!(valid_endpoint, res.attributes[7].value);
}

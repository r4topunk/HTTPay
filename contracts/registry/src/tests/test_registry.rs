use cosmwasm_std::testing::{mock_dependencies, mock_env, message_info};
use cosmwasm_std::{Addr, from_json, Uint128};

use crate::contract::{execute_pause_tool, execute_register_tool, execute_resume_tool, execute_update_price, instantiate, query_tool};
use crate::error::ContractError;
use crate::msg::{InstantiateMsg, ToolResponse};

// Helper function to instantiate the contract
fn setup_contract(deps: cosmwasm_std::DepsMut) -> Result<cosmwasm_std::Response, ContractError> {
    let info = message_info(&Addr::unchecked("creator"), &[]);
    instantiate(deps, mock_env(), info, InstantiateMsg {})
}

// Test successful tool registration
#[test]
fn register_tool_success() {
    let mut deps = mock_dependencies();
    setup_contract(deps.as_mut()).unwrap();

    // Register a new tool
    let info = message_info(&Addr::unchecked("provider1"), &[]);
    let tool_id = "tool1".to_string();
    let price = Uint128::new(100);
    
    let res = execute_register_tool(deps.as_mut(), info, tool_id.clone(), price).unwrap();
    
    // Check response attributes
    assert_eq!(5, res.attributes.len()); // Updated from 4 to 5 attributes
    assert_eq!("register_tool", res.attributes[0].value);
    assert_eq!("tool1", res.attributes[1].value);
    assert_eq!("provider1", res.attributes[2].value);
    assert_eq!("100", res.attributes[3].value);
    assert_eq!("true", res.attributes[4].value); // Check the is_active attribute
    
    // Query the tool to verify it was stored correctly
    let query_res = query_tool(deps.as_ref(), tool_id).unwrap();
    let tool_response: ToolResponse = from_json(&query_res).unwrap();
    
    assert_eq!("tool1", tool_response.tool_id);
    assert_eq!("provider1", tool_response.provider);
    assert_eq!(Uint128::new(100), tool_response.price);
    assert!(tool_response.is_active);
}

// Test tool registration with invalid tool_id (too long)
#[test]
fn register_tool_invalid_id() {
    let mut deps = mock_dependencies();
    setup_contract(deps.as_mut()).unwrap();

    // Try to register a tool with ID that is too long (>16 chars)
    let info = message_info(&Addr::unchecked("provider1"), &[]);
    let tool_id = "this_tool_id_is_way_too_long".to_string();
    let price = Uint128::new(100);
    
    let err = execute_register_tool(deps.as_mut(), info, tool_id, price).unwrap_err();
    
    // Verify the error is correct
    match err {
        ContractError::ToolIdTooLong {} => {}
        e => panic!("Unexpected error: {:?}", e),
    }
}

// Test unauthorized price update
#[test]
fn update_price_unauthorized() {
    let mut deps = mock_dependencies();
    setup_contract(deps.as_mut()).unwrap();

    // Register a tool as provider1
    let info = message_info(&Addr::unchecked("provider1"), &[]);
    let tool_id = "tool1".to_string();
    let price = Uint128::new(100);
    execute_register_tool(deps.as_mut(), info, tool_id.clone(), price).unwrap();
    
    // Try to update price as a different user (provider2)
    let info = message_info(&Addr::unchecked("provider2"), &[]);
    let new_price = Uint128::new(200);
    let err = execute_update_price(deps.as_mut(), info, tool_id, new_price).unwrap_err();
    
    // Verify the error is correct
    match err {
        ContractError::Unauthorized {} => {}
        e => panic!("Unexpected error: {:?}", e),
    }
}

// Test successful price update
#[test]
fn update_price_success() {
    let mut deps = mock_dependencies();
    setup_contract(deps.as_mut()).unwrap();

    // Register a tool as provider1
    let provider = Addr::unchecked("provider1");
    let info = message_info(&provider, &[]);
    let tool_id = "tool1".to_string();
    let price = Uint128::new(100);
    execute_register_tool(deps.as_mut(), info.clone(), tool_id.clone(), price).unwrap();
    
    // Update the price as the same provider
    let new_price = Uint128::new(200);
    let res = execute_update_price(deps.as_mut(), info, tool_id.clone(), new_price).unwrap();
    
    // Check response attributes
    assert_eq!(3, res.attributes.len());
    assert_eq!("update_price", res.attributes[0].value);
    assert_eq!("tool1", res.attributes[1].value);
    assert_eq!("200", res.attributes[2].value);
    
    // Query the tool to verify price was updated
    let query_res = query_tool(deps.as_ref(), tool_id).unwrap();
    let tool_response: ToolResponse = from_json(&query_res).unwrap();
    
    assert_eq!(Uint128::new(200), tool_response.price);
}

// Test pause and resume functionality
#[test]
fn pause_resume_tool() {
    let mut deps = mock_dependencies();
    setup_contract(deps.as_mut()).unwrap();

    // Register a tool as provider1
    let provider = Addr::unchecked("provider1");
    let info = message_info(&provider, &[]);
    let tool_id = "tool1".to_string();
    let price = Uint128::new(100);
    execute_register_tool(deps.as_mut(), info.clone(), tool_id.clone(), price).unwrap();
    
    // Pause the tool
    let res = execute_pause_tool(deps.as_mut(), info.clone(), tool_id.clone()).unwrap();
    
    // Check response attributes
    assert_eq!("pause_tool", res.attributes[0].value);
    
    // Query to verify the tool is paused
    let query_res = query_tool(deps.as_ref(), tool_id.clone()).unwrap();
    let tool_response: ToolResponse = from_json(&query_res).unwrap();
    assert!(!tool_response.is_active);
    
    // Resume the tool
    let res = execute_resume_tool(deps.as_mut(), info, tool_id.clone()).unwrap();
    
    // Check response attributes
    assert_eq!("resume_tool", res.attributes[0].value);
    
    // Query to verify the tool is active again
    let query_res = query_tool(deps.as_ref(), tool_id).unwrap();
    let tool_response: ToolResponse = from_json(&query_res).unwrap();
    assert!(tool_response.is_active);
}

// Test query functionality for existing and non-existing tools
#[test]
fn query_tool_functionality() {
    let mut deps = mock_dependencies();
    setup_contract(deps.as_mut()).unwrap();

    // Register a tool
    let info = message_info(&Addr::unchecked("provider1"), &[]);
    let tool_id = "tool1".to_string();
    let price = Uint128::new(100);
    execute_register_tool(deps.as_mut(), info, tool_id.clone(), price).unwrap();
    
    // Query for a tool that exists
    let query_res = query_tool(deps.as_ref(), tool_id).unwrap();
    let tool_response: ToolResponse = from_json(&query_res).unwrap();
    
    assert_eq!("provider1", tool_response.provider);
    assert_eq!(Uint128::new(100), tool_response.price);
    assert!(tool_response.is_active);
    
    // Query for a tool that doesn't exist
    let query_res = query_tool(deps.as_ref(), "nonexistent".to_string()).unwrap();
    let tool_response: Option<ToolResponse> = from_json(&query_res).unwrap();
    
    assert!(tool_response.is_none());
}

// Test unauthorized pause/resume attempts
#[test]
fn unauthorized_pause_resume() {
    let mut deps = mock_dependencies();
    setup_contract(deps.as_mut()).unwrap();

    // Register a tool as provider1
    let provider = Addr::unchecked("provider1");
    let info = message_info(&provider, &[]);
    let tool_id = "tool1".to_string();
    let price = Uint128::new(100);
    execute_register_tool(deps.as_mut(), info, tool_id.clone(), price).unwrap();
    
    // Try to pause the tool as a different user (provider2)
    let unauthorized_info = message_info(&Addr::unchecked("provider2"), &[]);
    let err = execute_pause_tool(deps.as_mut(), unauthorized_info.clone(), tool_id.clone()).unwrap_err();
    
    // Verify the error is correct
    match err {
        ContractError::Unauthorized {} => {}
        e => panic!("Unexpected error: {:?}", e),
    }
    
    // Try to resume the tool as a different user (provider2)
    let err = execute_resume_tool(deps.as_mut(), unauthorized_info, tool_id).unwrap_err();
    
    // Verify the error is correct
    match err {
        ContractError::Unauthorized {} => {}
        e => panic!("Unexpected error: {:?}", e),
    }
}

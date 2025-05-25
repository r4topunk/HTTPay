//! # Test Setup Module
//! 
//! This module provides the common test infrastructure for the Registry contract.
//! It contains helper functions to instantiate the contract for testing purposes,
//! ensuring consistent test environment across all test cases.
//! 
//! ## Overview
//! 
//! The Registry contract handles tool registration, price updates, and active state management.
//! This setup module initializes the contract with a default creator address for test scenarios.

use cosmwasm_std::testing::{mock_env, message_info};
use cosmwasm_std::{Addr, Uint128};
use crate::contract::{instantiate, execute_register_tool};
use crate::msg::InstantiateMsg;
use crate::error::ContractError;

/// Sets up the Registry contract for testing
///
/// This function instantiates the Registry contract with a mock environment and
/// a default creator address "creator". The function is used as the starting point
/// for all test scenarios to ensure consistent contract initialization.
///
/// # Arguments
///
/// * `deps` - The dependency injection object that provides storage access and other functionality
///
/// # Returns
///
/// * `Result<cosmwasm_std::Response, ContractError>` - The result of contract instantiation
pub fn setup_contract(deps: cosmwasm_std::DepsMut) -> Result<cosmwasm_std::Response, ContractError> {
    let info = message_info(&Addr::unchecked("creator"), &[]);
    instantiate(deps, mock_env(), info, InstantiateMsg {})
}

/// Helper function to register a tool with endpoint for testing
///
/// This function provides a convenient way to register tools in tests with all required fields
/// including the new endpoint field.
///
/// # Arguments
///
/// * `deps` - The dependency injection object
/// * `provider` - The provider address
/// * `tool_id` - The tool identifier
/// * `price` - The tool price
/// * `denom` - Optional denomination (defaults to "untrn")
/// * `description` - Tool description
/// * `endpoint` - Tool API endpoint URL
///
/// # Returns
///
/// * `Result<cosmwasm_std::Response, ContractError>` - The result of tool registration
pub fn register_tool(
    deps: cosmwasm_std::DepsMut,
    provider: &str,
    tool_id: String,
    price: Uint128,
    denom: Option<String>,
    description: String,
    endpoint: String,
) -> Result<cosmwasm_std::Response, ContractError> {
    let info = message_info(&Addr::unchecked(provider), &[]);
    execute_register_tool(deps, info, tool_id, price, denom, description, endpoint)
}

/// Helper function to register a tool with default endpoint for testing
///
/// This function provides a convenient way to register tools in tests with a default
/// HTTPS endpoint for cases where the specific endpoint value doesn't matter.
///
/// # Arguments
///
/// * `deps` - The dependency injection object
/// * `provider` - The provider address
/// * `tool_id` - The tool identifier
/// * `price` - The tool price
/// * `description` - Tool description
///
/// # Returns
///
/// * `Result<cosmwasm_std::Response, ContractError>` - The result of tool registration
pub fn register_tool_with_default_endpoint(
    deps: cosmwasm_std::DepsMut,
    provider: &str,
    tool_id: String,
    price: Uint128,
    description: String,
) -> Result<cosmwasm_std::Response, ContractError> {
    let default_endpoint = "https://api.example.com/tool".to_string();
    register_tool(deps, provider, tool_id, price, None, description, default_endpoint)
}

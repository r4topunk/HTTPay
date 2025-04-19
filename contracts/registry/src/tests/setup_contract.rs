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
use cosmwasm_std::Addr;
use crate::contract::instantiate;
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

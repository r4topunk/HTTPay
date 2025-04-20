//! # Excessive Fee Validation Test
//! 
//! This module tests that the Escrow contract properly rejects attempts to
//! charge a fee that exceeds the maximum fee specified when locking funds.
//! 
//! ## Test Coverage
//! 
//! This test verifies that:
//! 1. The contract enforces the maximum fee constraint
//! 2. The provider cannot release an escrow with a usage fee > max_fee
//! 3. The correct error is returned when the fee limit is exceeded

use cosmwasm_std::{Addr, Coin, Uint128};
use cw_multi_test::Executor;
use crate::error::ContractError;
use crate::msg::ExecuteMsg;
use crate::tests::setup_contract::{
    setup_contracts, register_tool, lock_funds, ATOM, DEFAULT_TOOL_ID, 
    DEFAULT_MAX_FEE, USER, PROVIDER, DEFAULT_TTL,
};

/// # Test: Attempting to Charge More Than Max Fee
/// 
/// This test ensures that the Escrow contract prevents providers from
/// charging more than the maximum fee specified when funds were locked.
/// 
/// ## Test Steps:
/// 
/// 1. Set up Registry and Escrow contracts
/// 2. Register a tool as the provider
/// 3. Lock funds with a specific max_fee
/// 4. Try to release the escrow with usage_fee > max_fee
/// 5. Verify the operation fails with the correct error
#[test]
fn test_excessive_fee() {
    // Set up the contracts
    let mut contracts = setup_contracts();
    
    // Register a tool
    register_tool(
        &mut contracts,
        DEFAULT_TOOL_ID,
        DEFAULT_MAX_FEE,
        PROVIDER,
    ).unwrap();
    
    // Lock funds for the tool
    let auth_token = "excessive_fee_test".to_string();
    let escrow_id = lock_funds(
        &mut contracts,
        DEFAULT_TOOL_ID,
        DEFAULT_MAX_FEE,
        DEFAULT_TTL,
        auth_token,
        USER,
        &[Coin {
            denom: ATOM.to_string(),
            amount: Uint128::new(DEFAULT_MAX_FEE),
        }],
    ).unwrap();
    
    // Try to release the escrow with usage_fee > max_fee
    let excessive_fee = DEFAULT_MAX_FEE + 1; // One unit more than max
    
    // Ensure PROVIDER is converted to a proper Bech32 address during the release operation
    let provider_addr = contracts.app.api().addr_make(PROVIDER);

    // Execute the release operation with excessive fee
    let result = contracts.app.execute_contract(
        provider_addr, // Use the properly formatted Bech32 address
        Addr::unchecked(&contracts.escrow_addr),
        &ExecuteMsg::Release {
            escrow_id,
            usage_fee: Uint128::new(excessive_fee),
        },
        &[],
    );
    
    // Verify the operation failed
    assert!(result.is_err());
    
    // Parse the error to verify it's the correct type
    match result.unwrap_err().downcast::<ContractError>() {
        Ok(contract_error) => match contract_error {
            ContractError::FeeTooHigh { max_fee, requested_fee } => {
                // Verify the error contains the correct parameters
                assert_eq!(DEFAULT_MAX_FEE.to_string(), max_fee);
                assert_eq!(excessive_fee.to_string(), requested_fee);
            },
            err => panic!("Unexpected error: {:?}", err),
        },
        Err(err) => panic!("Wrong error type: {:?}", err),
    }
}

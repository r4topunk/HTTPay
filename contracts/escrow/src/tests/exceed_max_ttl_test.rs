//! # Max TTL Validation Test
//! 
//! This module tests that the Escrow contract properly rejects attempts to 
//! create escrows with excessively long expiration periods.
//! 
//! ## Test Coverage
//! 
//! This test verifies that:
//! 1. The contract enforces the maximum TTL limit of 50 blocks
//! 2. Attempts to create escrows with longer expiration periods are rejected
//! 3. The correct error is returned when the TTL limit is exceeded

use cosmwasm_std::{Addr, Coin, Uint128};
use cw_multi_test::Executor;

use crate::error::ContractError;
use crate::tests::setup_contract::{
    setup_contracts, register_tool, ATOM, DEFAULT_TOOL_ID, DEFAULT_MAX_FEE, USER, PROVIDER,
};

/// # Test: Attempting to Exceed Max TTL
/// 
/// This test ensures that the Escrow contract enforces the maximum
/// TTL (Time-to-Live) limit of 50 blocks for escrow expiration.
/// 
/// ## Test Steps:
/// 
/// 1. Set up Registry and Escrow contracts
/// 2. Register a tool as the provider
/// 3. Try to lock funds with TTL > 50 blocks
/// 4. Verify the operation fails with the correct error
#[test]
fn test_exceed_max_ttl() {
    // Set up the contracts
    let mut contracts = setup_contracts();
    
    // Register a tool
    register_tool(
        &mut contracts,
        DEFAULT_TOOL_ID,
        DEFAULT_MAX_FEE,
        PROVIDER,
    ).unwrap();
    
    // Get current block height
    let current_height = contracts.app.block_info().height;
    
    // Try to lock funds with TTL > 50 blocks (51 blocks in this case)
    let max_ttl_plus_one = 51;
    let auth_token = "exceed_ttl_test".to_string();
    
    // Execute the lock funds operation with excessive TTL
    let result = contracts.app.execute_contract(
        Addr::unchecked(USER),
        Addr::unchecked(&contracts.escrow_addr),
        &crate::msg::ExecuteMsg::LockFunds {
            tool_id: DEFAULT_TOOL_ID.to_string(),
            max_fee: Uint128::new(DEFAULT_MAX_FEE),
            expires: current_height + max_ttl_plus_one,
            auth_token: auth_token.into(),
        },
        &[Coin {
            denom: ATOM.to_string(),
            amount: Uint128::new(DEFAULT_MAX_FEE),
        }],
    );
    
    // Verify the operation failed
    assert!(result.is_err());
    
    // Parse the error to verify it's the correct type
    match result.unwrap_err().downcast::<ContractError>() {
        Ok(contract_error) => match contract_error {
            ContractError::ExpirationTooLong { max_blocks, got_blocks } => {
                // Verify the error contains the correct parameters
                assert_eq!(50, max_blocks);
                assert_eq!(max_ttl_plus_one, got_blocks);
            },
            err => panic!("Unexpected error: {:?}", err),
        },
        Err(err) => panic!("Wrong error type: {:?}", err),
    }
}

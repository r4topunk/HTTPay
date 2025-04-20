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

use cosmwasm_std::{Coin, Uint128};
use crate::tests::setup_contract::lock_funds;

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
    
    // Try to lock funds with TTL > 50 blocks (51 blocks in this case)
    let max_ttl_plus_one = 51;
    let auth_token = "exceed_ttl_test".to_string();
    
    // Use the helper function to try to lock funds with excessive TTL
    let result = lock_funds(
        &mut contracts,
        DEFAULT_TOOL_ID,
        DEFAULT_MAX_FEE,
        max_ttl_plus_one,
        auth_token,
        USER,
        &[Coin {
            denom: ATOM.to_string(),
            amount: Uint128::new(DEFAULT_MAX_FEE),
        }],
    );
    
    // Verify the operation failed
    assert!(result.is_err());
    
    // Parse the error to verify it's the correct type
    // The error is wrapped by the cw-multi-test framework, so we can't directly match on ContractError
    // Instead, check if the error message contains the expected information
    let err_string = format!("{:?}", result.unwrap_err());
    assert!(err_string.contains("Escrow expiration too far in future: max 50 blocks, got 51 blocks"), 
            "Expected error about exceeding max TTL, got: {}", err_string);
}

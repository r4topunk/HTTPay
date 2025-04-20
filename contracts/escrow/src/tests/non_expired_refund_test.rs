//! # Non-Expired Escrow Refund Attempt Test
//! 
//! This module tests that the Escrow contract properly rejects attempts to
//! refund escrows that have not yet expired.
//! 
//! ## Test Coverage
//! 
//! This test verifies that:
//! 1. Escrows that have not expired cannot be refunded
//! 2. The contract returns the correct error when attempting to refund non-expired escrows

use cosmwasm_std::{Addr, Coin, Uint128};
use cw_multi_test::Executor;
use crate::error::ContractError;
use crate::msg::ExecuteMsg;
use crate::tests::setup_contract::{
    setup_contracts, register_tool, lock_funds, ATOM, DEFAULT_TOOL_ID, 
    DEFAULT_MAX_FEE, USER, PROVIDER, DEFAULT_TTL,
};

/// # Test: Attempt to Refund Non-Expired Escrow
/// 
/// This test ensures that the Escrow contract prevents users from refunding
/// escrows before they have reached their expiration block height.
/// 
/// ## Test Steps:
/// 
/// 1. Set up Registry and Escrow contracts
/// 2. Register a tool as the provider
/// 3. Lock funds with a standard TTL
/// 4. Try to refund the escrow before it expires
/// 5. Verify the operation fails with the correct error
#[test]
fn test_refund_non_expired_escrow() {
    // Set up the contracts
    let mut contracts = setup_contracts();
    
    // Register a tool
    register_tool(
        &mut contracts,
        DEFAULT_TOOL_ID,
        DEFAULT_MAX_FEE,
        PROVIDER,
    ).unwrap();
    
    // Lock funds with the default TTL
    let auth_token = "non_expired_refund_test".as_bytes().to_vec();
    let escrow_id = lock_funds(
        &mut contracts,
        DEFAULT_TOOL_ID,
        DEFAULT_MAX_FEE,
        DEFAULT_TTL, // Use standard TTL which should be > 1
        auth_token,
        USER,
        &[Coin {
            denom: ATOM.to_string(),
            amount: Uint128::new(DEFAULT_MAX_FEE),
        }],
    ).unwrap();
    
    // Try to refund the escrow immediately (before it expires)
    let result = contracts.app.execute_contract(
        Addr::unchecked(USER),
        Addr::unchecked(&contracts.escrow_addr),
        &ExecuteMsg::RefundExpired {
            escrow_id,
        },
        &[],
    );
    
    // Verify the operation failed
    assert!(result.is_err());
    
    // Parse the error to verify it's the correct type
    match result.unwrap_err().downcast::<ContractError>() {
        Ok(contract_error) => match contract_error {
            ContractError::EscrowNotExpired {} => {
                // This is the expected error
            },
            err => panic!("Unexpected error: {:?}", err),
        },
        Err(err) => panic!("Wrong error type: {:?}", err),
    }
}

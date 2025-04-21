//! # Unauthorized Release Test
//! 
//! This module tests that the Escrow contract properly rejects attempts to
//! release funds by anyone other than the original provider.
//! 
//! ## Test Coverage
//! 
//! This test verifies that:
//! 1. The contract enforces authorization for the Release operation
//! 2. Only the original provider can release an escrow
//! 3. The correct error is returned on unauthorized release attempts

use cosmwasm_std::{Addr, Coin, Uint128};
use cw_multi_test::Executor;
use crate::error::ContractError;
use crate::msg::ExecuteMsg;
use crate::tests::setup_contract::{
    setup_contracts, register_tool, lock_funds, ATOM, DEFAULT_TOOL_ID, 
    DEFAULT_MAX_FEE, USER, PROVIDER, UNAUTHORIZED, DEFAULT_TTL,
};

/// # Test: Unauthorized Release Attempt
/// 
/// This test ensures that the Escrow contract prevents unauthorized parties
/// from releasing funds from an escrow.
/// 
/// ## Test Steps:
/// 
/// 1. Set up Registry and Escrow contracts
/// 2. Register a tool as the provider
/// 3. Lock funds for the tool
/// 4. Try to release the escrow as an unauthorized address
/// 5. Verify the operation fails with the correct error
#[test]
fn test_unauthorized_release() {
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
    let auth_token = "unauthorized_release_test".to_string();
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
    
    // Try to release the escrow as an unauthorized user
    let usage_fee = DEFAULT_MAX_FEE / 2; // Use half of max fee
    
    // Execute the release operation with unauthorized user
    let unauthorized_addr = contracts.app.api().addr_make(UNAUTHORIZED);
    let result = contracts.app.execute_contract(
        unauthorized_addr,
        Addr::unchecked(&contracts.escrow_addr),
        &ExecuteMsg::Release {
            escrow_id,
            usage_fee: Uint128::new(usage_fee),
        },
        &[],
    );
    
    // Verify the operation failed
    assert!(result.is_err());
    
    // Parse the error to verify it's the correct type
    match result.unwrap_err().downcast::<ContractError>() {
        Ok(ContractError::Unauthorized {}) => {
            // This is the expected error
        },
        Ok(err) => panic!("Unexpected error: {:?}", err),
        Err(err) => panic!("Wrong error type: {:?}", err),
    }
    
    // Also try with the escrow user (who is also not authorized to release)
    let user_addr = contracts.app.api().addr_make(USER);
    let result = contracts.app.execute_contract(
        user_addr,
        Addr::unchecked(&contracts.escrow_addr),
        &ExecuteMsg::Release {
            escrow_id,
            usage_fee: Uint128::new(usage_fee),
        },
        &[],
    );
    
    // Verify the operation failed
    assert!(result.is_err());
    
    // Parse the error to verify it's the correct type
    match result.unwrap_err().downcast::<ContractError>() {
        Ok(ContractError::Unauthorized {}) => {
            // This is the expected error
        },
        Ok(err) => panic!("Unexpected error: {:?}", err),
        Err(err) => panic!("Wrong error type: {:?}", err),
    }
}

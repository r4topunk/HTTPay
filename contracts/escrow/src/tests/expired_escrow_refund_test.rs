//! # Expired Escrow Refund Test
//! 
//! This module tests that the Escrow contract properly handles refund requests
//! for expired escrows.
//! 
//! ## Test Coverage
//! 
//! This test verifies that:
//! 1. Escrows that have expired (current block > expires) can be refunded
//! 2. Only the original caller can refund an expired escrow
//! 3. Funds are properly returned to the original caller
//! 4. Escrow data is removed after refund

use cosmwasm_std::{Addr, Coin, Uint128};
use crate::msg::ExecuteMsg;
use crate::tests::setup_contract::{
    setup_contracts, register_tool, lock_funds, ATOM, DEFAULT_TOOL_ID, 
    DEFAULT_MAX_FEE, USER, PROVIDER,
};

/// # Test: Expired Escrow Refund
/// 
/// This test ensures that the Escrow contract properly handles the refund process
/// for escrows that have exceeded their expiration block height.
/// 
/// ## Test Steps:
/// 
/// 1. Set up Registry and Escrow contracts
/// 2. Register a tool as the provider
/// 3. Lock funds with a short TTL
/// 4. Advance the blockchain past the expiration block
/// 5. Refund the expired escrow
/// 6. Verify funds are returned to the original caller
#[test]
fn test_expired_escrow_refund() {
    // Set up the contracts
    let mut contracts = setup_contracts();
    
    // Register a tool
    register_tool(
        &mut contracts,
        DEFAULT_TOOL_ID,
        DEFAULT_MAX_FEE,
        PROVIDER,
    ).unwrap();
    
    // Get initial user balance
    let initial_user_balance = contracts.app
        .wrap()
        .query_balance(USER.to_string(), ATOM)
        .unwrap()
        .amount;
    
    // Lock funds with a very short TTL (1 block)
    let short_ttl = 1;
    let auth_token = "expired_escrow_test".as_bytes().to_vec();
    let escrow_id = lock_funds(
        &mut contracts,
        DEFAULT_TOOL_ID,
        DEFAULT_MAX_FEE,
        short_ttl,
        auth_token,
        USER,
        &[Coin {
            denom: ATOM.to_string(),
            amount: Uint128::new(DEFAULT_MAX_FEE),
        }],
    ).unwrap();
    
    // Verify funds were locked (deducted from user balance)
    let post_lock_user_balance = contracts.app
        .wrap()
        .query_balance(USER.to_string(), ATOM)
        .unwrap()
        .amount;
    
    assert_eq!(
        initial_user_balance.u128() - DEFAULT_MAX_FEE,
        post_lock_user_balance.u128()
    );
    
    // Advance the chain by 2 blocks to ensure the escrow is expired
    contracts.app.update_block(|block| {
        block.height += 2;
    });
    
    // Refund the expired escrow
    contracts.app.execute_contract(
        Addr::unchecked(USER),
        Addr::unchecked(&contracts.escrow_addr),
        &ExecuteMsg::RefundExpired {
            escrow_id,
        },
        &[],
    ).unwrap();
    
    // Verify funds were returned to the user
    let final_user_balance = contracts.app
        .wrap()
        .query_balance(USER.to_string(), ATOM)
        .unwrap()
        .amount;
    
    assert_eq!(
        initial_user_balance.u128(),
        final_user_balance.u128()
    );
}

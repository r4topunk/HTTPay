//! # Partial Fee Usage Test
//! 
//! This module tests the escrow flow with partial fee usage:
//! 1. Register a tool in the Registry contract
//! 2. Lock funds for that tool in the Escrow contract
//! 3. Release funds with a usage fee less than the maximum fee
//! 4. Verify correct fee distribution and refund of remainder
//! 
//! ## Test Coverage
//! 
//! This test verifies that:
//! 1. The provider can charge less than the maximum fee
//! 2. The remaining funds are correctly refunded to the user
//! 3. Final balances accurately reflect the partial fee usage

use cosmwasm_std::{Coin, Uint128};

use crate::tests::setup_contract::release_funds;
use crate::tests::setup_contract::{
    setup_contracts, register_tool, lock_funds, NEUTRON,
    PROVIDER, USER, DEFAULT_TTL,
};

/// # Test: Partial Fee Usage Flow
/// 
/// This test verifies that when a provider charges less than the maximum fee,
/// the remainder is correctly refunded to the user.
/// 
/// ## Test Steps:
/// 
/// 1. Set up Registry and Escrow contracts
/// 2. Register a test tool as the provider
/// 3. Lock funds for the tool as the user (with a higher max fee than will be used)
/// 4. Release funds with partial usage fee as the provider
/// 5. Verify final balances show correct fee deduction and refund
#[test]
fn test_partial_fee_usage() {
    // Set up the contracts
    let mut contracts = setup_contracts();
    
    // Constants for this specific test
    let tool_id = "partial_fee_tool";
    let max_fee = 100_u128;
    let actual_usage_fee = 30_u128; // Only use 30% of the max fee
    
    // Get initial balances using proper bech32 addresses
    let provider_addr = contracts.app.api().addr_make(PROVIDER);
    let user_addr = contracts.app.api().addr_make(USER);
    
    // Get initial balances using the proper addresses
    let initial_provider_balance = contracts.app
        .wrap()
        .query_balance(provider_addr.to_string(), NEUTRON)
        .unwrap_or_else(|e| {
            panic!("Failed to query provider balance: {:?}", e);
        })
        .amount;
    
    let initial_user_balance = contracts.app
        .wrap()
        .query_balance(user_addr.to_string(), NEUTRON)
        .unwrap_or_else(|e| {
            panic!("Failed to query user balance: {:?}", e);
        })
        .amount;
    
    // Step 1: Register a tool as the provider
    register_tool(
        &mut contracts,
        tool_id,
        max_fee, // price
        PROVIDER,
    ).expect("Failed to register tool");
    
    // Step 2: Lock funds as the user
    let auth_token = "partial_fee_auth".to_string();
    let escrow_id = lock_funds(
        &mut contracts,
        tool_id,
        max_fee,
        DEFAULT_TTL,
        auth_token,
        USER,
        &[Coin {
            denom: NEUTRON.to_string(),
            amount: Uint128::new(max_fee),
        }],
    ).expect("Failed to lock funds");
    
    // Step 3: Release funds with partial usage fee as the provider
    release_funds(
        &mut contracts,
        escrow_id,
        actual_usage_fee,
        PROVIDER,
    ).expect("Failed to release funds");
    
    // Step 4: Verify final balances
    
    // Get final balances using the proper addresses
    let final_provider_balance = contracts.app
        .wrap()
        .query_balance(provider_addr.to_string(), NEUTRON)
        .unwrap_or_else(|e| {
            panic!("Failed to query final provider balance: {:?}", e);
        })
        .amount;
    
    let final_user_balance = contracts.app
        .wrap()
        .query_balance(user_addr.to_string(), NEUTRON)
        .unwrap_or_else(|e| {
            panic!("Failed to query final user balance: {:?}", e);
        })
        .amount;
    
    // Provider should have received exactly the usage fee
    assert_eq!(
        initial_provider_balance.u128() + actual_usage_fee,
        final_provider_balance.u128()
    );
    
    // User should have spent only the actual usage fee, not the maximum fee
    let expected_user_balance = initial_user_balance.u128() - actual_usage_fee;
    assert_eq!(expected_user_balance, final_user_balance.u128());
    
    // Calculate the refund amount (should be max_fee - actual_usage_fee)
    let refund_amount = max_fee - actual_usage_fee;
    
    // Verify user received the correct refund
    assert_eq!(
        initial_user_balance.u128() - max_fee + refund_amount,
        final_user_balance.u128()
    );
}

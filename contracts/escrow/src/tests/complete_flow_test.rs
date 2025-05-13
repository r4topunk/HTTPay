//! # Complete Flow Integration Test
//! 
//! This module tests the complete flow of the Pay-Per-Tool system:
//! 1. Register a tool in the Registry contract
//! 2. Lock funds for that tool in the Escrow contract
//! 3. Release funds from escrow to the provider
//! 4. Verify final balances match expectations
//! 
//! ## Test Coverage
//! 
//! This test verifies that:
//! 1. The Registry and Escrow contracts can work together as designed
//! 2. Funds are correctly transferred from the user to the escrow and then to the provider
//! 3. All contract state changes are correctly applied throughout the workflow

use cosmwasm_std::{Addr, Coin, Uint128};
use cw_multi_test::Executor;

use crate::msg::ExecuteMsg;
use crate::tests::setup_contract::{
    setup_contracts, register_tool, lock_funds, ATOM, DEFAULT_TOOL_ID,
    PROVIDER, USER, DEFAULT_MAX_FEE, DEFAULT_TTL, DEFAULT_USAGE_FEE,
};

/// # Test: Complete Flow - Register Tool → Lock Funds → Release → Verify Balances
/// 
/// This test ensures the full workflow of the Pay-Per-Tool system functions correctly,
/// from tool registration through fund release, with proper balance verification.
/// 
/// ## Test Steps:
/// 
/// 1. Set up Registry and Escrow contracts
/// 2. Register a test tool as the provider
/// 3. Lock funds for the tool as the user
/// 4. Release funds as the provider
/// 5. Verify final balances of user and provider match expectations
#[test]
fn test_complete_flow() {
    // Set up the contracts
    let mut contracts = setup_contracts();
    
    // Get initial balances using properly formatted bech32 addresses
    let provider_addr = contracts.app.api().addr_make(PROVIDER).to_string();
    let user_addr = contracts.app.api().addr_make(USER).to_string();
    
    let initial_provider_balance = contracts.app
        .wrap()
        .query_balance(provider_addr.clone(), ATOM)
        .unwrap()
        .amount;
    
    let initial_user_balance = contracts.app
        .wrap()
        .query_balance(user_addr.clone(), ATOM)
        .unwrap()
        .amount;
    
    // Step 1: Register a tool as the provider
    register_tool(
        &mut contracts,
        DEFAULT_TOOL_ID,
        DEFAULT_MAX_FEE, // price
        PROVIDER,
    ).unwrap();
    
    // Step 2: Lock funds as the user
    let auth_token = "test_auth_token".to_string();
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
    
    // Step 3: Release funds as the provider
    // Use the Addr type for contract execution
    let provider_addr_obj = contracts.app.api().addr_make(PROVIDER);
    contracts.app
        .execute_contract(
            provider_addr_obj,
            Addr::unchecked(&contracts.escrow_addr),
            &ExecuteMsg::Release {
                escrow_id,
                usage_fee: Uint128::new(DEFAULT_USAGE_FEE),
            },
            &[],
        )
        .unwrap();
    
    // Step 4: Verify final balances (using the same properly formatted addresses)
    let final_provider_balance = contracts.app
        .wrap()
        .query_balance(provider_addr.clone(), ATOM)
        .unwrap()
        .amount;
    
    let final_user_balance = contracts.app
        .wrap()
        .query_balance(user_addr.clone(), ATOM)
        .unwrap()
        .amount;
    
    // Provider should have received the usage fee
    assert_eq!(
        initial_provider_balance.u128() + DEFAULT_USAGE_FEE,
        final_provider_balance.u128()
    );
    
    // User should have spent the usage fee and gotten refunded the difference
    let expected_user_balance = initial_user_balance.u128() - DEFAULT_USAGE_FEE;
    assert_eq!(expected_user_balance, final_user_balance.u128());
}

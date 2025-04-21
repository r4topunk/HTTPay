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
    setup_contracts, register_tool, lock_funds, ATOM,
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
    println!("DEBUG: Setting up contracts");
    let mut contracts = setup_contracts();
    
    // Constants for this specific test
    let tool_id = "partial_fee_tool";
    let max_fee = 100_u128;
    let actual_usage_fee = 30_u128; // Only use 30% of the max fee
    println!("DEBUG: Test parameters - tool_id: {}, max_fee: {}, actual_usage_fee: {}", 
             tool_id, max_fee, actual_usage_fee);
    
    // Get initial balances using proper bech32 addresses
    println!("DEBUG: Creating proper bech32 addresses for balance queries");
    let provider_addr = contracts.app.api().addr_make(PROVIDER);
    let user_addr = contracts.app.api().addr_make(USER);
    
    println!("DEBUG: Provider address: {}", provider_addr);
    println!("DEBUG: User address: {}", user_addr);
    
    // Get initial balances using the proper addresses
    println!("DEBUG: Querying initial provider balance");
    let initial_provider_balance = contracts.app
        .wrap()
        .query_balance(provider_addr.to_string(), ATOM)
        .unwrap_or_else(|e| {
            println!("ERROR querying provider balance: {:?}", e);
            panic!("Failed to query provider balance: {:?}", e);
        })
        .amount;
    
    println!("DEBUG: Querying initial user balance");
    let initial_user_balance = contracts.app
        .wrap()
        .query_balance(user_addr.to_string(), ATOM)
        .unwrap_or_else(|e| {
            println!("ERROR querying user balance: {:?}", e);
            panic!("Failed to query user balance: {:?}", e);
        })
        .amount;
        
    println!("DEBUG: Initial provider balance: {}", initial_provider_balance);
    println!("DEBUG: Initial user balance: {}", initial_user_balance);
    
    // Step 1: Register a tool as the provider
    println!("DEBUG: Registering tool as provider");
    match register_tool(
        &mut contracts,
        tool_id,
        max_fee, // price
        PROVIDER,
    ) {
        Ok(_) => println!("DEBUG: Tool registration successful"),
        Err(e) => {
            println!("ERROR registering tool: {:?}", e);
            panic!("Failed to register tool: {:?}", e);
        }
    }
    
    // Step 2: Lock funds as the user
    println!("DEBUG: Locking funds as user");
    let auth_token = "partial_fee_auth".to_string();
    println!("DEBUG: Auth token: {}", auth_token);
    let escrow_id = match lock_funds(
        &mut contracts,
        tool_id,
        max_fee,
        DEFAULT_TTL,
        auth_token,
        USER,
        &[Coin {
            denom: ATOM.to_string(),
            amount: Uint128::new(max_fee),
        }],
    ) {
        Ok(id) => {
            println!("DEBUG: Lock funds successful, escrow_id: {}", id);
            id
        },
        Err(e) => {
            println!("ERROR locking funds: {:?}", e);
            panic!("Failed to lock funds: {:?}", e);
        }
    };
    
    // Step 3: Release funds with partial usage fee as the provider
    println!("DEBUG: Releasing funds with partial usage fee");
    
    // Use the helper function to release funds instead of direct execution
    match release_funds(
        &mut contracts,
        escrow_id,
        actual_usage_fee,
        PROVIDER,
    ) {
        Ok(_) => println!("DEBUG: Release successful"),
        Err(e) => {
            println!("ERROR releasing funds: {:?}", e);
            panic!("Failed to release funds: {:?}", e);
        }
    };
    
    // Step 4: Verify final balances
    println!("DEBUG: Verifying final balances");
    
    // Get final balances using the proper addresses
    println!("DEBUG: Querying final provider balance");
    let final_provider_balance = contracts.app
        .wrap()
        .query_balance(provider_addr.to_string(), ATOM)
        .unwrap_or_else(|e| {
            println!("ERROR querying final provider balance: {:?}", e);
            panic!("Failed to query final provider balance: {:?}", e);
        })
        .amount;
    
    println!("DEBUG: Querying final user balance");
    let final_user_balance = contracts.app
        .wrap()
        .query_balance(user_addr.to_string(), ATOM)
        .unwrap_or_else(|e| {
            println!("ERROR querying final user balance: {:?}", e);
            panic!("Failed to query final user balance: {:?}", e);
        })
        .amount;
    
    println!("DEBUG: Final provider balance: {}", final_provider_balance);
    println!("DEBUG: Final user balance: {}", final_user_balance);
    
    // Provider should have received exactly the usage fee
    println!("DEBUG: Checking provider received correct usage fee");
    println!("DEBUG: Expected provider balance: {}", initial_provider_balance.u128() + actual_usage_fee);
    println!("DEBUG: Actual provider balance: {}", final_provider_balance.u128());
    assert_eq!(
        initial_provider_balance.u128() + actual_usage_fee,
        final_provider_balance.u128()
    );
    
    // User should have spent only the actual usage fee, not the maximum fee
    println!("DEBUG: Checking user spent only actual usage fee");
    let expected_user_balance = initial_user_balance.u128() - actual_usage_fee;
    println!("DEBUG: Expected user balance: {}", expected_user_balance);
    println!("DEBUG: Actual user balance: {}", final_user_balance.u128());
    assert_eq!(expected_user_balance, final_user_balance.u128());
    
    // Calculate the refund amount (should be max_fee - actual_usage_fee)
    let refund_amount = max_fee - actual_usage_fee;
    println!("DEBUG: Refund amount: {}", refund_amount);
    
    // Verify user received the correct refund
    println!("DEBUG: Verifying user received correct refund");
    println!("DEBUG: Expected refund calculation: {} - {} + {} = {}", 
             initial_user_balance.u128(), max_fee, refund_amount, 
             initial_user_balance.u128() - max_fee + refund_amount);
    assert_eq!(
        initial_user_balance.u128() - max_fee + refund_amount,
        final_user_balance.u128()
    );
    
    println!("DEBUG: Test completed successfully");
}

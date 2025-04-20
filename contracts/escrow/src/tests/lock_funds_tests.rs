//! # Lock Funds Tests
//! 
//! This module tests the LockFunds functionality of the Escrow contract.

use cosmwasm_std::{Addr, Coin, Uint128};
use crate::msg::EscrowResponse;
use super::setup_contract::{
    setup_contracts, register_tool, lock_funds,
    ATOM, DEFAULT_MAX_FEE, DEFAULT_TTL, DEFAULT_TOOL_ID,
    PROVIDER, USER,
};

#[test]
fn test_lock_funds_success() {
    // Set up contracts
    let mut contracts = setup_contracts();
    
    // Register a tool as the provider
    register_tool(&mut contracts, DEFAULT_TOOL_ID, 50, PROVIDER).unwrap();
    
    // Prepare auth token
    let auth_token = "test_auth_token".to_string();
    
    // Lock funds as the user
    let escrow_id = lock_funds(
        &mut contracts,
        DEFAULT_TOOL_ID,
        DEFAULT_MAX_FEE,
        DEFAULT_TTL,
        auth_token.clone(),
        USER,
        &[Coin {
            denom: ATOM.to_string(),
            amount: Uint128::new(DEFAULT_MAX_FEE),
        }],
    ).unwrap();
    
    // Query the escrow to verify it was created correctly
    let escrow: EscrowResponse = contracts.app.wrap().query_wasm_smart(
        &contracts.escrow_addr,
        &crate::msg::QueryMsg::GetEscrow { escrow_id },
    ).unwrap();
    
    // Verify escrow details
    assert_eq!(escrow.caller, USER);
    assert_eq!(escrow.provider, PROVIDER);
    assert_eq!(escrow.max_fee.u128(), DEFAULT_MAX_FEE);
    assert_eq!(escrow.auth_token, auth_token);
    
    // Verify that funds were transferred from the user to the escrow contract
    let user_balance = contracts.app.wrap().query_balance(USER.to_string(), ATOM).unwrap();
    assert_eq!(user_balance.amount.u128(), 5000 - DEFAULT_MAX_FEE);
}

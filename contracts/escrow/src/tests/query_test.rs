//! # Query Endpoints Test
//! 
//! This module tests the query functionality of the Escrow contract:
//! 1. Lock funds to create an escrow
//! 2. Query the escrow details
//! 3. Verify the returned data matches what was created
//! 
//! ## Test Coverage
//! 
//! This test verifies that:
//! 1. The GetEscrow query returns the correct data for an existing escrow
//! 2. All escrow fields are properly included in the response
//! 3. The query correctly handles escrow IDs, provider addresses, and amounts

use cosmwasm_std::{Coin, Uint128};
use crate::msg::{EscrowResponse, QueryMsg};
use crate::tests::setup_contract::{
    setup_contracts, register_tool, lock_funds, NEUTRON, DEFAULT_TOOL_ID,
    PROVIDER, USER, DEFAULT_MAX_FEE, DEFAULT_TTL,
};

/// # Test: Query Endpoints Return Correct Data
/// 
/// This test ensures that the Escrow contract's query endpoints return
/// the correct and complete data about escrow entries.
/// 
/// ## Test Steps:
/// 
/// 1. Set up Registry and Escrow contracts
/// 2. Register a tool as the provider
/// 3. Lock funds for the tool as the user
/// 4. Query the escrow details
/// 5. Verify all returned data matches what was expected
#[test]
fn test_query_endpoints() {
    // Set up the contracts
    let mut contracts = setup_contracts();
    
    // Step 1: Register a tool as the provider
    register_tool(
        &mut contracts,
        DEFAULT_TOOL_ID,
        DEFAULT_MAX_FEE, // price
        PROVIDER,
    ).unwrap();
    
    // Step 2: Lock funds as the user
    let auth_token = "query_test_auth".to_string();
    let auth_token_str = auth_token.clone(); // No conversion needed, already a String
    let current_height = contracts.app.block_info().height;
    let expires = current_height + DEFAULT_TTL;
    
    let escrow_id = lock_funds(
        &mut contracts,
        DEFAULT_TOOL_ID,
        DEFAULT_MAX_FEE,
        DEFAULT_TTL,
        auth_token,
        USER,
        &[Coin {
            denom: NEUTRON.to_string(),
            amount: Uint128::new(DEFAULT_MAX_FEE),
        }],
    ).unwrap();
    
    // Step 3: Query the escrow details
    let query_res: EscrowResponse = contracts.app
        .wrap()
        .query_wasm_smart(
            &contracts.escrow_addr,
            &QueryMsg::GetEscrow { escrow_id },
        )
        .unwrap();
    
    // Update the expected user address to match the Bech32-encoded format
    let expected_user_address = contracts.app.api().addr_make(USER);
    // Update the expected provider address to match the Bech32-encoded format
    let expected_provider_address = contracts.app.api().addr_make(PROVIDER);

    // Step 4: Verify all returned data matches what was expected
    assert_eq!(escrow_id, query_res.escrow_id);
    assert_eq!(expected_user_address.as_str(), query_res.caller.as_str());
    assert_eq!(expected_provider_address.as_str(), query_res.provider.as_str());
    assert_eq!(Uint128::new(DEFAULT_MAX_FEE), query_res.max_fee);
    assert_eq!(expires, query_res.expires);
    assert_eq!(auth_token_str, query_res.auth_token);
}

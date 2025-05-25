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

/// # Test: GetEscrows Query Returns Multiple Escrows
/// 
/// This test ensures that the new GetEscrows query functionality works correctly
/// with basic filtering and pagination.
/// 
/// ## Test Steps:
/// 
/// 1. Set up Registry and Escrow contracts
/// 2. Register a tool and create multiple escrows
/// 3. Query all escrows without filters
/// 4. Query escrows with caller filter
/// 5. Verify the results match expectations
#[test]
fn test_get_escrows_query() {
    use crate::msg::EscrowsResponse;
    
    // Set up the contracts
    let mut contracts = setup_contracts();
    
    // Step 1: Register a tool as the provider
    register_tool(
        &mut contracts,
        DEFAULT_TOOL_ID,
        DEFAULT_MAX_FEE, // price
        PROVIDER,
    ).unwrap();
    
    // Step 2: Create multiple escrows with different callers
    let auth_token1 = "auth_token_1".to_string();
    let auth_token2 = "auth_token_2".to_string();
    
    // Create first escrow with USER
    let escrow_id1 = lock_funds(
        &mut contracts,
        DEFAULT_TOOL_ID,
        DEFAULT_MAX_FEE,
        DEFAULT_TTL,
        auth_token1.clone(),
        USER,
        &[Coin {
            denom: NEUTRON.to_string(),
            amount: Uint128::new(DEFAULT_MAX_FEE),
        }],
    ).unwrap();
    
    // Create second escrow with a different user (using PROVIDER as different caller)
    let escrow_id2 = lock_funds(
        &mut contracts,
        DEFAULT_TOOL_ID,
        DEFAULT_MAX_FEE,
        DEFAULT_TTL,
        auth_token2.clone(),
        PROVIDER, // Using provider as a different caller
        &[Coin {
            denom: NEUTRON.to_string(),
            amount: Uint128::new(DEFAULT_MAX_FEE),
        }],
    ).unwrap();
    
    // Step 3: Query all escrows without filters
    let all_escrows: EscrowsResponse = contracts.app
        .wrap()
        .query_wasm_smart(
            &contracts.escrow_addr,
            &QueryMsg::GetEscrows {
                caller: None,
                provider: None,
                start_after: None,
                limit: None,
            },
        )
        .unwrap();
    
    // Should return both escrows
    assert_eq!(2, all_escrows.escrows.len());
    assert_eq!(escrow_id1, all_escrows.escrows[0].escrow_id);
    assert_eq!(escrow_id2, all_escrows.escrows[1].escrow_id);
    
    // Step 4: Query escrows filtered by first caller (USER)
    let user_address = contracts.app.api().addr_make(USER);
    let user_escrows: EscrowsResponse = contracts.app
        .wrap()
        .query_wasm_smart(
            &contracts.escrow_addr,
            &QueryMsg::GetEscrows {
                caller: Some(user_address.to_string()),
                provider: None,
                start_after: None,
                limit: None,
            },
        )
        .unwrap();
    
    // Should return only the first escrow
    assert_eq!(1, user_escrows.escrows.len());
    assert_eq!(escrow_id1, user_escrows.escrows[0].escrow_id);
    assert_eq!(user_address, user_escrows.escrows[0].caller);
    assert_eq!(auth_token1, user_escrows.escrows[0].auth_token);
    
    // Step 5: Query escrows filtered by provider
    let provider_address = contracts.app.api().addr_make(PROVIDER);
    let provider_escrows: EscrowsResponse = contracts.app
        .wrap()
        .query_wasm_smart(
            &contracts.escrow_addr,
            &QueryMsg::GetEscrows {
                caller: None,
                provider: Some(provider_address.to_string()),
                start_after: None,
                limit: None,
            },
        )
        .unwrap();
    
    // Should return both escrows since both have the same provider
    assert_eq!(2, provider_escrows.escrows.len());
    
    // Step 6: Test pagination with limit
    let limited_escrows: EscrowsResponse = contracts.app
        .wrap()
        .query_wasm_smart(
            &contracts.escrow_addr,
            &QueryMsg::GetEscrows {
                caller: None,
                provider: None,
                start_after: None,
                limit: Some(1),
            },
        )
        .unwrap();
    
    // Should return only 1 escrow
    assert_eq!(1, limited_escrows.escrows.len());
    assert_eq!(escrow_id1, limited_escrows.escrows[0].escrow_id);
}

/// # Test: GetEscrows Combined Filtering and Advanced Pagination
/// 
/// This test covers advanced filtering scenarios and pagination with start_after.
#[test]
fn test_get_escrows_advanced_filtering_pagination() {
    use crate::msg::EscrowsResponse;
    
    // Set up the contracts
    let mut contracts = setup_contracts();
    
    // Register a tool as the provider
    register_tool(
        &mut contracts,
        DEFAULT_TOOL_ID,
        DEFAULT_MAX_FEE,
        PROVIDER,
    ).unwrap();
    
    // Create multiple escrows with different caller/provider combinations
    let auth_token1 = "auth_token_1".to_string();
    let auth_token2 = "auth_token_2".to_string();
    let auth_token3 = "auth_token_3".to_string();
    
    // Register a second tool with a different provider
    let provider2 = "provider2";
    let tool_id2 = "tool2";
    register_tool(
        &mut contracts,
        tool_id2,
        DEFAULT_MAX_FEE,
        provider2,
    ).unwrap();
    
    // Create escrow 1: USER -> PROVIDER
    let escrow_id1 = lock_funds(
        &mut contracts,
        DEFAULT_TOOL_ID,
        DEFAULT_MAX_FEE,
        DEFAULT_TTL,
        auth_token1.clone(),
        USER,
        &[Coin {
            denom: NEUTRON.to_string(),
            amount: Uint128::new(DEFAULT_MAX_FEE),
        }],
    ).unwrap();
    
    // Create escrow 2: USER -> provider2
    let escrow_id2 = lock_funds(
        &mut contracts,
        tool_id2,
        DEFAULT_MAX_FEE,
        DEFAULT_TTL,
        auth_token2.clone(),
        USER,
        &[Coin {
            denom: NEUTRON.to_string(),
            amount: Uint128::new(DEFAULT_MAX_FEE),
        }],
    ).unwrap();
    
    // Create escrow 3: PROVIDER -> provider2 (provider as caller)
    let escrow_id3 = lock_funds(
        &mut contracts,
        tool_id2,
        DEFAULT_MAX_FEE,
        DEFAULT_TTL,
        auth_token3.clone(),
        PROVIDER,
        &[Coin {
            denom: NEUTRON.to_string(),
            amount: Uint128::new(DEFAULT_MAX_FEE),
        }],
    ).unwrap();
    
    // Test combined filtering: specific caller AND specific provider
    let user_address = contracts.app.api().addr_make(USER);
    let provider2_address = contracts.app.api().addr_make(provider2);
    let combined_filter: EscrowsResponse = contracts.app
        .wrap()
        .query_wasm_smart(
            &contracts.escrow_addr,
            &QueryMsg::GetEscrows {
                caller: Some(user_address.to_string()),
                provider: Some(provider2_address.to_string()),
                start_after: None,
                limit: None,
            },
        )
        .unwrap();
    
    // Should return only escrow 2 (USER -> provider2)
    assert_eq!(1, combined_filter.escrows.len());
    assert_eq!(escrow_id2, combined_filter.escrows[0].escrow_id);
    assert_eq!(user_address, combined_filter.escrows[0].caller);
    assert_eq!(provider2_address, combined_filter.escrows[0].provider);
    
    // Test pagination with start_after
    let paginated_result: EscrowsResponse = contracts.app
        .wrap()
        .query_wasm_smart(
            &contracts.escrow_addr,
            &QueryMsg::GetEscrows {
                caller: None,
                provider: None,
                start_after: Some(escrow_id1), // Start after first escrow
                limit: Some(2),
            },
        )
        .unwrap();
    
    // Should return escrows 2 and 3
    assert_eq!(2, paginated_result.escrows.len());
    assert_eq!(escrow_id2, paginated_result.escrows[0].escrow_id);
    assert_eq!(escrow_id3, paginated_result.escrows[1].escrow_id);
    
    // Test pagination with start_after and filtering
    let filtered_pagination: EscrowsResponse = contracts.app
        .wrap()
        .query_wasm_smart(
            &contracts.escrow_addr,
            &QueryMsg::GetEscrows {
                caller: Some(user_address.to_string()),
                provider: None,
                start_after: Some(escrow_id1), // Start after first escrow
                limit: None,
            },
        )
        .unwrap();
    
    // Should return only escrow 2 (USER's second escrow)
    assert_eq!(1, filtered_pagination.escrows.len());
    assert_eq!(escrow_id2, filtered_pagination.escrows[0].escrow_id);
}

/// # Test: GetEscrows Edge Cases and Limits
/// 
/// This test covers edge cases including limit boundaries and invalid scenarios.
#[test]
fn test_get_escrows_edge_cases() {
    use crate::msg::EscrowsResponse;
    
    // Set up the contracts
    let mut contracts = setup_contracts();
    
    // Register a tool
    register_tool(
        &mut contracts,
        DEFAULT_TOOL_ID,
        DEFAULT_MAX_FEE,
        PROVIDER,
    ).unwrap();
    
    // Create one escrow for testing
    let auth_token = "edge_case_auth".to_string();
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
    
    // Test limit = 0 (should return empty results)
    let zero_limit: EscrowsResponse = contracts.app
        .wrap()
        .query_wasm_smart(
            &contracts.escrow_addr,
            &QueryMsg::GetEscrows {
                caller: None,
                provider: None,
                start_after: None,
                limit: Some(0),
            },
        )
        .unwrap();
    
    assert_eq!(0, zero_limit.escrows.len());
    
    // Test very large limit (should be capped at 30)
    let large_limit: EscrowsResponse = contracts.app
        .wrap()
        .query_wasm_smart(
            &contracts.escrow_addr,
            &QueryMsg::GetEscrows {
                caller: None,
                provider: None,
                start_after: None,
                limit: Some(1000), // Very large limit
            },
        )
        .unwrap();
    
    // Should return only 1 escrow (we only have 1), but limit should be respected
    assert_eq!(1, large_limit.escrows.len());
    assert_eq!(escrow_id, large_limit.escrows[0].escrow_id);
    
    // Test start_after with non-existent escrow ID (should return empty)
    let non_existent_start: EscrowsResponse = contracts.app
        .wrap()
        .query_wasm_smart(
            &contracts.escrow_addr,
            &QueryMsg::GetEscrows {
                caller: None,
                provider: None,
                start_after: Some(9999), // Non-existent escrow ID
                limit: None,
            },
        )
        .unwrap();
    
    assert_eq!(0, non_existent_start.escrows.len());
    
    // Test start_after beyond available escrows
    let beyond_available: EscrowsResponse = contracts.app
        .wrap()
        .query_wasm_smart(
            &contracts.escrow_addr,
            &QueryMsg::GetEscrows {
                caller: None,
                provider: None,
                start_after: Some(escrow_id), // Start after the only escrow
                limit: None,
            },
        )
        .unwrap();
    
    assert_eq!(0, beyond_available.escrows.len());
}

/// # Test: GetEscrows Empty Results Scenarios
/// 
/// This test covers scenarios that should return empty results.
#[test]
fn test_get_escrows_empty_results() {
    use crate::msg::EscrowsResponse;
    
    // Set up the contracts
    let mut contracts = setup_contracts();
    
    // Register a tool but don't create any escrows
    register_tool(
        &mut contracts,
        DEFAULT_TOOL_ID,
        DEFAULT_MAX_FEE,
        PROVIDER,
    ).unwrap();
    
    // Test querying when no escrows exist
    let no_escrows: EscrowsResponse = contracts.app
        .wrap()
        .query_wasm_smart(
            &contracts.escrow_addr,
            &QueryMsg::GetEscrows {
                caller: None,
                provider: None,
                start_after: None,
                limit: None,
            },
        )
        .unwrap();
    
    assert_eq!(0, no_escrows.escrows.len());
    
    // Create one escrow
    let auth_token = "empty_test_auth".to_string();
    let _escrow_id = lock_funds(
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
    
    // Test filtering with non-matching caller
    let non_matching_caller: EscrowsResponse = contracts.app
        .wrap()
        .query_wasm_smart(
            &contracts.escrow_addr,
            &QueryMsg::GetEscrows {
                caller: Some(contracts.app.api().addr_make("nonexistent").to_string()),
                provider: None,
                start_after: None,
                limit: None,
            },
        )
        .unwrap();
    
    assert_eq!(0, non_matching_caller.escrows.len());
    
    // Test filtering with non-matching provider
    let non_matching_provider: EscrowsResponse = contracts.app
        .wrap()
        .query_wasm_smart(
            &contracts.escrow_addr,
            &QueryMsg::GetEscrows {
                caller: None,
                provider: Some(contracts.app.api().addr_make("nonexistent_provider").to_string()),
                start_after: None,
                limit: None,
            },
        )
        .unwrap();
    
    assert_eq!(0, non_matching_provider.escrows.len());
    
    // Test filtering with both non-matching caller and provider
    let both_non_matching: EscrowsResponse = contracts.app
        .wrap()
        .query_wasm_smart(
            &contracts.escrow_addr,
            &QueryMsg::GetEscrows {
                caller: Some(contracts.app.api().addr_make("nonexistent").to_string()),
                provider: Some(contracts.app.api().addr_make("nonexistent_provider").to_string()),
                start_after: None,
                limit: None,
            },
        )
        .unwrap();
    
    assert_eq!(0, both_non_matching.escrows.len());
}

/// # Test: GetEscrows Invalid Parameters and Error Handling
/// 
/// This test covers error handling for invalid parameters.
#[test]
fn test_get_escrows_invalid_parameters() {
    // Set up the contracts
    let mut contracts = setup_contracts();
    
    // Register a tool
    register_tool(
        &mut contracts,
        DEFAULT_TOOL_ID,
        DEFAULT_MAX_FEE,
        PROVIDER,
    ).unwrap();
    
    // Test with invalid caller address format
    let invalid_caller_result = contracts.app
        .wrap()
        .query_wasm_smart::<crate::msg::EscrowsResponse>(
            &contracts.escrow_addr,
            &QueryMsg::GetEscrows {
                caller: Some("invalid_address_format".to_string()),
                provider: None,
                start_after: None,
                limit: None,
            },
        );
    
    // Should fail due to invalid address format
    assert!(invalid_caller_result.is_err());
    
    // Test with invalid provider address format
    let invalid_provider_result = contracts.app
        .wrap()
        .query_wasm_smart::<crate::msg::EscrowsResponse>(
            &contracts.escrow_addr,
            &QueryMsg::GetEscrows {
                caller: None,
                provider: Some("invalid_provider_format".to_string()),
                start_after: None,
                limit: None,
            },
        );
    
    // Should fail due to invalid address format
    assert!(invalid_provider_result.is_err());
    
    // Test with both invalid addresses
    let both_invalid_result = contracts.app
        .wrap()
        .query_wasm_smart::<crate::msg::EscrowsResponse>(
            &contracts.escrow_addr,
            &QueryMsg::GetEscrows {
                caller: Some("invalid_caller".to_string()),
                provider: Some("invalid_provider".to_string()),
                start_after: None,
                limit: None,
            },
        );
    
    // Should fail due to invalid address formats
    assert!(both_invalid_result.is_err());
}

/// # Test: GetEscrows Data Integrity and Ordering
/// 
/// This test verifies data integrity and proper ordering of results.
#[test]
fn test_get_escrows_data_integrity() {
    use crate::msg::EscrowsResponse;
    
    // Set up the contracts
    let mut contracts = setup_contracts();
    
    // Register a tool
    register_tool(
        &mut contracts,
        DEFAULT_TOOL_ID,
        DEFAULT_MAX_FEE,
        PROVIDER,
    ).unwrap();
    
    // Create multiple escrows with specific data to verify integrity
    let auth_token1 = "auth_token_integrity_1".to_string();
    let auth_token2 = "auth_token_integrity_2".to_string();
    let auth_token3 = "auth_token_integrity_3".to_string();
    
    // Create first escrow and capture its expiration time
    let current_height1 = contracts.app.block_info().height;
    let expires1 = current_height1 + DEFAULT_TTL;
    let escrow_id1 = lock_funds(
        &mut contracts,
        DEFAULT_TOOL_ID,
        DEFAULT_MAX_FEE,
        DEFAULT_TTL,
        auth_token1.clone(),
        USER,
        &[Coin {
            denom: NEUTRON.to_string(),
            amount: Uint128::new(DEFAULT_MAX_FEE),
        }],
    ).unwrap();
    
    // Advance block height for different expiration
    contracts.app.update_block(|block| block.height += 5);
    
    // Create second escrow and capture its expiration time
    let current_height2 = contracts.app.block_info().height;
    let expires2 = current_height2 + DEFAULT_TTL + 5;
    let escrow_id2 = lock_funds(
        &mut contracts,
        DEFAULT_TOOL_ID,
        DEFAULT_MAX_FEE + 100,
        DEFAULT_TTL + 5,
        auth_token2.clone(),
        USER,
        &[Coin {
            denom: NEUTRON.to_string(),
            amount: Uint128::new(DEFAULT_MAX_FEE + 100),
        }],
    ).unwrap();
    
    // Advance block height again
    contracts.app.update_block(|block| block.height += 5);
    
    // Create third escrow and capture its expiration time
    let current_height3 = contracts.app.block_info().height;
    let expires3 = current_height3 + DEFAULT_TTL + 10;
    let escrow_id3 = lock_funds(
        &mut contracts,
        DEFAULT_TOOL_ID,
        DEFAULT_MAX_FEE + 200,
        DEFAULT_TTL + 10,
        auth_token3.clone(),
        USER,
        &[Coin {
            denom: NEUTRON.to_string(),
            amount: Uint128::new(DEFAULT_MAX_FEE + 200),
        }],
    ).unwrap();
    
    // Query all escrows
    let all_escrows: EscrowsResponse = contracts.app
        .wrap()
        .query_wasm_smart(
            &contracts.escrow_addr,
            &QueryMsg::GetEscrows {
                caller: None,
                provider: None,
                start_after: None,
                limit: None,
            },
        )
        .unwrap();
    
    // Verify we have all 3 escrows
    assert_eq!(3, all_escrows.escrows.len());
    
    // Verify ordering (should be ascending by escrow ID)
    assert_eq!(escrow_id1, all_escrows.escrows[0].escrow_id);
    assert_eq!(escrow_id2, all_escrows.escrows[1].escrow_id);
    assert_eq!(escrow_id3, all_escrows.escrows[2].escrow_id);
    
    // Verify data integrity for each escrow
    let user_address = contracts.app.api().addr_make(USER);
    let provider_address = contracts.app.api().addr_make(PROVIDER);
    
    // Check first escrow
    assert_eq!(user_address, all_escrows.escrows[0].caller);
    assert_eq!(provider_address, all_escrows.escrows[0].provider);
    assert_eq!(Uint128::new(DEFAULT_MAX_FEE), all_escrows.escrows[0].max_fee);
    assert_eq!(NEUTRON, all_escrows.escrows[0].denom);
    assert_eq!(expires1, all_escrows.escrows[0].expires);
    assert_eq!(auth_token1, all_escrows.escrows[0].auth_token);
    
    // Check second escrow
    assert_eq!(user_address, all_escrows.escrows[1].caller);
    assert_eq!(provider_address, all_escrows.escrows[1].provider);
    assert_eq!(Uint128::new(DEFAULT_MAX_FEE + 100), all_escrows.escrows[1].max_fee);
    assert_eq!(NEUTRON, all_escrows.escrows[1].denom);
    assert_eq!(expires2, all_escrows.escrows[1].expires);
    assert_eq!(auth_token2, all_escrows.escrows[1].auth_token);
    
    // Check third escrow
    assert_eq!(user_address, all_escrows.escrows[2].caller);
    assert_eq!(provider_address, all_escrows.escrows[2].provider);
    assert_eq!(Uint128::new(DEFAULT_MAX_FEE + 200), all_escrows.escrows[2].max_fee);
    assert_eq!(NEUTRON, all_escrows.escrows[2].denom);
    assert_eq!(expires3, all_escrows.escrows[2].expires);
    assert_eq!(auth_token3, all_escrows.escrows[2].auth_token);
}

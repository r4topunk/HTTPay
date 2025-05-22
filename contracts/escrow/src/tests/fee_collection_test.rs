use cosmwasm_std::{Addr, Coin, Uint128};
use cw_multi_test::Executor;

use crate::msg::{ExecuteMsg, CollectedFeesResponse, QueryMsg};
use crate::tests::setup_contract::{NEUTRON, DEFAULT_MAX_FEE, DEFAULT_TTL, DEFAULT_TOOL_ID, OWNER, PROVIDER, USER, UNAUTHORIZED, setup_contracts_with_fee, register_tool, lock_funds, release_funds};

// Define a secondary token for multi-denom tests
pub const ATOM: &str = "uatom";

// Helper function to claim fees from the contract
fn claim_fees(
    contracts: &mut crate::tests::setup_contract::TestContracts,
    denom: Option<String>,
    sender: &str,
) -> Result<(), Box<dyn std::error::Error>> {
    let sender_addr = contracts.app.api().addr_make(sender);
    
    contracts.app.execute_contract(
        sender_addr,
        Addr::unchecked(&contracts.escrow_addr),
        &ExecuteMsg::ClaimFees { denom },
        &[],
    )?;
    
    Ok(())
}

// Helper function to query collected fees
fn query_collected_fees(
    contracts: &crate::tests::setup_contract::TestContracts,
) -> Result<CollectedFeesResponse, Box<dyn std::error::Error>> {
    let res: CollectedFeesResponse = contracts.app.wrap().query_wasm_smart(
        &contracts.escrow_addr,
        &QueryMsg::GetCollectedFees {},
    )?;
    
    Ok(res)
}

#[test]
fn test_fee_collection_flow() {
    let fee_percentage = 10; // 10% fee
    
    // Setup contracts with fee percentage
    let mut contracts = setup_contracts_with_fee(fee_percentage);
    
    // Register a tool
    register_tool(&mut contracts, DEFAULT_TOOL_ID, DEFAULT_MAX_FEE, PROVIDER).unwrap();
    
    // Lock funds
    let escrow_id = lock_funds(
        &mut contracts,
        DEFAULT_TOOL_ID,
        DEFAULT_MAX_FEE,
        DEFAULT_TTL,
        "token123".to_string(),
        USER,
        &[Coin {
            denom: NEUTRON.to_string(),
            amount: Uint128::new(DEFAULT_MAX_FEE),
        }],
    ).unwrap();
    
    // Release funds with usage fee of 100
    release_funds(&mut contracts, escrow_id, DEFAULT_MAX_FEE, PROVIDER).unwrap();
    
    // Query collected fees
    let fees_response = query_collected_fees(&contracts).unwrap();
    
    // Calculate expected fee (10% of 100 = 10)
    let expected_fee = Uint128::new(DEFAULT_MAX_FEE) * Uint128::new(fee_percentage as u128) / Uint128::new(100);
    
    // Verify fee percentage and owner address
    assert_eq!(fees_response.fee_percentage, fee_percentage);
    
    // Get owner address
    let owner_addr = contracts.app.api().addr_make(OWNER);
    assert_eq!(fees_response.owner, owner_addr);
    
    // Verify collected fees
    assert_eq!(fees_response.collected_fees.len(), 1);
    assert_eq!(fees_response.collected_fees[0].0, NEUTRON);
    assert_eq!(fees_response.collected_fees[0].1, expected_fee);
    
    // Check owner balance before claiming
    let owner_balance_before = contracts.app.wrap().query_balance(owner_addr.to_string(), NEUTRON).unwrap();
    
    // Owner claims fees
    claim_fees(&mut contracts, None, OWNER).unwrap();
    
    // Check owner balance after claiming
    let owner_balance_after = contracts.app.wrap().query_balance(owner_addr.to_string(), NEUTRON).unwrap();
    
    // Verify owner received the fee
    assert_eq!(
        owner_balance_after.amount - owner_balance_before.amount,
        expected_fee
    );
    
    // Query fees again to verify they were cleared
    let fees_after_claim = query_collected_fees(&contracts).unwrap();
    assert_eq!(fees_after_claim.collected_fees.len(), 0);
}

#[test]
fn test_unauthorized_claim_fees() {
    // Setup contracts with fee percentage
    let fee_percentage = 10;
    let mut contracts = setup_contracts_with_fee(fee_percentage);
    
    // Register a tool
    register_tool(&mut contracts, DEFAULT_TOOL_ID, DEFAULT_MAX_FEE, PROVIDER).unwrap();
    
    // Lock funds
    let escrow_id = lock_funds(
        &mut contracts,
        DEFAULT_TOOL_ID,
        DEFAULT_MAX_FEE,
        DEFAULT_TTL,
        "token123".to_string(),
        USER,
        &[Coin {
            denom: NEUTRON.to_string(),
            amount: Uint128::new(DEFAULT_MAX_FEE),
        }],
    ).unwrap();
    
    // Release funds to collect some fees
    release_funds(&mut contracts, escrow_id, DEFAULT_MAX_FEE, PROVIDER).unwrap();
    
    // Attempt to claim fees as unauthorized user
    let result = claim_fees(&mut contracts, None, UNAUTHORIZED);
    
    // Verify it fails with unauthorized error
    assert!(result.is_err());
    let err_string = format!("{:?}", result.err().unwrap());
    assert!(err_string.contains("Unauthorized"));
}

#[test]
fn test_fee_calculation_multiple_releases() {
    let fee_percentage = 5; // 5% fee
    
    // Setup contracts with fee percentage
    let mut contracts = setup_contracts_with_fee(fee_percentage);
    
    // Register a tool
    register_tool(&mut contracts, DEFAULT_TOOL_ID, DEFAULT_MAX_FEE, PROVIDER).unwrap();
    
    // First escrow
    let escrow_id1 = lock_funds(
        &mut contracts,
        DEFAULT_TOOL_ID,
        DEFAULT_MAX_FEE,
        DEFAULT_TTL,
        "token123".to_string(),
        USER,
        &[Coin {
            denom: NEUTRON.to_string(),
            amount: Uint128::new(DEFAULT_MAX_FEE),
        }],
    ).unwrap();
    
    // Release first escrow with usage fee of 100
    release_funds(&mut contracts, escrow_id1, DEFAULT_MAX_FEE, PROVIDER).unwrap();
    
    // Second escrow
    let escrow_id2 = lock_funds(
        &mut contracts,
        DEFAULT_TOOL_ID,
        DEFAULT_MAX_FEE,
        DEFAULT_TTL,
        "token456".to_string(),
        USER,
        &[Coin {
            denom: NEUTRON.to_string(),
            amount: Uint128::new(DEFAULT_MAX_FEE),
        }],
    ).unwrap();
    
    // Release second escrow with usage fee of 100
    release_funds(&mut contracts, escrow_id2, DEFAULT_MAX_FEE, PROVIDER).unwrap();
    
    // Query collected fees
    let fees_response = query_collected_fees(&contracts).unwrap();
    
    // Calculate expected fee (5% of 100 * 2 = 10)
    let expected_fee = Uint128::new(DEFAULT_MAX_FEE) * Uint128::new(fee_percentage as u128) / Uint128::new(100) * Uint128::new(2);
    
    // Verify fee percentage and owner address
    assert_eq!(fees_response.fee_percentage, fee_percentage);
    
    // Verify collected fees
    assert_eq!(fees_response.collected_fees.len(), 1);
    assert_eq!(fees_response.collected_fees[0].0, NEUTRON);
    assert_eq!(fees_response.collected_fees[0].1, expected_fee);
    
    // Get owner address
    let owner_addr = contracts.app.api().addr_make(OWNER);
    
    // Check owner balance before claiming
    let owner_balance_before = contracts.app.wrap().query_balance(owner_addr.to_string(), NEUTRON).unwrap();
    
    // Owner claims fees
    claim_fees(&mut contracts, None, OWNER).unwrap();
    
    // Check owner balance after claiming
    let owner_balance_after = contracts.app.wrap().query_balance(owner_addr.to_string(), NEUTRON).unwrap();
    
    // Verify owner received the fee
    assert_eq!(
        owner_balance_after.amount - owner_balance_before.amount,
        expected_fee
    );
}

#[test]
fn test_invalid_fee_percentage() {
    // Setup app
    let mut app = cw_multi_test::App::default();
    
    // Store contract codes
    let registry_code_id = app.store_code(crate::tests::setup_contract::registry_contract());
    let escrow_code_id = app.store_code(crate::tests::setup_contract::escrow_contract());
    
    // Create addresses
    let owner_addr = app.api().addr_make(OWNER);
    
    // Instantiate registry contract
    let registry_addr = app
        .instantiate_contract(
            registry_code_id,
            owner_addr.clone(),
            &registry::msg::InstantiateMsg {},
            &[],
            "registry",
            None,
        )
        .unwrap();
    
    // Try to instantiate escrow contract with invalid fee percentage (>100)
    let result = app.instantiate_contract(
        escrow_code_id,
        owner_addr.clone(),
        &crate::msg::InstantiateMsg {
            registry_addr: registry_addr.to_string(),
            fee_percentage: 101, // Invalid: >100%
        },
        &[],
        "escrow",
        None,
    );
    
    // Verify it fails with the expected error
    assert!(result.is_err());
    let err = result.err().unwrap();
    let err_string = format!("{:?}", err);
    assert!(err_string.contains("Invalid fee percentage: must be between 0 and 100"));
}

#[test]
fn test_specific_denom_claim() {
    // Start with a completely fresh App instance
    let mut app = cw_multi_test::App::default();
    
    // Set up initial balances - ensure all accounts have both token types
    app.init_modules(|router, api, storage| {
        let owner = api.addr_make(OWNER);
        let provider = api.addr_make(PROVIDER);
        let user = api.addr_make(USER);
        
        // Initialize balances for each account with both token types at once
        router.bank.init_balance(
            storage,
            &owner,
            vec![
                Coin {
                    denom: NEUTRON.to_string(),
                    amount: Uint128::new(10000),
                },
                Coin {
                    denom: ATOM.to_string(),
                    amount: Uint128::new(10000),
                },
            ],
        ).unwrap();
        
        router.bank.init_balance(
            storage,
            &provider,
            vec![
                Coin {
                    denom: NEUTRON.to_string(),
                    amount: Uint128::new(5000),
                },
                Coin {
                    denom: ATOM.to_string(),
                    amount: Uint128::new(5000),
                },
            ],
        ).unwrap();
        
        router.bank.init_balance(
            storage,
            &user,
            vec![
                Coin {
                    denom: NEUTRON.to_string(),
                    amount: Uint128::new(10000),
                },
                Coin {
                    denom: ATOM.to_string(),
                    amount: Uint128::new(10000),
                },
            ],
        ).unwrap();
    });
    
    // Store contract codes
    let registry_code_id = app.store_code(crate::tests::setup_contract::registry_contract());
    let escrow_code_id = app.store_code(crate::tests::setup_contract::escrow_contract());
    
    // Create addresses
    let owner_addr = app.api().addr_make(OWNER);
    let provider_addr = app.api().addr_make(PROVIDER);
    let user_addr = app.api().addr_make(USER);
    
    // Instantiate registry contract
    let registry_addr = app
        .instantiate_contract(
            registry_code_id,
            owner_addr.clone(),
            &registry::msg::InstantiateMsg {},
            &[],
            "registry",
            None,
        )
        .unwrap();
    
    // Fee percentage for this test
    let fee_percentage = 10; // 10% fee
    
    // Instantiate escrow contract
    let escrow_addr = app
        .instantiate_contract(
            escrow_code_id,
            owner_addr.clone(),
            &crate::msg::InstantiateMsg {
                registry_addr: registry_addr.to_string(),
                fee_percentage,
            },
            &[],
            "escrow",
            None,
        )
        .unwrap();
    
    // Register NEUTRON tool
    app.execute_contract(
        provider_addr.clone(),
        Addr::unchecked(&registry_addr),
        &registry::msg::ExecuteMsg::RegisterTool {
            tool_id: "neutron-tool".to_string(),
            price: Uint128::new(DEFAULT_MAX_FEE),
            denom: None, // Default to NEUTRON
            description: "NEUTRON tool".to_string(),
        },
        &[],
    ).unwrap();
    
    // Register ATOM tool
    app.execute_contract(
        provider_addr.clone(),
        Addr::unchecked(&registry_addr),
        &registry::msg::ExecuteMsg::RegisterTool {
            tool_id: "atom-tool".to_string(),
            price: Uint128::new(DEFAULT_MAX_FEE),
            denom: Some(ATOM.to_string()),
            description: "ATOM tool".to_string(),
        },
        &[],
    ).unwrap();
    
    // Create test contracts struct
    let mut contracts = crate::tests::setup_contract::TestContracts {
        app,
        registry_addr: registry_addr.to_string(),
        escrow_addr: escrow_addr.to_string(),
    };
    
    // Get current block height
    let current_height = contracts.app.block_info().height;
    
    // Lock funds for NEUTRON tool
    let neutron_lock_res = contracts.app.execute_contract(
        user_addr.clone(),
        Addr::unchecked(&escrow_addr),
        &ExecuteMsg::LockFunds {
            tool_id: "neutron-tool".to_string(),
            max_fee: Uint128::new(DEFAULT_MAX_FEE),
            expires: current_height + DEFAULT_TTL,
            auth_token: "neutron-token".to_string(),
        },
        &[Coin {
            denom: NEUTRON.to_string(),
            amount: Uint128::new(DEFAULT_MAX_FEE),
        }],
    ).unwrap();
    
    // Extract NEUTRON escrow_id
    let neutron_escrow_id = extract_escrow_id_from_response(&neutron_lock_res);
    
    // Lock funds for ATOM tool
    let atom_lock_res = contracts.app.execute_contract(
        user_addr.clone(),
        Addr::unchecked(&escrow_addr),
        &ExecuteMsg::LockFunds {
            tool_id: "atom-tool".to_string(),
            max_fee: Uint128::new(DEFAULT_MAX_FEE),
            expires: current_height + DEFAULT_TTL,
            auth_token: "atom-token".to_string(),
        },
        &[Coin {
            denom: ATOM.to_string(),
            amount: Uint128::new(DEFAULT_MAX_FEE),
        }],
    ).unwrap();
    
    // Extract ATOM escrow_id
    let atom_escrow_id = extract_escrow_id_from_response(&atom_lock_res);
    
    // Release NEUTRON escrow
    contracts.app.execute_contract(
        provider_addr.clone(),
        Addr::unchecked(&escrow_addr),
        &ExecuteMsg::Release {
            escrow_id: neutron_escrow_id,
            usage_fee: Uint128::new(DEFAULT_MAX_FEE),
        },
        &[],
    ).unwrap();
    
    // Release ATOM escrow
    contracts.app.execute_contract(
        provider_addr.clone(),
        Addr::unchecked(&escrow_addr),
        &ExecuteMsg::Release {
            escrow_id: atom_escrow_id,
            usage_fee: Uint128::new(DEFAULT_MAX_FEE),
        },
        &[],
    ).unwrap();
    
    // Query collected fees
    let fees_response: CollectedFeesResponse = contracts.app.wrap().query_wasm_smart(
        &escrow_addr,
        &QueryMsg::GetCollectedFees {},
    ).unwrap();
    
    // Should have both token types
    assert_eq!(fees_response.collected_fees.len(), 2);
    
    // Calculate expected fee (10% of max fee)
    let expected_fee = Uint128::new(DEFAULT_MAX_FEE) * Uint128::new(fee_percentage as u128) / Uint128::new(100);
    
    // Check initial balances
    let initial_neutron_balance = contracts.app.wrap().query_balance(owner_addr.to_string(), NEUTRON).unwrap().amount;
    let initial_atom_balance = contracts.app.wrap().query_balance(owner_addr.to_string(), ATOM).unwrap().amount;
    
    // Claim only NEUTRON fees
    contracts.app.execute_contract(
        owner_addr.clone(),
        Addr::unchecked(&escrow_addr),
        &ExecuteMsg::ClaimFees {
            denom: Some(NEUTRON.to_string()),
        },
        &[],
    ).unwrap();
    
    // Check balances after first claim
    let post_neutron_claim_neutron_balance = contracts.app.wrap().query_balance(owner_addr.to_string(), NEUTRON).unwrap().amount;
    let post_neutron_claim_atom_balance = contracts.app.wrap().query_balance(owner_addr.to_string(), ATOM).unwrap().amount;
    
    // NEUTRON should increase, ATOM should remain the same
    assert_eq!(post_neutron_claim_neutron_balance - initial_neutron_balance, expected_fee);
    assert_eq!(post_neutron_claim_atom_balance, initial_atom_balance);
    
    // Check fees again - should only have ATOM left
    let fees_after_neutron_claim: CollectedFeesResponse = contracts.app.wrap().query_wasm_smart(
        &escrow_addr,
        &QueryMsg::GetCollectedFees {},
    ).unwrap();
    
    assert_eq!(fees_after_neutron_claim.collected_fees.len(), 1);
    assert_eq!(fees_after_neutron_claim.collected_fees[0].0, ATOM);
    
    // Claim ATOM fees
    contracts.app.execute_contract(
        owner_addr.clone(),
        Addr::unchecked(&escrow_addr),
        &ExecuteMsg::ClaimFees {
            denom: Some(ATOM.to_string()),
        },
        &[],
    ).unwrap();
    
    // Check balances after second claim
    let post_atom_claim_atom_balance = contracts.app.wrap().query_balance(owner_addr.to_string(), ATOM).unwrap().amount;
    
    // ATOM should have increased
    assert_eq!(post_atom_claim_atom_balance - post_neutron_claim_atom_balance, expected_fee);
    
    // Check fees again - should be empty
    let fees_after_all_claims: CollectedFeesResponse = contracts.app.wrap().query_wasm_smart(
        &escrow_addr,
        &QueryMsg::GetCollectedFees {},
    ).unwrap();
    
    assert_eq!(fees_after_all_claims.collected_fees.len(), 0);
    
    // Try to claim non-existent fees - should fail
    let result = contracts.app.execute_contract(
        owner_addr.clone(),
        Addr::unchecked(&escrow_addr),
        &ExecuteMsg::ClaimFees {
            denom: Some(NEUTRON.to_string()),
        },
        &[],
    );
    
    assert!(result.is_err());
}

// Helper function to extract escrow_id from response
fn extract_escrow_id_from_response(res: &cw_multi_test::AppResponse) -> u64 {
    if let Some(data) = &res.data {
        match cosmwasm_std::from_json::<crate::msg::LockFundsResponse>(data) {
            Ok(resp) => resp.escrow_id,
            Err(_) => {
                // Fall back to event attributes
                res.events
                    .iter()
                    .find_map(|e| {
                        if e.ty == "wasm" {
                            e.attributes
                                .iter()
                                .find(|attr| attr.key == "escrow_id")
                                .map(|attr| attr.value.parse::<u64>().unwrap_or(0))
                        } else {
                            None
                        }
                    })
                    .unwrap_or(0)
            }
        }
    } else {
        // No data available, use event attributes
        res.events
            .iter()
            .find_map(|e| {
                if e.ty == "wasm" {
                    e.attributes
                        .iter()
                        .find(|attr| attr.key == "escrow_id")
                        .map(|attr| attr.value.parse::<u64>().unwrap_or(0))
                } else {
                    None
                }
            })
            .unwrap_or(0)
    }
}

#[test]
fn test_partial_fee_usage() {
    let fee_percentage = 10; // 10% fee
    let mut contracts = setup_contracts_with_fee(fee_percentage);
    
    // Register a tool
    register_tool(&mut contracts, DEFAULT_TOOL_ID, DEFAULT_MAX_FEE, PROVIDER).unwrap();
    
    // Lock funds with max_fee = 100
    let escrow_id = lock_funds(
        &mut contracts,
        DEFAULT_TOOL_ID,
        DEFAULT_MAX_FEE,
        DEFAULT_TTL,
        "token123".to_string(),
        USER,
        &[Coin {
            denom: NEUTRON.to_string(),
            amount: Uint128::new(DEFAULT_MAX_FEE),
        }],
    ).unwrap();
    
    // Use only half of the max fee
    let usage_fee = DEFAULT_MAX_FEE / 2;
    
    // Release funds with half the max fee
    release_funds(&mut contracts, escrow_id, usage_fee, PROVIDER).unwrap();
    
    // Query collected fees
    let fees_response = query_collected_fees(&contracts).unwrap();
    
    // Calculate expected fee (10% of 50 = 5)
    let expected_fee = Uint128::new(usage_fee) * Uint128::new(fee_percentage as u128) / Uint128::new(100);
    
    // Verify collected fees
    assert_eq!(fees_response.collected_fees.len(), 1);
    assert_eq!(fees_response.collected_fees[0].0, NEUTRON);
    assert_eq!(fees_response.collected_fees[0].1, expected_fee);
    
    // Verify user got refunded the unused portion
    let user_addr = contracts.app.api().addr_make(USER);
    let user_balance = contracts.app.wrap().query_balance(user_addr.to_string(), NEUTRON).unwrap().amount;
    
    // User should have received 100 - 50 = 50 back as refund
    // Plus their initial balance minus the escrow amount
    let expected_refund = Uint128::new(DEFAULT_MAX_FEE - usage_fee);
    
    // Initial balance was 5000, they spent 100 on escrow, got 50 back, so should have 4950
    let expected_user_balance = Uint128::new(5000) - Uint128::new(DEFAULT_MAX_FEE) + expected_refund;
    assert_eq!(user_balance, expected_user_balance);
}
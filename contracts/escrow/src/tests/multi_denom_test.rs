//! # Multi-Denomination Support Test
//! 
//! This module tests the Escrow contract's support for multiple token denominations.
//! 
//! ## Test Coverage
//! 
//! This test verifies that:
//! 1. Users can lock funds in different token denominations
//! 2. The contract validates that the correct denomination is provided
//! 3. Funds are released in the correct denomination
//! 4. The denomination is properly stored and returned in queries

use cosmwasm_std::testing::mock_env;
use cosmwasm_std::{coins, Addr, Coin, Uint128};
use cw_multi_test::Executor;
use registry::msg::ExecuteMsg as RegistryExecuteMsg;

use crate::tests::setup_contract::{TestContracts, setup_contracts, PROVIDER, USER};

const NATIVE_DENOM: &str = "untrn";
const IBC_DENOM: &str = "ibc/ABCDEF0123456789";

/// # Test: Lock Funds with Custom Denomination
/// 
/// This test verifies that users can lock funds using a custom token denomination,
/// and that the escrow correctly stores and uses this denomination.
/// 
/// ## Test Steps:
///
/// 1. Set up test contracts
/// 2. Register a tool with custom IBC denomination
/// 3. Lock funds using correct IBC denomination
/// 4. Verify escrow is created with correct denomination
/// 5. Provider releases funds and receives payment in correct denomination
#[test]
fn test_lock_funds_with_custom_denom() {
    // Set up test conditions and contracts
    let mut contracts = setup_contracts();
    
    // Initialize the IBC token balance for users
    let user_addr = Addr::unchecked(contracts.app.api().addr_make(USER));
    
    contracts.app.init_modules(|router, _, storage| {
        router.bank.init_balance(
            storage,
            &user_addr,
            vec![
                Coin {
                    denom: IBC_DENOM.to_string(),
                    amount: Uint128::new(1000),
                },
                Coin {
                    denom: NATIVE_DENOM.to_string(),
                    amount: Uint128::new(1000),
                },
            ],
        ).unwrap();
    });
    
    // 1. Register a tool with IBC token denomination
    register_tool_with_custom_denom(&mut contracts, IBC_DENOM);
    
    // 2. Lock funds using correct denomination
    let escrow_id = lock_funds_with_denom(&mut contracts, IBC_DENOM).unwrap();
    
    // 3. Query escrow and check denomination
    let escrow = query_escrow(&contracts, escrow_id);
    assert_eq!(IBC_DENOM, escrow.denom);
    
    // 4. Release funds and verify provider received funds in correct denomination
    // Get initial provider balance
    let provider_addr = Addr::unchecked(contracts.app.api().addr_make(PROVIDER));
    let provider_initial_balance = contracts.app.wrap().query_balance(&provider_addr, IBC_DENOM).unwrap();
    
    // Release funds
    let usage_fee = Uint128::new(50);
    contracts.app.execute_contract(
        provider_addr.clone(),
        Addr::unchecked(&contracts.escrow_addr),
        &crate::msg::ExecuteMsg::Release {
            escrow_id,
            usage_fee,
        },
        &[],
    ).unwrap();
    
    // Verify provider received funds in custom denomination
    let provider_final_balance = contracts.app.wrap().query_balance(&provider_addr, IBC_DENOM).unwrap();
    assert_eq!(
        provider_initial_balance.amount.u128() + usage_fee.u128(),
        provider_final_balance.amount.u128()
    );
}

/// # Test: Lock Funds with Wrong Denomination
/// 
/// This test verifies that the contract rejects attempts to lock funds
/// with a different denomination than what the tool requires.
/// 
/// ## Test Steps:
///
/// 1. Set up test contracts
/// 2. Register a tool with IBC denomination
/// 3. Attempt to lock funds using native denomination
/// 4. Verify transaction fails with appropriate error
#[test]
fn test_lock_funds_with_wrong_denom() {
    // Set up test conditions and contracts
    let mut contracts = setup_contracts();
    
    // Initialize the IBC token balance for users
    let user_addr = Addr::unchecked(contracts.app.api().addr_make(USER));
    
    contracts.app.init_modules(|router, _, storage| {
        router.bank.init_balance(
            storage,
            &user_addr,
            vec![
                Coin {
                    denom: IBC_DENOM.to_string(),
                    amount: Uint128::new(1000),
                },
                Coin {
                    denom: NATIVE_DENOM.to_string(),
                    amount: Uint128::new(1000),
                },
            ],
        ).unwrap();
    });
    
    // 1. Register a tool with IBC token denomination
    register_tool_with_custom_denom(&mut contracts, IBC_DENOM);
    
    // 2. Attempt to lock funds using incorrect denomination (native denom)
    let result = lock_funds_with_denom(&mut contracts, NATIVE_DENOM);
    
    // 3. Verify transaction fails
    assert!(result.is_err());
    match result {
        Err(e) => {
            // Print the error message for debugging
            println!("Error message in test_lock_funds_with_wrong_denom: {}", e);
            // Just check that it failed without asserting specific error message
        },
        _ => panic!("Expected an error but got success"),
    }
}

/// # Test: Update Tool Denom and Lock Funds
/// 
/// This test verifies that when a tool's denomination is updated,
/// users must provide funds in the new denomination.
/// 
/// ## Test Steps:
///
/// 1. Set up test contracts
/// 2. Register a tool with native denomination
/// 3. Lock funds successfully with native denomination
/// 4. Update tool to use IBC denomination
/// 5. Attempt to lock funds with native denomination (should fail)
/// 6. Lock funds with IBC denomination (should succeed)
#[test]
fn test_update_tool_denom_and_lock_funds() {
    // Set up test conditions and contracts
    let mut contracts = setup_contracts();
    
    // Initialize the IBC token balance for users
    let user_addr = Addr::unchecked(contracts.app.api().addr_make(USER));
    
    contracts.app.init_modules(|router, _, storage| {
        router.bank.init_balance(
            storage,
            &user_addr,
            vec![
                Coin {
                    denom: IBC_DENOM.to_string(),
                    amount: Uint128::new(1000),
                },
                Coin {
                    denom: NATIVE_DENOM.to_string(),
                    amount: Uint128::new(1000),
                },
            ],
        ).unwrap();
    });
    
    const TOOL_ID: &str = "denom1";
    const PRICE: u128 = 100;
    
    // 1. Register a tool with native denomination
    let provider_addr = Addr::unchecked(contracts.app.api().addr_make(PROVIDER));
    contracts.app.execute_contract(
        provider_addr.clone(),
        Addr::unchecked(&contracts.registry_addr),
        &RegistryExecuteMsg::RegisterTool {
            tool_id: TOOL_ID.to_string(),
            price: Uint128::new(PRICE),
            denom: Some(NATIVE_DENOM.to_string()),
            description: "Native denom test tool".to_string(),
        },
        &[],
    ).unwrap();
    
    // 2. Lock funds successfully with native denomination
    let escrow_id = lock_funds_custom_tool(&mut contracts, NATIVE_DENOM, TOOL_ID).unwrap();
    let escrow = query_escrow(&contracts, escrow_id);
    assert_eq!(NATIVE_DENOM, escrow.denom);
    
    // 3. Update tool to use IBC denomination
    contracts.app.execute_contract(
        provider_addr.clone(),
        Addr::unchecked(&contracts.registry_addr),
        &RegistryExecuteMsg::UpdateDenom {
            tool_id: TOOL_ID.to_string(),
            denom: IBC_DENOM.to_string(),
        },
        &[],
    ).unwrap();
    
    // 4. Attempt to lock funds with native denomination (should fail)
    let result = lock_funds_custom_tool(&mut contracts, NATIVE_DENOM, TOOL_ID);
    assert!(result.is_err());
    match result {
        Err(e) => {
            // Print the error message for debugging
            println!("Error message in test_update_tool_denom_and_lock_funds: {}", e);
            // Just check that it failed without asserting specific error message
        },
        _ => panic!("Expected an error but got success"),
    };
    
    // 5. Lock funds with IBC denomination (should succeed)
    let escrow_id = lock_funds_custom_tool(&mut contracts, IBC_DENOM, TOOL_ID).unwrap();
    let escrow = query_escrow(&contracts, escrow_id);
    assert_eq!(IBC_DENOM, escrow.denom);
}

// Helper function to register a tool with a custom denomination
fn register_tool_with_custom_denom(contracts: &mut TestContracts, denom: &str) {
    const TOOL_ID: &str = "custom1";
    const PRICE: u128 = 100;
    
    let provider_addr = Addr::unchecked(contracts.app.api().addr_make(PROVIDER));
    contracts.app.execute_contract(
        provider_addr,
        Addr::unchecked(&contracts.registry_addr),
        &RegistryExecuteMsg::RegisterTool {
            tool_id: TOOL_ID.to_string(),
            price: Uint128::new(PRICE),
            denom: Some(denom.to_string()),
            description: format!("Custom denom tool: {}", denom),
        },
        &[],
    ).unwrap();
}

// Helper function to lock funds with a specific denomination
fn lock_funds_with_denom(contracts: &mut TestContracts, denom: &str) -> Result<u64, String> {
    const TOOL_ID: &str = "custom1";
    const MAX_FEE: u128 = 100;
    const AUTH_TOKEN: &str = "test_auth_token";
    
    let env = mock_env();
    let block_time = env.block.height;
    let expires = block_time + 10;
    
    let user_addr = Addr::unchecked(contracts.app.api().addr_make(USER));
    match contracts.app.execute_contract(
        user_addr,
        Addr::unchecked(&contracts.escrow_addr),
        &crate::msg::ExecuteMsg::LockFunds {
            tool_id: TOOL_ID.to_string(),
            max_fee: Uint128::new(MAX_FEE),
            auth_token: AUTH_TOKEN.to_string(),
            expires,
        },
        &coins(MAX_FEE, denom),
    ) {
        Ok(res) => {
            // Extract escrow_id from the response
            let escrow_id_attr = res.events
                .iter()
                .find(|e| e.ty == "wasm")
                .and_then(|e| e.attributes.iter().find(|a| a.key == "escrow_id"))
                .expect("Could not find escrow_id in response");
            
            Ok(escrow_id_attr.value.parse::<u64>().unwrap())
        },
        Err(e) => Err(e.to_string()),
    }
}

// Helper function to lock funds with a custom tool ID
fn lock_funds_custom_tool(contracts: &mut TestContracts, denom: &str, tool_id: &str) -> Result<u64, String> {
    const MAX_FEE: u128 = 100;
    const AUTH_TOKEN: &str = "test_auth_token";
    
    let env = mock_env();
    let block_time = env.block.height;
    let expires = block_time + 10;
    
    let user_addr = Addr::unchecked(contracts.app.api().addr_make(USER));
    match contracts.app.execute_contract(
        user_addr,
        Addr::unchecked(&contracts.escrow_addr),
        &crate::msg::ExecuteMsg::LockFunds {
            tool_id: tool_id.to_string(),
            max_fee: Uint128::new(MAX_FEE),
            auth_token: AUTH_TOKEN.to_string(),
            expires,
        },
        &coins(MAX_FEE, denom),
    ) {
        Ok(res) => {
            // Extract escrow_id from the response
            let escrow_id_attr = res.events
                .iter()
                .find(|e| e.ty == "wasm")
                .and_then(|e| e.attributes.iter().find(|a| a.key == "escrow_id"))
                .expect("Could not find escrow_id in response");
            
            Ok(escrow_id_attr.value.parse::<u64>().unwrap())
        },
        Err(e) => Err(e.to_string()),
    }
}

// Helper function to query an escrow
fn query_escrow(contracts: &TestContracts, escrow_id: u64) -> crate::msg::EscrowResponse {
    contracts.app
        .wrap()
        .query_wasm_smart(
            &contracts.escrow_addr,
            &crate::msg::QueryMsg::GetEscrow { escrow_id },
        )
        .unwrap()
}

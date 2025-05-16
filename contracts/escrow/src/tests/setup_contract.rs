//! # Test Setup Module for Escrow Contract
//! 
//! This module provides the common test infrastructure for the Escrow contract.
//! It contains helper functions to instantiate the contract for testing purposes,
//! ensuring consistent test environment across all test cases.
//! 
//! The module leverages cw-multi-test for contract integration testing.

use cosmwasm_std::{Addr, Coin, Empty, Uint128};
use cw_multi_test::{App, Contract, ContractWrapper, Executor};

use crate::contract::{execute, instantiate, query, sudo};
use crate::msg::{ExecuteMsg, InstantiateMsg, QueryMsg};
use registry::msg::{ExecuteMsg as RegistryExecuteMsg, InstantiateMsg as RegistryInstantiateMsg};

// Define constants for testing
pub const ATOM: &str = "untrn";
pub const DEFAULT_MAX_FEE: u128 = 100;
pub const DEFAULT_USAGE_FEE: u128 = 50;
pub const DEFAULT_TOOL_ID: &str = "testtool";
pub const DEFAULT_TTL: u64 = 10; // in blocks

// Mock account address names - these will be converted to properly formatted addresses
pub const OWNER: &str = "owner";
pub const PROVIDER: &str = "provider";
pub const USER: &str = "user";
pub const UNAUTHORIZED: &str = "unauthorized";

/// Sets up the Escrow contract for cw-multi-test
fn escrow_contract() -> Box<dyn Contract<Empty>> {
    let contract = ContractWrapper::new(execute, instantiate, query)
        .with_sudo(sudo);
    Box::new(contract)
}

/// Sets up the Registry contract for cw-multi-test
fn registry_contract() -> Box<dyn Contract<Empty>> {
    let contract = ContractWrapper::new(
        registry::contract::execute,
        registry::contract::instantiate,
        registry::contract::query,
    );
    Box::new(contract)
}

/// Initializes test application with funds for accounts
pub fn mock_app() -> App {
    let mut app = App::default();
    
    // Set up initial balances using properly formatted bech32 addresses
    app.init_modules(|router, api, storage| {
        // Create proper addresses using addr_make
        let owner_addr = api.addr_make(OWNER);
        let provider_addr = api.addr_make(PROVIDER);
        let user_addr = api.addr_make(USER);
        let unauth_addr = api.addr_make(UNAUTHORIZED);
        
        router.bank.init_balance(
            storage,
            &owner_addr,
            vec![Coin {
                denom: ATOM.to_string(),
                amount: Uint128::new(10000),
            }],
        ).unwrap();
        
        router.bank.init_balance(
            storage,
            &provider_addr,
            vec![Coin {
                denom: ATOM.to_string(),
                amount: Uint128::new(1000),
            }],
        ).unwrap();
        
        router.bank.init_balance(
            storage,
            &user_addr,
            vec![Coin {
                denom: ATOM.to_string(),
                amount: Uint128::new(5000),
            }],
        ).unwrap();
        
        router.bank.init_balance(
            storage,
            &unauth_addr,
            vec![Coin {
                denom: ATOM.to_string(),
                amount: Uint128::new(1000),
            }],
        ).unwrap();
    });
    
    app
}

/// Helper struct to manage test contracts
pub struct TestContracts {
    pub app: App,
    pub registry_addr: String,
    pub escrow_addr: String,
}

/// Instantiates both Registry and Escrow contracts for testing
pub fn setup_contracts() -> TestContracts {
    let mut app = mock_app();
    
    // Store contract codes
    let registry_code_id = app.store_code(registry_contract());
    let escrow_code_id = app.store_code(escrow_contract());
    
    // Create proper bech32 address for owner
    let owner_addr = app.api().addr_make(OWNER);
    
    // Instantiate registry contract
    let registry_addr = app
        .instantiate_contract(
            registry_code_id,
            owner_addr.clone(),
            &RegistryInstantiateMsg {},
            &[],
            "registry",
            None,
        )
        .unwrap();
    
    // Instantiate escrow contract
    let escrow_addr = app
        .instantiate_contract(
            escrow_code_id,
            owner_addr,
            &InstantiateMsg {
                registry_addr: registry_addr.to_string(),
            },
            &[],
            "escrow",
            None,
        )
        .unwrap();
    
    TestContracts {
        app,
        registry_addr: registry_addr.to_string(),
        escrow_addr: escrow_addr.to_string(),
    }
}

/// Helper function to register a tool in the Registry contract
pub fn register_tool(
    contracts: &mut TestContracts, 
    tool_id: &str, 
    price: u128,
    sender: &str,
) -> Result<(), Box<dyn std::error::Error>> {
    // Create proper bech32 address for sender
    let sender_addr = contracts.app.api().addr_make(sender);
    
    contracts.app.execute_contract(
        sender_addr,
        Addr::unchecked(&contracts.registry_addr),
        &RegistryExecuteMsg::RegisterTool {
            tool_id: tool_id.to_string(),
            price: Uint128::new(price),
            denom: None,
            description: format!("Test tool: {}", tool_id),
        },
        &[],
    )?;
    
    Ok(())
}

/// Helper function to lock funds in the Escrow contract
pub fn lock_funds(
    contracts: &mut TestContracts,
    tool_id: &str,
    max_fee: u128,
    expires_in_blocks: u64,
    auth_token: String,
    sender: &str,
    funds: &[Coin],
) -> Result<u64, Box<dyn std::error::Error>> {
    let current_height = contracts.app.block_info().height;
    
    // Create proper bech32 address for sender
    let sender_addr = contracts.app.api().addr_make(sender);
    
    let res = contracts.app.execute_contract(
        sender_addr,
        Addr::unchecked(&contracts.escrow_addr),
        &ExecuteMsg::LockFunds {
            tool_id: tool_id.to_string(),
            max_fee: Uint128::new(max_fee),
            expires: current_height + expires_in_blocks,
            auth_token: auth_token,
        },
        funds,
    )?;
    
    // Extract escrow_id from the response
    // First try to decode from response data (if available)
    let escrow_id = if let Some(data) = res.data {
        // Try to decode the data
        match cosmwasm_std::from_json::<crate::msg::LockFundsResponse>(&data) {
            Ok(resp) => resp.escrow_id,
            Err(_) => {
                // If decoding fails, fall back to event attributes
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
    };
    
    Ok(escrow_id)
}

/// Helper function to release funds from the Escrow contract
pub fn release_funds(
    contracts: &mut TestContracts,
    escrow_id: u64,
    usage_fee: u128,
    sender: &str,
) -> Result<(), Box<dyn std::error::Error>> {
    // Create proper bech32 address for sender
    let sender_addr = contracts.app.api().addr_make(sender);

    contracts.app.execute_contract(
        sender_addr,
        Addr::unchecked(&contracts.escrow_addr),
        &ExecuteMsg::Release {
            escrow_id,
            usage_fee: Uint128::new(usage_fee),
        },
        &[],
    )?;

    Ok(())
}

/// Helper function to refund expired escrow
pub fn refund_expired(
    contracts: &mut TestContracts,
    escrow_id: u64,
    sender: &str,
) -> Result<(), Box<dyn std::error::Error>> {
    // Create proper bech32 address for sender
    let sender_addr = contracts.app.api().addr_make(sender);

    contracts.app.execute_contract(
        sender_addr,
        Addr::unchecked(&contracts.escrow_addr),
        &ExecuteMsg::RefundExpired {
            escrow_id,
        },
        &[],
    )?;

    Ok(())
}

/// Helper function to get escrow details by ID
#[allow(dead_code)]
pub fn query_escrow(
    contracts: &TestContracts, 
    escrow_id: u64,
) -> Result<crate::msg::EscrowResponse, Box<dyn std::error::Error>> {
    let res: crate::msg::EscrowResponse = contracts.app.wrap().query_wasm_smart(
        &contracts.escrow_addr,
        &QueryMsg::GetEscrow { escrow_id },
    )?;
    
    Ok(res)
}

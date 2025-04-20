//! # Registry Contract Basic Functionality Test
//! 
//! This module tests the basic functionality of the Registry contract:
//! 1. Tool registration
//! 2. Tool price updating
//! 3. Tool pausing and resuming
//! 4. Tool querying
//! 
//! ## Test Coverage
//! 
//! This test verifies that:
//! 1. The Registry contract correctly handles tool registration and management
//! 2. Price updates are properly processed and stored
//! 3. Tools can be paused and resumed correctly
//! 4. Query functionality returns proper data for existing tools
//! 5. Authorization checks are properly enforced for all operations

use cosmwasm_std::{Addr, Uint128};
use cw_multi_test::Executor;
use registry::msg::{ExecuteMsg as RegistryExecuteMsg, QueryMsg as RegistryQueryMsg, ToolResponse};
use crate::tests::setup_contract::{setup_contracts, PROVIDER, UNAUTHORIZED};

/// # Test: Registry Contract Basic Functionality
/// 
/// This test ensures that the Registry contract's core functionality works
/// correctly in the integrated testing environment.
/// 
/// ## Test Steps:
/// 
/// 1. Set up Registry and Escrow contracts
/// 2. Register a new tool as the provider
/// 3. Query the tool and verify its details
/// 4. Update the tool's price and verify the change
/// 5. Pause the tool and verify it's inactive
/// 6. Resume the tool and verify it's active again
/// 7. Attempt unauthorized operations and verify they fail
#[test]
fn test_registry_basic_functionality() {
    // Set up the contracts
    let mut contracts = setup_contracts();
    
    // Constants for this test
    let tool_id = "reg_test_tool"; // Changed to <=16 chars
    let initial_price = 100_u128;
    let updated_price = 150_u128;
    
    // Step 1: Register a tool as the provider
    contracts.app
        .execute_contract(
            Addr::unchecked(PROVIDER),
            Addr::unchecked(&contracts.registry_addr),
            &RegistryExecuteMsg::RegisterTool {
                tool_id: tool_id.to_string(),
                price: Uint128::new(initial_price),
            },
            &[],
        )
        .unwrap();
    
    // Step 2: Query the tool and verify its details
    let query_res: ToolResponse = contracts.app
        .wrap()
        .query_wasm_smart(
            &contracts.registry_addr,
            &RegistryQueryMsg::GetTool { 
                tool_id: tool_id.to_string() 
            },
        )
        .unwrap();
    
    // Verify tool details match what was registered
    assert_eq!(tool_id, query_res.tool_id);
    assert_eq!(PROVIDER, query_res.provider);
    assert_eq!(Uint128::new(initial_price), query_res.price);
    assert!(query_res.is_active);
    
    // Step 3: Update the tool's price
    contracts.app
        .execute_contract(
            Addr::unchecked(PROVIDER),
            Addr::unchecked(&contracts.registry_addr),
            &RegistryExecuteMsg::UpdatePrice {
                tool_id: tool_id.to_string(),
                price: Uint128::new(updated_price),
            },
            &[],
        )
        .unwrap();
    
    // Query again and verify price is updated
    let query_res: ToolResponse = contracts.app
        .wrap()
        .query_wasm_smart(
            &contracts.registry_addr,
            &RegistryQueryMsg::GetTool { 
                tool_id: tool_id.to_string() 
            },
        )
        .unwrap();
    
    assert_eq!(Uint128::new(updated_price), query_res.price);
    
    // Step 4: Pause the tool
    contracts.app
        .execute_contract(
            Addr::unchecked(PROVIDER),
            Addr::unchecked(&contracts.registry_addr),
            &RegistryExecuteMsg::PauseTool {
                tool_id: tool_id.to_string(),
            },
            &[],
        )
        .unwrap();
    
    // Query again and verify tool is inactive
    let query_res: ToolResponse = contracts.app
        .wrap()
        .query_wasm_smart(
            &contracts.registry_addr,
            &RegistryQueryMsg::GetTool { 
                tool_id: tool_id.to_string() 
            },
        )
        .unwrap();
    
    assert!(!query_res.is_active);
    
    // Step 5: Resume the tool
    contracts.app
        .execute_contract(
            Addr::unchecked(PROVIDER),
            Addr::unchecked(&contracts.registry_addr),
            &RegistryExecuteMsg::ResumeTool {
                tool_id: tool_id.to_string(),
            },
            &[],
        )
        .unwrap();
    
    // Query again and verify tool is active
    let query_res: ToolResponse = contracts.app
        .wrap()
        .query_wasm_smart(
            &contracts.registry_addr,
            &RegistryQueryMsg::GetTool { 
                tool_id: tool_id.to_string() 
            },
        )
        .unwrap();
    
    assert!(query_res.is_active);
    
    // Step 6: Test authorization - unauthorized attempt to update price
    let result = contracts.app
        .execute_contract(
            Addr::unchecked(UNAUTHORIZED),
            Addr::unchecked(&contracts.registry_addr),
            &RegistryExecuteMsg::UpdatePrice {
                tool_id: tool_id.to_string(),
                price: Uint128::new(200),
            },
            &[],
        );
    
    // Verify unauthorized operation fails
    assert!(result.is_err());
    
    // Step 7: Test authorization - unauthorized attempt to pause tool
    let result = contracts.app
        .execute_contract(
            Addr::unchecked(UNAUTHORIZED),
            Addr::unchecked(&contracts.registry_addr),
            &RegistryExecuteMsg::PauseTool {
                tool_id: tool_id.to_string(),
            },
            &[],
        );
    
    // Verify unauthorized operation fails
    assert!(result.is_err());
}

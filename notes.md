# ToolPay Implementation Notes

This document tracks the implementation progress of the ToolPay MVP, providing overviews of completed chunks and notes for future development. It serves as a companion to the tasks.md file, offering insights into the implementation decisions and outcomes.

## Phase 1: Smart Contracts & Testing

### Chunk 1: Project Setup (COMPLETED)

**Overview**:
The initial project setup has been completed successfully, establishing the foundational structure for the ToolPay MVP. This chunk focused on creating the necessary directory structure and setting up the CosmWasm contracts that will power the system.

**Key Accomplishments**:

1. **Directory Structure**:

   - Created `contracts/` directory for CosmWasm smart contracts
   - Created `packages/` directory for future TypeScript packages
   - Created `frontend/` directory as a placeholder with explanatory README
   - Created `scripts/` directory for helper scripts

2. **CosmWasm Contract Templates**:

   - Generated registry contract using CosmWasm template
   - Generated escrow contract using CosmWasm template
   - Both contracts were initialized with standard CosmWasm structure

3. **Rust Workspace Setup**:

   - Configured Cargo.toml at the project root with proper workspace members
   - Added required dependencies:
     - cosmwasm-std = "1.5"
     - cw-storage-plus = "1.2"
     - schemars
     - serde
     - thiserror
   - Set up optimization settings for Wasm compilation
   - Added rust-toolchain.toml with Rust 1.78 specification

4. **Initial Validation**:
   - Verified that `cargo build` succeeds
   - Added appropriate .gitignore file for Rust and Node artifacts

**Next Steps**:
The project is now ready for Chunk 2, which will focus on implementing the Registry contract according to the specifications in project.md.

### Chunk 2: Registry Contract Implementation (COMPLETED)

**Overview**:
The Registry contract has been fully implemented and tested. All required functionality for registering, updating, pausing, and querying tools has been successfully implemented and verified with a comprehensive test suite.

**Key Accomplishments**:

1. **Contract Logic Implementation**:

   - Implemented `instantiate` function with minimal setup
   - Implemented `execute` function with pattern matching for all message variants
   - Created handlers for all required operations:
     - `RegisterTool`: Validates tool_id length (≤ 16 characters), stores provider address, and saves tool metadata
     - `UpdatePrice`: Verifies sender authorization and updates price
     - `PauseTool`/`ResumeTool`: Manages tool activation state with provider authorization
   - Implemented `query` function for retrieving tool information

2. **Error Handling**:

   - Added proper error types for contract operations
   - Implemented validation checks for unauthorized access
   - Added error handling for non-existent tools

3. **Comprehensive Test Suite**:
   - Created test helpers and mocks to simplify test cases
   - Implemented tests for successful tool registration and validation
   - Added tests for validating tool ID length restrictions
   - Created tests for authorized and unauthorized price updates
   - Added tests for tool pausing and resuming functionality
   - Implemented tests for query functionality with both existing and non-existing tools
   - Refactored tests into a separate module for better organization and maintainability

**Next Steps**:
The Registry contract implementation is now complete. The next phase will focus on implementing the Escrow contract (Chunk 3), beginning with defining its messages and types.

### Chunk 3: Escrow Contract Implementation (IN PROGRESS)

**Overview**:
Work has begun on implementing the Escrow contract. We've completed defining the core message and state types (Task 3.1) and have implemented the `LockFunds` functionality (Task 3.2), which allows users to lock funds for tool usage. Testing infrastructure has been set up and the first integration test for the complete flow is now working correctly.

**Current Progress**:

1. **Message Types Implementation** (Task 3.1):

   - Created `msg.rs` with all required message structures:
     - `InstantiateMsg`: Now includes `registry_addr` parameter to connect with the Registry contract
     - `ExecuteMsg`: Implemented with variants for `LockFunds`, `Release`, and `RefundExpired` operations
     - `QueryMsg`: Added with the `GetEscrow` variant for querying escrow details
     - `SudoMsg`: Created with the `Freeze` variant for contract-level admin control
     - `EscrowResponse`: Added response struct for query returns

2. **State Types Implementation** (Task 3.1):

   - Created `state.rs` with core data structures:
     - `Escrow`: Struct with fields for `caller`, `provider`, `max_fee`, `auth_token`, and `expires`
     - `Config`: Struct with `frozen` boolean field and `registry_addr` for Registry contract integration
     - Storage definitions:
       - `ESCROWS`: Map to store escrow data indexed by ID
       - `NEXT_ID`: Item to maintain sequential escrow IDs
       - `CONFIG`: Item to store contract configuration

3. **Registry Interface Implementation** (Task 3.2):

   - Created `registry_interface.rs` for interacting with the Registry contract

4. **Integration Testing Setup**:

   - Fixed bech32 address encoding issue in `cw-multi-test` environment
   - Updated the test helpers in `setup_contract.rs` to use proper address formatting with `app.api().addr_make()` instead of raw string addresses
   - Implemented `complete_flow_test.rs` that tests the entire workflow from tool registration to fund release
   - Ensured consistent address handling by using properly formatted bech32 addresses for balance queries and contract execution
   - Implemented `query_tool` function to retrieve tool information
   - Added `ToolResponse` structure matching the Registry contract's response format

5. **LockFunds Implementation** (Task 3.2):

   - Expanded `error.rs` with specific error types for escrow operations:
     - `Frozen` for when the contract is frozen
     - `ToolNotActive` for when tools don't exist or are inactive
     - `InsufficientFunds` for when funds are inadequate
     - `ExpirationTooLong` for when escrow duration exceeds limits
     - Other error types for future functionality
   - Implemented `instantiate` function:
     - Sets contract version for future migrations
     - Validates and stores registry contract address
     - Initializes configuration with `frozen: false`
     - Sets up escrow ID counter starting at 1
   - Added `execute` function with pattern matching for message types
   - Implemented `lock_funds` handler with all required validations:
     - Queries Registry for tool existence and active status
     - Validates provided funds against maximum fee
     - Ensures expiration is within the 50-block limit (via `MAX_ESCROW_BLOCKS` constant)
     - Creates/stores the escrow and increments the ID counter
     - Emits `wasm-toolpay.locked` event with relevant attributes
     - Returns escrow ID to caller

6. **Release Implementation** (Task 3.3):

   - Implemented `release` handler function:
     - Loads and validates escrow existence by ID
     - Verifies that only the original provider can release funds
     - Ensures the escrow hasn't expired before attempting release
     - Validates that the usage fee doesn't exceed the maximum fee
     - Implements fund transfers for both provider payment and refunds:
       - Sends the usage fee to the provider
       - Returns any remaining funds to the original caller
     - Performs cleanup by removing the escrow from storage
     - Emits `wasm-toolpay.released` event with detailed attributes:
       - escrow_id, provider, caller, usage_fee, refund_amount
   - Fixed warnings and optimized imports in contract.rs

7. **RefundExpired Implementation** (Task 3.4):
   - Implemented `refund_expired` handler function:
     - Loads and validates escrow existence by ID
     - Verifies that only the original caller (not provider) can request refunds
     - Validates that the escrow has actually expired (current block > expires)
     - Creates a bank message to return all locked funds to the original caller
     - Performs cleanup by removing the escrow from storage
     - Emits `wasm-toolpay.refunded` event with relevant attributes:
       - escrow_id, caller, refund_amount

**Key Design Decisions**:

1. **Registry Contract Integration**: The Escrow contract now requires a Registry contract address during instantiation, establishing a clear dependency between the contracts
2. **Frozen State Check**: All execute operations first check if the contract is frozen, providing a global way to halt operations if needed
3. **Error Handling**: Comprehensive error types were added for detailed failure reporting
4. **Expiration Limits**: Set a maximum of 50 blocks for escrow expiration to prevent funds being locked for too long
5. **Event Emissions**: Standard events are emitted for blockchain explorers and indexers
6. **Fund Transfer Logic**: Implemented conditional fund transfers that only execute when amounts are non-zero
7. **Partial Release Support**: Added support for providers to claim only part of the maximum fee, automatically refunding the remainder
8. **Security Controls**: Strict verification of caller identity in all operations, ensuring only authorized parties can perform actions

9. **Query and Sudo Implementation** (Task 3.5):
   - Implemented `query` function for handling `GetEscrow` requests:
     - Added a helper function `query_escrow` that retrieves escrow details by ID
     - Returns properly formatted `EscrowResponse` with all escrow details
     - Handles error cases when escrows don't exist
     - Uses modern `to_json_binary` function instead of deprecated alternatives
   - Implemented `sudo` function for handling admin commands:
     - Added support for the `Freeze` command that can freeze the contract
     - Loads current configuration, sets frozen state, and saves it back
     - Prevents any further execute operations when frozen
     - Returns appropriate response with action attributes

**Next Steps**:
With the core contract functionality now fully implemented (Tasks 3.1-3.5), the next phase will focus on implementing comprehensive unit tests for the contracts (Chunk 4).

### Chunk 4: Contract Unit Tests (ALMOST COMPLETE)

**Overview**:
Comprehensive unit tests for both the Registry and Escrow contracts have been implemented and are now passing successfully. A robust testing environment with cw-multi-test has been established that allows for proper integration testing between contracts.

**Current Progress**:

1. **Testing Environment Setup** (Task 4.1):

   - Created a well-organized test directory structure for the Escrow contract:
     - Added `tests/mod.rs` as the main entry point for all test modules
     - Set up importing structure for different test categories (lock_funds, release, refund, etc.)
   - Configured `cw-multi-test` framework for integration testing:
     - Implemented `mock_app()` function that creates a test blockchain with initial balances
     - Set up contract code storage and instantiation helpers
     - Added support for bank operations to test fund transfers
   - Created mock accounts for different roles in the system:
     - `OWNER`: Contract deployer and admin
     - `PROVIDER`: Tool provider account
     - `USER`: Regular user that locks funds for tool usage
     - `UNAUTHORIZED`: Account without proper permissions for testing edge cases
   - Implemented helper functions for common contract operations:
     - `setup_contracts()`: Instantiates both Registry and Escrow contracts
     - `register_tool()`: Registers a tool in the Registry contract
     - `lock_funds()`: Locks funds in the Escrow contract
     - `release_funds()`: Releases funds to the provider
     - `refund_expired()`: Refunds an expired escrow
     - `query_escrow()`: Gets escrow details by ID
   - Set up integration between Registry and Escrow contracts:
     - Configured Registry contract address to be passed to Escrow contract
     - Enabled cross-contract querying for tool validation
     - Created `TestContracts` struct to manage both contracts in tests
   - Created initial test for locking funds:
     - Implemented `test_lock_funds_success` to validate basic escrow creation
     - Verified proper fund transfers between accounts
     - Validated escrow data is stored correctly

2. **Happy Path Tests Implementation** (Task 4.2):

   - Created comprehensive end-to-end integration tests:
     - Implemented `complete_flow_test.rs` to validate the full escrow lifecycle:
       - Tool registration by provider
       - Fund locking by user
       - Fund release by provider
       - Verification of final balances for both parties
     - Added `partial_fee_test.rs` to test refund functionality:
       - Verifies provider can charge less than maximum fee
       - Validates proper refunding of unused funds to the user
       - Ensures exact balance calculations for partial fee usage
     - Implemented `query_test.rs` for testing query functionality:
       - Verifies escrow data can be properly retrieved
       - Validates all escrow fields match expected values
       - Tests proper response formatting
     - Implemented `registry_basic_test.rs` to verify Registry contract functionality:
       - Tests basic tool registration, querying, and management
       - Verifies tool activation/deactivation (pause/resume)
       - Confirms price updates work correctly
       - Ensures proper authorization checks for all operations

3. **Edge Case Tests Implementation** (Task 4.3):
   - Implemented comprehensive error and edge case testing:
     - Created `exceed_max_ttl_test.rs` to validate TTL constraints:
       - Verifies contract rejects escrows with expiration > 50 blocks
       - Tests exact error messages and parameters for TTL violations
     - Added `excessive_fee_test.rs` to test fee limits:
       - Ensures providers cannot charge more than the maximum fee
       - Verifies proper error handling with detailed fee information
     - Implemented `unauthorized_release_test.rs` for authorization checks:
       - Tests that only the original provider can release funds
       - Confirms unauthorized users and even the escrow creator cannot release
     - Created `expired_escrow_refund_test.rs` for timeout handling:
       - Tests complete refund flow for expired escrows
       - Verifies funds are fully returned to the original caller
       - Confirms escrow state is properly cleaned up after refund
     - Added `non_expired_refund_test.rs` for premature refund attempts:
       - Ensures escrows cannot be refunded before expiration
       - Verifies proper error responses for premature refund attempts
     - Implemented `frozen_contract_test.rs` for administrative controls:
       - Tests contract behavior when frozen by admin via sudo
       - Verifies all operations (lock, release, refund) are rejected when frozen
       - Confirms proper error messages for frozen contract interactions

**Test Execution Issues** (Task 4.4):
Initial test execution revealed several issues that need to be addressed:

1. **Registry Import Issues**: The escrow tests are not correctly importing the registry crate. This is causing compilation errors as the tests are trying to use registry modules without proper imports. ✅ FIXED

2. **Type Conversion Problems**: There are issues with converting between data types, specifically:

   - Converting `Vec<u8>` to `String` for auth_token ✅ FIXED
   - Comparing `Addr` objects with `&str` values in assertions ✅ FIXED

3. **Field Name Mismatches**: The tests are using incorrect field names in some message variants:

   - Using `id` instead of `escrow_id` in `QueryMsg::GetEscrow` ✅ FIXED

4. **Sudo Implementation Issues**: The sudo implementation in the tests is incorrect:

   - Passing both contract address and message to the sudo function when it only accepts a message ✅ FIXED

5. **Error Handling in Tests**: Fixed issues in the `exceed_max_ttl_test.rs` test:

   - Initially the test was failing with a subtraction overflow error when attempting to validate the MAX_TTL limit of 50 blocks
   - The error occurred because the test was manually executing the contract message, which was encountering issues with the error propagation in the test environment
   - Modified the test to use the `lock_funds` helper function which provides better error handling
   - Updated the error assertion logic to check for the expected error message string instead of trying to directly match against the contract error enum
   - This approach is more resilient because it doesn't rely on the specific error wrapping/unwrapping mechanism used by the cw-multi-test framework
   - The test now correctly verifies that attempts to create escrows with TTL > 50 blocks are rejected with the appropriate error message

6. **Contract Address Reference Issues**: Fixed a critical bug in the partial_fee_test:

   - The test was failing with "ContractData; key: [...] not found" error when trying to execute the Release operation
   - The error was due to improper contract address handling when trying to execute the release message
   - Modified the test to use the standard helper function `release_funds()` from setup_contract.rs instead of attempting direct contract execution
   - The helper function properly handles address formatting using `contracts.app.api().addr_make(sender)` to create valid bech32 addresses
   - Also removed all debug print statements to clean up the test output
   - This fix ensures consistent address handling across all tests and aligns with the established testing patterns

7. **Expired Escrow Refund Test Issues**: Fixed the `expired_escrow_refund_test.rs` that was failing with an "Overflow: Cannot Sub with given operands" error: ✅ FIXED

   - The primary issue was that the test wasn't explicitly providing the funds needed for the escrow transaction
   - Added a proper `funds` vector with a Coin object containing the default maximum fee amount
   - Ensured user addresses are properly formatted as Bech32 addresses using `contracts.app.api().addr_make(USER)`
   - Fixed block advancement logic to ensure escrow properly expires before refund attempt
   - Added balance verification to confirm funds are locked and then refunded correctly
   - Used helper functions consistently for all operations to ensure proper address handling
   - The test now successfully validates the complete expired escrow refund workflow

8. **Address Formatting Issues in Tests**: Fixed critical issues with address handling in tests: ✅ FIXED

   - Multiple tests were failing due to inconsistent address formatting in tests
   - The errors manifested as "ContractData; key: [...] not found" in tests like `frozen_contract_test`, `non_expired_refund_test`, and `unauthorized_release_test`
   - The root issue was the inconsistent use of address types between:
     - `Addr::unchecked(USER)` - Creates an Addr struct but doesn't format it properly for the test environment
     - `contracts.app.api().addr_make(USER)` - Creates a properly formatted Bech32 address for the test environment
   - The fix involved:
     - Using `contracts.app.api().addr_make()` consistently for user/account addresses in all tests
     - Using `Addr::unchecked(&contracts.escrow_addr)` when referencing contract addresses in function calls
     - Adding `.clone()` for Addr values when they're used multiple times (since Addr doesn't implement Copy)
   - This pattern ensures addresses are properly formatted as Bech32 addresses that the test environment can recognize
   - Consistent address handling is now implemented across all tests

9. **Error Handling in Tests**: Standardized error handling pattern in tests: ✅ FIXED
   - Fixed error handling in all test files to use a consistent pattern:
   ```rust
   match result.unwrap_err().downcast::<ContractError>() {
       Ok(ContractError::ExpectedError {}) => {}, // Expected error
       Ok(err) => panic!("Unexpected error: {:?}", err),
       Err(err) => panic!("Wrong error type: {:?}", err),
   }
   ```
   - This pattern correctly handles the anyhow error wrapping used by cw-multi-test
   - First unwraps the Result to get the error, then uses downcast to recover the original ContractError type
   - Distinguishes between expected errors, unexpected contract errors, and non-contract errors

These fixes have established an important pattern for CosmWasm testing with cw-multi-test:

1. **Proper Address Handling**:

   - Use `contracts.app.api().addr_make(USER)` for creating account addresses
   - Use `Addr::unchecked(&contracts.escrow_addr)` for referencing contract addresses
   - Remember to clone Addr values when they're used multiple times

2. **Consistent Error Checking**:

   - Always use `downcast::<ContractError>()` to recover the original error type from anyhow errors
   - Check for specific error variants to ensure the correct error is being returned
   - Handle all three possible scenarios: expected error, unexpected contract error, wrong error type

3. **Test Organization**:
   - Separate tests into individual modules based on functionality
   - Create reusable helper functions for common operations
   - Use consistent naming conventions across test files

These patterns have been consistently applied to all tests in the project, ensuring robust and reliable test coverage.

**Test Execution Results**:
All 11 tests are now passing successfully, covering:

- Basic lock funds functionality
- Complete flow from tool registration to fund release
- Partial fee usage scenarios
- Query endpoint functionality
- Registry contract basic operations
- Edge cases for TTL limits, excessive fees, authorization checks
- Expired escrow refund workflows
- Contract freezing functionality

There is a minor warning about an unused `query_escrow` function in the test setup, which could be addressed in future cleanup.

**Next Steps**:
The test implementation is complete with all tests passing. The only remaining task is to check code coverage (if available). Once this is done, we can move on to Chunk 5: CI & Localnet Configuration.

**Build System Notes**:
When working on Apple Silicon (M1/M2) Macs, the following build workflow is recommended for CosmWasm contracts:

1. **For building contract WebAssembly files**:
   ```fish
   # Standard development build
   cargo build --lib --target wasm32-unknown-unknown
   
   # Optimized release build
   cargo build --lib --release --target wasm32-unknown-unknown
   ```

2. **For generating schemas**:
   Run these separately for each contract:
   ```fish
   cd contracts/registry
   cargo run --bin schema

   cd contracts/escrow
   cargo run --bin schema
   ```

3. **For optimizing WASM files for deployment**:
   Run this after building the release WASM for each contract:
   ```fish
   wasm-opt \
     target/wasm32-unknown-unknown/release/escrow.wasm \
     -Oz \
     --strip-debug \
     --strip-producers \
     --vacuum \
     -o artifacts/escrow.wasm
   ```
   (Repeat for `registry.wasm` as needed, changing the input/output filenames.)

   - This produces a minimized, deployable WASM file in `artifacts/`.
   - The CosmWasm Optimizer Docker image is no longer required for this workflow.

### Chunk 5: CI & Localnet Configuration (PENDING)

_Implementation notes will be added here once work begins on this chunk._

## Deployment to Neutron Testnet (pion-1)

### Build and Deployment Sequence

The correct deployment sequence for ToolPay contracts is:

1. **Build and optimize both contracts**
2. **Deploy and instantiate the Registry contract first**
3. **Deploy and instantiate the Escrow contract, passing the Registry contract address**

#### 1. Build and Optimize WASM Files

First, build the release WASM files:

```fish
# Build release WASM files
cargo build --lib --release --target wasm32-unknown-unknown
```

Then optimize the WASM files using wasm-opt:

```fish
# Optimize escrow contract
wasm-opt \
  target/wasm32-unknown-unknown/release/escrow.wasm \
  -Oz \
  --strip-debug \
  --strip-producers \
  --vacuum \
  -o artifacts/escrow.wasm

# Optimize registry contract
wasm-opt \
  target/wasm32-unknown-unknown/release/registry.wasm \
  -Oz \
  --strip-debug \
  --strip-producers \
  --vacuum \
  -o artifacts/registry.wasm
```

This creates optimized `.wasm` files in the `artifacts/` directory, ready for deployment without requiring Docker.

#### 2. Deploy and Instantiate the Registry Contract

**a. Store the Registry contract on-chain:**

```fish
neutrond tx wasm store artifacts/registry.wasm \
  --from devwallet \
  --gas auto --gas-adjustment 1.3 \
  --fees 30000untrn \
  --broadcast-mode sync
```

Note the resulting `code_id` (e.g., `11724`).

**b. Instantiate the Registry contract:**

```fish
neutrond tx wasm instantiate 11724 '{}' \
  --from devwallet \
  --label "toolpay-registry" \
  --no-admin \
  --gas auto --gas-adjustment 1.3 \
  --fees 5000untrn \
  --broadcast-mode sync
```

- The output will include the new Registry contract address (e.g., `neutron1mxaqqn...`).

#### 3. Deploy and Instantiate the Escrow Contract

**a. Store the Escrow contract on-chain:**

```fish
neutrond tx wasm store artifacts/escrow.wasm \
  --from devwallet \
  --gas auto --gas-adjustment 1.3 \
  --fees 30000untrn \
  --broadcast-mode sync
```

Note the resulting `code_id` (e.g., `11725`).

**b. Instantiate the Escrow contract, passing the Registry contract address:**

```fish
neutrond tx wasm instantiate 11725 '{"registry_addr": "<REGISTRY_CONTRACT_ADDRESS>"}' \
  --from devwallet \
  --label "toolpay-escrow" \
  --no-admin \
  --gas auto --gas-adjustment 1.3 \
  --fees 5000untrn \
  --broadcast-mode sync
```

- Replace `<REGISTRY_CONTRACT_ADDRESS>` with the actual address returned from the Registry instantiation step.

### Example

Suppose the Registry contract address is `neutron1mxaqqnh237vu0phcfh6ut8gx3att2dza49r5x9h52fey9gspy5nq54cjhv`:

```fish
neutrond tx wasm instantiate 11725 '{"registry_addr": "neutron1mxaqqnh237vu0phcfh6ut8gx3att2dza49r5x9h52fey9gspy5nq54cjhv"}' \
  --from devwallet \
  --label "toolpay-escrow" \
  --no-admin \
  --gas auto --gas-adjustment 1.3 \
  --fees 5000untrn \
  --broadcast-mode sync
```

### Notes
- Always deploy and instantiate the Registry contract before the Escrow contract.
- The Escrow contract must be instantiated with the correct Registry contract address.
- Both contracts should be deployed with `--no-admin` for immutability unless upgradability is required.
- Adjust `code_id` and addresses as needed for your deployment.

### Deployed Contract Addresses

ToolPay contracts have been successfully deployed to Neutron testnet (pion-1) with the following addresses:

| Contract  | Address                                                             |
|-----------|---------------------------------------------------------------------|
| Registry  | neutron1mxaqqnh237vu0phcfh6ut8gx3att2dza49r5x9h52fey9gspy5nq54cjhv |
| Escrow    | neutron1hg4p3r0vlmca5vwyvxdx6kfd4urg038xsacjsfu0lytrupm3h42sag09wr |

These addresses can be used for integration testing with frontend applications and the provider SDK.

#### Interacting with Deployed Contracts

You can query the deployed contracts using the following commands:

```fish
# Query a registered tool
neutrond query wasm contract-state smart neutron1mxaqqnh237vu0phcfh6ut8gx3att2dza49r5x9h52fey9gspy5nq54cjhv '{"get_tool":{"tool_id":"example-tool"}}'

# Query an escrow by ID
neutrond query wasm contract-state smart neutron1hg4p3r0vlmca5vwyvxdx6kfd4urg038xsacjsfu0lytrupm3h42sag09wr '{"get_escrow":{"escrow_id":1}}'
```

For executing transactions against these contracts, use the addresses above in your commands.

---

## Architecture Notes

From the project specification (project.md), the ToolPay MVP implements a pay-per-call workflow for AI tools with the following key components:

1. **Registry Contract**: Manages tool registration and metadata

   - Providers register tools with pricing
   - Tools can be paused/resumed
   - Query interface for tool discovery

2. **Escrow Contract**: Handles fund locking and release

   - Users lock funds for tool usage
   - Providers verify usage and claim fees
   - Timeout mechanism for refunds

3. **Provider SDK**: Typescript library for tool providers
   - Verification of escrows
   - Usage reporting and fee claiming

The implementation follows a phased approach as outlined in blueprint.md, focusing first on contract development, then SDK development, and finally frontend components if required.

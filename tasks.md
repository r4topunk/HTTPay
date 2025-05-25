# Pay-Per-Tool MVP Implementation Tasks

This document provides a comprehensive, actionable tasklist for implementing the Pay-Per-Tool MVP. Each task is broken down into specific subtasks with clear deliverables.

## Implementation Phases

We will implement Pay-Per-Tool in 3 distinct phases:

1. **Phase 1: Smart Contracts & Testing** - Focus on implementing and thoroughly testing the core CosmWasm contracts
2. **Phase 2: Provider SDK** - Develop the TypeScript SDK for providers (no CLI)
3. **Phase 3: Frontend Development** - Build the user-facing application with shadcn UI

> **Current Phase**: We are currently in **Phase 1**, focusing exclusively on contract development and testing. Phases 2 and 3 will begin only after Phase 1 is fully completed and tested.

## Chunk 1: Project Setup

### 1.1 Create directory structure
- [x] Create a `contracts` directory for CosmWasm contracts
- [x] Create a `packages` directory for TypeScript packages
- [x] Create a `frontend` directory as a placeholder for future development
- [x] Create a `scripts` directory for helper scripts
- [x] Create a README.md in the frontend directory explaining it will be developed later

### 1.2 Initialize CosmWasm template
- [x] Change the directory to get into the `contracts` directory
- [x] Install `cargo-generate` if needed: `cargo install cargo-generate`
- [x] Generate registry project using CosmWasm template: `cargo generate --git https://github.com/CosmWasm/cw-template.git --name registry`
- [x] Generate escrow project using CosmWasm template: `cargo generate --git https://github.com/CosmWasm/cw-template.git --name escrow`

### 1.3 Create Rust workspace
- [x] Set up `Cargo.toml` at root with workspace members, including `contracts/registry` and `contracts/escrow`
- [x] Add common dependencies to workspace:
  - [x] `cosmwasm-std = "1.5"`
  - [x] `cw-storage-plus = "1.2"`
  - [x] `schemars`
  - [x] `serde`
  - [x] `thiserror`
- [x] Configure optimization settings for Wasm compilation
- [x] Add `rust-toolchain.toml` with Rust 1.78 specification

### 1.4 Validate initial setup
- [x] Ensure `cargo build` succeeds
- [x] Add `.gitignore` for Rust and Node artifacts

## Chunk 2: Registry Contract Implementation

### 2.1 Define Registry messages and types
- [x] Create `msg.rs` with:
  - [x] `InstantiateMsg` struct (empty for MVP)
  - [x] `ExecuteMsg` enum with variants: `RegisterTool`, `UpdatePrice`, `PauseTool`, `ResumeTool`
  - [x] `QueryMsg` enum with variant: `GetTool`
  - [x] `ToolResponse` struct for query returns
- [x] Create `state.rs` with:
  - [x] `ToolMeta` struct with fields: `provider: Addr`, `price: Uint128`, `is_active: bool`
  - [x] `TOOLS: Map<String, ToolMeta>` storage definition

### 2.2 Implement Registry contract logic
- [x] Implement `instantiate` function with minimal setup
- [x] Implement `execute` function with pattern matching for all message variants
- [x] Implement `RegisterTool` handler:
  - [x] Validate `tool_id` length ≤ 16 characters
  - [x] Store provider address from `info.sender`
  - [x] Store tool metadata in `TOOLS` map
  - [x] Return success response with tool_id
- [x] Implement `UpdatePrice` handler:
  - [x] Load existing tool
  - [x] Verify sender is the provider
  - [x] Update price and save
- [x] Implement `PauseTool` handler:
  - [x] Load existing tool
  - [x] Verify sender is the provider
  - [x] Set `is_active` to false
- [x] Implement `ResumeTool` handler:
  - [x] Load existing tool
  - [x] Verify sender is the provider
  - [x] Set `is_active` to true
- [x] Implement `query` function for `GetTool`
- [x] Implement `query` function for `GetTools` to fetch all available tools

### 2.3 Add Registry contract tests
- [x] Set up test helpers and mocks
- [x] Test successful tool registration
- [x] Test tool registration with invalid tool_id (too long)
- [x] Test unauthorized price update
- [x] Test successful price update
- [x] Test pause and resume functionality
- [x] Test query functionality for single tools
- [x] Test query functionality for fetching all tools

## Chunk 3: Escrow Contract Implementation

### 3.1 Define Escrow messages and types
- [x] Create `msg.rs` with:
  - [x] `InstantiateMsg` struct (empty for MVP)
  - [x] `ExecuteMsg` enum with variants: `LockFunds`, `Release`, `RefundExpired`
  - [x] `QueryMsg` enum with variant: `GetEscrow`
  - [x] `SudoMsg` enum with variant: `Freeze`
  - [x] `EscrowResponse` struct for query returns
- [x] Create `state.rs` with:
  - [x] `Escrow` struct with fields: `caller`, `provider`, `max_fee`, `auth_token`, `expires`
  - [x] `Config` struct with field: `frozen: bool`
  - [x] `ESCROWS: Map<u64, Escrow>` storage
  - [x] `NEXT_ID: Item<u64>` counter
  - [x] `CONFIG: Item<Config>` storage

### 3.2 Implement `LockFunds` functionality
- [x] Add import for `Registry` contract interfaces for querying tools
- [x] Implement `instantiate` function with `CONFIG` and `NEXT_ID` initialization
- [x] Implement `LockFunds` handler:
  - [x] Query Registry contract for tool details
  - [x] Verify tool exists and is active
  - [x] Validate `max_fee` against attached funds
  - [x] Validate `expires` is within limits (≤ 50 blocks)
  - [x] Create and store `Escrow` object
  - [x] Increment `NEXT_ID`
  - [x] Emit `wasm-toolpay.locked` event
  - [x] Return escrow_id

### 3.3 Implement `Release` functionality
- [x] Implement `Release` handler:
  - [x] Load escrow by id
  - [x] Verify caller is the original provider
  - [x] Verify escrow hasn't expired
  - [x] Verify `usage_fee` ≤ `max_fee`
  - [x] Transfer `usage_fee` to provider
  - [x] Transfer remaining funds (if any) to original caller
  - [x] Remove escrow from storage
  - [x] Emit `wasm-toolpay.released` event

### 3.4 Implement `RefundExpired` functionality
- [x] Implement `RefundExpired` handler:
  - [x] Load escrow by id
  - [x] Verify caller is the original caller
  - [x] Verify escrow has expired (current block > expires)
  - [x] Return all funds to original caller
  - [x] Remove escrow from storage
  - [x] Emit `wasm-toolpay.refunded` event

### 3.5 Implement query and sudo functionality
- [x] Implement `query` function for `GetEscrow`
- [x] Implement `sudo` function for `Freeze` that sets the contract's frozen state

### 3.6 Fix warnings in helpers.rs
- [x] Addressed unreachable expression and unused variable warnings in `call` method of `CwTemplateContract`.
- [x] Updated the method to return an error since `ExecuteMsg` is uninhabited.

## Chunk 4: Contract Unit Tests

### 4.1 Set up testing environment
- [x] Configure `cw-multi-test` in each contract's tests
- [x] Create mock accounts for providers and users
- [x] Create helper functions for contract instantiation
- [x] Set up integration between Registry and Escrow contracts in tests

### 4.2 Write happy path tests
- [x] Test basic lock funds functionality
- [x] Test complete flow: register tool → lock funds → release → verify balances
- [x] Test complete flow with partial fee usage (refund remainder)
- [x] Test query endpoints returning correct data
- [x] Test Registry contract's basic functionality

### 4.3 Write edge case tests
- [x] Test attempting to exceed max TTL (50 blocks)
- [x] Test attempting to charge > max_fee
- [x] Test unauthorized release attempt
- [x] Test expired escrow refund
- [x] Test attempt to refund non-expired escrow
- [x] Test interactions when contract is frozen

### 4.4 Fix test implementation issues
- [x] Fix registry crate import in test files (add registry as a dependency in escrow's Cargo.toml)
- [x] Fix type conversion for auth_token (Vec<u8> to String)
  - [x] Update `lock_funds` helper function to take String directly
  - [x] Replace `"...".as_bytes().to_vec()` with `"...".to_string()` in all test files
  - [x] Remove unnecessary String::from_utf8 conversions
- [x] Correct field name in QueryMsg::GetEscrow (change 'id' to 'escrow_id')
- [x] Fix type comparison issues (Addr vs &str)
- [x] Correct sudo implementation in frozen_contract_test.rs
- [x] Fix `test_excessive_fee` to ensure proper Bech32 address formatting for PROVIDER.

### 4.5 Run comprehensive test suite
- [x] Configure Cargo to run wasm tests: `cargo wasm-test`
- [x] Verify all tests pass without warnings
- [ ] Check code coverage (if available)

### 4.6 Update tests for Bech32 compliance
- [x] Reviewed and updated all escrow contract tests to replace `Addr::unchecked` with Bech32-compliant addresses using `addr_make`.
- [x] Verified and resolved warnings in test files, including unused imports.

## Chunk 5: Deployment to Testnet

### 5.1 Build optimized contracts
- [x] Use CosmWasm Rust Optimizer to build optimized WASM files
- [x] Verify WASM files are created in the `artifacts/` directory

### 5.2 Deploy contracts to Neutron testnet
- [x] Store Escrow contract on-chain
- [x] Instantiate Escrow contract with a placeholder registry address
- [x] Fix Registry contract instantiation issue:
  - [x] Investigate instantiation error with Registry contract
  - [x] Check entry point annotations and InstantiateMsg structure
  - [x] Re-optimize and redeploy Registry contract
  - [x] Verify successful Registry contract deployment
- [x] Deploy new Escrow contract connected to actual Registry contract:
  - [x] Store new Escrow contract on-chain
  - [x] Instantiate with correct Registry contract address
- [x] Register test tools in Registry contract
- [x] Test creating escrows with deployed contracts

### 5.3 Document contract deployment
- [x] Record code IDs and contract addresses
- [x] Document deployment steps and commands
- [x] Note any issues encountered during deployment
- [x] Update deployment notes with proper Registry-Escrow connection

## Chunk 6: CI & Localnet Configuration

### 6.1 Set up GitHub Actions workflow
- [ ] Create `.github/workflows/ci.yml`
- [ ] Configure Rust build and test steps
- [ ] Add cargo wasm optimizer step
- [ ] Set up caching for faster CI builds

### 6.2 Configure Neutron localnet
- [ ] Create `docker-compose.yml` for Neutron localnet
- [ ] Configure volumes and networks
- [ ] Add deployment scripts for contracts
- [ ] Create convenience scripts for running localnet

### 6.3 Set up TypeScript test environment
- [ ] Configure Jest for TypeScript testing
- [ ] Set up environment variables for test configuration
- [ ] Integrate TypeScript tests with GitHub Actions
- [ ] Create integration test scripts that deploy and test contracts

## Chunk 7: Provider SDK (TypeScript)

### 7.1 Initialize provider SDK package
- [x] Create directory `packages/provider-sdk`
- [x] Initialize package with `npm init -y`
- [x] Create TypeScript configuration
- [x] Set up build and test scripts
- [x] Configure package exports and types

### 7.2 Generate TypeScript bindings
- [x] Extract contract schemas: `cargo schema`
- [x] Define TypeScript types manually based on schemas
- [x] Implement TypeScript types for Registry contract messages, queries, and responses
- [x] Implement TypeScript types for Escrow contract messages, queries, and responses
- [x] Create wrapper classes (`RegistryClient` and `EscrowClient`) for contract interaction

### 7.3 Implement escrow verification
- [x] Create `EscrowVerifier` class
- [x] Implement `verifyEscrow` method:
  - [x] Query escrow by ID
  - [x] Validate auth token
  - [x] Check expiration
  - [x] Verify provider address
  - [x] Return boolean result and escrow details

### 7.4 Implement usage posting
- [x] Create `UsageReporter` class
- [x] Implement `postUsage` method:
  - [x] Create `Release` message
  - [x] Sign and broadcast transaction
  - [x] Handle error states
  - [x] Return transaction hash and status

### 7.5 Prepare package for publishing
- [x] Add documentation comments
- [x] Create README with examples
- [x] Add tests for SDK functions
- [x] Create comprehensive README.md with full documentation, examples, and contribution guidelines
- [ ] Create packaged version for local registry

## Chunk 8: CLI Tool for Provider (do not implement this)

### 8.1 Set up CLI framework
- [ ] Create directory `packages/provider-cli`
- [ ] Install CLI framework: `npm install commander` (or oclif)
- [ ] Create main entry point
- [ ] Set up command structure
- [ ] Configure binary creation

### 8.2 Implement CLI commands
- [ ] Implement `register-tool` command:
  - [ ] Parse arguments: tool_id, price
  - [ ] Load wallet from key
  - [ ] Call registry contract
- [ ] Implement `update-price` command:
  - [ ] Parse arguments: tool_id, new_price
  - [ ] Call registry contract
- [ ] Implement `pause-tool` and `resume-tool` commands
- [ ] Implement `release-escrow` command:
  - [ ] Parse arguments: escrow_id, usage_fee
  - [ ] Call escrow contract

### 8.3 Add configuration handling
- [ ] Create config file structure
- [ ] Add options for RPC endpoint, chain ID
- [ ] Add wallet key management
- [ ] Implement configuration validation

### 8.4 Add CLI tests
- [ ] Set up test fixtures
- [ ] Mock contract interactions
- [ ] Test command parsing
- [ ] Test configuration loading

## Chunk 9: AI-Wallet Client Demo & E2E

### 9.1 Create demo script
- [x] Initialize demo directory
- [x] Create wallet generation utilities
- [x] Implement tool discovery flow
- [x] Implement fund locking and API call flow
- [x] Update client authentication to use private key instead of mnemonic
- [ ] Create simple HTTP server for demo provider

### 9.2 Implement E2E test script
- [ ] Set up test environment with contracts deployed
- [x] Create test wallets with funds
- [x] Register test tool
- [x] Lock funds and verify escrow
- [x] Mock API call with auth token
- [x] Release funds and verify balances
- [ ] Test refund flow with timeout

## Chunk 10: Multi-Denomination Token Support

### 10.1 Registry Contract Multi-Denom Support
- [x] Create PRD/TDD for multi-denomination token support
- [x] Update `ToolMeta` struct with `denom` field
- [x] Add optional `denom` parameter to `RegisterTool` message
- [x] Create `UpdateDenom` message type
- [x] Implement `execute_update_denom` handler function
- [x] Update query responses to include denom information
- [x] Add default "untrn" token for backward compatibility

### 10.2 Escrow Contract Multi-Denom Support
- [x] Update `Escrow` struct with `denom` field
- [x] Modify `lock_funds` to validate token denomination
- [x] Update `release` and `refund_expired` to use stored denom
- [x] Add appropriate error types for denom-related issues
- [x] Add denom field to events and responses

### 10.3 TypeScript SDK Multi-Denom Support
- [x] Update registry and escrow types to include denom
- [x] Update RegistryClient with denom support
- [x] Modify EscrowClient to handle denom information
- [x] Create implementation notes

### 10.4 Testing and Documentation
- [x] Add comprehensive tests for multi-denomination support
- [ ] Update documentation with multi-denom usage examples

## Chunk 11: Documentation & Hardening

### 11.1 Create comprehensive README
- [x] Add project description and architecture diagram
- [x] Document installation instructions
- [x] Provide quickstart guide
- [x] Add examples for each component
- [x] Include troubleshooting section
- [x] **Create professional README.md for Provider SDK with comprehensive documentation, API examples, testing guidelines, and contribution instructions**

### 11.2 Finalize specification
- [ ] Review and update `project.md` with final implementation details
- [ ] Add links to code repositories
- [ ] Document any deviations from original spec
- [ ] Add suggestions for future improvements

### 11.3 Harden implementation
- [ ] Add gas limits to all transactions
- [ ] Add input validation throughout
- [ ] Review for security issues (reentrancy, overflow)
- [ ] Add more edge-case tests
- [ ] Optimize contract storage patterns

### 11.4 Prepare for release
- [ ] Tag release in git
- [ ] Prepare crates for publication
- [ ] Prepare npm packages for publication
- [ ] Create release notes
- [ ] Generate documentation website (if applicable)

## Chunk 12: Fee Collection Feature

### 12.1 Update Escrow Contract for Fee Collection
- [x] Update `Config` struct to include owner address and fee percentage
- [x] Modify `InstantiateMsg` to accept fee_percentage parameter
- [x] Add `ClaimFees` execute message
- [x] Update `release` function to calculate and collect platform fee
- [x] Implement `claim_fees` handler function for owner to withdraw fees
- [x] Add new errors for fee percentage validation and claiming
- [x] Add `GetCollectedFees` query and response type

### 12.2 Fee Collection Testing
- [x] Add fee_collection_test.rs with comprehensive tests:
  - [x] Test fee calculation and collection flow
  - [x] Test unauthorized claim attempts
  - [x] Test multiple releases with fee accumulation
  - [x] Test invalid fee percentage validation
- [x] Fix type conversion issues in tests
- [x] Update setup_contract.rs to support fee percentage

### 12.3 Documentation & Final Review
- [x] Update error handling for robust fee management
- [x] Ensure all tests pass with fee collection feature
- [x] Add TypeScript SDK tests for fee collection functionality:
  - [x] Test fee querying with getCollectedFees
  - [x] Test fee claiming with claimFees
  - [x] Test release flow with fee calculation
- [ ] Update contract documentation to explain fee collection
- [ ] Document fee collection feature in provider SDK

## Chunk 13: Frontend Debug Page

### 13.1 Frontend Debug Page Implementation - ✅ COMPLETED
- [x] Created comprehensive debug page at `packages/httpay-website/app/debug/page.tsx`
- [x] Integrated PayPerTool SDK with full functionality coverage
- [x] Implemented wallet connection and management
- [x] Added Registry contract interaction (register, update, pause/resume tools)
- [x] Added Escrow contract interaction (lock funds, release, refund)
- [x] Implemented query functionality for tools and escrows
- [x] Added error handling and user feedback (toasts)
- [x] Created responsive UI with shadcn/ui components
- [x] Validated build process and runtime functionality
- [x] Confirmed no import/export issues with SDK integration
- [x] Tested all features in development environment
- [x] Documented implementation in `notes/frontend-debug-page.md`

## Chunk 14: Add Endpoint Field to Registry Contract ✅

**Objective**: Add a new `endpoint` field to the Registry contract for storing tool API endpoints that users will fetch to interact with tools.

**Status**: PLANNING COMPLETED ✅

**Implementation Plan**: Detailed 68-task implementation plan documented in `notes/endpoint-field-plan.md`

### Main Implementation Checkpoints

#### 14.1 Registry Contract Core Updates
- [ ] Update ToolMeta struct with endpoint field
- [ ] Add RegisterTool endpoint parameter and validation
- [ ] Implement UpdateEndpoint message and handler
- [ ] Update all query responses to include endpoint
- [ ] Add endpoint validation and error handling

#### 14.2 Registry Contract Testing
- [ ] Update existing tests for endpoint field compatibility
- [ ] Create comprehensive endpoint-specific tests
- [ ] Test endpoint validation and error scenarios
- [ ] Verify endpoint data integrity across all operations

#### 14.3 TypeScript SDK Updates
- [ ] Update Registry types and interfaces for endpoint support
- [ ] Add endpoint parameter to registerTool method
- [ ] Implement new updateEndpoint method
- [ ] Update SDK tests and documentation

#### 14.4 SDK Release Management
- [ ] Version bump and changelog updates
- [ ] NPM publishing with endpoint feature
- [ ] Verify package integrity and functionality

#### 14.5 Frontend Debug Page Enhancement
- [ ] Add endpoint input to tool registration form
- [ ] Display and manage endpoints in tools list
- [ ] Implement endpoint update functionality
- [ ] Enhance UX with validation and copy features

#### 14.6 Documentation and Integration
- [ ] Update project specifications with endpoint field
- [ ] Create migration guide for existing users
- [ ] Update SDK and contract documentation

#### 14.7 Testing and Quality Assurance
- [ ] Full system integration testing
- [ ] Performance and validation testing
- [ ] User acceptance testing

#### 14.8 Deployment and Release
- [ ] Deploy updated contracts to testnet
- [ ] Coordinate release across all components
- [ ] Monitor post-deployment functionality
# ToolPay MVP Implementation Tasks

This document provides a comprehensive, actionable tasklist for implementing the ToolPay MVP. Each task is broken down into specific subtasks with clear deliverables.

## Implementation Phases

We will implement ToolPay in 3 distinct phases:

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

### 2.3 Add Registry contract tests
- [x] Set up test helpers and mocks
- [x] Test successful tool registration
- [x] Test tool registration with invalid tool_id (too long)
- [x] Test unauthorized price update
- [x] Test successful price update
- [x] Test pause and resume functionality
- [x] Test query functionality

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

### 4.5 Run comprehensive test suite
- [ ] Configure Cargo to run wasm tests: `cargo wasm-test`
- [ ] Verify all tests pass without warnings
- [ ] Check code coverage (if available)

## Chunk 5: CI & Localnet Configuration

### 5.1 Set up GitHub Actions workflow
- [ ] Create `.github/workflows/ci.yml`
- [ ] Configure Rust build and test steps
- [ ] Add cargo wasm optimizer step
- [ ] Set up caching for faster CI builds

### 5.2 Configure Neutron localnet
- [ ] Create `docker-compose.yml` for Neutron localnet
- [ ] Configure volumes and networks
- [ ] Add deployment scripts for contracts
- [ ] Create convenience scripts for running localnet

### 5.3 Set up TypeScript test environment
- [ ] Configure Jest for TypeScript testing
- [ ] Set up environment variables for test configuration
- [ ] Integrate TypeScript tests with GitHub Actions
- [ ] Create integration test scripts that deploy and test contracts

## Chunk 6: Provider SDK (TypeScript)

### 6.1 Initialize provider SDK package
- [ ] Create directory `packages/provider-sdk`
- [ ] Initialize package with `npm init -y`
- [ ] Create TypeScript configuration
- [ ] Set up build and test scripts
- [ ] Configure package exports and types

### 6.2 Generate TypeScript bindings
- [ ] Extract contract schemas: `cargo schema`
- [ ] Configure Telescope settings
- [ ] Generate TypeScript types from schemas
- [ ] Create wrapper classes for contract interaction

### 6.3 Implement escrow verification
- [ ] Create `EscrowVerifier` class
- [ ] Implement `verifyEscrow` method:
  - [ ] Query escrow by ID
  - [ ] Validate auth token
  - [ ] Check expiration
  - [ ] Verify provider address
  - [ ] Return boolean result and escrow details

### 6.4 Implement usage posting
- [ ] Create `UsageReporter` class
- [ ] Implement `postUsage` method:
  - [ ] Create `Release` message
  - [ ] Sign and broadcast transaction
  - [ ] Handle error states
  - [ ] Return transaction hash and status

### 6.5 Prepare package for publishing
- [ ] Add documentation comments
- [ ] Create README with examples
- [ ] Add tests for SDK functions
- [ ] Create packaged version for local registry

## Chunk 7: CLI Tool for Provider

### 7.1 Set up CLI framework
- [ ] Create directory `packages/provider-cli`
- [ ] Install CLI framework: `npm install commander` (or oclif)
- [ ] Create main entry point
- [ ] Set up command structure
- [ ] Configure binary creation

### 7.2 Implement CLI commands
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

### 7.3 Add configuration handling
- [ ] Create config file structure
- [ ] Add options for RPC endpoint, chain ID
- [ ] Add wallet key management
- [ ] Implement configuration validation

### 7.4 Add CLI tests
- [ ] Set up test fixtures
- [ ] Mock contract interactions
- [ ] Test command parsing
- [ ] Test configuration loading

## Chunk 8: AI-Wallet Client Demo & E2E

### 8.1 Create demo script
- [ ] Initialize demo directory
- [ ] Create wallet generation utilities
- [ ] Implement tool discovery flow
- [ ] Implement fund locking and API call flow
- [ ] Create simple HTTP server for demo provider

### 8.2 Implement E2E test script
- [ ] Set up test environment with contracts deployed
- [ ] Create test wallets with funds
- [ ] Register test tool
- [ ] Lock funds and verify escrow
- [ ] Mock API call with auth token
- [ ] Release funds and verify balances
- [ ] Test refund flow with timeout

### 8.3 Integrate with CI
- [ ] Add E2E tests to CI workflow
- [ ] Configure localnet startup in CI
- [ ] Ensure tests are isolated and reproducible

## Chunk 9: Documentation & Hardening

### 9.1 Create comprehensive README
- [ ] Add project description and architecture diagram
- [ ] Document installation instructions
- [ ] Provide quickstart guide
- [ ] Add examples for each component
- [ ] Include troubleshooting section

### 9.2 Finalize specification
- [ ] Review and update `project.md` with final implementation details
- [ ] Add links to code repositories
- [ ] Document any deviations from original spec
- [ ] Add suggestions for future improvements

### 9.3 Harden implementation
- [ ] Add gas limits to all transactions
- [ ] Add input validation throughout
- [ ] Review for security issues (reentrancy, overflow)
- [ ] Add more edge-case tests
- [ ] Optimize contract storage patterns

### 9.4 Prepare for release
- [ ] Tag release in git
- [ ] Prepare crates for publication
- [ ] Prepare npm packages for publication
- [ ] Create release notes
- [ ] Generate documentation website (if applicable)

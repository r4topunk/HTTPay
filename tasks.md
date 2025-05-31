# HTTPay MVP Implementation Tasks

This document provides a comprehensive, actionable tasklist for implementing the HTTPay MVP. Each task is broken down into specific subtasks with clear deliverables.

**NEVER** write here the complete implementation, only the high level plan to keep track of progress.

## Implementation Phases

We will implement HTTPay in 3 distinct phases:

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

### 4.7 Migration Guide and Examples
- [x] Fixed TypeScript errors in migration-example.tsx:
  - [x] Replaced connection object with individual properties (isConnected, hasSigningCapabilities, walletAddress)
  - [x] Fixed registerTool return type handling (void instead of result checking)
  - [x] Updated error handling to use try/catch pattern
  - [x] Updated migration documentation with breaking changes

### 4.8 Documentation
- [x] Created dedicated note file `/notes/sdk-v2-refactoring.md` with comprehensive documentation of the SDK v2 migration process, architecture decisions, and future steps
- [x] Updated main notes index to reference the dedicated SDK v2 refactoring notes file

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

### 5.4 Automated deployment script ✅
- [x] Create bash script for automated deployment (`scripts/deploy.sh`)
- [x] Implement error handling and transaction verification
- [x] Add colored output for better user experience
- [x] Capture and output code IDs and contract addresses for both contracts
- [x] Save deployment information to timestamped JSON file
- [x] Export environment variables for easy access
- [x] Verify deployment by testing GetEscrows query
- [x] Document script features and usage in deployment.md

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

## Chunk 10: Frontend SDK v2 Refactoring

### 10.1 HTTPay Website SDK Context Refactoring
- [x] Analyze current SDK context implementation (~500+ lines monolithic file)
- [x] Create new folder structure `/components/sdk-v2/` with proper organization:
  - [x] `types/` - Comprehensive type definitions with Zod validation
  - [x] `utils/` - Client creation and utility functions  
  - [x] `hooks/` - Specialized React hooks for different concerns
  - [x] `providers/` - Main provider component
- [x] Create comprehensive type definitions (`types/index.ts`):
  - [x] HTTPaySDKConfig, HTTPayClients interfaces
  - [x] Form schemas with Zod validation (toolRegistrationSchema, escrowCreationSchema, etc.)
  - [x] Result types (LockFundsResult, VerificationResult, etc.)
  - [x] Main context type (HTTPaySDKContextType) with all required methods
- [x] Create utility functions (`utils/client-utils.ts`):
  - [x] Client creation (createQueryClients, createSigningClients)
  - [x] Error handling (handleSDKError)
  - [x] Token formatting and validation utilities
  - [x] Address validation and formatting helpers
- [x] Create specialized React hooks:
  - [x] `use-registry.ts`: Registry operations (registerTool, updateEndpoint, updatePrice, etc.)
  - [x] `use-escrow.ts`: Escrow operations (lockFunds, verifyEscrow, postUsage, etc.)
  - [x] `use-wallet-integration.ts`: Wallet connection and CosmosKit integration
  - [x] `use-block-height.ts`: Block height tracking with automatic updates
- [x] Create main provider component (`providers/httpay-provider.tsx`):
  - [x] Combines all specialized hooks using dependency injection
  - [x] Maintains same API surface for backward compatibility
  - [x] Better error handling and loading states
  - [x] Uses httpay v2 instead of provider-sdk v1
- [x] Create index file for clean exports and migration example
- [x] Update existing demo components to use new SDK v2 context:
  - [x] Fixed imports in `sdk-context.tsx` to use the new SDK v2 from correct path
  - [x] Updated type imports in `types.ts` to use the new SDK v2 types
  - [x] Fixed ReactNode type issues by explicitly importing from React
  - [x] Created proper compatibility layer with SDK v1 API surface
- [x] Test integration and ensure all functionality works correctly
- [x] Remove old `httpay` dependency from package.json
- [x] Fix remaining TypeScript errors (20 errors resolved):
  - [x] Fixed missing properties in new SDK context type (sdk, isWalletDisconnected, isWalletError → derived or mapped)
  - [x] Fixed implicit 'any' type errors by adding explicit type annotations to form setters
  - [x] Fixed ReactNode type compatibility between React 19 (website) and React 18 (SDK)
  - [x] Updated SDK to support React 19 in peerDependencies
- [x] Successfully migrated from old `httpay` library to new `httpay` v2
- [x] Create backward compatibility layer for gradual migration:
  - [x] Re-exported the SDK v2 hook as `useSDK` for backward compatibility
  - [x] Maintained same API surface for minimal disruption
- [x] Update import statements throughout the application:
  - [x] Changed imports from "httpay" to relative paths "../../../httpay/src/react"
  - [x] Updated type imports from "httpay/src/types" to relative paths

### 10.2 Benefits of SDK v2 Refactoring
- [x] **Better React practices**: Split monolithic context into focused, single-responsibility hooks
- [x] **Improved TypeScript support**: Uses generated TypeScript clients from httpay v2
- [x] **Better maintainability**: Organized folder structure with clear separation of concerns
- [x] **Enhanced error handling**: Normalized error messages and better error reporting
- [x] **Better testing**: Dependency injection allows for easier mocking and testing
- [x] **Performance**: More granular loading states and optimized re-renders
- [x] **Future-proof**: Uses the latest SDK v2 with better contract bindings

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
- [x] Update ToolMeta struct with endpoint field
- [x] Add RegisterTool endpoint parameter and validation
- [x] Implement UpdateEndpoint message and handler
- [x] Update all query responses to include endpoint
- [x] Add endpoint validation and error handling

#### 14.2 Registry Contract Testing
- [x] Update existing tests for endpoint field compatibility
- [x] Create comprehensive endpoint-specific tests
- [x] Test endpoint validation and error scenarios
- [x] Verify endpoint data integrity across all operations

#### 14.3 TypeScript SDK Updates
- [x] Update Registry types and interfaces for endpoint support
- [x] Add endpoint parameter to registerTool method
- [x] Implement new updateEndpoint method
- [x] Update SDK tests and documentation

#### 14.4 SDK Release Management
- [x] Version bump and changelog updates
- [x] NPM publishing with endpoint feature
- [x] Verify package integrity and functionality

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

### Task 15: Implement GetEscrows Feature

#### 15.1 Escrow Contract GetEscrows Query Implementation
- [x] Add GetEscrows query to msg.rs with filter and pagination parameters
- [x] Create EscrowsResponse struct for returning multiple escrow details
- [x] Implement query_escrows function with filtering and pagination support
- [x] Update query entry point to handle the new query

#### 15.2 Escrow Contract Testing
- [x] Create comprehensive test coverage for GetEscrows functionality
- [x] Test filtering by caller and provider addresses
- [x] Test pagination with start_after and limit parameters
- [x] Test edge cases and empty results scenarios

#### 15.3 TypeScript SDK Updates
- [x] Update Escrow types for GetEscrows query
- [x] Implement getEscrows method in EscrowClient
- [x] Add helper method in HTTPaySDK
- [x] Create comprehensive SDK tests for the new functionality

#### 15.4 Frontend Component Enhancement
- [x] Update EscrowsList component with filtering capabilities
- [x] Add pagination controls with "Load More" functionality
- [x] Implement "My Escrows" filter for connected wallet
- [x] Update escrow display to show more details

#### 15.5 Documentation and Quality Assurance
- [ ] Update SDK and contract documentation
- [ ] Perform comprehensive testing across all layers
- [ ] Version management and release coordination
- [ ] Monitor post-deployment functionality
- [x] Deploy fresh Registry contract from scratch
  - [x] Build and optimize registry.wasm
  - [x] Store contract on Neutron testnet (Code ID: 11942)
  - [x] Instantiate registry contract (Address: neutron1rc9uvkt9df5df5rj89kw9mraa78glm60ruww8huj0dn2zdkuwjlslggcwu)
- [x] Deploy fresh Escrow contract with GetEscrows support
  - [x] Build and optimize escrow.wasm  
  - [x] Store contract on Neutron testnet (Code ID: 11943)
  - [x] Instantiate escrow contract with registry address (Address: neutron1fflqdqvpuka2y2afkqjc7fdznxdq3ft54fcexwdhvheyzfrvwl6qq5ju6a)
- [x] Verify GetEscrows query functionality
- [x] Update deployment.md with new contract addresses
- [x] Document deployment transaction hashes for reference

#### 15.7 Remaining Tasks
- [x] Reorganize SDK integration in Next.js project for better code structure
  - [x] Move SDK context provider from demo components to dedicated providers folder
  - [x] Update import paths across the application
  - [x] Improve folder structure and component organization
  - [x] Add proper documentation to SDK integration components
- [ ] Update frontend configuration with new contract addresses
- [ ] Update SDK configuration with new contract addresses
- [ ] Perform end-to-end testing with new contracts
- [ ] Update SDK and contract documentation
- [ ] Perform comprehensive testing across all layers
- [ ] Version management and release coordination
- [ ] Monitor post-deployment functionality
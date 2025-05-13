# Blueprint for Pay-Per-Tool MVP

This document defines a step-by-step plan to build the Pay-Per-Tool MVP. It is organized into three distinct implementation phases with clear deliverables for each phase.

## Implementation Phases

### Phase 1: Smart Contracts & Testing
Focus on implementing and thoroughly testing the core CosmWasm contracts that power the Pay-Per-Tool system.

### Phase 2: Provider SDK & Tools
Develop the TypeScript SDK and CLI tools for providers once the contracts are stable and tested.

### Phase 3: Frontend Development
Build the user-facing application only after the contract and SDK foundation is solid.

## Project Directory Structure

```
toolpay/
├── contracts/               # CosmWasm contracts (Phase 1)
│   ├── registry/           # Registry contract
│   └── escrow/             # Escrow contract
├── packages/                # TypeScript packages (Phase 2)
│   └── provider-sdk/       # SDK for tool providers
├── frontend/               # User interface (Phase 3)
│   └── README.md           # Information about future frontend development
├── scripts/                # Helper scripts for development/deployment
├── Cargo.toml              # Rust workspace configuration for Phase 1
└── other config files...   # .gitignore, rust-toolchain.toml, etc.
```

Note: package.json will be created in Phase 2 when TypeScript is first needed.

---

## Phase 1: Smart Contracts & Testing

### Phase 1 Deliverables
1. **Project Setup**
2. **Registry Contract Implementation**
3. **Escrow Contract Implementation**
4. **Contract Unit Tests**
5. **Contract Integration Tests**
6. **CI & Localnet Configuration**

## Phase 2: Provider SDK

### Phase 2 Deliverables
1. **TypeScript Workspace Setup**
2. **Provider SDK (TypeScript)**
3. **SDK Documentation & Examples**
4. **AI‑Wallet Client Demo**
5. **E2E Testing with SDK**

## Phase 3: Frontend Development

### Phase 3 Deliverables
1. **Frontend Setup with shadcn**
2. **User Wallet Integration**
3. **Provider Dashboard & Tool Management UI**
4. **Analytics & Monitoring**
5. **Documentation & User Guides**

---

## Detailed Implementation Steps

### Phase 1: Smart Contracts & Testing

#### 1.1 Project Setup
- Create basic directory structure (contracts, packages, frontend, scripts)
- Initialize CosmWasm template with `cargo generate`
- Create Rust workspace and set up `cw-storage-plus` dependency
- Add `rust-toolchain.toml` with Rust 1.78 specification
- Set up `.gitignore` for Rust and Node artifacts
- Make first commit with scaffold

#### 1.2 Registry Contract Implementation
- Define `InstantiateMsg`, `ExecuteMsg`, `QueryMsg` enums in Rust
- Implement `ToolMeta` struct and `TOOLS` map storage
- Enforce `tool_id` ≤ 16 characters and provider authorization
- Implement `RegisterTool`, `UpdatePrice`, `PauseTool`, `ResumeTool`
- Write basic Rust unit tests for each ExecuteMsg

#### 1.3 Escrow Contract Implementation
- Define `Escrow` and `Config` structs and storage items
- Implement `LockFunds` handler with TTL ≤ 50 blocks validation
- Store `Escrow` entry and emit `wasm-toolpay.locked` event
- Implement `Release` handler with proper verification
- Implement `RefundExpired` handler for timeout scenarios
- Implement query and sudo functionality

#### 1.4 Contract Testing
- Configure `cw-multi-test` environment
- Write unit tests for both registry and escrow contracts
- Write integration tests for contract interactions
- Write edge-case tests: TTL violation, over-limit fee, unauthorized callers
- Ensure all tests pass under `cargo wasm-test`

#### 1.5 CI & Localnet Configuration
- Create GitHub Actions workflow for Rust tests
- Add cargo wasm optimizer step
- Define Docker Compose files for Neutron localnet
- Create convenience scripts for running localnet
- Verify contracts can be deployed and function correctly on localnet

### Phase 2: Provider SDK

#### 2.1 TypeScript Setup
- Initialize npm workspace in the project root
- Install TypeScript and testing frameworks
- Add `tsconfig.json` with appropriate settings
- Install CosmJS dependencies and Telescope
- Create package.json for the project

#### 2.2 Provider SDK (TypeScript)
- Extract contract schemas using `cargo schema`
- Generate TypeScript bindings via `telescope`
- Create `packages/provider-sdk` directory structure
- Implement `EscrowVerifier` class with verification logic
- Implement `UsageReporter` class for reporting usage
- Write SDK unit tests

#### 2.3 SDK Integration Testing
- Build AI-Wallet client demo script
- Implement E2E test scenarios
- Test complete flows on localnet
- Document SDK usage examples and best practices

### Phase 3: Frontend Development

#### 3.1 Frontend Setup with shadcn
- Set up Next.js project in the frontend directory using shadcn init command
- Configure build system and development environment
- Set up shadcn UI component system
- Implement wallet connection capabilities
- Integrate with Provider SDK

#### 3.2 User Interface
- Implement user dashboard for viewing tool usage
- Create tool registration and management interface for providers
- Implement escrow creation flow for users
- Create monitoring dashboards for providers

#### 3.3 Documentation & Finalization
- Write comprehensive README with architecture diagram
- Create user guides for different personas
- Finalize all documentation
- Tag release and prepare for production deployment

---

> **Development Approach**: Complete each phase sequentially before moving to the next. At the end of each phase, perform a thorough review to ensure all deliverables meet quality standards before progressing.

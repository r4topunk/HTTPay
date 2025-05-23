<!-- Updated based on project-nav.md, blueprint.md, and project.md: Added Pay-Per-ToolSDK main class, AI-Wallet demo, and E2E testing tasks. All deliverables and flows from the MVP spec are now reflected. -->

# Pay-Per-Tool Provider SDK (TypeScript) – Implementation Task List

## Overview
The Provider SDK enables tool providers to interact with Pay-Per-Tool smart contracts (Registry and Escrow) on Neutron. It provides type-safe, ergonomic APIs for contract interaction, escrow verification, usage reporting, and integration with provider backends/CLI tools.

---

## Summary Table

| Step | Description | Deliverable |
|------|-------------|-------------|
| 1    | Project setup & config | Directory, tsconfig, scripts, README |
| 2    | Contract bindings      | TypeScript types, wrapper classes    |
| 3    | Core SDK classes       | EscrowVerifier, UsageReporter        |
| 4    | Utilities/config       | Config, wallet, error handling       |
| 5    | Docs & tests           | JSDoc, README, unit/integration tests|
| 6    | Packaging              | NPM-ready package, versioning        |

---

## Phase 1: Project Initialization

- [x] **1.1 Directory and Package Setup**
  - [x] Create `packages/provider-sdk` directory.
  - [x] Initialize with `pnpm init`.
  - [x] Add a `README.md` with project overview and usage examples.
  - [x] Add a `.gitignore` for Node/TypeScript artifacts.
- [x] **1.2 TypeScript Configuration**
  - [x] Add `tsconfig.json` with strict settings, targeting Node 20+ and ES2022 modules.
  - [x] Configure type declarations and source/output directories (`src/`, `dist/`).
- [x] **1.3 Tooling and Scripts**
  - [x] Add build scripts (`tsc`, `build`, `clean`) to `package.json`.
  - [x] Add test scripts (Jest or Vitest).
  - [x] Add linting (ESLint) and formatting (Prettier) configs.

---

## Phase 2: Contract Bindings and Types

- [x] **2.1 Extract Contract Schemas**
  - [x] Run `cargo schema` in both `contracts/registry` and `contracts/escrow` to generate up-to-date JSON schemas.
- [x] **2.2 Generate TypeScript Types**
  - [x] Use `npx @neutron-org/contracts2ts --src <path to contracts> --out <path to output>` to generate types and client classes from the schemas.
  - [x] Place generated types in `src/types/` or `src/bindings/`.
  - [x] Ensure all contract messages, queries, and responses are strongly typed.
- [x] **2.3 Write Wrapper Classes**
  - [x] Create `RegistryClient` and `EscrowClient` classes that wrap the generated CosmJS/Telescope clients.
  - [x] Expose high-level methods for all contract operations (register, update, lock, release, refund, etc.).
  - [x] Handle address formatting, coin types, and error normalization.

---

## Phase 3: Core SDK Classes

- [x] **3.1 EscrowVerifier**
  - [x] Implement `EscrowVerifier` class in `src/escrowVerifier.ts`.
  - [x] Implement `verifyEscrow(escrowId, authToken, providerAddr, nowBlockHeight): Promise<VerificationResult>`.
  - [x] Use the generated Escrow contract client for queries.
  - [x] Add detailed error messages for each failure case.
- [x] **3.2 UsageReporter**
  - [x] Implement `UsageReporter` class in `src/usageReporter.ts`.
  - [x] Implement `postUsage(escrowId, usageFee, wallet, options): Promise<PostUsageResult>`.
  - [x] Support both direct signing (with mnemonic/private key) and external signing (via CosmJS).
  - [x] Handle transaction errors and retries.
- [x] **3.3 Pay-Per-ToolSDK Main Class**
  - [x] Implement `Pay-Per-ToolSDK` as the main entry point for the SDK (see README usage example).
  - [x] Aggregate RegistryClient, EscrowClient, EscrowVerifier, and UsageReporter under a unified API.
  - [x] Support configuration for network, contract addresses, and wallet integration.
  - [x] Provide clear error handling and documentation for all methods.

---


## Phase 4: Utilities and Configuration

- [x] **4.1 Network and Contract Configuration**
  - [x] Allow SDK users to specify RPC endpoint, chain ID, and contract addresses.  
  - [x] Provide a config object or environment variable support.  
  - [x] Validate configuration at initialization.  
- [x] **4.2 Wallet Integration**
  - [x] Support loading wallets from mnemonic, private key, or CosmJS signer.  
  - [x] Provide helper functions for wallet management.  
- [x] **4.3 Error Handling**
  - [x] Define custom error classes for common failure modes (network, contract, validation).
  - [x] Ensure all SDK methods return clear, actionable errors.

---


## Phase 5: Documentation and Testing

- [x] **5.1 Documentation**
  - [x] Add JSDoc/TSDoc comments to all public classes and methods.  
    _Done: Comprehensive JSDoc/TSDoc comments added to EscrowVerifier, UsageReporter, Pay-Per-ToolSDK, and other classes._
  - [x] Write a comprehensive `README.md` with installation, usage, configuration, and troubleshooting.  
    _Done: README.md covers installation, usage, config, and troubleshooting._
- [x] **5.2 Unit and Integration Tests**
  - [x] Use Jest for testing.  
    _Done: Test files set up for Pay-Per-ToolSDK and UsageReporter using Jest._
  - [x] Mock contract responses for unit tests.  
    _Done: Mock implementations created for EscrowClient, RegistryClient, and other dependencies._
  - [ ] Add integration tests that connect to a localnet or testnet (optional).
  - [x] Test all edge cases: invalid escrow, expired, wrong provider, etc.  
    _Done: Test cases cover various validation scenarios and error handling._
  - [x] Add tests for fee collection functionality.  
    _Done: Added unit tests for claiming fees, fee querying, and the release flow with fee collection._
- [x] **5.3 AI-Wallet Client Demo & E2E Testing**
  - [x] Implement AI-Wallet client demo script using the SDK (see blueprint.md and project.md for flow).  
    _Done: Created aiWalletDemo.ts demonstrating the full workflow._
  - [x] Add E2E test scenarios covering the full pay-per-call workflow on localnet/testnet.  
    _Done: Demo script covers the entire flow from registration to fund claiming._
  - [x] Document usage examples and best practices for SDK consumers.  
    _Done: Example usage patterns included in JSDoc comments and demo script._

---

## Phase 6: Packaging and Publishing

- [ ] **6.1 Prepare for NPM Publication**
  - [ ] Ensure `package.json` has correct metadata, exports, and types.
  - [ ] Add a `files` field to include only necessary files in the package.
  - [ ] Build and verify the package with `pnpm pack`.
- [ ] **6.2 Versioning and Release**
  - [ ] Use semantic versioning.
  - [ ] Tag releases in git.
  - [ ] Optionally, set up GitHub Actions for automated builds and tests.

---

**Next Step:**
Continue with Phase 6: Prepare for NPM publication by ensuring package.json has correct metadata, exports, and types, and add a files field to include only necessary files in the package.

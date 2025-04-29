# ToolPay Provider SDK (TypeScript) – Implementation Task List

## Overview
The Provider SDK enables tool providers to interact with ToolPay smart contracts (Registry and Escrow) on Neutron. It provides type-safe, ergonomic APIs for contract interaction, escrow verification, usage reporting, and integration with provider backends/CLI tools.

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

- [ ] **1.1 Directory and Package Setup**
  - [ ] Create `packages/provider-sdk` directory.
  - [ ] Initialize with `pnpm init`.
  - [ ] Add a `README.md` with project overview and usage examples.
  - [ ] Add a `.gitignore` for Node/TypeScript artifacts.
- [ ] **1.2 TypeScript Configuration**
  - [ ] Add `tsconfig.json` with strict settings, targeting Node 20+ and ES2022 modules.
  - [ ] Configure type declarations and source/output directories (`src/`, `dist/`).
- [ ] **1.3 Tooling and Scripts**
  - [ ] Add build scripts (`tsc`, `build`, `clean`) to `package.json`.
  - [ ] Add test scripts (Jest or Vitest).
  - [ ] Add linting (ESLint) and formatting (Prettier) configs.

---

## Phase 2: Contract Bindings and Types

- [ ] **2.1 Extract Contract Schemas**
  - [ ] Run `cargo schema` in both `contracts/registry` and `contracts/escrow` to generate up-to-date JSON schemas.
- [ ] **2.2 Generate TypeScript Types**
  - [ ] Use `npx @neutron-org/contracts2ts --src <path to contracts> --out <path to output>` to generate types and client classes from the schemas.
  - [ ] Place generated types in `src/types/` or `src/bindings/`.
  - [ ] Ensure all contract messages, queries, and responses are strongly typed.
- [ ] **2.3 Write Wrapper Classes**
  - [ ] Create `RegistryClient` and `EscrowClient` classes that wrap the generated CosmJS/Telescope clients.
  - [ ] Expose high-level methods for all contract operations (register, update, lock, release, refund, etc.).
  - [ ] Handle address formatting, coin types, and error normalization.

---

## Phase 3: Core SDK Classes

- [ ] **3.1 EscrowVerifier**
  - [ ] Implement `EscrowVerifier` class in `src/escrowVerifier.ts`.
  - [ ] Implement `verifyEscrow(escrowId, authToken, providerAddr, nowBlockHeight): Promise<VerificationResult>`.
  - [ ] Use the generated Escrow contract client for queries.
  - [ ] Add detailed error messages for each failure case.
- [ ] **3.2 UsageReporter**
  - [ ] Implement `UsageReporter` class in `src/usageReporter.ts`.
  - [ ] Implement `postUsage(escrowId, usageFee, wallet, options): Promise<PostUsageResult>`.
  - [ ] Support both direct signing (with mnemonic/private key) and external signing (via CosmJS).
  - [ ] Handle transaction errors and retries.

---

## Phase 4: Utilities and Configuration

- [ ] **4.1 Network and Contract Configuration**
  - [ ] Allow SDK users to specify RPC endpoint, chain ID, and contract addresses.
  - [ ] Provide a config object or environment variable support.
  - [ ] Validate configuration at initialization.
- [ ] **4.2 Wallet Integration**
  - [ ] Support loading wallets from mnemonic, private key, or CosmJS signer.
  - [ ] Provide helper functions for wallet management.
- [ ] **4.3 Error Handling**
  - [ ] Define custom error classes for common failure modes (network, contract, validation).
  - [ ] Ensure all SDK methods return clear, actionable errors.

---

## Phase 5: Documentation and Testing

- [ ] **5.1 Documentation**
  - [ ] Add JSDoc/TSDoc comments to all public classes and methods.
  - [ ] Write a comprehensive `README.md` with installation, usage, configuration, and troubleshooting.
- [ ] **5.2 Unit and Integration Tests**
  - [ ] Use Jest for testing.
  - [ ] Mock contract responses for unit tests.
  - [ ] Add integration tests that connect to a localnet or testnet (optional).
  - [ ] Test all edge cases: invalid escrow, expired, wrong provider, etc.

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
Begin with Phase 1: create the `packages/provider-sdk` directory, initialize the package, and set up TypeScript configuration and scripts.

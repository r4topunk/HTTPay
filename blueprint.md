# Blueprint for ToolPay MVP

This document defines a step-by-step plan to build the ToolPay MVP. It is organized into two rounds:

1. **Iterative Chunks**: High-level deliverables in logical order.
2. **Detailed Steps**: Each chunk broken down into actionable subtasks.

---

## 1. Iterative Chunks

1. **Project Setup**
2. **Registry Contract Implementation**
3. **Escrow Contract Implementation**
4. **Contract Unit Tests**
5. **CI & Localnet Configuration**
6. **Provider SDK (TypeScript)**
7. **CLI Tool for Provider**
8. **AI‑Wallet Client Demo & E2E**
9. **Documentation & Hardening**

---

## 2. Detailed Steps

### Chunk 1: Project Setup
- 1.1 Initialize CosmWasm template with `cargo generate`.
- 1.2 Create Rust workspace and set up `cw-storage-plus` dependency.
- 1.3 Add TypeScript workspace, install `telescope`, `cosmjs`, and testing frameworks.
- 1.4 Commit initial scaffolding and verify `cargo build`.

### Chunk 2: Registry Contract Implementation
- 2.1 Define `InstantiateMsg`, `ExecuteMsg`, `QueryMsg` enums in Rust.
- 2.2 Implement `ToolMeta` struct and `TOOLS` map storage.
- 2.3 Enforce `tool_id` ≤ 16 characters and provider authorization.
- 2.4 Implement `RegisterTool`, `UpdatePrice`, `PauseTool`, `ResumeTool`.
- 2.5 Write basic Rust unit tests for each ExecuteMsg.

### Chunk 3: Escrow Contract Implementation
- 3.1 Define `Escrow` and `Config` structs and storage items.
- 3.2 Implement `LockFunds` handler:
  - Validate TTL ≤ 50 blocks.
  - Store `Escrow` entry and emit `wasm-toolpay.locked` event.
- 3.3 Implement `Release` handler:
  - Verify caller is original provider.
  - Enforce `usage_fee` ≤ `max_fee`.
  - Transfer funds and emit `wasm-toolpay.released`.
- 3.4 Implement `RefundExpired` handler:
  - Verify caller is original caller and TTL expired.
  - Refund full amount and emit `wasm-toolpay.refunded`.

### Chunk 4: Contract Unit Tests
- 4.1 Configure `cw-multi-test` environment.
- 4.2 Write tests for happy paths in both contracts.
- 4.3 Write edge-case tests: TTL violation, over-limit fee, unauthorized callers.
- 4.4 Confirm all tests pass under `cargo wasm-test`.

### Chunk 5: CI & Localnet Configuration
- 5.1 Create GitHub Actions workflow for Rust tests and Wasmd localnet.
- 5.2 Define Docker Compose files for Neutron localnet.
- 5.3 Add TypeScript test runner (Jest/Mocha) and CI integration.

### Chunk 6: Provider SDK (TypeScript)
- 6.1 Scaffold an NPM package `@toolpay/provider-sdk`.
- 6.2 Generate TypeScript bindings via `telescope`.
- 6.3 Implement `verifyEscrow(escrowId, authToken)` gRPC call logic.
- 6.4 Implement `postUsage(escrowId, fee)` method using `cosmjs`.
- 6.5 Publish initial version to local registry.

### Chunk 7: CLI Tool for Provider
- 7.1 Scaffold CLI with `oclif` or `commander`.
- 7.2 Add commands: `register-tool`, `update-price`, `release-escrow`.
- 7.3 Integrate SDK methods and parse args.
- 7.4 Add unit tests for CLI flows.

### Chunk 8: AI‑Wallet Client Demo & E2E
- 8.1 Build simple demo script using `fetch` and SDK.
- 8.2 Write E2E test: lock → verify (mock provider) → release → refund.
- 8.3 Run tests against localnet in CI.

### Chunk 9: Documentation & Hardening
- 9.1 Write README with architecture diagram and usage examples.
- 9.2 Finalize `project.md` spec and add links.
- 9.3 Add gas limits, edge-case tests, and secure defaults.
- 9.4 Tag release and publish crates/NPM packages.

---

> **Next**: Execute each chunk in order, commit on success, and iterate towards MVP delivery.

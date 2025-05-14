
---
status: draft
date: 2025-05-14
updated: 2025-05-14
---

# PRD/TDD: Multi-Denom (IBC Token) Support for Escrow Contract

## Product Requirements Document (PRD)

### Title
Enable Escrow Contract to Accept Any IBC Token (Multi-Denom Support)

### Background
Currently, the escrow contract only supports the native `untrn` token for payments. To support a broader range of use cases and enable payments with any IBC token, the contract must be updated to:
- Accept any valid IBC token (or other Cosmos tokens) as payment.
- Ensure that the correct token/denom is used for each tool, as specified in the registry.
- Update all related flows, error handling, and events to be denom-agnostic.
- Update the TypeScript SDK and tests to support multi-denom flows.

### Goals
- Allow users to lock, release, and refund escrows using any valid token.
- Prevent accidental payment in the wrong token (must match the tool's required denom).
- Maintain backwards compatibility for `untrn`.
- Update all contract events and responses to include denom information.
- Update SDK and tests to support multi-denom.

### Non-Goals
- No support for non-Cosmos tokens (e.g., ERC20).
- No automatic conversion between tokens.

### Acceptance Criteria
- User can lock funds in any IBC token, provided it matches the tool's required denom.
- If the wrong denom is sent, the contract returns a clear error.
- All contract events and responses include the denom.
- TypeScript SDK can specify denom for all relevant calls and parses denom in responses.
- All tests pass for both `untrn` and at least one IBC denom.

---

## Technical Design Document (TDD)

### 1. Contract Changes
- **Escrow Struct**: Add a `denom: String` field to track the token used for each escrow.
- **LockFunds**:
  - Query the tool's required denom from the registry.
  - Validate that the attached funds include the correct denom and sufficient amount.
  - Store the denom in the escrow record.
- **Release/Refund**:
  - Use the stored denom for all BankMsg transfers.
  - Events and responses must include denom.
- **Events**: Add `denom` attribute to all relevant events.
- **Error Handling**: Add/extend errors for wrong denom.
- **Migration**: If needed, provide a migration path for existing escrows (optional if not in prod).

### 2. Registry Contract
- Ensure the registry exposes the required denom for each tool (if not already).
- Update registry interface/types if needed.

### 3. TypeScript SDK
- Update contract bindings/types for new/changed messages and responses.
- Update SDK methods to accept denom as a parameter where relevant.
- Update SDK to parse denom in responses/events.
- Add/extend tests for multi-denom flows.

### 4. Tests
- Update Rust contract tests to cover multiple denoms (e.g., `untrn`, `ibc/XXX`).
- Update TypeScript SDK tests for multi-denom.

### 5. Documentation
- Update contract and SDK docs to describe multi-denom support and usage.

---

## Implementation Steps
1. Update escrow contract:
   - Add `denom` to Escrow struct and all relevant logic.
   - Update LockFunds, Release, RefundExpired, and events.
   - Update error handling for denom mismatches.
2. Update registry contract/interface if needed.
3. Update TypeScript SDK and types.
4. Update and add tests (Rust and TypeScript).
5. Update documentation.
6. Update `tasks.md` and `notes/index.md` to reflect progress.

---

## Open Questions
- Should the contract support a whitelist of allowed denoms, or only those registered for tools?
- Is migration needed for existing escrows (if any)?

---

## References
- See `project.md`, `blueprint.md`, and `cosmwasm-docs/ibc.mdx` for IBC and denom handling.
- See `contracts/escrow/src/contract.rs` for current implementation.
- See `packages/provider-sdk` for TypeScript SDK.

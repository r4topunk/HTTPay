# ToolPay

**Pay-per-call escrow for AI tools on Neutron (CosmWasm 1.5 + TypeScript SDK)**

---

## Overview

ToolPay is a minimal, secure, and extensible pay-per-call escrow system for AI tool providers and consumers, built on the Neutron blockchain using CosmWasm smart contracts. It enables users to lock funds for a tool call, providers to verify and claim fees, and ensures refunds if a provider does not deliver within a set time window.

---

## Architecture

```
┌─────────────────┐   register_tool   ┌─────────────────────┐
│  Provider CLI   │ ────────────────► │   Registry Contract │
└─────────────────┘                   └─────────────────────┘
        ▲                                         │
        │    lock_funds(tool_id, max_fee, token)  │
        │                                         ▼
┌─────────────────┐                        ┌──────────────────┐
│  AI Wallet SDK  │ ────────────────►      │ Escrow Contract  │
└─────────────────┘          escrow_id ◄───┤  (Custody + log) │
        │  auth_token                      └──────────────────┘
        │  + payload                                ▲
        ▼                                           │ verify_escrow(…)
┌─────────────────┐  HTTP POST (auth_token) ┌──────────────────┐
│  Provider API   │ ───────────────────────►│  Verifier lib    │
└─────────────────┘        usage_receipt    └──────────────────┘
```

---

## Features

- **Registry Contract**: Providers register tools, set prices, pause/resume tools, and update pricing.
- **Escrow Contract**: Users lock funds for tool usage, providers claim fees, and refunds are automatic on timeout.
- **Provider SDK (TypeScript)**: Off-chain verification and usage reporting for providers.
- **Comprehensive Testing**: All contract flows are covered by unit and integration tests.
- **Security**: Strict authorization, expiration limits, and contract freezing for emergencies.

---

## Project Structure

```
toolpay/
├── contracts/
│   ├── registry/   # Registry contract (CosmWasm)
│   └── escrow/     # Escrow contract (CosmWasm)
├── packages/
│   └── provider-sdk/  # TypeScript SDK (planned)
├── frontend/       # User interface (planned)
├── scripts/        # Helper scripts
├── Cargo.toml      # Rust workspace config
├── blueprint.md    # Step-by-step implementation plan
├── project.md      # Full specification
├── tasks.md        # Actionable task list
├── notes/index.md        # Implementation notes and history
└── ...
```

---

## Quickstart

### Prerequisites

- Rust 1.78+ with wasm32 target
- Node.js 20+ (for SDK/frontend, planned)
- [cargo-generate](https://github.com/ashleygwilliams/cargo-generate)
- [Neutron localnet](https://neutron.org/) (for integration testing)

### Build & Test Contracts

```sh
# Build all contracts
cargo build --release

# Run all unit and integration tests (wasm)
cargo wasm-test
```

### Directory Setup

- `contracts/registry`: Registry contract for tool metadata and pricing.
- `contracts/escrow`: Escrow contract for fund locking, release, and refunds.

---

## Smart Contract Specs

### Registry Contract

- **RegisterTool**: Register a tool with a unique ID (≤16 chars) and price.
- **UpdatePrice**: Update the price for a registered tool.
- **PauseTool/ResumeTool**: Temporarily disable or enable a tool.
- **GetTool**: Query tool metadata.

**Storage**: `TOOLS: Map<String, ToolMeta>`

### Escrow Contract

- **LockFunds**: User locks funds for a tool call, specifying max fee, auth token, and expiration (≤50 blocks).
- **Release**: Provider claims usage fee (≤max_fee), remainder refunded to user.
- **RefundExpired**: User refunds all funds if provider does not claim within TTL.
- **Freeze**: Admin can freeze contract for emergencies.

**Storage**: `ESCROWS: Map<u64, Escrow>`, `NEXT_ID: Item<u64>`, `CONFIG: Item<Config>`

---

## Development Phases

1. **Smart Contracts & Testing**: (Current) Registry and Escrow contracts, full test coverage.
2. **Provider SDK**: TypeScript SDK for off-chain verification and usage reporting.
3. **Frontend**: User-facing app with shadcn UI (planned).

See [tasks.md](./tasks.md) for detailed progress and next steps.

---

## Example Usage

### Locking Funds (User)

```rust
// Lock funds for a tool call
LockFunds {
  tool_id: "sentiment-api",
  max_fee: Uint128::from(1000u128),
  auth_token: Binary::from(b"randomtoken"),
  expires: 123456 + 30, // current block + TTL
}
```

### Releasing Funds (Provider)

```rust
// Provider claims usage fee
Release {
  escrow_id: 1,
  usage_fee: Uint128::from(800u128),
}
```

### Refund on Timeout (User)

```rust
// User refunds if provider does not claim in time
RefundExpired {
  escrow_id: 1,
}
```

---

## Testing

- All contract logic is covered by unit and integration tests using `cw-multi-test`.
- Edge cases: TTL violations, over-limit fees, unauthorized access, contract freezing, and refunds.
- See `contracts/escrow/src/tests/` and `contracts/registry/src/tests/` for test modules.

---

## Tech Stack

| Layer      | Choice                                 |
|------------|----------------------------------------|
| Chain      | Neutron (Cosmos SDK, CosmWasm 1.5)     |
| Contracts  | Rust 1.78, cw-storage-plus 1.2         |
| SDK/CLI    | Node 20, TypeScript 5, cosmjs, telescope (planned) |
| Frontend   | React, shadcn UI, CosmJS (planned)     |
| CI         | GitHub Actions, localnet, npm test     |

---

## Documentation & References

- [blueprint.md](./blueprint.md): Step-by-step implementation plan
- [project.md](./project.md): Full contract and system specification
- [tasks.md](./tasks.md): Actionable task list and progress tracker
- [notes/index.md](./notes/index.md): Implementation notes and design decisions
- [cosmwasm-docs/](./cosmwasm-docs/): CosmWasm and cw-multi-test documentation

---

## Future Directions

- Multi-asset support (IBC)
- DAO-based registry governance
- On-chain metering and dynamic pricing
- Full-featured provider dashboard and analytics

---

## Troubleshooting

- Ensure all dependencies are installed and Rust toolchain is up to date.
- For localnet testing, see scripts and Docker Compose files (to be added in Phase 5).
- For contract errors, consult `notes/index.md` for common issues and solutions.

---

## License

MIT

---

## Deployed Contracts

ToolPay contracts are deployed on Neutron testnet (pion-1) with the following addresses:

| Contract  | Address                                                             |
|-----------|---------------------------------------------------------------------|
| Registry  | neutron1mxaqqnh237vu0phcfh6ut8gx3att2dza49r5x9h52fey9gspy5nq54cjhv |
| Escrow    | neutron1nrq2wahvklx3t362cr95dlv4xru08mnpucq0mn4nje266qqhe9hsjnhv94 |

### Interacting with Deployed Contracts

```fish
# Query a registered tool
neutrond query wasm contract-state smart neutron1mxaqqnh237vu0phcfh6ut8gx3att2dza49r5x9h52fey9gspy5nq54cjhv '{"get_tool":{"tool_id":"example-tool"}}'

# Query an escrow by ID
neutrond query wasm contract-state smart neutron1nrq2wahvklx3t362cr95dlv4xru08mnpucq0mn4nje266qqhe9hsjnhv94 '{"get_escrow":{"escrow_id":1}}'
```

---

For more details, see the reference files in this repository. Contributions and feedback are welcome!

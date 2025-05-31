# HTTPay

**Decentralized API marketplace for AI agents with autonomous payments via blockchain**

---

## Overview

HTTPay is a decentralized marketplace where developers publish their APIs and AI agents consume them autonomously. Built on the Neutron blockchain using CosmWasm smart contracts, HTTPay enables a new economy where APIs are discovered, requested, and paid for automatically without human intervention.

The protocol works in two stages: developers register their APIs in the Registry Contract with prices per call, and agents discover these APIs, lock funds in the Escrow Contract, and are automatically charged after receiving the API response. This creates a seamless marketplace for the autonomous agent economy.

### The Problem

Developers create powerful APIs but monetizing them is complex. Current methods require manual integrations with API keys, human-configured payments with credit cards, and complex billing management. Autonomous agents need humans to discover and sign up for APIs, and there's no marketplace designed specifically for autonomous consumers.

### The Solution

HTTPay unlocks a new revenue source through microtransactions and complete automation. APIs that previously had just a few users can now be monetized by thousands of autonomous agents running 24/7, without manual billing management or complex integrations. For agents, it provides instant access to specialized services without relying on humans for configuration.

The global API marketplace was valued at $18 billion in 2024 and is projected to grow at 18.9% CAGR through 2030, with HTTPay positioned as the first marketplace designed specifically for autonomous consumers in the Cosmos ecosystem.

---

## Features

- **Registry Contract**: Developers register APIs, set prices, pause/resume services, and update pricing.
- **Escrow Contract**: Agents lock funds for API usage, developers claim fees, and refunds are automatic on timeout.
- **Multi-Denomination Support**: Support for any valid IBC token as payment, enabling cross-chain transactions.
- **HTTPay SDK (TypeScript)**: Production-ready SDK for off-chain verification, usage reporting, wallet integration, and error handling. Published as `httpay` npm package with comprehensive documentation and React components.
- **Frontend Application**: Next.js-based web application with shadcn UI components for user interaction, API discovery, and escrow management.
- **AI Agent Integration**: Eliza-based AI agent project for automated API discovery, selection, and payment processing.
- **Pagination & Filtering**: Get multiple escrows with filtering by caller/provider and pagination support.
- **Fee Collection**: Protocol fee collection mechanism with multi-denomination support.
- **Comprehensive Testing**: All contract flows are covered by unit and integration tests.
- **Security**: Strict authorization, expiration limits, and contract freezing for emergencies.

---

## Project Structure

```
toolpay/
├── contracts/
│   ├── registry/   # Registry contract for API metadata and pricing
│   └── escrow/     # Escrow contract for fund locking, release, and refunds
├── packages/
│   ├── httpay-sdk/         # HTTPay TypeScript SDK (production-ready)
│   ├── httpay-website/     # Next.js frontend application with React components
│   └── httpay-eliza-project/ # Eliza AI agent integration project
├── scripts/        # Helper scripts
├── notes/          # Implementation notes and development history
├── Cargo.toml      # Rust workspace config
├── blueprint.md    # Step-by-step implementation plan
├── project.md      # Full specification
├── tasks.md        # Actionable task list
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

```fish
# Build all contracts
cargo build --release

# Run all unit and integration tests (wasm)
cargo wasm-test
```

### HTTPay SDK Setup

```fish
# Install the HTTPay SDK
npm install httpay

# Or with pnpm
pnpm add httpay
```

### Run the Website Locally

```fish
cd packages/httpay-website
pnpm install
pnpm dev
```

### Run the Eliza AI Agent

```fish
cd packages/httpay-eliza-project
pnpm install
pnpm build && pnpm start
```

### Directory Setup

- `contracts/registry`: Registry contract for tool metadata and pricing.
- `contracts/escrow`: Escrow contract for fund locking, release, and refunds.

---

## Smart Contract Specs

### Registry Contract

- **RegisterAPI**: Register an API with a unique ID (≤16 chars), price, and optional token denomination.
- **UpdatePrice**: Update the price for a registered API.
- **UpdateDenom**: Update the token denomination accepted by an API.
- **PauseAPI/ResumeAPI**: Temporarily disable or enable an API.
- **GetAPI**: Query API metadata.

**Storage**: `TOOLS: Map<String, ToolMeta>`

### Escrow Contract

- **LockFunds**: Agent locks funds for an API call, specifying max fee, auth token, and expiration (≤50 blocks).
- **Release**: Developer claims usage fee (≤max_fee), remainder refunded to agent.
- **RefundExpired**: Agent refunds all funds if developer does not claim within TTL.
- **Freeze**: Admin can freeze contract for emergencies.
- **GetEscrows**: Query multiple escrows with filtering and pagination support.

**Storage**: `ESCROWS: Map<u64, Escrow>`, `NEXT_ID: Item<u64>`, `CONFIG: Item<Config>`

---

## Packages

### HTTPay SDK (`packages/httpay-sdk/`)
Production-ready TypeScript SDK published as `httpay` npm package. Features:
- Complete contract interaction layer with type safety
- React hooks and components for frontend integration  
- Multiple abstraction levels (Full Control, Simplified Methods, Zero-Config)
- Comprehensive error handling and validation
- Demo scripts and extensive documentation

### HTTPay Website (`packages/httpay-website/`)
Next.js-based web application featuring:
- Interactive tool discovery and registration interface
- Escrow management with filtering and pagination
- Wallet integration using CosmosKit
- Modern UI built with shadcn components
- Debug page for developer testing

### Eliza AI Agent (`packages/httpay-eliza-project/`)
AI agent integration using Eliza OS:
- Automated tool discovery and selection
- Natural language tool interaction
- Payment processing and escrow management
- Configurable agent behavior and responses

---

## Development Phases

1. **Smart Contracts & Testing**: Registry and Escrow contracts, full test coverage. **(Complete)**
2. **HTTPay SDK**: TypeScript SDK for off-chain verification, usage reporting, wallet integration, and error handling. **(Complete)**
3. **Multi-Denomination Support**: Support for any IBC token as payment. **(Complete)**
4. **Escrow Querying Enhancements**: Pagination and filtering for escrow queries. **(Complete)**
5. **Frontend Application**: Next.js web application with shadcn UI and React components. **(Complete)**
6. **AI Agent Integration**: Eliza-based AI agent for automated tool interaction. **(Complete)**

See [tasks.md](./tasks.md) for detailed progress and next steps.

---


## Example SDK Usage

```typescript
import { PayPerToolSDK } from 'httpay';

const sdk = new PayPerToolSDK({
  rpcEndpoint: 'https://rpc-pion-1.neutron.org',
  chainId: 'pion-1',
  registryAddress: 'neutron1jptpkaveckrs7mu3f4kgm2rgte9uhzu7eldfuay0w8sfhlqhc6gsklceq9',
  escrowAddress: 'neutron1au2gz2sdaeqd933ygcc3suud6snkw728dc0mycx5ft0l0ys48ykqsagyjd',
});

// Verify an escrow with authentication token
const verification = await sdk.escrowVerifier.verifyEscrow({
  escrowId: '123',
  authToken: 'base64token',
  providerAddr: 'neutron1...',
});

// Lock funds with IBC tokens
await sdk.escrow.lockFunds(
  clientAddress,
  'premium-tool',
  '5000000',
  'auth-token',
  expires,
  [{ denom: 'ibc/ATOM', amount: '5000000' }]
);

// Report usage after providing service
if (verification.isValid) {
  const result = await sdk.usageReporter.postUsage({
    escrowId: '123',
    usageFee: '1000000',
    wallet: yourWallet,
  });
  console.log('Usage reported, tx hash:', result.txHash);
}
```

See [packages/httpay-sdk/README.md](./packages/httpay-sdk/README.md) for full details and more examples.

---

## Use Case Example

Here's how HTTPay enables autonomous API consumption:

1. **API Discovery**: An AI agent needs financial data for analysis and queries the HTTPay Registry
2. **Service Selection**: The agent finds a real-time data API created by an independent developer for 1 ATOM per call
3. **Payment Lock**: The agent locks funds in escrow and receives an authentication token
4. **API Call**: The agent uses the auth token to call the API endpoint
5. **Verification & Delivery**: The developer's API verifies the escrow, delivers the data, and claims the payment
6. **Settlement**: The entire marketplace-discovery-payment-delivery cycle completes automatically without human intervention

This process happens thousands of times daily across multiple agents and APIs, creating a thriving autonomous economy.

---

## Competitive Advantage

**Traditional API Marketplaces** (like RapidAPI) focus on human developers with dashboards, manual billing, and complex payment management. They require API keys, custom integrations, and human intervention for discovery and setup.

**HTTPay's Innovation**: The first API marketplace designed specifically for autonomous consumers, offering:
- Programmatic discovery through smart contract queries
- Instant payments via blockchain escrow
- Automatic settlement without billing systems
- No API keys or manual integrations required
- Built for thousands of agents operating 24/7

---


## Testing

- All contract and SDK logic is covered by unit and integration tests using `cw-multi-test` and Jest.
- Edge cases: TTL violations, over-limit fees, unauthorized access, contract freezing, refunds, and SDK error handling.
- Multi-denomination flow testing: registering tools with different denoms, locking funds with various tokens, validating error handling for wrong denoms.
- See `contracts/escrow/src/tests/`, `contracts/registry/src/tests/`, and `packages/httpay-sdk/__tests__/` for test modules.

---

## Tech Stack

| Layer      | Choice                                 |
|------------|----------------------------------------|
| Chain      | Neutron (Cosmos SDK, CosmWasm 1.5)     |
| Contracts  | Rust 1.78, cw-storage-plus 1.2         |
| HTTPay SDK | Node 20, TypeScript 5, cosmjs, telescope (production-ready) |
| Frontend   | Next.js, React, shadcn UI, CosmJS      |
| AI Agent   | Eliza OS, TypeScript                   |
| CI         | GitHub Actions, localnet, npm test     |

---

## Documentation & References

- [blueprint.md](./blueprint.md): Step-by-step implementation plan
- [project.md](./project.md): Full contract and system specification
- [tasks.md](./tasks.md): Actionable task list and progress tracker
- [notes/index.md](./notes/index.md): Implementation notes and design decisions
- [notes/multidenom-support.md](./notes/multidenom-support.md): Multi-denomination implementation details
- [notes/fetch-escrows-implementation.md](./notes/fetch-escrows-implementation.md): GetEscrows query implementation
- [cosmwasm-docs/](./cosmwasm-docs/): CosmWasm and cw-multi-test documentation

---

## Future Directions

- Enhanced AI agent capabilities with more sophisticated tool selection
- Cross-chain token support and IBC improvements  
- Advanced provider analytics and dashboard features
- DAO-based registry governance and community voting
- On-chain metering and dynamic pricing mechanisms

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

HTTPay contracts are deployed on Neutron testnet (pion-1) with the following addresses:

| Contract  | Address                                                             |
|-----------|---------------------------------------------------------------------|
| Registry  | neutron1jptpkaveckrs7mu3f4kgm2rgte9uhzu7eldfuay0w8sfhlqhc6gsklceq9 |
| Escrow    | neutron1au2gz2sdaeqd933ygcc3suud6snkw728dc0mycx5ft0l0ys48ykqsagyjd |

### Interacting with Deployed Contracts

```fish
# Query a registered tool
neutrond query wasm contract-state smart neutron1jptpkaveckrs7mu3f4kgm2rgte9uhzu7eldfuay0w8sfhlqhc6gsklceq9 '{"get_tool":{"tool_id":"example-tool"}}'

# Query an escrow by ID
neutrond query wasm contract-state smart neutron1au2gz2sdaeqd933ygcc3suud6snkw728dc0mycx5ft0l0ys48ykqsagyjd '{"get_escrow":{"escrow_id":1}}'

# Query multiple escrows with filtering
neutrond query wasm contract-state smart neutron1au2gz2sdaeqd933ygcc3suud6snkw728dc0mycx5ft0l0ys48ykqsagyjd '{"get_escrows":{"caller":"neutron1...","limit":10}}'
```

---

For more details, see the reference files in this repository. Contributions and feedback are welcome!

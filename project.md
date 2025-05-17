# Pay-Per-Tool MVP — Minimal Viable Specification


_(Target stack: CosmWasm 1.5 on Neutron + TypeScript SDK/CLI)_

**Status: Registry and Escrow contracts are fully implemented and tested. Provider SDK is production-ready with comprehensive documentation, error handling, wallet integration, and a main SDK class. AI-Wallet demo and E2E flows are implemented.**

---

## **0. Goals & non‑goals**

|**Item**|**In‑scope for MVP**|**Out‑of‑scope (v2+)**|
|---|---|---|
|Pay‑per‑call workflow (lock → verify → release/refund)|✔︎|Dynamic price curves, auctions|
|Single‑token payments (NTRN)|✔︎|IBC multi‑asset settlement|
|Off‑chain provider kit (token verifier + meter)|✔︎|Usage oracles, on‑chain metering|
|One tool → one price tier|✔︎|Tiered + volume pricing|
|Manual provider registration (tx)|✔︎|DAO, self‑serve web onboarding|
|Unit tests & localnet CI|✔︎|Formal verification, fuzzing|

---

## **1. Architecture snapshot**

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

## **2. Smart‑contract specs (CosmWasm, Rust + cw‑storage‑plus)**

### **2.1** 

### **Registry**

| **Function** | **Msg**      | **Params**                                                | **Response**        |
| ------------ | ------------ | --------------------------------------------------------- | ------------------- |
| Register     | RegisterTool | tool_id: String (max 16 characters), provider_addr, price: Uint128 (per call) | tool_id             |
| Update price | UpdatePrice  | tool_id, new_price                                        | ()                  |
| Pause Tool   | PauseTool    | tool_id                                                   | ()                  |
| Resume Tool  | ResumeTool   | tool_id                                                   | ()                  |
| Query meta   | GetTool      | tool_id                                                   | { provider, price, is_active } |
| Query all    | GetTools     | None                                                      | { tools: [] }       |

_Storage:_ TOOLS: Map<String, ToolMeta>

### **2.2** 

### **Escrow**

| **Function**       | **Msg**       | **Params**                           | **Emits / Returns**                                   |
| ------------------ | ------------- | ------------------------------------ | ----------------------------------------------------- |
| Lock               | LockFunds     | tool_id, max_fee, auth_token: Binary | escrow_id: u64                                        |
| Release (provider) | Release       | escrow_id, usage_fee                 | Sends usage_fee to provider & refunds delta to caller |
| Timeout refund     | RefundExpired | escrow_id                            | Refund 100 % to caller                                |

_Storage:_

```
pub struct Escrow {
  caller: Addr,
  provider: Addr,
  max_fee: Uint128,
  auth_token: Binary, // stored as plaintext
  expires: u64,       // block height (user-defined TTL, max 50 blocks)
}
ESCROWS: Map<u64, Escrow>;
NEXT_ID: Item<u64>;
```

_Safety toggles:_ hard‑coded TTL = user-defined (max 50 blocks); contract owner can sudo { freeze: true | false }.

---


## **3. Off‑chain Provider SDK (TypeScript)**

The Provider SDK (`@toolpay/provider-sdk`) is production-ready and enables tool providers to interact with Pay-Per-Tool smart contracts (Registry and Escrow) on Neutron. It provides type-safe, ergonomic APIs for contract interaction, escrow verification, usage reporting, and integration with provider backends/CLI tools.

### Features
- **Escrow Verification**: Verify escrow existence, validity, and authorization (escrow existence, provider address, auth token, expiration)
- **Usage Reporting**: Submit usage reports and claim funds from escrows (with safety checks)
- **Contract Interaction**: Type-safe wrapper classes for Registry and Escrow contract interaction
- **Wallet Integration**: Support for various wallet providers and signing methods (mnemonic, private key, CosmJS signer)
- **Comprehensive Error Handling**: Custom error classes for configuration, network, contract, escrow, usage, and wallet errors
- **Configuration**: Flexible configuration for network, contract addresses, and gas settings
- **Documentation & Examples**: JSDoc/TSDoc comments, README, and demo scripts

### Main SDK Class
`PayPerToolSDK` is the main entry point, aggregating all functionality:
- `registry`: Registry contract client
- `escrow`: Escrow contract client
- `escrowVerifier`: Escrow verification logic
- `usageReporter`: Usage reporting and fund claiming

#### Example Usage
```typescript
import { PayPerToolSDK } from '@toolpay/provider-sdk';

const sdk = new PayPerToolSDK({
  rpcEndpoint: 'https://rpc-pion-1.neutron.org',
  chainId: 'pion-1',
  registryAddress: 'neutron1...',
  escrowAddress: 'neutron1...',
});

const verification = await sdk.escrowVerifier.verifyEscrow({
  escrowId: '123',
  authToken: 'base64token',
  providerAddr: 'neutron1...',
});

if (verification.isValid) {
  const result = await sdk.usageReporter.postUsage({
    escrowId: '123',
    usageFee: '1000000',
    wallet: yourWallet,
  });
  console.log('Usage reported, tx hash:', result.txHash);
}
```

### Documentation & Testing
- All public classes and methods are documented with JSDoc/TSDoc
- Comprehensive Jest test suite (unit and integration)
- AI-Wallet demo script demonstrates full workflow (registration, discovery, escrow, verification, usage, claiming)
- Example usage patterns included in docs and demo

### Status
- **Phase 3 Complete**: Core SDK, utilities, error handling, wallet integration, documentation, and tests are all implemented and passing.

See [packages/provider-sdk/README.md](./packages/provider-sdk/README.md) for full details.

---

## **4. AI‑Wallet Client (TypeScript)**

The AI-Wallet client demo is implemented in `packages/provider-sdk/scripts/aiWalletDemo.ts` and demonstrates the full Pay-Per-Tool workflow:
1. Provider registration
2. Tool discovery by client
3. Fund locking in escrow
4. Escrow verification
5. Service delivery (simulated)
6. Usage reporting and fund claiming

The demo includes configuration handling, wallet setup for both provider and client, error handling, and explanatory logging. It serves as a reference for integrating the SDK into real-world applications.

SDK depends on **telescope‑generated** bindings for contract schemas.

---

## **5. Development Timeline & Status**

|**Phase**|**Deliverables**|**Status**|
|---|---|---|
|1|Contracts: Registry & Escrow, unit/integration tests, CI/localnet|**Complete**|
|2|Provider SDK: TypeScript SDK, docs, AI-Wallet demo, E2E tests|**Complete**|
|3|Frontend: User-facing app with shadcn UI|Planned|

All contract and SDK deliverables are implemented, tested, and documented. The project is ready for frontend development and further enhancements (multi-denom, DAO, etc.).

---

## **6. Acceptance Criteria**

1. **Happy path**: agent locks funds → provider verifies → runs tool → releases correct fee → caller refunded remainder.
2. **Over‑limit**: provider attempts to charge > max_fee → tx fails.
3. **Timeout**: provider never calls Release within TTL → caller can RefundExpired.
4. All flows covered by unit + integration tests; contracts compile under --release and pass cargo wasm-test.
5. SDK covers all contract flows, with unit/integration tests and demo scripts for all edge cases.

---

## **7. Tech Stack Summary**

|**Layer**|**Choice**|
|---|---|
|Chain|**Neutron** testnet → mainnet|
|Contracts|Rust 1.78, CosmWasm 1.5, cw‑storage‑plus 1.2|
|Provider SDK|Node 20, TypeScript 5, cosmjs, telescope code‑gen|
|Frontend|React, shadcn UI, CosmJS (planned)|
|CI|GitHub Actions: cargo test, wasmd localnet, npm test|

---

## **8. Future Directions (Post-MVP)**

- Multi-asset support (IBC tokens)
- DAO-based registry governance
- On-chain metering and dynamic pricing
- Full-featured provider dashboard and analytics
- Switch price to curve or oracle feed
- Add IBCTransfer support for any denom
- DAO registry governance via Neutron’s DAO module
- Move metering on‑chain with gas or compute proofs

---

## 9. Developer Specification

This section defines the full contract-level spec derived from our scoped MVP decisions during brainstorming.

### 9.1 Registry Contract

#### Types

```rust
pub struct ToolMeta {
  pub provider: Addr,
  pub price: Uint128,
  pub is_active: bool,
}
```

#### Messages

```rust
// InstantiateMsg
pub struct InstantiateMsg {}

// ExecuteMsg
pub enum ExecuteMsg {
  RegisterTool { tool_id: String, price: Uint128 },
  UpdatePrice { tool_id: String, new_price: Uint128 },
  PauseTool { tool_id: String },
  ResumeTool { tool_id: String },
}

// QueryMsg
pub enum QueryMsg {
  GetTool { tool_id: String },
  GetTools {},
}

// SudoMsg — not implemented for Registry
```

#### Constraints

- `tool_id` must be ≤ 16 characters
- Only the provider (i.e. `info.sender`) can register or modify their own tools
- A provider may register multiple tools

---

### 9.2 Escrow Contract

#### Types

```rust
pub struct Escrow {
  pub caller: Addr,
  pub provider: Addr,
  pub max_fee: Uint128,
  pub auth_token: Binary,
  pub expires: u64, // block height
}

pub struct Config {
  pub frozen: bool,
}
```

#### Messages

```rust
// InstantiateMsg
pub struct InstantiateMsg {}

// ExecuteMsg
pub enum ExecuteMsg {
  LockFunds {
    tool_id: String,
    max_fee: Uint128,
    auth_token: Binary,
    expires: u64,
  },
  Release {
    escrow_id: u64,
    usage_fee: Uint128,
  },
  RefundExpired {
    escrow_id: u64,
  },
}

// QueryMsg
pub enum QueryMsg {
  GetEscrow { escrow_id: u64 },
}

// SudoMsg
pub enum SudoMsg {
  Freeze { value: bool },
}
```

#### Constraints

- `expires` must be ≤ 50 blocks into the future
- `usage_fee` in `Release` must be ≤ `max_fee`
- Only the original provider may call `Release`
- Only the original caller may call `RefundExpired`
- `auth_token` is stored in plaintext
- Emits events:
  - `wasm-toolpay.locked`
  - `wasm-toolpay.released`
  - `wasm-toolpay.refunded`

---

This specification now reflects the current, tested, and production-ready state of the contracts and SDK. For full integration, reference the Provider SDK and AI-wallet flows outlined in previous sections and the demo scripts in the SDK package.
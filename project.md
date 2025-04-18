ToolPay MVP — Minimal Viable Specification

_(Target stack: CosmWasm 1.5 on Neutron + TypeScript SDK/CLI)_

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
| Register     | RegisterTool | tool_id: String, provider_addr, price: Uint128 (per call) | tool_id             |
| Update price | UpdatePrice  | tool_id, new_price                                        | ()                  |
| Query meta   | GetTool      | tool_id                                                   | { provider, price } |

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
  auth_token: Binary,
  expires: u64  // block height
}
ESCROWS: Map<u64, Escrow>;
NEXT_ID: Item<u64>;
```

_Safety toggles:_ hard‑coded TTL = 10 blocks; contract owner can sudo { freeze: true }.

---

## **3. Off‑chain provider SDK (TypeScript)**

- verifyEscrow(escrowId, authToken) → gRPC call to Neutron RPC to confirm:

    - escrow exists, not expired

    - provider == myAddress
    - postUsage(escrowId, fee) → broadcast Release tx via **cosmos‑kit** signer.


Publish as @toolpay/provider-sdk.

---

## **4. AI‑wallet client (TypeScript)**

```
const registry = new RegistryQuerier(rpc);
const tool = await registry.getTool("sentiment-api");

const escrow = new EscrowTx(rpc, signer);
const escrowId = await escrow.lockFunds({
  toolId: tool.id,
  maxFee: tool.price,
  authToken: randomBytes(16)
});

// call off‑chain API
const res = await fetch(tool.endpoint, {
  headers: { "x-auth": base64(authToken) },
  body: payload
});
```

SDK depends on **telescope‑generated** bindings for contract schemas.

---

## **5. Development timeline (4 weeks)**

|**Week**|**Deliverables**|
|---|---|
|1|Scaffold contracts (cw-template) • write state & msgs • unit tests (cw-multi-test)|
|2|TypeScript provider verifier lib • CLI for register & release • localnet docker compose|
|3|AI‑wallet demo script • E2E test on Neutron testnet (pion-1)|
|4|Basic docs (README + spec.md) • Hardening: gas limits, edge‑case tests|

---

## **6. Acceptance criteria**

1. **Happy path**: agent locks funds → provider verifies → runs tool → releases correct fee → caller refunded remainder.

2. **Over‑limit**: provider attempts to charge > max_fee → tx fails.

3. **Timeout**: provider never calls Release within TTL → caller can RefundExpired.

4. All flows covered by unit + integration tests; contracts compile under --release and pass cargo wasm-test.
---

## **7. Tech stack summary**

|**Layer**|**Choice**|
|---|---|
|Chain|**Neutron** testnet → mainnet|
|Contracts|Rust 1.78, CosmWasm 1.5, cw‑storage‑plus 1.2|
|Front/CLI|Node 20, TypeScript 5, cosmjs 0.48, telescope code‑gen|
|CI|GitHub Actions: cargo test, wasmd localnet, npm test|

---

## **8. Future‑proof hooks (post‑MVP)**

- Switch price to curve or oracle feed.

- Add IBCTransfer support for any denom.

- DAO registry governance via Neutron’s DAO module.

- Move metering on‑chain with gas or compute proofs.
---

Deliver this MVP and you’ll have a complete, audited proof‑of‑concept of _AI agents paying per‑tool on Cosmos_. From here you can iterate into dynamic pricing, multi‑tenant registries, and cross‑chain settlement. Happy building!
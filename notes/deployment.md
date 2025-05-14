# Deployment to Neutron Testnet (pion-1)

This file documents the build and deployment sequence for Pay-Per-Tool contracts on the Neutron testnet (pion-1), including contract addresses and example commands.

## Build and Deployment Sequence
1. Build and optimize both contracts
2. Deploy and instantiate the Registry contract first
3. Deploy and instantiate the Escrow contract, passing the Registry contract address

### Build and Optimize WASM Files
- Build release WASM files for both contracts
- Optimize using `wasm-opt` for deployment

### Deploy and Instantiate Contracts
- Store and instantiate the Registry contract
- Store and instantiate the Escrow contract, passing the Registry contract address

### Example Commands
- Provided for each step, including contract instantiation and querying
```bash
# Build contracts
cargo build --lib --release --target wasm32-unknown-unknown

# Optimize registry contract
wasm-opt \
     target/wasm32-unknown-unknown/release/registry.wasm \
     -Oz \
     --strip-debug \
     --strip-producers \
     --vacuum \
     -o artifacts/registry.wasm

# Optimize escrow contract
wasm-opt \
     target/wasm32-unknown-unknown/release/escrow.wasm \
     -Oz \
     --strip-debug \
     --strip-producers \
     --vacuum \
     -o artifacts/escrow.wasm

# Store registry contract
neutrond tx wasm store artifacts/registry.wasm \
  --from devwallet \
  --gas auto --gas-adjustment 1.3 \
  --fees 30000untrn \
  --broadcast-mode sync

# Store escrow contract
neutrond tx wasm store artifacts/escrow.wasm \
  --from devwallet \
  --gas auto --gas-adjustment 1.3 \
  --fees 30000untrn \
  --broadcast-mode sync

# Instantiate registry contract
# Replace 11846 with the actual code ID of the registry contract
neutrond tx wasm instantiate 11846 '{}' \
  --from devwallet \
  --label "toolpay-registry" \
  --no-admin \
  --gas auto --gas-adjustment 1.3 \
  --fees 5000untrn \
  --broadcast-mode sync

# Instantiate escrow contract
# Replace 11831 with the actual code ID of the escrow contract
# Replace "neutron1ev3rm2ch8ul2qs62x9vyr4vhw06euwgtvjlv5kc9mp4yj0ftygqqckz3n8" with the actual registry contract address
neutrond tx wasm instantiate 11831 '{"registry_addr": "neutron1ev3rm2ch8ul2qs62x9vyr4vhw06euwgtvjlv5kc9mp4yj0ftygqqckz3n8"}' \
  --from devwallet \
  --label "toolpay-escrow" \
  --no-admin \
  --gas auto --gas-adjustment 1.3 \
  --fees 5000untrn \
  --broadcast-mode sync
```
### Deployed Contract Addresses
- Registry: neutron1ev3rm2ch8ul2qs62x9vyr4vhw06euwgtvjlv5kc9mp4yj0ftygqqckz3n8
- Escrow: neutron1q9cedxhuf9vggfxjpx692l025eqtalk44f0t5unnxlkqvym2arnsakaxmx

### Notes
- Always deploy and instantiate the Registry contract before the Escrow contract
- Use the provided addresses for integration testing and SDK development

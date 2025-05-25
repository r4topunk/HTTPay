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

# Store registry contract
neutrond tx wasm store artifacts/registry.wasm \
  --from devwallet \
  --gas auto --gas-adjustment 1.3 \
  --fees 30000untrn \
  --broadcast-mode sync

# Instantiate registry contract
# Replace 11934 with the actual code ID of the registry contract
neutrond tx wasm instantiate 11934 '{}' \
  --from devwallet \
  --label "toolpay-registry" \
  --no-admin \
  --gas auto --gas-adjustment 1.3 \
  --fees 5000untrn \
  --broadcast-mode sync

# Optimize escrow contract
wasm-opt \
     target/wasm32-unknown-unknown/release/escrow.wasm \
     -Oz \
     --strip-debug \
     --strip-producers \
     --vacuum \
     -o artifacts/escrow.wasm

# Store escrow contract
neutrond tx wasm store artifacts/escrow.wasm \
  --from devwallet \
  --gas auto --gas-adjustment 1.3 \
  --fees 30000untrn \
  --broadcast-mode sync

# Instantiate escrow contract
# Replace 11935 with the actual code ID of the escrow contract
# Replace "neutron1hle9gxr8d6r78qssat9v2rxre4g57yt7tn8559wwrevza0wnuh8sqtsu44" with the actual registry contract address
neutrond tx wasm instantiate 11935 '{"registry_addr": "neutron1hle9gxr8d6r78qssat9v2rxre4g57yt7tn8559wwrevza0wnuh8sqtsu44","fee_percentage":10}' \
  --from devwallet \
  --label "toolpay-escrow" \
  --no-admin \
  --gas auto --gas-adjustment 1.3 \
  --fees 5000untrn \
  --broadcast-mode sync
```
### Deployed Contract Addresses
- Registry: neutron1hle9gxr8d6r78qssat9v2rxre4g57yt7tn8559wwrevza0wnuh8sqtsu44
- Escrow: neutron1ukeqlw2hq48jffhwmj5tm6xq8d3fzjpp4e8y022dsaz842sksgeqxus7z4

### Notes
- Always deploy and instantiate the Registry contract before the Escrow contract
- Use the provided addresses for integration testing and SDK development

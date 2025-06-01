# Deployment to Neutron Testnet (pion-1)

This file documents the build and deployment sequence for HTTPay contracts on the Neutron testnet (pion-1), including contract addresses and example commands.

## Automated Deployment Script

For automated deployment, use the provided bash script:

```bash
# Run the automated deployment script
./scripts/deploy.sh
```

The script will:
- Build and optimize both contracts
- Deploy and instantiate the Registry contract first
- Deploy and instantiate the Escrow contract with the Registry address
- Capture and display all code IDs and contract addresses
- Save deployment information to a timestamped JSON file
- Export environment variables for easy access
- Verify the deployment by testing the GetEscrows query

### Script Features

- **Error handling**: Exits on any error and provides clear error messages
- **Transaction verification**: Waits for transaction confirmation before proceeding
- **Colored output**: Uses colors to distinguish between info, success, error, and warning messages
- **Deployment logging**: Saves complete deployment information to a JSON file
- **Environment variables**: Exports contract addresses and code IDs for easy access
- **Verification testing**: Tests the GetEscrows query to ensure proper deployment

### Script Output

The script outputs:
- Registry Code ID and Address
- Escrow Code ID and Address
- All transaction hashes for reference
- Deployment timestamp and configuration
- JSON file with complete deployment information

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
  --broadcast-mode sync \
  --yes | jq -r '.txhash'

# Query the registry contract deployment code
neutrond query tx 82853C30C96F44AB182479DE9BB0F7702A9E0EB2865AB5C6061EFC2AE58CC4C4 | jq -r '.events[] | select(.type == "store_code") | .attributes[] | select(.key == "code_id") | .value'

# Instantiate registry contract
# Replace the number with the actual code ID of the registry contract
neutrond tx wasm instantiate 11941 '{}' \
  --from devwallet \
  --label "toolpay-registry" \
  --no-admin \
  --gas auto --gas-adjustment 1.3 \
  --fees 5000untrn \
  --broadcast-mode sync \
  --yes  | jq -r '.txhash'

# Query the registry contract address
neutrond query tx F74197C7C97F2FAC07B967AE19469FF65C43A2C79145B67C6758269B452B3E34 | jq -r '.events[] | selec
t(.type == "instantiate") | .attributes[] | select(.key == "_contract_address") | .value'

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
  --broadcast-mode sync \
  --yes | jq -r '.txhash'


# Query the escrow contract deployment code
neutrond query tx 4BCB1085014A070F30C341A37579EDCE773E7C06D41E067EFA368BC6EC6954A0 | jq -r '.events[] | select(.type == 
"store_code") | .attributes[] | select(.key == "code_id") | .value'

# Instantiate escrow contract
# Replace 11935 with the actual code ID of the escrow contract
# Replace "neutron1y3sukd6exjkmhu3sqdh7efl7gx3qthm4y9gadgaxuu5xckydnwesr6mev0" with the actual registry contract address
neutrond tx wasm instantiate 11935 '{"registry_addr": "neutron1y3sukd6exjkmhu3sqdh7efl7gx3qthm4y9gadgaxuu5xckydnwesr6mev0","fee_percentage":10}' \
  --from devwallet \
  --label "toolpay-escrow" \
  --no-admin \
  --gas auto --gas-adjustment 1.3 \
  --fees 5000untrn \
  --broadcast-mode sync

# Query the escrow contract address
neutrond query tx F74197C7C97F2FAC07B967AE19469FF65C43A2C79145B67C6758269B452B3E34 | jq -r '.events[] | selec
t(.type == "instantiate") | .attributes[] | select(.key == "_contract_address") | .value'
```
### Deployed Contract Addresses

#### Latest Deployment (Fresh contracts with GetEscrows query support)
- Registry Code ID: 11942
- Registry Address: neutron1y3sukd6exjkmhu3sqdh7efl7gx3qthm4y9gadgaxuu5xckydnwesr6mev0
- Escrow Code ID: 11943  
- Escrow Address: neutron1e9taftylxzdqvtcwscddznmy5ualhcx30xrrrttxznme0jsrm0msxkm6xn

#### Previous Deployment (Deprecated - missing GetEscrows query)
- Registry: neutron1y3sukd6exjkmhu3sqdh7efl7gx3qthm4y9gadgaxuu5xckydnwesr6mev0
- Escrow: neutron1e9taftylxzdqvtcwscddznmy5ualhcx30xrrrttxznme0jsrm0msxkm6xn

#### Verification
- GetEscrows query tested and working: `neutrond query wasm contract-state smart neutron1e9taftylxzdqvtcwscddznmy5ualhcx30xrrrttxznme0jsrm0msxkm6xn '{"get_escrows":{}}'`
- Returns: `{"data":{"escrows":[]}}`

#### Changes from Previous Deployment
- Fresh deployment from scratch to ensure GetEscrows query functionality
- Updated contract labels to include "-fresh" suffix for identification
- Both contracts deployed with latest code including all query variants
- Always deploy and instantiate the Registry contract before the Escrow contract
- Use the provided addresses for integration testing and SDK development

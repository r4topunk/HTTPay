# Deployment to Neutron Testnet (pion-1)

This file documents the build and deployment sequence for ToolPay contracts on the Neutron testnet (pion-1), including contract addresses and example commands.

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

### Deployed Contract Addresses
- Registry: neutron1mxaqqnh237vu0phcfh6ut8gx3att2dza49r5x9h52fey9gspy5nq54cjhv
- Escrow: neutron15pc80qem8vn8g6nazjs8nayx625x6g0wy9kte4y56ru7k3d6ek0shmc92y

### Notes
- Always deploy and instantiate the Registry contract before the Escrow contract
- Use the provided addresses for integration testing and SDK development

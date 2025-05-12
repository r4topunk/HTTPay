# ToolPay Provider SDK

The ToolPay Provider SDK enables tool providers to interact with ToolPay smart contracts (Registry and Escrow) on Neutron. It provides type-safe, ergonomic APIs for contract interaction, escrow verification, usage reporting, and integration with provider backends/CLI tools.

**Current Status: Phase 3 Complete (Core SDK Implementation)**

## Features

- **Escrow Verification**: Verify escrow existence, validity, and authorization
- **Usage Reporting**: Submit usage reports and claim funds from escrows
- **Contract Interaction**: Type-safe wrappers for Registry and Escrow contract interaction
- **Wallet Integration**: Support for various wallet providers and signing methods

## Installation

```bash
npm install @toolpay/provider-sdk
# or
yarn add @toolpay/provider-sdk
# or
pnpm add @toolpay/provider-sdk
```

## Basic Usage

```typescript
import { ToolPaySDK, EscrowVerifier, UsageReporter } from '@toolpay/provider-sdk';

// Initialize the SDK with your configuration
const sdk = new ToolPaySDK({
  rpcEndpoint: 'https://rpc-pion-1.neutron.org',
  chainId: 'pion-1',
  registryAddress: 'neutron1mxaqqnh237vu0phcfh6ut8gx3att2dza49r5x9h52fey9gspy5nq54cjhv',
  escrowAddress: 'neutron1nrq2wahvklx3t362cr95dlv4xru08mnpucq0mn4nje266qqhe9hsjnhv94',
});

// Verify an escrow using the escrow verifier
const verificationResult = await sdk.escrowVerifier.verifyEscrow({
  escrowId: '123',
  authToken: 'base64-encoded-auth-token',
  providerAddr: 'your-provider-address',
});

if (verificationResult.isValid) {
  console.log('Escrow valid:', verificationResult.escrow);
  
  // Report usage and claim funds
  const result = await sdk.usageReporter.postUsage({
    escrowId: '123',
    usageFee: '1000000', // In smallest denomination of the token (e.g., untrn)
    wallet: yourWallet, // CosmJS wallet or signer
  });
  
  console.log('Usage reported, transaction hash:', result.txHash);
} else {
  console.error('Invalid escrow:', verificationResult.error);
}
```

## Documentation

For full API documentation and examples, see the [API Documentation](./docs/API.md).

## Configuration

The SDK can be configured with different networks and contract addresses:

```typescript
const mainnetSdk = new ToolPaySDK({
  rpcEndpoint: 'https://rpc.neutron.org',
  chainId: 'neutron-1',
  registryAddress: 'neutron1...',
  escrowAddress: 'neutron1...',
});

const testnetSdk = new ToolPaySDK({
  rpcEndpoint: 'https://rpc-pion-1.neutron.org',
  chainId: 'pion-1',
  registryAddress: 'neutron1...',
  escrowAddress: 'neutron1...',
});
```

## Demo Script

The SDK includes a demo script that simulates a full ToolPay workflow:

1. Tool registration by a provider
2. Tool discovery by a client
3. Fund locking in an escrow
4. Escrow verification by the provider
5. Service provision and usage reporting
6. Fund claiming by the provider

### Running the Demo

1. Copy the environment configuration file:
   ```bash
   cp .env.example .env
   ```

2. Edit the `.env` file with your private key, mnemonic, and other settings.

3. Run the demo script:
   ```bash
   # Build the SDK first
   pnpm build
   
   # Run the demo script
   node dist-scripts/scripts/aiWalletDemo.js
   ```

### Environment Variables

The demo script supports the following environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `NETWORK` | Network to connect to ('mainnet', 'testnet', 'local') | 'testnet' |
| `RPC_ENDPOINT` | RPC endpoint | Based on `NETWORK` |
| `CHAIN_ID` | Chain ID | Based on `NETWORK` |
| `REGISTRY_ADDRESS` | Registry contract address | Default test address |
| `ESCROW_ADDRESS` | Escrow contract address | Default test address |
| `PROVIDER_PRIVATE_KEY` | Provider's private key | None (required) |
| `CLIENT_PRIVATE_KEY` | Client's mnemonic | None (required) |
| `TOOL_ID` | Tool ID to use | 'sentiment-api' |
| `TOOL_PRICE` | Tool price in untrn | '1000' |

## License

MIT

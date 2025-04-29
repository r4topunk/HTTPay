# ToolPay Provider SDK

The ToolPay Provider SDK enables tool providers to interact with ToolPay smart contracts (Registry and Escrow) on Neutron. It provides type-safe, ergonomic APIs for contract interaction, escrow verification, usage reporting, and integration with provider backends/CLI tools.

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
  escrowAddress: 'neutron1hg4p3r0vlmca5vwyvxdx6kfd4urg038xsacjsfu0lytrupm3h42sag09wr',
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

## License

MIT

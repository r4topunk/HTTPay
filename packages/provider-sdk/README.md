# HTTPay Provider SDK

A comprehensive TypeScript SDK for interacting with HTTPay smart contracts on Neutron blockchain. HTTPay is a pay-per-use platform enabling AI tools and services to be monetized through blockchain-based escrow mechanisms.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8+-blue)](https://www.typescriptlang.org/)
[![CosmWasm](https://img.shields.io/badge/CosmWasm-1.5-purple)](https://cosmwasm.com/)
[![Neutron](https://img.shields.io/badge/Neutron-Testnet-green)](https://neutron.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## Overview

The HTTPay Provider SDK is a production-ready TypeScript library that enables tool providers to seamlessly integrate with the HTTPay ecosystem. Built on top of the Neutron blockchain and CosmWasm smart contracts, it provides a secure, decentralized solution for pay-per-use AI services.

### Key Capabilities

- **🔐 Escrow Management**: Secure fund locking and release mechanisms
- **✅ Authorization Verification**: Cryptographic verification of user permissions
- **💰 Usage Reporting**: Automated billing and payment processing
- **🔗 Multi-Wallet Support**: Integration with various Cosmos ecosystem wallets
- **⚡ Type Safety**: Full TypeScript support with comprehensive type definitions
- **🧪 Comprehensive Testing**: Extensive unit and integration test coverage

## Technologies Used

- **[TypeScript 5.8+](https://www.typescriptlang.org/)** - Primary development language with strict type checking
- **[CosmJS](https://github.com/cosmos/cosmjs)** - Cosmos blockchain client library
- **[CosmWasm](https://cosmwasm.com/)** - Smart contract platform for Cosmos
- **[Neutron](https://neutron.org/)** - Target blockchain network
- **[Jest](https://jestjs.io/)** - Testing framework with comprehensive coverage
- **[ESLint](https://eslint.org/)** + **[Prettier](https://prettier.io/)** - Code quality and formatting
- **[PNPM](https://pnpm.io/)** - Fast, disk space efficient package manager

## Project Structure

```
packages/provider-sdk/
├── src/
│   ├── HTTPaySDK.ts              # Main SDK entry point
│   ├── PayPerToolSDK.ts          # Alternative SDK implementation
│   ├── clients/                  # Contract client implementations
│   │   ├── RegistryClient.ts     # Registry contract interface
│   │   ├── EscrowClient.ts       # Escrow contract interface
│   │   └── index.ts              # Client exports
│   ├── types/                    # TypeScript type definitions
│   │   ├── registry.ts           # Registry contract types
│   │   ├── escrow.ts             # Escrow contract types
│   │   ├── common.ts             # Shared types
│   │   └── index.ts              # Type exports
│   ├── utils/                    # Utility functions
│   │   ├── config.ts             # Configuration helpers
│   │   ├── errors.ts             # Custom error classes
│   │   ├── wallet.ts             # Wallet utilities
│   │   └── index.ts              # Utility exports
│   ├── escrowVerifier.ts         # Escrow verification logic
│   ├── usageReporter.ts          # Usage reporting and billing
│   ├── version.ts                # SDK version information
│   └── index.ts                  # Main package exports
├── scripts/
│   └── aiWalletDemo.ts           # Complete workflow demonstration
├── test/                         # Comprehensive test suite
│   ├── httpaySDK.test.ts         # Main SDK tests
│   ├── registryClient.test.ts    # Registry client tests
│   ├── escrowVerifier.test.ts    # Verification logic tests
│   ├── usageReporter.test.ts     # Usage reporting tests
│   ├── multi-denom.test.ts       # Multi-denomination support tests
│   └── feeCollection.test.ts     # Fee collection feature tests
├── package.json                  # Project dependencies and scripts
├── tsconfig.json                 # TypeScript configuration
├── jest.config.cjs               # Jest testing configuration
├── .env.example                  # Environment variable template
└── README.md                     # This file
```

## Installation

Install the HTTPay Provider SDK using your preferred package manager:

```bash
# Using npm
npm install httpay

# Using yarn
yarn add httpay

# Using pnpm (recommended)
pnpm add httpay
```

### Dependencies

The SDK requires the following peer dependencies:

```bash
npm install @cosmjs/cosmwasm-stargate @cosmjs/proto-signing @cosmjs/stargate
```

## Quick Start

### Basic Setup

```typescript
import { HTTPaySDK } from 'httpay';

// Initialize the SDK with Neutron testnet configuration
const sdk = new HTTPaySDK({
  rpcEndpoint: 'https://rpc-pion-1.neutron.org',
  chainId: 'pion-1',
  registryAddress: 'neutron1hle9gxr8d6r78qssat9v2rxre4g57yt7tn8559wwrevza0wnuh8sqtsu44',
  escrowAddress: 'neutron1ukeqlw2hq48jffhwmj5tm6xq8d3fzjpp4e8y022dsaz842sksgeqxus7z4',
});

// Connect to the blockchain
await sdk.connect();
```

### Escrow Verification Workflow

```typescript
// Verify an escrow before providing services
const verificationResult = await sdk.escrowVerifier.verifyEscrow({
  escrowId: '123',
  authToken: 'base64-encoded-auth-token',
  providerAddr: 'neutron1yourprovideraddress',
});

if (verificationResult.isValid) {
  console.log('✅ Escrow verified:', verificationResult.escrow);
  
  // Provide your service here...
  
  // Report usage and claim payment
  const result = await sdk.usageReporter.postUsage({
    escrowId: '123',
    usageFee: '1000000', // Amount in smallest denomination (e.g., untrn)
    wallet: yourWallet,
  });
  
  console.log('💰 Payment claimed, tx:', result.txHash);
} else {
  console.error('❌ Invalid escrow:', verificationResult.error);
}
```

### Advanced Configuration

```typescript
// Production mainnet configuration
const mainnetSDK = new HTTPaySDK({
  rpcEndpoint: 'https://rpc.neutron.org',
  chainId: 'neutron-1',
  registryAddress: 'neutron1...',
  escrowAddress: 'neutron1...',
  gasPrice: '0.025untrn',
  gasAdjustment: 1.5,
});

// Local development configuration
const localSDK = new HTTPaySDK({
  rpcEndpoint: 'http://localhost:26657',
  chainId: 'local-testnet',
  registryAddress: 'neutron1registry',
  escrowAddress: 'neutron1escrow',
});

```

## Core Components

### HTTPaySDK Class

The main SDK class provides a unified interface for all HTTPay operations:

```typescript
class HTTPaySDK {
  // Core contract clients
  registry: RegistryClient;     // Tool registration and management
  escrow: EscrowClient;         // Escrow fund management
  
  // Service components
  escrowVerifier: EscrowVerifier;   // Escrow validation logic
  usageReporter: UsageReporter;     // Usage billing and claims
  
  // Connection methods
  async connect(): Promise<void>;
  async connectWithMnemonic(mnemonic: string): Promise<void>;
  async connectWithPrivateKey(privateKey: string): Promise<void>;
}
```

### Contract Clients

#### RegistryClient

Manages tool registration and discovery:

```typescript
// Register a new tool
await sdk.registry.registerTool(
  senderAddress,
  'sentiment-api',     // Tool ID (≤16 characters)
  '1000000',          // Price in untrn
  'AI sentiment analysis tool' // Description
);

// Query tool information
const tool = await sdk.registry.getTool('sentiment-api');

// Update tool pricing
await sdk.registry.updatePrice(senderAddress, 'sentiment-api', '2000000');

// Pause/resume tool availability
await sdk.registry.pauseTool(senderAddress, 'sentiment-api');
await sdk.registry.resumeTool(senderAddress, 'sentiment-api');

// List all available tools
const tools = await sdk.registry.getTools();
```

#### EscrowClient

Handles secure fund management:

```typescript
// Lock funds for tool usage (client-side)
const result = await sdk.escrow.lockFunds(
  clientAddress,
  'sentiment-api',     // Tool ID
  '1000000',          // Maximum fee
  'auth-token-123',   // Authentication token
  currentBlockHeight + 10, // Expiration
  [{ denom: 'untrn', amount: '1000000' }] // Funds to lock
);

// Release funds after service delivery (provider-side)
await sdk.escrow.releaseFunds(
  providerAddress,
  result.escrowId,    // Escrow ID
  '800000'           // Actual usage fee (≤ max fee)
);

// Refund expired escrows (client-side)
await sdk.escrow.refundExpired(clientAddress, escrowId);

// Query escrow details
const escrowData = await sdk.escrow.getEscrow(escrowId);
```

### Service Components

#### EscrowVerifier

Validates escrow authorization before service delivery:

```typescript
const verification = await sdk.escrowVerifier.verifyEscrow({
  escrowId: '123',
  authToken: 'client-provided-token',
  providerAddr: 'neutron1youraddress'
});

if (verification.isValid) {
  // Safe to provide service
  const { escrow, remainingBlocks } = verification;
  console.log(`Escrow valid until block ${escrow.expires}`);
} else {
  // Handle verification failure
  console.error(`Verification failed: ${verification.error}`);
}
```

#### UsageReporter

Handles billing and fund claiming:

```typescript
const result = await sdk.usageReporter.postUsage({
  escrowId: '123',
  usageFee: '900000',  // Must be ≤ escrow.max_fee
  wallet: providerWallet
});

console.log(`Claimed ${result.claimedAmount} from escrow ${result.escrowId}`);
```

## Multi-Denomination Support

The SDK supports multiple token denominations for payments:

```typescript
// Lock funds with IBC tokens
await sdk.escrow.lockFunds(
  clientAddress,
  'premium-tool',
  '5000000',
  'auth-token',
  expires,
  [{ denom: 'ibc/ATOM', amount: '5000000' }]
);

// Query tools by denomination
const atomTools = await sdk.registry.getToolsByDenom('ibc/ATOM');
```

## Error Handling

The SDK provides comprehensive error handling with custom error types:

```typescript
import { 
  ConfigurationError, 
  NetworkError, 
  ContractError,
  EscrowError,
  UsageError,
  WalletError 
} from 'httpay';

try {
  await sdk.verifyEscrow(params);
} catch (error) {
  if (error instanceof EscrowError) {
    console.error('Escrow validation failed:', error.message);
  } else if (error instanceof NetworkError) {
    console.error('Network connectivity issue:', error.message);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## Wallet Integration

### Mnemonic-based Connection

```typescript
await sdk.connectWithMnemonic('your twelve word mnemonic phrase here...');
```

### Private Key Connection

```typescript
await sdk.connectWithPrivateKey('your-private-key-hex');
```

### External Wallet Integration

```typescript
import { SigningCosmWasmClient } from '@cosmjs/cosmwasm-stargate';

// Use with Keplr or other wallet providers
const signingClient = await SigningCosmWasmClient.connectWithSigner(
  rpcEndpoint,
  await window.keplr.getOfflineSigner(chainId)
);

const sdk = new HTTPaySDK({
  rpcEndpoint,
  chainId,
  registryAddress,
  escrowAddress,
  customClient: signingClient
});
```

## Demo Script

The SDK includes a comprehensive demo script showcasing the complete HTTPay workflow:

### Running the Demo

1. **Setup Environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

2. **Build and Run**:
   ```bash
   pnpm build
   node dist-scripts/scripts/aiWalletDemo.js
   ```

### Demo Workflow

The demo script demonstrates:

1. **Provider Setup**: Tool registration and configuration
2. **Client Discovery**: Finding available tools and pricing
3. **Fund Locking**: Secure escrow creation with time limits
4. **Service Delivery**: Provider verification and service execution
5. **Payment Processing**: Usage reporting and fund claiming
6. **Error Scenarios**: Timeout handling and refund mechanisms

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NETWORK` | Target network | `testnet`, `mainnet`, `local` |
| `RPC_ENDPOINT` | Blockchain RPC URL | `https://rpc-pion-1.neutron.org` |
| `CHAIN_ID` | Network chain identifier | `pion-1` |
| `REGISTRY_ADDRESS` | Registry contract address | `neutron1zyfl...` |
| `ESCROW_ADDRESS` | Escrow contract address | `neutron1nhg...` |
| `PROVIDER_PRIVATE_KEY` | Provider wallet private key | `0x123...` |
| `CLIENT_PRIVATE_KEY` | Client wallet private key | `0x456...` |
| `TOOL_ID` | Tool identifier for demo | `sentiment-api` |
| `TOOL_PRICE` | Tool price in base units | `1000` |

## Testing

The SDK includes comprehensive testing covering all functionality:

```bash
# Run all tests
pnpm test

# Run with coverage report
pnpm test:coverage

# Run in watch mode during development
pnpm test:watch

# Lint and format code
pnpm lint:fix
pnpm format
```

### Test Categories

- **Unit Tests**: Individual component testing with mocks
- **Integration Tests**: End-to-end workflow validation
- **Multi-Denomination Tests**: IBC token support verification
- **Fee Collection Tests**: Contract fee mechanism validation
- **Error Handling Tests**: Edge case and failure scenario coverage

## Building and Development

### Development Setup

```bash
# Clone and install dependencies
git clone <repository-url>
cd packages/provider-sdk
pnpm install

# Start development with watch mode
pnpm build:watch
```

### Build Scripts

```bash
# Clean build artifacts
pnpm clean

# Build TypeScript to JavaScript
pnpm build

# Lint code
pnpm lint

# Format code
pnpm format

# Type check
npx tsc --noEmit
```

## Network Configuration

### Neutron Testnet (Default)

```typescript
const testnetConfig = {
  rpcEndpoint: 'https://rpc-pion-1.neutron.org',
  chainId: 'pion-1',
  registryAddress: 'neutron1hle9gxr8d6r78qssat9v2rxre4g57yt7tn8559wwrevza0wnuh8sqtsu44',
  escrowAddress: 'neutron1ukeqlw2hq48jffhwmj5tm6xq8d3fzjpp4e8y022dsaz842sksgeqxus7z4'
};
```

### Neutron Mainnet

```typescript
const mainnetConfig = {
  rpcEndpoint: 'https://rpc.neutron.org',
  chainId: 'neutron-1',
  registryAddress: 'neutron1...', // Deploy contracts first
  escrowAddress: 'neutron1...'    // Deploy contracts first
};
```

### Local Development

```typescript
const localConfig = {
  rpcEndpoint: 'http://localhost:26657',
  chainId: 'local-testnet',
  registryAddress: 'neutron1registry',
  escrowAddress: 'neutron1escrow'
};
```

## Contributing

We welcome contributions to the HTTPay Provider SDK! Please follow these guidelines:

### Development Workflow

1. **Fork and Clone**: Fork the repository and clone your fork
2. **Branch**: Create a feature branch (`git checkout -b feature/your-feature`)
3. **Develop**: Implement your changes with tests
4. **Test**: Ensure all tests pass (`pnpm test`)
5. **Lint**: Run linting and formatting (`pnpm lint:fix && pnpm format`)
6. **Commit**: Use conventional commit messages
7. **Push**: Push to your fork and create a pull request

### Code Standards

- **TypeScript**: Use strict type checking and explicit types
- **Testing**: Maintain >90% test coverage for new code
- **Documentation**: Update JSDoc comments for public APIs
- **Formatting**: Use Prettier and ESLint configurations
- **Error Handling**: Implement comprehensive error scenarios

### Commit Message Format

```
type(scope): description

body (optional)

footer (optional)
```

Examples:
- `feat(escrow): add multi-denomination support`
- `fix(verifier): handle expired escrow edge case`
- `docs(readme): update configuration examples`
- `test(usage): add timeout scenario tests`

### Pull Request Guidelines

- Include tests for all new functionality
- Update documentation for API changes
- Ensure backwards compatibility when possible
- Add entries to CHANGELOG.md for significant changes
- Reference related issues in PR description

## Support and Resources

### Documentation

- **API Reference**: Complete TypeScript API documentation
- **Examples**: Working code examples in `/scripts` directory
- **Tests**: Comprehensive test suite demonstrating usage patterns

### Community

- **Issues**: Report bugs and request features on GitHub
- **Discussions**: Join technical discussions in GitHub Discussions
- **Discord**: Connect with the HTTPay community

### Related Projects

- **[HTTPay Contracts](../../../contracts/)**: CosmWasm smart contracts
- **[HTTPay Frontend](../httpay-website/)**: Web application interface
- **[Neutron Docs](https://docs.neutron.org/)**: Neutron blockchain documentation
- **[CosmWasm Docs](https://docs.cosmwasm.com/)**: Smart contract platform documentation

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for detailed version history and breaking changes.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- **Neutron Team**: For the innovative blockchain platform
- **CosmWasm Team**: For the smart contract framework  
- **Cosmos SDK Team**: For the underlying blockchain infrastructure
- **CosmJS Team**: For the JavaScript client libraries

---

**Built with ❤️ for the Cosmos ecosystem**

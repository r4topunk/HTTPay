# HTTPay SDK

TypeScript SDK for HTTPay CosmWasm contracts, providing type-safe interfaces, React hooks, and comprehensive client libraries for interacting with Escrow and Registry contracts.

## Features

- ✅ **Type-safe contract clients** - Auto-generated TypeScript bindings
- ✅ **React integration** - Complete React Provider with hooks
- ✅ **React Query hooks** - Built-in query hooks for efficient data fetching
- ✅ **Wallet integration** - Seamless integration with Cosmos Kit
- ✅ **Form validation** - Zod schemas for form validation
- ✅ **Error handling** - Comprehensive error handling utilities
- ✅ **TypeScript-first** - Full type safety throughout

## Installation

```bash
npm install httpay-sdk
# or
yarn add httpay-sdk
# or
pnpm add httpay-sdk
```

## Peer Dependencies

This package requires the following peer dependencies:

```bash
pnpm add @cosmjs/cosmwasm-stargate @cosmjs/proto-signing @cosmjs/stargate @cosmos-kit/react @tanstack/react-query react zod
```

## Quick Start

### Basic Contract Client Usage

```typescript
import { EscrowQueryClient, RegistryQueryClient } from 'httpay-sdk';
import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate';

const client = await CosmWasmClient.connect('https://rpc.cosmos.network');

const escrowClient = new EscrowQueryClient(client, 'escrow_contract_address');
const registryClient = new RegistryQueryClient(client, 'registry_contract_address');

// Query escrows
const escrows = await escrowClient.getEscrows({ limit: 10 });
const tools = await registryClient.getTools();
```

### React Provider Setup

```typescript
import { ReactSDK } from 'httpay-sdk';
import { ChainProvider } from '@cosmos-kit/react';

function App() {
  return (
    <ChainProvider>
      <ReactSDK.HTTPaySDKProvider
        config={{
          rpcEndpoint: "https://rpc.cosmos.network",
          chainId: "cosmoshub-4",
          registryAddress: "registry_contract_address",
          escrowAddress: "escrow_contract_address",
          gasPrice: "0.025uatom",
          gasAdjustment: 1.5
        }}
        walletConnectOptions={{
          chainId: "cosmoshub-4"
        }}
      >
        <YourApp />
      </ReactSDK.HTTPaySDKProvider>
    </ChainProvider>
  );
}
```

### Using React Hooks

```typescript
import { ReactSDK } from 'httpay-sdk';

function MyComponent() {
  const { 
    registry, 
    escrow, 
    wallet,
    loading,
    tools,
    escrows 
  } = ReactSDK.useHTTPaySDK();

  // Register a new tool
  const handleRegisterTool = async () => {
    await registry.registerTool({
      toolId: "my-tool",
      description: "My awesome tool",
      price: "1000000",
      endpoint: "https://api.mytool.com",
      denom: "uatom"
    });
  };

  // Create an escrow
  const handleCreateEscrow = async () => {
    await escrow.lockFunds({
      toolId: "my-tool",
      maxFee: "1000000"
    });
  };

  return (
    <div>
      <button onClick={handleRegisterTool} disabled={loading.registering}>
        {loading.registering ? 'Registering...' : 'Register Tool'}
      </button>
      <button onClick={handleCreateEscrow} disabled={loading.lockingFunds}>
        {loading.lockingFunds ? 'Creating...' : 'Create Escrow'}
      </button>
    </div>
  );
}
```

### Using Individual Hooks

```typescript
import { ReactSDK } from 'httpay-sdk';

function ToolsComponent() {
  const { tools, refreshTools, loading } = ReactSDK.useRegistry({
    clients,
    walletAddress,
    isWalletConnected,
    hasSigningCapabilities,
    loading: globalLoading,
    setLoadingState
  });

  return (
    <div>
      {loading.fetchingTools ? 'Loading tools...' : (
        <ul>
          {tools.map(tool => (
            <li key={tool.tool_id}>{tool.description}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

### Using React Query Hooks

```typescript
import { useEscrowQuery, useRegistryQuery } from 'httpay-sdk';

function QueryExample() {
  const { data: escrow, isLoading } = useEscrowQuery({
    client: escrowQueryClient,
    args: { escrowId: 123 }
  });

  const { data: tools } = useRegistryQuery({
    client: registryQueryClient,
    args: {}
  });

  return (
    <div>
      {isLoading ? 'Loading...' : <pre>{JSON.stringify(escrow, null, 2)}</pre>}
    </div>
  );
}
```

### Namespace Import (Alternative)

```typescript
import { HTTPay } from 'httpay-sdk';

// Access contract clients through namespace
const escrowClient = new HTTPay.Escrow.EscrowQueryClient(client, address);
const registryClient = new HTTPay.Registry.RegistryQueryClient(client, address);
```

## API Reference

### React Provider

The `HTTPaySDKProvider` creates a complete integration context with wallet management, contract clients, and state management.

```typescript
interface HTTPaySDKConfig {
  rpcEndpoint: string;
  chainId: string;
  registryAddress: string;
  escrowAddress: string;
  gasPrice: string;
  gasAdjustment: number;
}
```

### Main Hook: `useHTTPaySDK()`

Returns the complete SDK context with all functionality:

```typescript
const {
  // Configuration & clients
  config,
  clients,
  
  // Wallet integration
  wallet: {
    isConnected,
    address,
    connect,
    disconnect,
    balance
  },
  
  // Contract hooks
  registry: {
    tools,
    registerTool,
    refreshTools,
    // ... other registry methods
  },
  
  escrow: {
    escrows,
    lockFunds,
    verifyAndRelease,
    refund,
    refreshEscrows,
    // ... other escrow methods
  },
  
  // Loading states
  loading: {
    connecting,
    registering,
    lockingFunds,
    // ... other loading states
  }
} = useHTTPaySDK();
```

## Contract Details

### Escrow Contract

Manages secure payment escrows between service providers and consumers.

**Query Methods:**
- `getEscrow({ escrowId: number })` - Get specific escrow details
- `getEscrows({ caller?, provider?, limit?, startAfter? })` - List escrows with filters
- `getCollectedFees()` - Get platform fees collected

**Execute Methods:**
- `createEscrow({ toolId, maxFee })` - Create a new escrow
- `verifyAndRelease({ escrowId, results, actualUsage })` - Verify service and release funds
- `refund({ escrowId })` - Refund escrow to caller

**Types Available:**
```typescript
import type { 
  EscrowResponse, 
  EscrowsResponse,
  CollectedFeesResponse,
  EscrowTypes 
} from 'httpay-sdk';
```

### Registry Contract

Manages tool and service provider registrations.

**Query Methods:**
- `getTool({ toolId: string })` - Get specific tool details
- `getTools()` - Get all registered tools

**Execute Methods:**
- `registerTool({ toolId, description, price, endpoint, denom? })` - Register a new tool
- `updateTool({ toolId, description?, price?, endpoint?, denom? })` - Update tool information

**Types Available:**
```typescript
import type { 
  ToolResponse, 
  ToolsResponse,
  RegistryTypes 
} from 'httpay-sdk';
```

## Form Validation

The SDK includes Zod schemas for form validation:

```typescript
import { ReactSDK } from 'httpay-sdk';

// Available schemas
const { 
  toolRegistrationSchema,
  escrowCreationSchema,
  escrowVerificationSchema,
  usagePostingSchema,
  escrowsFilterSchema 
} = ReactSDK;

// Example usage
const result = toolRegistrationSchema.safeParse({
  toolId: "my-tool",
  description: "A helpful tool",
  price: "1000000",
  endpoint: "https://api.example.com"
});
```

## Export Structure

The SDK provides multiple ways to import functionality:

### Main Exports (Recommended)
```typescript
// Contract clients and types
import { 
  EscrowQueryClient, 
  EscrowClient,
  RegistryQueryClient, 
  RegistryClient,
  EscrowTypes,
  RegistryTypes 
} from 'httpay-sdk';

// React Query hooks
import { useEscrowQuery, useRegistryQuery } from 'httpay-sdk';
```

### React Integration
```typescript
// Complete React integration
import { ReactSDK } from 'httpay-sdk';

// Individual exports
const { 
  HTTPaySDKProvider,
  useHTTPaySDK,
  useRegistry,
  useEscrow,
  useWalletIntegration,
  useBlockHeight
} = ReactSDK;
```

### Organized Namespace
```typescript
// Access everything through HTTPay namespace
import { HTTPay } from 'httpay-sdk';

const escrowClient = new HTTPay.Escrow.EscrowQueryClient(client, address);
const registryClient = new HTTPay.Registry.RegistryQueryClient(client, address);
```

## TypeScript Support

This package is written in TypeScript and provides full type safety:

```typescript
import type { 
  // Configuration types
  HTTPaySDKConfig,
  HTTPayClients,
  ConnectionState,
  LoadingStates,
  
  // Form types
  ToolRegistrationForm,
  EscrowCreationForm,
  EscrowVerificationForm,
  UsagePostingForm,
  EscrowsFilter,
  
  // Response types
  LockFundsResult,
  VerificationResult,
  ReleaseResult,
  RegistrationResult,
  
  // Contract types
  Tool,
  Escrow,
  
  // All contract types
  EscrowTypes,
  RegistryTypes
} from 'httpay-sdk';
```

## Error Handling

The SDK includes comprehensive error handling utilities:

```typescript
import { ReactSDK } from 'httpay-sdk';

// Error handling is built into all hooks
const { registry } = ReactSDK.useHTTPaySDK();

try {
  await registry.registerTool(formData);
} catch (error) {
  // Errors are automatically handled and formatted
  console.error('Registration failed:', error);
}
```

## Development

To build the package locally:

```bash
pnpm install
pnpm build
```

## License

MIT License - see LICENSE file for details.

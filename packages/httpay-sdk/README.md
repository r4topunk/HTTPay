# HTTPay SDK

TypeScript SDK for HTTPay CosmWasm contracts, providing type-safe interfaces, React hooks, and comprehensive client libraries for interacting with Escrow and Registry contracts.

## Features

- ✅ **Universal compatibility** - Works in any JavaScript environment (browser, Node.js, serverless)
- ✅ **Type-safe contract clients** - Auto-generated TypeScript bindings
- ✅ **Separate React entry point** - Clean separation prevents backend dependency issues
- ✅ **React Query hooks** - Built-in query hooks for efficient data fetching
- ✅ **Wallet integration** - Seamless integration with Cosmos Kit
- ✅ **Form validation** - Zod schemas for form validation
- ✅ **Error handling** - Comprehensive error handling utilities
- ✅ **TypeScript-first** - Full type safety throughout

## Installation

```bash
npm install httpay
# or
yarn add httpay
# or
pnpm add httpay
```

## Dependencies

### Core Dependencies (always required)
```bash
pnpm add @cosmjs/cosmwasm-stargate @cosmjs/proto-signing @cosmjs/stargate zod
```

### React Dependencies (only for React apps)
```bash
pnpm add @cosmos-kit/react @tanstack/react-query react
```

## Quick Start

### Backend / Node.js / Serverless Usage

For backend applications, Node.js scripts, or any non-React environment:

```typescript
// ✅ Safe for backend - no React dependencies
import { EscrowQueryClient, RegistryQueryClient, HTTPay } from 'httpay';
import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate';

const client = await CosmWasmClient.connect('https://rpc.cosmos.network');

const escrowClient = new EscrowQueryClient(client, 'escrow_contract_address');
const registryClient = new RegistryQueryClient(client, 'registry_contract_address');

// Query escrows
const escrows = await escrowClient.getEscrows({ limit: 10 });
const tools = await registryClient.getTools();

// Using namespace import
const escrowClient2 = new HTTPay.Escrow.EscrowQueryClient(client, 'address');
```

### React Applications

For React applications that need hooks and UI components:

```typescript
// ✅ Import React features from '/react' entry point
import { 
  HTTPaySDKProvider,
  useHTTPaySDK,
  useEscrow,
  useRegistry 
} from 'httpay/react';

// You can still import core clients from main entry
import { EscrowClient } from 'httpay';

import { ChainProvider } from '@cosmos-kit/react';

function App() {
  return (
    <ChainProvider>
      <HTTPaySDKProvider
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
      </HTTPaySDKProvider>
    </ChainProvider>
  );
}
```

### Using React Hooks

```typescript
import { useHTTPaySDK } from 'httpay/react';

function MyComponent() {
  const { 
    registry, 
    escrow, 
    wallet,
    loading,
    tools,
    escrows 
  } = useHTTPaySDK();

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
import { useRegistry } from 'httpay/react';

function ToolsComponent() {
  const { tools, refreshTools, loading } = useRegistry({
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
import { 
  useEscrowGetEscrowQuery, 
  useRegistryGetToolsQuery 
} from 'httpay/react';

function QueryExample() {
  const { data: escrow, isLoading } = useEscrowGetEscrowQuery({
    client: escrowQueryClient,
    args: { escrowId: 123 }
  });

  const { data: tools } = useRegistryGetToolsQuery({
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

## Entry Points

The HTTPay SDK provides **two separate entry points** to avoid dependency conflicts:

### Main Entry Point (`httpay`)

- **✅ Safe for any environment** (browser, Node.js, serverless, etc.)
- **✅ No React dependencies** - won't break backend applications
- Contains core clients and types only

```typescript
import { 
  EscrowClient, 
  EscrowQueryClient,
  RegistryClient, 
  RegistryQueryClient,
  EscrowTypes,
  RegistryTypes,
  HTTPay 
} from 'httpay';
```

### React Entry Point (`httpay/react`)

- **⚛️ Only for React applications**
- Contains React hooks, components, and React Query integration
- Requires React as a peer dependency

```typescript
import { 
  // React hooks and providers
  HTTPaySDKProvider,
  useHTTPaySDK,
  useEscrow,
  useRegistry,
  useWalletIntegration,
  
  // React Query hooks
  useEscrowGetEscrowQuery,
  useRegistryGetToolsQuery,
  
  // Re-exported for convenience
  EscrowClient,
  RegistryClient
} from 'httpay/react';
```

## Migration from Old Versions

If you were previously importing React features from the main entry point:

```typescript
// ❌ Old way (causes backend issues)
import { ReactSDK, useEscrow } from 'httpay';

// ✅ New way (React apps)
import { useEscrow, HTTPaySDKProvider } from 'httpay/react';
import { EscrowClient } from 'httpay'; // Core client

// ✅ New way (backend/Node.js)
import { EscrowClient } from 'httpay'; // No React imports needed
```

## High-Level Abstractions

### HTTPayProvider - Simplified Payment Processing

For backend applications and API routes, the SDK provides `HTTPayProvider` - a high-level abstraction that simplifies the entire payment flow:

```typescript
import { HTTPayProvider } from 'httpay';

// Configure your HTTPay setup
const httppayConfig = {
  rpcEndpoint: "https://neutron-rpc.your-node.com",
  registryAddress: "neutron1registry...",
  escrowAddress: "neutron1escrow...", 
  gasPrice: "0.025untrn"
};

// Configure your tool
const toolConfig = {
  toolId: "weather-api",
  provider: {
    privateKey: "your-64-char-hex-private-key" // For signing transactions
  }
};

// Initialize the provider
const provider = new HTTPayProvider(httppayConfig, toolConfig);
await provider.initialize();
```

#### Complete Payment Flow

```typescript
// Handle payment in your API route
async function handlePayment(escrowId: string, authToken: string) {
  const payment = { escrowId, authToken };
  
  // Complete flow: validate + get price + process
  const result = await provider.handlePayment(payment);
  
  if (!result.validation.isValid) {
    return { error: result.validation.error };
  }
  
  if (!result.processing?.success) {
    return { error: result.processing?.error };
  }
  
  return {
    success: true,
    txHash: result.processing.txHash,
    fee: result.price
  };
}
```

#### Individual Methods

```typescript
// 1. Validate payment credentials
const validation = await provider.validatePayment({
  escrowId: "123",
  authToken: "user-provided-token"
});

if (validation.isValid) {
  console.log('Escrow details:', validation.escrow);
}

// 2. Get tool pricing
const { price, error } = await provider.getToolPrice();

// 3. Process payment (release escrow)
const result = await provider.processPayment(123, "1000000");
if (result.success) {
  console.log('Payment processed:', result.txHash);
}
```

#### API Integration Example

```typescript
// Next.js API route example
import { HTTPayProvider } from 'httpay';

const provider = new HTTPayProvider(config, toolConfig);
await provider.initialize();

export async function POST(request: Request) {
  const { escrowId, authToken, ...serviceParams } = await request.json();
  
  // Validate payment first
  const validation = await provider.validatePayment({ escrowId, authToken });
  if (!validation.isValid) {
    return Response.json({ error: validation.error }, { status: 401 });
  }
  
  try {
    // Provide your service
    const serviceResult = await yourServiceLogic(serviceParams);
    
    // Process payment after successful service delivery
    const { price } = await provider.getToolPrice();
    const payment = await provider.processPayment(
      parseInt(escrowId), 
      price!
    );
    
    return Response.json({
      result: serviceResult,
      payment: payment.success ? {
        txHash: payment.txHash,
        fee: payment.fee
      } : { error: payment.error }
    });
    
  } catch (error) {
    return Response.json({ error: 'Service failed' }, { status: 500 });
  }
}
```

#### HTTPayProvider Benefits

- **🔄 Complete Flow Management**: Handles validation → pricing → payment in one call
- **🔐 Built-in Validation**: Verifies escrow ID and auth tokens automatically  
- **💰 Automatic Pricing**: Fetches tool prices from registry
- **🔑 Wallet Management**: Handles signing client setup internally
- **⚡ Optimized for APIs**: Perfect for backend payment processing
- **🛡️ Error Handling**: Comprehensive error handling with clear messages

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
} from 'httpay';
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
} from 'httpay';
```

## Form Validation

The SDK includes Zod schemas for form validation (available in React entry point):

```typescript
import { 
  toolRegistrationSchema,
  escrowCreationSchema,
  escrowVerificationSchema,
  usagePostingSchema,
  escrowsFilterSchema 
} from 'httpay/react';

// Example usage
const result = toolRegistrationSchema.safeParse({
  toolId: "my-tool",
  description: "A helpful tool",
  price: "1000000",
  endpoint: "https://api.example.com"
});
```

## Export Structure

### Core Exports (Backend Safe)
```typescript
// ✅ Works everywhere - no React dependencies
import { 
  // Contract clients
  EscrowQueryClient, 
  EscrowClient,
  RegistryQueryClient, 
  RegistryClient,
  
  // Types
  EscrowTypes,
  RegistryTypes,
  
  // Namespace
  HTTPay
} from 'httpay';
```

### React Integration
```typescript
// ⚛️ React apps only
import { 
  // Complete React integration
  HTTPaySDKProvider,
  useHTTPaySDK,
  useRegistry,
  useEscrow,
  useWalletIntegration,
  useBlockHeight,
  
  // React Query hooks
  useEscrowGetEscrowQuery,
  useRegistryGetToolsQuery,
  // ... other generated hooks
  
  // Contracts with React Query (for backward compatibility)
  EscrowContracts,
  RegistryContracts,
  
  // Re-exported core types
  EscrowClient,
  RegistryClient
} from 'httpay/react';
```

## TypeScript Support

This package is written in TypeScript and provides full type safety:

```typescript
// Core types (from main entry point)
import type { 
  // Contract types  
  EscrowTypes,
  RegistryTypes
} from 'httpay';

// React types (from React entry point)  
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
  
  // Domain types
  Tool,
  EscrowType, // Note: exported as EscrowType to avoid conflicts
} from 'httpay/react';
```

## Error Handling

The SDK includes comprehensive error handling utilities:

```typescript
import { useHTTPaySDK } from 'httpay/react';

// Error handling is built into all hooks
function MyComponent() {
  const { registry } = useHTTPaySDK();

  const handleRegister = async () => {
    try {
      await registry.registerTool(formData);
    } catch (error) {
      // Errors are automatically handled and formatted
      console.error('Registration failed:', error);
    }
  };
}
```

## Benefits of Dual Entry Points

1. **🔧 Backend Safety**: Backend applications won't accidentally import React dependencies
2. **📦 Bundle Optimization**: Frontend apps can still tree-shake unused React features  
3. **🎯 Cleaner Dependencies**: Optional peer dependencies for React-related packages
4. **👩‍💻 Better DevX**: Clear separation between core functionality and React integration
5. **🌍 Universal Compatibility**: Use the same SDK across different environments

## Development

To build the package locally:

```bash
pnpm install
pnpm build
```

This will generate both entry points:
- `dist/index.js` - Core SDK (no React dependencies)
- `dist/react.js` - React integration

## License

MIT License - see LICENSE file for details.

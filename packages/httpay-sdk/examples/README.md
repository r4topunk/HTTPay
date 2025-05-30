# HTTPay SDK Examples

This directory contains examples and migration guides for using the HTTPay SDK.

## Files

- `migration-example.tsx` - Comprehensive example showing how to use HTTPay SDK v2 with React

## Usage

The HTTPay SDK v2 provides React components and hooks for easy integration with the HTTPay protocol. Here's a basic example:

```tsx
import { HTTPaySDKProvider, useHTTPaySDK } from 'httpay/v2';

function MyApp() {
  return (
    <HTTPaySDKProvider
      chainName="neutrontestnet"
      toast={myToastFunction}
      initialConfig={{
        registryAddress: "neutron1...",
        escrowAddress: "neutron1...",
      }}
    >
      <MyComponent />
    </HTTPaySDKProvider>
  );
}

function MyComponent() {
  const { registerTool, tools, loading } = useHTTPaySDK();
  
  // Use the SDK functions...
}
```

## Requirements

When using the React components, your application must provide:

1. **Toast Function**: A function that matches the `ToastFunction` interface for displaying notifications
2. **Chain Name**: The Cosmos chain name for wallet integration (e.g., "neutrontestnet")
3. **Dependencies**: Install required peer dependencies:
   - `@cosmos-kit/react`
   - `@cosmjs/cosmwasm-stargate`
   - `@cosmjs/amino`
   - `react`
   - `zod`

## Migration from V1

If you're migrating from an older version of the HTTPay SDK, see `migration-example.tsx` for a comprehensive guide on the changes and new patterns.

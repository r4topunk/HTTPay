# GetTools Query Implementation

This document describes the implementation of the new GetTools query functionality in the Registry contract and its SDK integration.

## Overview

We've added the ability to query for all registered tools in the Registry contract, allowing for easier discovery of available tools on the platform. This is essential for browsing tools in the frontend and for integration with other components.

## Changes Made

### Contract Changes

1. **Added new query variant**:
   - Added `GetTools` to the `QueryMsg` enum in `msg.rs`
   - Created a new `ToolsResponse` type with a `tools` vector field

2. **Implemented query handler**:
   - Added `query_all_tools` function in `contract.rs`
   - Used `TOOLS.range()` to iterate over all stored tools
   - Transformed storage data into response format

3. **Added comprehensive tests**:
   - Created `query_all_tools.rs` test file
   - Tests cover empty state, multiple tools, mixed providers, and different denoms
   - Validates all tool metadata fields

### SDK Changes

1. **Updated TypeScript types**:
   - Added `get_tools` query type in `RegistryQueryMsg`
   - Created `ToolsResponse` interface to match contract response

2. **Added new SDK method**:
   - Implemented `getTools()` method in `RegistryClient` class
   - Added proper error handling and validation
   - Maintains consistent error messaging style with existing methods

3. **Added unit tests**:
   - Created tests for the new method
   - Tested success case with multiple tools 
   - Tested empty response handling
   - Tested error handling

## Usage

### Contract Query

```rust
use cosmwasm_std::from_json;
use registry::msg::{QueryMsg, ToolsResponse};

// Query for all tools
let query_msg = QueryMsg::GetTools {};
let response: ToolsResponse = from_json(&deps.querier.query_wasm_smart(registry_addr, &query_msg)?)?;

// Access all tools
for tool in response.tools {
    println!("Tool ID: {}, Provider: {}, Price: {}", tool.tool_id, tool.provider, tool.price);
}
```

### SDK Usage

```typescript
import { PayPerToolSDK } from '@toolpay/provider-sdk';

// Initialize SDK
const sdk = new PayPerToolSDK({
  rpcEndpoint: 'https://rpc-pion-1.neutron.org',
  chainId: 'pion-1',
  registryAddress: 'neutron1...',
  escrowAddress: 'neutron1...',
});

// Query all available tools
try {
  const response = await sdk.registry.getTools();
  
  console.log(`Found ${response.tools.length} tools:`);
  
  // Display tools
  response.tools.forEach(tool => {
    console.log(`- ${tool.tool_id}: ${tool.description}`);
    console.log(`  Price: ${tool.price} ${tool.denom}`);
    console.log(`  Provider: ${tool.provider}`);
    console.log(`  Status: ${tool.is_active ? 'Active' : 'Paused'}`);
  });
} catch (error) {
  console.error('Failed to fetch tools:', error.message);
}
```

## Benefits

1. **Enhanced Discovery**: Users can now browse and discover all available tools
2. **Improved UX**: Enables frontend implementations of tool marketplaces and galleries
3. **Better Integration**: Other systems can easily fetch the full list of tools
4. **Efficient Queries**: Retrieves all tools in a single query instead of multiple requests

This feature lays the groundwork for more advanced tool discovery and filtering capabilities in future versions.

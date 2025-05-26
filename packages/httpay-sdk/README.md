# HTTPay SDK

TypeScript SDK for HTTPay CosmWasm contracts, providing type-safe interfaces and React Query hooks for interacting with Escrow and Registry contracts.

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
pnpm add @cosmjs/cosmwasm-stargate @cosmjs/proto-signing @cosmjs/stargate @tanstack/react-query react
```

## Usage

### Basic Import

```typescript
import { EscrowQueryClient, RegistryQueryClient } from 'httpay-sdk';
```

### Using with CosmWasm Stargate Client

```typescript
import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { EscrowQueryClient, RegistryQueryClient } from 'httpay-sdk';

const client = await CosmWasmClient.connect('https://rpc.cosmos.network');

// Initialize contract clients
const escrowClient = new EscrowQueryClient(client, 'escrow_contract_address');
const registryClient = new RegistryQueryClient(client, 'registry_contract_address');

// Query contract state
const escrowState = await escrowClient.getEscrow({ id: 'escrow_id' });
const tools = await registryClient.getTools();
```

### Using with React Query

```typescript
import { useEscrowQuery, useRegistryQuery } from 'httpay-sdk';

function MyComponent() {
  const { data: escrow, isLoading } = useEscrowQuery({
    client: escrowQueryClient,
    args: { id: 'escrow_id' }
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

## Contracts

### Escrow Contract

The Escrow contract manages secure payment escrows between parties.

**Available Queries:**
- `getEscrow({ id: string })` - Get escrow details
- `getEscrows({ limit?: number, start_after?: string })` - List escrows
- `getConfig()` - Get contract configuration

**Available Mutations:**
- `createEscrow(...)` - Create a new escrow
- `releaseEscrow(...)` - Release funds to recipient
- `refundEscrow(...)` - Refund funds to sender

### Registry Contract

The Registry contract manages tool and service provider registrations.

**Available Queries:**
- `getTools()` - Get all registered tools
- `getTool({ id: string })` - Get specific tool details
- `getProvider({ address: string })` - Get provider information

**Available Mutations:**
- `registerTool(...)` - Register a new tool
- `updateTool(...)` - Update tool information
- `registerProvider(...)` - Register as a service provider

## TypeScript Support

This package is written in TypeScript and provides full type safety for all contract interactions.

```typescript
import type { 
  EscrowResponse, 
  Tool, 
  CreateEscrowMsg,
  RegisterToolMsg 
} from 'httpay-sdk';
```

## Development

To build the package locally:

```bash
pnpm install
pnpm build
```

## License

MIT License - see LICENSE file for details.

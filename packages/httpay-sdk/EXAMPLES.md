# Example Usage

Here are some examples of how to use the HTTPay SDK in your project:

## Installation

```bash
npm install httpay @cosmjs/cosmwasm-stargate @cosmjs/stargate @cosmjs/proto-signing @tanstack/react-query react
```

## Basic Usage

```typescript
import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { EscrowQueryClient, RegistryQueryClient } from 'httpay';

// Connect to blockchain
const client = await CosmWasmClient.connect('https://rpc.cosmos.network');

// Initialize contract clients
const escrowClient = new EscrowQueryClient(client, 'your_escrow_contract_address');
const registryClient = new RegistryQueryClient(client, 'your_registry_contract_address');

// Query escrow
const escrow = await escrowClient.getEscrow({ id: 'escrow_123' });
console.log('Escrow:', escrow);

// Query tools
const tools = await registryClient.getTools();
console.log('Tools:', tools);
```

## React Query Usage

```typescript
import { useEscrowGetEscrowQuery, useRegistryGetToolsQuery } from 'httpay';

function MyComponent() {
  const { data: escrow, isLoading } = useEscrowGetEscrowQuery({
    client: escrowQueryClient,
    args: { id: 'escrow_123' }
  });

  const { data: tools } = useRegistryGetToolsQuery({
    client: registryQueryClient,
    args: {}
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <h2>Escrow Details</h2>
      <pre>{JSON.stringify(escrow, null, 2)}</pre>
      
      <h2>Available Tools</h2>
      <pre>{JSON.stringify(tools, null, 2)}</pre>
    </div>
  );
}
```

## Namespace Usage (Alternative)

```typescript
import { HTTPay } from 'httpay';

const escrowClient = new HTTPay.Escrow.EscrowQueryClient(client, address);
const registryClient = new HTTPay.Registry.RegistryQueryClient(client, address);
```

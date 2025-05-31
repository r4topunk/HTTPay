# HTTPay Eliza Plugin Development Tasks - MVP

## Overview

This document outlines the simplified MVP development plan for the HTTPay Eliza plugin. The MVP focuses on the core workflow: list tools, select tool, store selection, and confirm transaction.

## MVP Core Functionality Requirements

- **List Tools**: Display available tools from the HTTPay registry
- **Select Tool**: Choose a tool and store selection in conversation state
- **Show Tool Details**: Display selected tool information and pricing
- **Confirm Transaction**: Create escrow payment for the selected tool

## MVP Architecture Overview

### Simplified Plugin Components

1. **HTTPay Service** - Basic SDK integration for tool listing and escrow creation
2. **Actions** - Three core actions: list, select, confirm
3. **State Management** - Simple tool selection storage per room

### Simplified State Structure

```typescript
interface HTTPayMVPState {
  selectedTool?: {
    toolId: string
    name: string
    description: string
    price: string
    provider: string
  }
}
```

## MVP Task Breakdown

### Phase 1: Basic Setup (Essential Only)

- [x] **Task 1.1**: Update package.json with minimal dependencies

  - Add HTTPay SDK dependency
  - Add basic CosmJS dependencies for transactions

- [x] **Task 1.2**: Create basic plugin configuration

  - Define HTTPAY_PRIVATE_KEY environment variable
  - Add Neutron RPC endpoint
  - Set up contract addresses

- [x] **Task 1.3**: Create minimal TypeScript types
  - HTTPay tool interface
  - Plugin state interface
  - Action parameter types

### Phase 2: Core Service (Minimal Implementation)

- [x] **Task 2.1**: Create basic HTTPayService

  - Initialize service with private key
  - Set up wallet for transactions
  - Basic error handling

- [x] **Task 2.2**: Implement tool listing

  - Fetch tools from registry
  - Basic formatting for display
  - Simple error handling

- [x] **Task 2.3**: Implement escrow creation
  - Create escrow payment
  - Return transaction hash
  - Basic error handling

### Phase 3: Essential Actions Only

- [x] **Task 3.1**: LIST_HTTPAY_TOOLS action

  - Display available tools with basic info
  - Simple formatting
  - No filtering or search

- [x] **Task 3.2**: SELECT_HTTPAY_TOOL action

  - Store tool selection in state
  - Display tool details and price
  - Basic validation

- [x] **Task 3.3**: CONFIRM_HTTPAY_PAYMENT action
  - Show cost breakdown
  - Create escrow transaction
  - Return transaction confirmation

### Phase 4: Basic State Management

- [x] **Task 4.1**: Simple state storage
  - Store selected tool per room
  - Basic state persistence
  - Clear state after transaction

## MVP File Structure (Simplified)

```
packages/eliza-plugin/
├── src/
│   ├── index.ts                 # Main plugin export
│   ├── service.ts               # HTTPay service (single file)
│   ├── actions/
│   │   ├── listTools.ts         # LIST_HTTPAY_TOOLS action
│   │   ├── selectTool.ts        # SELECT_HTTPAY_TOOL action
│   │   └── confirmPayment.ts    # CONFIRM_HTTPAY_PAYMENT action
│   ├── types.ts                 # All types in one file
│   └── utils.ts                 # Basic utilities
└── TASKS.md                     # This file
```

## MVP Dependencies (Minimal)

```json
{
  "dependencies": {
    "httpay": "workspace:*",
    "@cosmjs/cosmwasm-stargate": "^0.32.0",
    "@cosmjs/proto-signing": "^0.32.0"
  }
}
```

## MVP Environment Variables

```bash
# Essential Configuration Only
HTTPAY_PRIVATE_KEY=your_private_key_here
HTTPAY_RPC_ENDPOINT=https://rpc.neutron.org
HTTPAY_REGISTRY_CONTRACT=neutron1...
HTTPAY_ESCROW_CONTRACT=neutron1...
```

## MVP Success Criteria (Simplified)

- [x] Plugin can list tools from HTTPay registry
- [x] Users can select a tool and see its details
- [x] Tool selection is stored in conversation state
- [x] Users can confirm payment and create escrow transaction
- [x] Basic error handling provides user feedback

## MVP Workflow

1. **User**: "List available tools"
2. **Plugin**: Shows tools with basic info (name, price, description)
3. **User**: "Select tool X"
4. **Plugin**: Stores selection, shows tool details and pricing
5. **User**: "Confirm payment"
6. **Plugin**: Creates escrow transaction, shows confirmation

## Implementation Priority

1. **Phase 1**: Setup and configuration (Tasks 1.1-1.3)
2. **Phase 2**: Core service with tool listing and escrow creation (Tasks 2.1-2.3)
3. **Phase 3**: Three essential actions (Tasks 3.1-3.3)
4. **Phase 4**: Basic state management (Task 4.1)

## Out of Scope for MVP

- Tool execution functionality
- Complex state tracking
- Payment history
- Tool recommendations
- Advanced error recovery
- Comprehensive testing
- Detailed documentation
- User preferences
- Caching mechanisms
- Rate limiting
- Advanced validation

## Next Steps for MVP

1. **Start with Task 1.1** - Set up basic dependencies
2. **Task 1.2** - Create minimal configuration
3. **Task 2.1** - Build basic HTTPay service
4. **Task 3.1** - Implement LIST_HTTPAY_TOOLS action

This MVP approach will deliver a working plugin with the core workflow in minimal time, which can then be extended with additional features as needed.

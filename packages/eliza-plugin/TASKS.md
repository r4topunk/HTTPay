# HTTPay Eliza Plugin Development Tasks

## Overview
This document outlines the development plan for the HTTPay Eliza plugin, which will enable AI agents to interact with the HTTPay decentralized tool marketplace, manage escrow payments, and execute tools on behalf of users.

## Core Functionality Requirements
- List available tools from the HTTPay registry
- Store user's tool selection in conversation state
- Confirm tool usage with clear cost breakdown
- Create escrow payments using HTTPAY_PRIVATE_KEY
- Execute tools through the registry API
- Handle payment confirmations and refunds
- Maintain user-specific tool preferences per room/conversation

## Architecture Overview

### Plugin Components
1. **HTTPay Service** - Core service for SDK integration
2. **Actions** - User-facing commands (list, select, confirm, execute)
3. **Providers** - Context providers for tool information
4. **State Management** - Per-room tool selection and escrow tracking
5. **Wallet Integration** - Private key management for transactions

### State Structure
```typescript
interface HTTPayState {
  selectedTool?: {
    toolId: string;
    name: string;
    description: string;
    price: string;
    endpoint: string;
    provider: string;
  };
  pendingEscrow?: {
    escrowId: string;
    amount: string;
    toolId: string;
    status: 'pending' | 'confirmed' | 'executed' | 'refunded';
  };
  userPreferences: {
    autoConfirm?: boolean;
    maxAmount?: string;
  };
}
```

## Task Breakdown

### Phase 1: Project Setup and Configuration
- [ ] **Task 1.1**: Update package.json dependencies
  - Add HTTPay SDK dependency
  - Add CosmJS dependencies
  - Add wallet utilities
  - Update TypeScript configuration

- [ ] **Task 1.2**: Create HTTPay plugin configuration
  - Define HTTPAY_PRIVATE_KEY environment variable
  - Add Neutron RPC endpoint configuration
  - Set up registry and escrow contract addresses
  - Create configuration validation schema

- [ ] **Task 1.3**: Set up TypeScript types
  - Create HTTPay-specific type definitions
  - Define plugin state interfaces
  - Create action parameter types
  - Set up error handling types

### Phase 2: Core Service Implementation
- [ ] **Task 2.1**: Create HTTPayService class
  - Implement service initialization with private key
  - Set up wallet connection and signing client
  - Initialize registry and escrow query clients
  - Implement connection health checks

- [ ] **Task 2.2**: Implement tool fetching functionality
  - Create method to fetch all available tools
  - Add tool filtering and search capabilities
  - Implement caching for tool information
  - Add error handling for network issues

- [ ] **Task 2.3**: Implement escrow management
  - Create escrow creation functionality
  - Add escrow status checking
  - Implement payment confirmation
  - Add refund handling

### Phase 3: State Management
- [ ] **Task 3.1**: Implement state persistence
  - Create room-specific state storage
  - Implement state serialization/deserialization
  - Add state cleanup for expired sessions
  - Create state migration utilities

- [ ] **Task 3.2**: Tool selection management
  - Store selected tool information
  - Track tool usage history
  - Implement tool preference learning
  - Add tool recommendation logic

- [ ] **Task 3.3**: Escrow tracking
  - Track pending escrows per user/room
  - Monitor escrow status changes
  - Handle escrow timeouts
  - Implement payment history

### Phase 4: Action Implementation
- [ ] **Task 4.1**: LIST_TOOLS action
  - Create action to list available tools
  - Add filtering by category/price
  - Implement search functionality
  - Format tool information for display

- [ ] **Task 4.2**: SELECT_TOOL action
  - Create tool selection action
  - Validate tool availability
  - Store selection in state
  - Provide tool details and pricing

- [ ] **Task 4.3**: CONFIRM_PAYMENT action
  - Create payment confirmation action
  - Display clear cost breakdown
  - Require explicit user confirmation
  - Create escrow transaction

- [ ] **Task 4.4**: EXECUTE_TOOL action
  - Execute selected tool with parameters
  - Handle API authentication
  - Process tool responses
  - Update escrow status

### Phase 5: Provider Implementation
- [ ] **Task 5.1**: Tool information provider
  - Provide context about available tools
  - Include pricing and provider information
  - Add tool usage statistics
  - Create tool recommendation context

- [ ] **Task 5.2**: Payment status provider
  - Provide current escrow status
  - Include payment history
  - Add balance information
  - Create transaction summaries

### Phase 6: Error Handling and Validation
- [ ] **Task 6.1**: Input validation
  - Validate tool selection inputs
  - Check payment amount limits
  - Verify user permissions
  - Validate API parameters

- [ ] **Task 6.2**: Error recovery
  - Handle network failures gracefully
  - Implement retry mechanisms
  - Add fallback for service unavailability
  - Create user-friendly error messages

- [ ] **Task 6.3**: Security measures
  - Secure private key handling
  - Validate transaction amounts
  - Prevent double-spending
  - Add rate limiting

### Phase 7: Testing and Documentation
- [ ] **Task 7.1**: Unit tests
  - Test service initialization
  - Test action handlers
  - Test state management
  - Test error scenarios

- [ ] **Task 7.2**: Integration tests
  - Test full workflow scenarios
  - Test wallet integration
  - Test escrow lifecycle
  - Test tool execution

- [ ] **Task 7.3**: Documentation
  - Create plugin usage guide
  - Document configuration options
  - Add troubleshooting guide
  - Create development setup guide

## Implementation Order

### Sprint 1: Foundation (Tasks 1.1 - 2.1)
1. Set up project dependencies and configuration
2. Create basic HTTPay service structure
3. Establish wallet connection

### Sprint 2: Core Functionality (Tasks 2.2 - 3.3)
1. Implement tool fetching and caching
2. Build escrow management system
3. Create state management infrastructure

### Sprint 3: User Actions (Tasks 4.1 - 4.4)
1. Implement all user-facing actions
2. Create action validation and error handling
3. Test action workflows

### Sprint 4: Context and Polish (Tasks 5.1 - 7.3)
1. Implement context providers
2. Add comprehensive error handling
3. Create tests and documentation

## File Structure
```
packages/eliza-plugin/
├── src/
│   ├── index.ts                 # Main plugin export
│   ├── services/
│   │   └── httPayService.ts     # Core HTTPay service
│   ├── actions/
│   │   ├── listTools.ts         # LIST_TOOLS action
│   │   ├── selectTool.ts        # SELECT_TOOL action
│   │   ├── confirmPayment.ts    # CONFIRM_PAYMENT action
│   │   └── executeTool.ts       # EXECUTE_TOOL action
│   ├── providers/
│   │   ├── toolProvider.ts      # Tool information provider
│   │   └── paymentProvider.ts   # Payment status provider
│   ├── types/
│   │   └── httpay.ts           # HTTPay-specific types
│   └── utils/
│       ├── wallet.ts           # Wallet utilities
│       ├── validation.ts       # Input validation
│       └── formatting.ts       # Response formatting
├── __tests__/
│   ├── services/
│   ├── actions/
│   └── providers/
└── TASKS.md                    # This file
```

## Dependencies to Add
```json
{
  "dependencies": {
    "httpay": "workspace:*",
    "@cosmjs/cosmwasm-stargate": "^0.32.0",
    "@cosmjs/proto-signing": "^0.32.0",
    "@cosmjs/stargate": "^0.32.0",
    "bip39": "^3.0.4"
  }
}
```

## Environment Variables
```bash
# HTTPay Configuration
HTTPAY_PRIVATE_KEY=your_private_key_here
HTTPAY_RPC_ENDPOINT=https://rpc.neutron.org
HTTPAY_REGISTRY_CONTRACT=neutron1...
HTTPAY_ESCROW_CONTRACT=neutron1...

# Optional Configuration
HTTPAY_MAX_ESCROW_AMOUNT=1000000
HTTPAY_DEFAULT_GAS_PRICE=0.025
```

## Success Criteria
- [ ] Plugin can successfully list tools from HTTPay registry
- [ ] Users can select tools and see clear pricing information
- [ ] Payment confirmation requires explicit user consent
- [ ] Escrow transactions are created successfully
- [ ] Tools can be executed with proper authentication
- [ ] State is properly maintained per user/room
- [ ] Error handling provides clear user feedback
- [ ] All tests pass with >90% coverage
- [ ] Documentation is complete and accurate

## Risk Mitigation
- **Private Key Security**: Use secure key storage and validation
- **Network Failures**: Implement robust retry and fallback mechanisms
- **State Corruption**: Add state validation and recovery
- **Double Spending**: Implement transaction deduplication
- **API Rate Limits**: Add request throttling and queuing

## Next Steps
1. Start with Task 1.1 - Update package.json dependencies
2. Set up development environment with test network
3. Create basic plugin structure following Eliza patterns
4. Implement core service with wallet integration
5. Build actions incrementally with thorough testing

# HTTPay Eliza Plugin

An Eliza plugin that enables AI agents to discover, select, and pay for blockchain tools using the HTTPay protocol.

## Features

- 🔍 **Tool Discovery**: List all available tools from HTTPay registry
- 🎯 **Tool Selection**: Select specific tools and store them in conversation state
- 💰 **Secure Payments**: Create escrow transactions for selected tools
- 🤖 **AI Integration**: Natural language interaction for payment workflows

## Quick Start

### 1. Installation

```bash
cd packages/eliza-plugin
pnpm install
```

### 2. Configuration

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit `.env` with your actual values:

```bash
# Your wallet private key (64 hex characters)
HTTPAY_PRIVATE_KEY=your_private_key_here

# Neutron RPC endpoint
HTTPAY_RPC_ENDPOINT=https://rpc.neutron.org

# HTTPay contract addresses
HTTPAY_REGISTRY_CONTRACT=neutron1...
HTTPAY_ESCROW_CONTRACT=neutron1...
```

### 3. Build

```bash
pnpm build
```

### 4. Use in Eliza

Add the plugin to your Eliza configuration:

```typescript
import { httpayPlugin } from "@httpay/eliza-plugin"

// Add to your plugins array
const plugins = [
  httpayPlugin,
  // ... other plugins
]
```

## Usage Examples

### List Available Tools

```
User: "List available tools"
Agent: "🛠️ Available HTTPay Tools (3 total)

1. weather-api - 1.000000 NTRN
   📄 Get weather data for any location
   🆔 Tool ID: weather-api
   👤 Provider: neutron1abc...

💡 Use "Select tool [tool-id]" to choose a tool for payment."
```

### Select a Tool

```
User: "Select tool weather-api"
Agent: "✅ Tool Selected Successfully!

🔧 weather-api (ID: weather-api)
📄 Get weather data for any location
💰 Price: 1.000000 NTRN
👤 Provider: neutron1abc...

💡 You can now use "confirm payment" to create an escrow transaction for this tool."
```

### Confirm Payment

```
User: "Confirm payment"
Agent: "💰 Payment Confirmation

🔧 Tool: weather-api (weather-api)
💵 Amount: 1.000000 NTRN
👤 Provider: neutron1abc...
🏦 From Wallet: neutron1xyz...

🔄 Creating escrow transaction...

✅ Payment Escrow Created Successfully!
🔗 Transaction Hash: ABC123...
🆔 Escrow ID: 42
💡 Your payment is now secured in escrow and will be released when the service is provided."
```

## Plugin Actions

### LIST_HTTPAY_TOOLS

- **Triggers**: "list tools", "show tools", "what tools are available"
- **Function**: Displays all tools from HTTPay registry
- **Output**: Formatted list with tool details and pricing

### SELECT_HTTPAY_TOOL

- **Triggers**: "select tool [id]", "choose [id]", "pick tool [id]"
- **Function**: Selects a tool and stores it in conversation state
- **Output**: Tool details and confirmation

### CONFIRM_HTTPAY_PAYMENT

- **Triggers**: "confirm payment", "pay", "create escrow"
- **Function**: Creates escrow transaction for selected tool
- **Output**: Transaction confirmation with escrow ID

## Architecture

```
src/
├── index.ts              # Main plugin export and service
├── service.ts            # HTTPay service integration
├── types.ts              # TypeScript interfaces
├── utils.ts              # Utility functions
└── actions/
    ├── listTools.ts      # LIST_HTTPAY_TOOLS action
    ├── selectTool.ts     # SELECT_HTTPAY_TOOL action
    └── confirmPayment.ts # CONFIRM_HTTPAY_PAYMENT action
```

## State Management

The plugin maintains simple conversation state:

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

## Error Handling

- **Configuration errors**: Clear messages about missing environment variables
- **Network errors**: Friendly messages with retry suggestions
- **Tool not found**: Suggestions to list available tools
- **Payment failures**: Balance and network troubleshooting hints

## Development

### Run Tests

```bash
pnpm test
```

### Format Code

```bash
pnpm format
```

### Development Mode

```bash
pnpm dev
```

## Security Notes

- **Private Key**: Never commit your private key to version control
- **Environment Variables**: Use `.env` file for local development
- **Production**: Use secure environment variable management

## Dependencies

- `httpay`: HTTPay SDK for blockchain interactions
- `@cosmjs/cosmwasm-stargate`: CosmWasm client
- `@cosmjs/proto-signing`: Transaction signing
- `@elizaos/core`: Eliza framework core

## License

MIT License - see LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## Support

For questions and support:

- Create an issue in the repository
- Check the HTTPay documentation
- Review the Eliza plugin development guide

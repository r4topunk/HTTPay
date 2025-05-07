/**
 * AI-Wallet Client Demo Script
 *
 * This script demonstrates a full ToolPay workflow from both the client and provider perspectives.
 * It simulates:
 * 1. Tool registration by a provider
 * 2. Tool discovery by a client
 * 3. Fund locking in an escrow
 * 4. Escrow verification by the provider
 * 5. Service provision and usage reporting
 * 6. Fund claiming by the provider
 *
 * This is meant to be run in a local/test environment with the ToolPay contracts deployed.
 * 
 * Environment Variables:
 * - NETWORK: The network to connect to ('mainnet', 'testnet', or 'local', default: 'local')
 * - RPC_ENDPOINT: Override the RPC endpoint (default: based on network)
 * - CHAIN_ID: Override the chain ID (default: based on network)
 * - REGISTRY_ADDRESS: The address of the registry contract (default: 'neutron1registry')
 * - ESCROW_ADDRESS: The address of the escrow contract (default: 'neutron1escrow')
 * - PROVIDER_PRIVATE_KEY: The private key to use for the provider (default: test key)
 * - CLIENT_MNEMONIC: The mnemonic to use for the client (default: test mnemonic)
 * - TOOL_ID: The ID of the tool to use
 * - TOOL_PRICE: The price of the tool in untrn
 */

// Load environment variables from .env file
import 'dotenv/config';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

// Try to load .env file from the package root directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '..', '.env');

// Check if .env file exists
if (!fs.existsSync(envPath)) {
  console.log(`Warning: No .env file found at ${envPath}. Using environment variables or defaults.`);
  console.log('You can create a .env file by copying .env.example and filling in your values.');
}

import { ToolPaySDK } from '../src/toolPaySDK.js';
import { createWalletFromMnemonic, createWalletFromPrivateKey, getWalletAddress } from '../src/utils/wallet.js';
import { getNetworkDefaults } from '../src/utils/config.js';
import { randomBytes } from 'crypto';
import { ConfigurationError, NetworkError } from '../src/utils/errors.js';

// Get network configuration with defaults (override with environment variables)
const networkType = (process.env.NETWORK || 'testnet') as 'mainnet' | 'testnet' | 'local';
const networkDefaults = getNetworkDefaults(networkType);

// Configuration with type safety
const config = {
  rpcEndpoint: process.env.RPC_ENDPOINT || networkDefaults.rpcEndpoint || 'http://localhost:26657',
  chainId: process.env.CHAIN_ID || networkDefaults.chainId || 'local-testnet',
  registryAddress: process.env.REGISTRY_ADDRESS || 'neutron1mxaqqnh237vu0phcfh6ut8gx3att2dza49r5x9h52fey9gspy5nq54cjhv',
  escrowAddress: process.env.ESCROW_ADDRESS || 'neutron1hg4p3r0vlmca5vwyvxdx6kfd4urg038xsfu0lytrupm3h42sag09wr',
  gasAdjustment: 1.3,
  gasPrice: networkDefaults.gasPrice,
};

// Get private key and mnemonic from environment variables or use defaults for testing
// (never use these defaults in production!)
const providerPrivateKey = process.env.PROVIDER_PRIVATE_KEY as string;
const clientMnemonic = process.env.CLIENT_MNEMONIC as string;

if (!providerPrivateKey) {
  console.error('Provider private key is required. Set PROVIDER_PRIVATE_KEY environment variable.');
  process.exit(1);
}

if (!clientMnemonic) {
  console.error('Client mnemonic is required. Set CLIENT_MNEMONIC environment variable.');
  process.exit(1);
}

// Tool details
const TOOL_ID = process.env.TOOL_ID || 'sentiment-api';
const TOOL_PRICE = process.env.TOOL_PRICE || '1000'; // 0.001 NTRN assuming 6 decimals
const AUTH_TOKEN = randomBytes(16).toString('base64');

/**
 * Main demo function
 */
async function runDemo() {
  console.log('Starting ToolPay AI-Wallet Client Demo');
  console.log('======================================');
  console.log('Network:', networkType);
  console.log('Config:', config);

  try {
    // Create wallets first to get addresses
    console.log('\n🔧 Creating wallets...');
    const providerWallet = await createWalletFromPrivateKey(providerPrivateKey);
    const providerAddress = await getWalletAddress(providerWallet);
    console.log(`Provider address: ${providerAddress} (from private key)`);

    const clientWallet = await createWalletFromMnemonic(clientMnemonic);
    const clientAddress = await getWalletAddress(clientWallet);
    console.log(`Client address: ${clientAddress}`);
    
    // Provider setup
    console.log('\n🔧 Setting up provider SDK...');
    const providerSDK = new ToolPaySDK(config);
    
    try {
      await providerSDK.connectWithPrivateKey(providerPrivateKey);
      console.log('Provider SDK connected successfully using private key');
    } catch (error) {
      if (error instanceof NetworkError) {
        console.error(`Network error: ${error.message}`);
        if (error.details) {
          console.error('Error details:', error.details);
        }
        process.exit(1);
      } else {
        throw error;
      }
    }

    // Client setup
    console.log('\n🔧 Setting up client SDK...');
    const clientSDK = new ToolPaySDK(config);
    
    try {
      await clientSDK.connectWithMnemonic(clientMnemonic);
      console.log('Client SDK connected successfully');
    } catch (error) {
      if (error instanceof NetworkError) {
        console.error(`Network error: ${error.message}`);
        if (error.details) {
          console.error('Error details:', error.details);
        }
        process.exit(1);
      } else {
        throw error;
      }
    }

    // Step 1: Provider registers a tool (skip if already registered)
    console.log('\n📝 Step 1: Checking if tool already registered...');
    
    let toolAlreadyRegistered = false;
    try {
      // First try to get the tool to see if it's already registered
      const existingTool = await providerSDK.registry.getTool(TOOL_ID);
      if (existingTool) {
        console.log(`Tool '${TOOL_ID}' is already registered with provider: ${existingTool.provider}`);
        toolAlreadyRegistered = true;
      }
    } catch (error) {
      // Tool not found, we'll try to register it
      console.log(`Tool not found, will attempt to register it...`);
    }
    
    // Only try to register if not already registered
    if (!toolAlreadyRegistered) {
      try {
        // Note: The registry contract requires a significant deposit for tool registration
        // For this demo, we'll skip actual registration if we get insufficient funds
        await providerSDK.registry.registerTool(
          providerAddress, 
          TOOL_ID, 
          TOOL_PRICE,
          // Include funds for registration deposit if required by contract
          // This is commented out as it depends on contract requirements
          // [{ denom: 'untrn', amount: '1000000000' }]
        );
        console.log(`Tool '${TOOL_ID}' registered successfully`);
      } catch (error) {
        // For demo purposes, we'll continue if registration fails
        console.log(`Tool registration skipped: ${error.message}`);
        console.log('Continuing with demo using existing tool or simulated registration...');
      }
    }

    // Step 2: Client discovers the tool
    console.log('\n🔍 Step 2: Client discovers the tool...');
    
    interface ToolInfo {
      id: string;
      provider: string;
      price: string;
    }
    
    let toolInfo: ToolInfo;
    try {
      const tool = await clientSDK.registry.getTool(TOOL_ID);
      
      if (!tool) {
        throw new Error('Tool not found in registry');
      }
      
      toolInfo = {
        id: TOOL_ID,
        provider: tool.provider,
        price: tool.price,
      };
      
      console.log('Tool discovered:', toolInfo);
    } catch (error) {
      console.log(`Tool discovery failed: ${error.message}`);
      console.log('For demo purposes, continuing with simulated tool data...');
      
      // Create simulated tool data for demo purposes
      toolInfo = {
        id: TOOL_ID,
        provider: providerAddress, // Use the provider address we have
        price: TOOL_PRICE
      };
      
      console.log('Using simulated tool data:', toolInfo);
    }

    // Step 3: Client locks funds in escrow
    console.log('\n💰 Step 3: Client locks funds in escrow...');

    // Current block height for expiration calculation
    const client = clientSDK.getClient();
    if (!client) {
      throw new Error('Failed to get client');
    }
    
    let currentHeight: number;
    try {
      currentHeight = await client.getHeight();
    } catch (error) {
      console.error(`Failed to get current block height: ${error.message}`);
      process.exit(1);
    }
    
    const expiresAt = currentHeight + 50; // Expires in 50 blocks

    let txHash: string;
    try {
      txHash = await clientSDK.escrow.lockFunds(
        clientAddress,
        TOOL_ID,
        TOOL_PRICE,
        AUTH_TOKEN,
        expiresAt,
        [{ denom: 'untrn', amount: TOOL_PRICE }], // Send funds matching the price
      );
      console.log(`Funds locked in escrow, tx hash: ${txHash}`);
      console.log(`Auth token for verification: ${AUTH_TOKEN}`);
    } catch (error) {
      console.error(`Failed to lock funds: ${error.message}`);
      process.exit(1);
    }

    // For demo purposes, we'd need to get the escrow ID from chain
    // In a real implementation, this would be returned in the transaction events
    // For simplicity, we'll simulate by hardcoding escrow ID 1
    const ESCROW_ID = '1';
    console.log(`Using escrow ID: ${ESCROW_ID} (simulated for demo)`);

    // Step 4: Provider verifies the escrow
    console.log('\n✅ Step 4: Provider verifies the escrow...');
    let verificationResult;
    try {
      verificationResult = await providerSDK.verifyEscrow({
        escrowId: ESCROW_ID,
        authToken: AUTH_TOKEN,
        providerAddr: providerAddress,
      });
    } catch (error) {
      console.error(`Failed to verify escrow: ${error.message}`);
      process.exit(1);
    }

    if (verificationResult.isValid && verificationResult.escrow) {
      console.log('Escrow verified successfully!', {
        escrowId: verificationResult.escrow.escrow_id,
        maxFee: verificationResult.escrow.max_fee,
        expires: verificationResult.escrow.expires,
        currentHeight: verificationResult.blockHeight,
      });

      // Step 5: Provider delivers the service (simulated)
      console.log('\n🤖 Step 5: Provider delivers the AI service...');
      console.log('Service delivered successfully (simulated)');

      // Step 6: Provider reports usage and claims funds
      console.log('\n💸 Step 6: Provider reports usage and claims funds...');

      // Use half the max fee for the demo
      const usageFee = (parseInt(TOOL_PRICE) / 2).toString();

      try {
        const usageResult = await providerSDK.postUsage(providerAddress, {
          escrowId: ESCROW_ID,
          usageFee,
          options: {
            memo: 'Payment for sentiment analysis service',
          },
        });

        console.log('Usage reported and funds claimed successfully!', {
          txHash: usageResult.txHash,
          gasUsed: usageResult.gasUsed,
          fee: usageResult.fee,
        });

        console.log('\n✨ Demo completed successfully! ✨');
      } catch (error) {
        console.error(`Failed to report usage: ${error.message}`);
        process.exit(1);
      }
    } else {
      console.error('Escrow verification failed:', verificationResult.error);
      process.exit(1);
    }
  } catch (error) {
    if (error instanceof ConfigurationError) {
      console.error(`Configuration error: ${error.message}`);
    } else if (error instanceof NetworkError) {
      console.error(`Network error: ${error.message}`);
    } else if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
    } else {
      console.error('Unknown error:', error);
    }
    process.exit(1);
  }
}

// Run the demo if this script is executed directly
// In ES modules, we can check if the current module is the main module by checking import.meta.url
// against the Node.js process's entry point
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  runDemo().catch((error) => {
    console.error('Unhandled error in demo:', error);
    process.exit(1);
  });
}

export { runDemo };

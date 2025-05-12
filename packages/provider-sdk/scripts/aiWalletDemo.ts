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
 * - CLIENT_PRIVATE_KEY: The private key to use for the client (default: test key)
 * - TOOL_ID: The ID of the tool to use
 * - TOOL_PRICE: The price of the tool in untrn
 */

// Load environment variables from .env file
import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { randomBytes } from 'crypto';
import { ToolPaySDK } from '../src/toolPaySDK.js';
import { getNetworkDefaults } from '../src/utils/config.js';
import { ConfigurationError, NetworkError } from '../src/utils/errors.js';
import { createWalletFromPrivateKey, getWalletAddress } from '../src/utils/wallet.js';
import { OfflineDirectSigner } from '@cosmjs/proto-signing';

// Types for cleaner code
interface WalletInfo {
  wallet: OfflineDirectSigner;
  address: string;
}

interface SDKs {
  provider: ToolPaySDK;
  client: ToolPaySDK;
}

interface ToolInfo {
  id: string;
  provider: string;
  price: string;
}

interface EscrowDetails {
  escrowId: string;
  authToken: string;
  expiresAt: number;
}

// Try to load .env file from the package root directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '..', '.env');

// Check if .env file exists
if (!fs.existsSync(envPath)) {
  console.log(`Warning: No .env file found at ${envPath}. Using environment variables or defaults.`);
  console.log('You can create a .env file by copying .env.example and filling in your values.');
}

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

// Get private keys from environment variables or use defaults for testing
// (never use these defaults in production!)
const providerPrivateKey = process.env.PROVIDER_PRIVATE_KEY as string;
const clientPrivateKey = process.env.CLIENT_PRIVATE_KEY as string;

if (!providerPrivateKey) {
  console.error('Provider private key is required. Set PROVIDER_PRIVATE_KEY environment variable.');
  process.exit(1);
}

if (!clientPrivateKey) {
  console.error('Client private key is required. Set CLIENT_PRIVATE_KEY environment variable.');
  process.exit(1);
}

// Tool details
const TOOL_ID = process.env.TOOL_ID || 'sentiment-api';
const TOOL_PRICE = process.env.TOOL_PRICE || '1000'; // 0.001 NTRN assuming 6 decimals
const AUTH_TOKEN = randomBytes(16).toString('base64');

/**
 * Create wallet info objects for both the provider and client
 */
async function setupWallets(): Promise<{ provider: WalletInfo; client: WalletInfo }> {
  console.log('\n🔧 Creating wallets...');
  
  const providerWallet = await createWalletFromPrivateKey(providerPrivateKey);
  const providerAddress = await getWalletAddress(providerWallet);
  console.log(`Provider address: ${providerAddress}`);
  
  const clientWallet = await createWalletFromPrivateKey(clientPrivateKey);
  const clientAddress = await getWalletAddress(clientWallet);
  console.log(`Client address: ${clientAddress}`);
  
  return {
    provider: { wallet: providerWallet, address: providerAddress },
    client: { wallet: clientWallet, address: clientAddress }
  };
}

/**
 * Query wallet balances to ensure they have sufficient funds
 */
async function checkBalances(providerAddress: string, clientAddress: string): Promise<void> {
  console.log('\n💰 Querying wallet balances...');
  const tempSDK = new ToolPaySDK(config);
  
  try {
    await tempSDK.connectWithPrivateKey(providerPrivateKey);
    const client = tempSDK.getClient();
    
    if (!client) {
      console.warn('Could not get client for balance check');
      return;
    }
    
    const denom = 'untrn'; // Default denom
    
    try {
      const providerBalance = await client.getBalance(providerAddress, denom);
      console.log(`Provider balance: ${providerBalance.amount}${providerBalance.denom}`);
      
      const clientBalance = await client.getBalance(clientAddress, denom);
      console.log(`Client balance: ${clientBalance.amount}${clientBalance.denom}`);
    } catch (error) {
      console.warn(`Balance check failed: ${(error as Error).message}`);
    }
  } catch (error) {
    console.warn(`SDK connection failed: ${(error as Error).message}`);
  }
}

/**
 * Initialize the SDKs for both provider and client
 */
async function initializeSDKs(): Promise<SDKs> {
  console.log('\n🔧 Initializing SDKs...');
  
  // Provider SDK
  const providerSDK = new ToolPaySDK(config);
  await providerSDK.connectWithPrivateKey(providerPrivateKey)
    .catch(handleConnectionError);
  console.log('Provider SDK connected');
  
  // Client SDK
  const clientSDK = new ToolPaySDK(config);
  await clientSDK.connectWithPrivateKey(clientPrivateKey)
    .catch(handleConnectionError);
  console.log('Client SDK connected');
  
  return { provider: providerSDK, client: clientSDK };
}

/**
 * Register a tool if it's not already registered
 */
async function registerTool(
  sdk: ToolPaySDK, 
  providerAddress: string
): Promise<ToolInfo> {
  console.log('\n📝 Step 1: Registering tool...');
  
  try {
    // Check if tool already exists
    const existingTool = await sdk.registry.getTool(TOOL_ID);
    
    if (existingTool) {
      console.log(`Tool '${TOOL_ID}' already registered with provider: ${existingTool.provider}`);
      return {
        id: TOOL_ID,
        provider: existingTool.provider,
        price: existingTool.price,
      };
    }
  } catch (error) {
    console.log(`Tool not found, will register it now...`);
  }
  
  try {
    await sdk.registry.registerTool(
      providerAddress, 
      TOOL_ID, 
      TOOL_PRICE
    );
    console.log(`Tool '${TOOL_ID}' registered successfully`);
  } catch (error) {
    console.log(`Tool registration skipped: ${(error as Error).message}`);
    console.log('Continuing demo with simulated registration...');
  }
  
  return {
    id: TOOL_ID,
    provider: providerAddress,
    price: TOOL_PRICE
  };
}

/**
 * Client discovers a tool by ID
 */
async function discoverTool(
  sdk: ToolPaySDK, 
  providerAddress: string
): Promise<ToolInfo> {
  console.log('\n🔍 Step 2: Discovering tool...');
  
  try {
    const tool = await sdk.registry.getTool(TOOL_ID);
    
    if (!tool) {
      throw new Error('Tool not found in registry');
    }
    
    const toolInfo = {
      id: TOOL_ID,
      provider: tool.provider,
      price: tool.price,
    };
    
    console.log('Tool discovered:', toolInfo);
    return toolInfo;
  } catch (error) {
    console.log(`Tool discovery failed: ${(error as Error).message}`);
    console.log('Using simulated tool data for demo');
    
    // Fallback to simulated data
    const toolInfo = {
      id: TOOL_ID,
      provider: providerAddress,
      price: TOOL_PRICE
    };
    
    console.log('Simulated tool:', toolInfo);
    return toolInfo;
  }
}

/**
 * Client locks funds in escrow for using the tool
 */
async function lockFundsInEscrow(
  sdk: ToolPaySDK, 
  clientAddress: string
): Promise<EscrowDetails> {
  console.log('\n💰 Step 3: Locking funds in escrow...');
  
  const client = sdk.getClient();
  if (!client) {
    throw new Error('Failed to get client');
  }
  
  // Get current block height for expiration
  const currentHeight = await client.getHeight();
  const expiresAt = currentHeight + 50; // Expires in 50 blocks
  
  try {
    // Lock funds
    const txHash = await sdk.escrow.lockFunds(
      clientAddress,
      TOOL_ID,
      TOOL_PRICE,
      AUTH_TOKEN,
      expiresAt,
      [{ denom: 'untrn', amount: TOOL_PRICE }]
    );
    console.log(`Funds locked, tx hash: ${txHash}`);
    
    // Extract escrow ID from transaction
    const txResult = await client.getTx(txHash);
    if (!txResult) {
      throw new Error(`Transaction not found: ${txHash}`);
    }
    
    const wasmEvents = txResult.events.filter(event => event.type === 'wasm');
    const escrowIdAttr = wasmEvents
      .flatMap(event => event.attributes)
      .find(attr => attr.key === 'escrow_id');
    
    const escrowId = escrowIdAttr?.value || '1';
    console.log(`Escrow ID: ${escrowId}, Auth Token: ${AUTH_TOKEN}`);
    
    return {
      escrowId,
      authToken: AUTH_TOKEN,
      expiresAt
    };
  } catch (error) {
    console.log(`Error locking funds: ${(error as Error).message}`);
    console.log('Using fallback escrow ID: 1');
    
    return {
      escrowId: '1',
      authToken: AUTH_TOKEN,
      expiresAt
    };
  }
}

/**
 * Provider verifies the escrow
 */
async function verifyEscrow(
  sdk: ToolPaySDK, 
  escrow: EscrowDetails, 
  providerAddress: string
): Promise<boolean> {
  console.log('\n✅ Step 4: Verifying escrow...');
  
  try {
    const result = await sdk.verifyEscrow({
      escrowId: escrow.escrowId,
      authToken: escrow.authToken,
      providerAddr: providerAddress,
    });
    
    if (result.isValid && result.escrow) {
      console.log('Escrow verified successfully!', {
        escrowId: result.escrow.escrow_id,
        maxFee: result.escrow.max_fee,
        expires: result.escrow.expires,
      });
      return true;
    } else {
      console.error('Escrow verification failed:', result.error);
      return false;
    }
  } catch (error) {
    console.error(`Error verifying escrow: ${(error as Error).message}`);
    return false;
  }
}

/**
 * Provider completes service and claims payment
 */
async function deliverServiceAndClaim(
  sdk: ToolPaySDK, 
  escrow: EscrowDetails, 
  providerAddress: string
): Promise<boolean> {
  // Step 5: Service delivery (simulated)
  console.log('\n🤖 Step 5: Delivering AI service...');
  console.log('Service delivered successfully (simulated)');
  
  // Step 6: Report usage and claim funds
  console.log('\n💸 Step 6: Claiming payment...');
  const usageFee = (parseInt(TOOL_PRICE) / 2).toString(); // Use half price for demo
  
  try {
    const result = await sdk.postUsage(providerAddress, {
      escrowId: escrow.escrowId,
      usageFee,
      options: {
        memo: 'Payment for sentiment analysis service',
      },
    });
    
    console.log('Payment claimed successfully!', {
      txHash: result.txHash,
      fee: result.fee,
    });
    
    return true;
  } catch (error) {
    console.error(`Failed to claim payment: ${(error as Error).message}`);
    return false;
  }
}

/**
 * Handle connection errors
 */
function handleConnectionError(error: any): never {
  if (error instanceof NetworkError) {
    console.error(`Network error: ${error.message}`);
    if (error.details) {
      console.error('Details:', error.details);
    }
  } else {
    console.error(`Connection error: ${error.message}`);
  }
  process.exit(1);
}

/**
 * Main demo function using all the helper functions
 */
async function runDemo() {
  console.log('Starting ToolPay AI-Wallet Client Demo');
  console.log('======================================');
  console.log('Network:', networkType);
  
  try {
    // Step 1: Setup wallets
    const wallets = await setupWallets();
    
    // Step 2: Check balances
    await checkBalances(wallets.provider.address, wallets.client.address);
    
    // Step 3: Initialize SDKs
    const sdks = await initializeSDKs();
    
    // Step 4: Provider registers a tool
    const toolInfo = await registerTool(sdks.provider, wallets.provider.address);
    
    // Step 5: Client discovers the tool
    await discoverTool(sdks.client, wallets.provider.address);
    
    // Step 6: Client locks funds in escrow
    const escrow = await lockFundsInEscrow(sdks.client, wallets.client.address);
    
    // Step 7: Provider verifies the escrow
    const isVerified = await verifyEscrow(sdks.provider, escrow, wallets.provider.address);
    
    if (!isVerified) {
      console.error('Demo failed: Escrow verification failed');
      process.exit(1);
    }
    
    // Step 8: Provider delivers service and claims payment
    const isSuccess = await deliverServiceAndClaim(sdks.provider, escrow, wallets.provider.address);
    
    if (isSuccess) {
      console.log('\n✨ Demo completed successfully! ✨');
    } else {
      console.error('Demo failed: Service delivery or payment failed');
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
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  runDemo().catch((error) => {
    console.error('Unhandled error in demo:', error);
    process.exit(1);
  });
}

export { runDemo };

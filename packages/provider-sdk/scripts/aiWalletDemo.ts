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
 */

import { ToolPaySDK } from '../src/toolPaySDK.js';
import { createWalletFromMnemonic, getWalletAddress } from '../src/utils/wallet.js';
import { randomBytes } from 'crypto';

// Configuration
const config = {
  rpcEndpoint: process.env.RPC_ENDPOINT || 'http://localhost:26657',
  chainId: process.env.CHAIN_ID || 'local-testnet',
  registryAddress: process.env.REGISTRY_ADDRESS || 'neutron1registry',
  escrowAddress: process.env.ESCROW_ADDRESS || 'neutron1escrow',
};

// Test mnemonics (don't use these in production!)
const providerMnemonic =
  'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
const clientMnemonic =
  'notice oak worry limit wrap speak medal online prefer cluster roof addict wrist behave treat actual wasp year salad speed social layer crew genius';

// Tool details
const TOOL_ID = 'sentiment-api';
const TOOL_PRICE = '1000000'; // 1 NTRN assuming 6 decimals
const AUTH_TOKEN = randomBytes(16).toString('base64');

/**
 * Main demo function
 */
async function runDemo() {
  console.log('Starting ToolPay AI-Wallet Client Demo');
  console.log('======================================');
  console.log('Config:', config);

  try {
    // Provider setup
    console.log('\n🔧 Setting up provider wallet and SDK...');
    const providerWallet = await createWalletFromMnemonic(providerMnemonic);
    const providerAddress = await getWalletAddress(providerWallet);
    console.log(`Provider address: ${providerAddress}`);

    const providerSDK = new ToolPaySDK(config);
    await providerSDK.connectWithMnemonic(providerMnemonic);
    console.log('Provider SDK connected successfully');

    // Client setup
    console.log('\n🔧 Setting up client wallet and SDK...');
    const clientWallet = await createWalletFromMnemonic(clientMnemonic);
    const clientAddress = await getWalletAddress(clientWallet);
    console.log(`Client address: ${clientAddress}`);

    const clientSDK = new ToolPaySDK(config);
    await clientSDK.connectWithMnemonic(clientMnemonic);
    console.log('Client SDK connected successfully');

    // Step 1: Provider registers a tool
    console.log('\n📝 Step 1: Provider registers a tool...');
    try {
      await providerSDK.registry.registerTool(providerAddress, TOOL_ID, TOOL_PRICE);
      console.log(`Tool '${TOOL_ID}' registered successfully`);
    } catch (error) {
      console.log(`Tool likely already registered: ${error.message}`);
    }

    // Step 2: Client discovers the tool
    console.log('\n🔍 Step 2: Client discovers the tool...');
    const tool = await clientSDK.registry.getTool(TOOL_ID);
    console.log('Tool discovered:', {
      id: TOOL_ID,
      provider: tool.provider,
      price: tool.price,
    });

    // Step 3: Client locks funds in escrow
    console.log('\n💰 Step 3: Client locks funds in escrow...');

    // Current block height for expiration calculation
    const client = clientSDK.getClient();
    if (!client) {
      throw new Error('Failed to get client');
    }
    const currentHeight = await client.getHeight();
    const expiresAt = currentHeight + 50; // Expires in 50 blocks

    const txHash = await clientSDK.escrow.lockFunds(
      clientAddress,
      TOOL_ID,
      TOOL_PRICE,
      AUTH_TOKEN,
      expiresAt,
      [{ denom: 'untrn', amount: TOOL_PRICE }], // Send funds matching the price
    );
    console.log(`Funds locked in escrow, tx hash: ${txHash}`);
    console.log(`Auth token for verification: ${AUTH_TOKEN}`);

    // For demo purposes, we'd need to get the escrow ID from chain
    // In a real implementation, this would be returned in the transaction events
    // For simplicity, we'll simulate by hardcoding escrow ID 1
    const ESCROW_ID = '1';
    console.log(`Using escrow ID: ${ESCROW_ID} (simulated for demo)`);

    // Step 4: Provider verifies the escrow
    console.log('\n✅ Step 4: Provider verifies the escrow...');
    const verificationResult = await providerSDK.verifyEscrow({
      escrowId: ESCROW_ID,
      authToken: AUTH_TOKEN,
      providerAddr: providerAddress,
    });

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
    } else {
      console.error('Escrow verification failed:', verificationResult.error);
    }
  } catch (error) {
    console.error('Demo failed with error:', error);
  }
}

// Run the demo if this script is executed directly
if (require.main === module) {
  runDemo().catch(console.error);
}

export { runDemo };

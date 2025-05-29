import { NextRequest, NextResponse } from 'next/server';
import { CosmWasmClient, SigningCosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { DirectSecp256k1Wallet } from '@cosmjs/proto-signing';
import { GasPrice } from '@cosmjs/stargate';

import { EscrowQueryClient, EscrowClient } from 'httpay-sdk/src/Escrow/Escrow.client';
import type { EscrowResponse } from 'httpay-sdk/src/Escrow/Escrow.types';
import { RegistryQueryClient } from 'httpay-sdk/src/Registry/Registry.client';

// HTTPay configuration for Neutron testnet
const HTTPAY_CONFIG = {
  rpcEndpoint: process.env.NEXT_PUBLIC_RPC_ENDPOINT as string,
  registryAddress: process.env.NEXT_PUBLIC_REGISTRY_ADDRESS as string,
  escrowAddress: process.env.NEXT_PUBLIC_ESCROW_ADDRESS as string,
  providerPrivateKey: process.env.CLIENT_PRIVATE_KEY as string,
  toolId: 'weather',
} as const;

// Mock weather data for San Francisco
const WEATHER_DATA = {
  location: { 
    name: 'San Francisco', 
    country: 'United States', 
    lat: 37.7749, 
    lon: -122.4194 
  },
  current: { 
    temperature: 72, 
    condition: 'Partly Cloudy', 
    humidity: 65, 
    windSpeed: 8, 
    windDirection: 'NW', 
    pressure: 1013, 
    uvIndex: 5, 
    visibility: 10, 
    feelsLike: 75 
  },
  forecast: [
    { date: '2025-05-29', day: 'Today', high: 75, low: 58, condition: 'Partly Cloudy', chanceOfRain: 10 },
    { date: '2025-05-30', day: 'Tomorrow', high: 78, low: 61, condition: 'Sunny', chanceOfRain: 5 },
    { date: '2025-05-31', day: 'Saturday', high: 73, low: 59, condition: 'Cloudy', chanceOfRain: 25 },
    { date: '2025-06-01', day: 'Sunday', high: 69, low: 56, condition: 'Light Rain', chanceOfRain: 80 },
    { date: '2025-06-02', day: 'Monday', high: 71, low: 57, condition: 'Partly Cloudy', chanceOfRain: 15 },
  ]
} as const;

// Utility function to create consistent error responses
function createErrorResponse(
  status: number,
  error: string,
  message: string,
  details?: string | Record<string, unknown>
): NextResponse {
  return NextResponse.json(
    { success: false, error, message, ...(details && { details }) },
    { status }
  );
}

/**
 * Creates a CosmWasm client connection
 */
async function createCosmWasmClient(): Promise<CosmWasmClient> {
  return CosmWasmClient.connect(HTTPAY_CONFIG.rpcEndpoint);
}

/**
 * Creates a signing client with provider wallet
 */
async function createSigningClient(): Promise<{ client: SigningCosmWasmClient; address: string }> {
  if (!HTTPAY_CONFIG.providerPrivateKey || !/^[0-9a-fA-F]{64}$/.test(HTTPAY_CONFIG.providerPrivateKey)) {
    throw new Error('Invalid private key. Must be a 64-character hex string.');
  }

  const privateKey = new Uint8Array(
    HTTPAY_CONFIG.providerPrivateKey.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []
  );
  
  const wallet = await DirectSecp256k1Wallet.fromKey(privateKey, 'neutron');
  const [providerAccount] = await wallet.getAccounts();
  
  const client = await SigningCosmWasmClient.connectWithSigner(
    HTTPAY_CONFIG.rpcEndpoint,
    wallet,
    { gasPrice: GasPrice.fromString('0.025untrn') }
  );

  return { client, address: providerAccount.address };
}
/**
 * Fetches tool information from the registry to get the correct price
 */
async function getToolPrice(toolId: string): Promise<{ price?: string; error?: string }> {
  try {
    const cosmWasmClient = await createCosmWasmClient();
    const registryQueryClient = new RegistryQueryClient(cosmWasmClient, HTTPAY_CONFIG.registryAddress);

    const toolResponse = await registryQueryClient.getTool({ toolId });

    if (!toolResponse?.price) {
      return { error: 'Tool not found in registry or price not set' };
    }

    console.log('Tool information retrieved from registry:', {
      toolId,
      price: toolResponse.price,
      denom: toolResponse.denom,
      description: toolResponse.description,
    });

    return { price: toolResponse.price };
  } catch (error) {
    console.error('Registry query error:', error);
    return { 
      error: error instanceof Error ? error.message : 'Unknown registry error' 
    };
  }
}

/**
 * Validates escrow data using HTTPay SDK
 */
async function validateEscrow(
  escrowId: number,
  authToken: string
): Promise<{ isValid: boolean; escrow?: EscrowResponse; error?: string }> {
  try {
    const cosmWasmClient = await createCosmWasmClient();
    const escrowQueryClient = new EscrowQueryClient(cosmWasmClient, HTTPAY_CONFIG.escrowAddress);

    const escrow = await escrowQueryClient.getEscrow({ escrowId });

    if (!escrow) {
      return { isValid: false, error: 'Escrow not found' };
    }

    console.log('Escrow data retrieved:', escrow);

    const tokenMatches = escrow.auth_token === authToken;
    
    console.log('Auth token validation:', {
      stored: escrow.auth_token,
      provided: authToken,
      matches: tokenMatches
    });

    if (!tokenMatches) {
      return { isValid: false, error: 'Invalid auth token' };
    }

    if (escrow.expires <= 0) {
      return { isValid: false, error: 'Escrow has expired' };
    }

    return { isValid: true, escrow };
  } catch (error) {
    console.error('Escrow validation error:', error);
    return { 
      isValid: false, 
      error: error instanceof Error ? error.message : 'Unknown validation error' 
    };
  }
}

/**
 * Releases escrow funds to charge the user for API usage
 */
async function releaseEscrowFunds(
  escrowId: number,
  usageFee: string
): Promise<{ success: boolean; error?: string; txHash?: string }> {
  try {
    if (!HTTPAY_CONFIG.providerPrivateKey) {
      throw new Error('Provider private key not configured');
    }

    const { client, address } = await createSigningClient();
    console.log('Signing client created for address:', address);
    const escrowClient = new EscrowClient(client, address, HTTPAY_CONFIG.escrowAddress);

    console.log('Releasing escrow funds:', { escrowId, usageFee, providerAddress: address });

    const result = await escrowClient.release({ escrowId, usageFee });

    console.log('Escrow release successful:', result.transactionHash);

    return {
      success: true,
      txHash: result.transactionHash,
    };
  } catch (error) {
    console.error('Escrow release error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown release error',
    };
  }
}

/**
 * Returns weather data with current timestamp
 */
function generateWeatherData() {
  return {
    ...WEATHER_DATA,
    lastUpdated: new Date().toISOString(),
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const escrowId = searchParams.get('escrowId');
    const authToken = searchParams.get('authToken');

    // Validate required parameters
    if (!escrowId || !authToken) {
      console.log('Missing required parameters - returning 402');
      return createErrorResponse(
        402,
        'Payment Required',
        'Valid escrowId and authToken are required to access this service',
        {
          hint: 'Add query parameters: ?escrowId=123&authToken=your-token',
          received: {
            escrowId: escrowId || 'missing',
            authToken: authToken ? 'provided' : 'missing'
          }
        }
      );
    }

    // Parse and validate escrowId
    const escrowIdNum = parseInt(escrowId, 10);
    if (isNaN(escrowIdNum)) {
      return createErrorResponse(
        402,
        'Payment Required',
        'Invalid escrowId format - must be a number'
      );
    }

    console.log('Validating escrow:', { escrowIdNum, authToken: `${authToken.substring(0, 10)}...` });

    // Validate escrow credentials
    const validation = await validateEscrow(escrowIdNum, authToken);
    if (!validation.isValid) {
      console.log('Escrow validation failed:', validation.error);
      return createErrorResponse(
        402,
        'Payment Required',
        validation.error || 'Invalid escrow credentials'
      );
    }

    console.log('Escrow validation successful, generating weather data');

    // Get tool pricing from registry
    console.log('Fetching tool price from registry...');
    const toolPriceResult = await getToolPrice(HTTPAY_CONFIG.toolId);

    if (toolPriceResult.error || !toolPriceResult.price) {
      console.error('Failed to fetch tool price from registry:', toolPriceResult.error);
      return createErrorResponse(
        500,
        'Service Configuration Error',
        'Failed to fetch pricing information from registry',
        toolPriceResult.error
      );
    }

    const usageFee = toolPriceResult.price;
    console.log(`Using dynamic pricing from registry: ${usageFee} for tool ${HTTPAY_CONFIG.toolId}`);

    // Process payment by releasing escrow funds
    console.log('Releasing escrow funds for usage...');
    const releaseResult = await releaseEscrowFunds(escrowIdNum, usageFee);

    if (!releaseResult.success) {
      console.error('Failed to release escrow funds:', releaseResult.error);
      return createErrorResponse(
        500,
        'Payment Processing Failed',
        'Failed to process payment for API usage',
        releaseResult.error
      );
    }

    console.log(`Payment processed successfully for escrow ${escrowIdNum}, tx: ${releaseResult.txHash}`);

    // Generate and return weather data
    const weatherResponse = generateWeatherData();
    console.log(`Weather API accessed successfully for escrow ${escrowIdNum} at ${new Date().toISOString()}`);

    return NextResponse.json({
      success: true,
      data: weatherResponse,
      escrow: {
        id: escrowIdNum,
        provider: validation.escrow?.provider,
        maxFee: validation.escrow?.max_fee,
        expires: validation.escrow?.expires,
      },
      usage: {
        timestamp: new Date().toISOString(),
        fee: usageFee,
        transactionHash: releaseResult.txHash,
      },
    });
    
  } catch (error) {
    console.error('Weather API error:', error);
    return createErrorResponse(
      500,
      'Internal server error',
      'An error occurred while processing your request',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}
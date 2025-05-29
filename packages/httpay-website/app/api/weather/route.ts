import { NextRequest, NextResponse } from 'next/server';
import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate';

// Import only the specific types and client we need, avoiding React hooks
import { EscrowQueryClient } from 'httpay-sdk/src/Escrow/Escrow.client';
import type { EscrowResponse } from 'httpay-sdk/src/Escrow/Escrow.types';

// HTTPay configuration for Neutron testnet
const HTTPAY_CONFIG = {
  rpcEndpoint: process.env.NEXT_PUBLIC_RPC_ENDPOINT as string,
  registryAddress: process.env.NEXT_PUBLIC_REGISTRY_ADDRESS as string,
  escrowAddress: process.env.NEXT_PUBLIC_ESCROW_ADDRESS as string,
  providerPrivateKey: process.env.PROVIDER_PRIVATE_KEY as string,
  toolId: 'weather', // Our tool ID in the registry
};

// Mock weather data for San Francisco
const weatherData = {
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
};

// Validation schema for escrow verification request
// Interface removed as we now use query parameters instead of request body

/**
 * Validates escrow data using HTTPay SDK
 */
async function validateEscrow(
  escrowId: number,
  authToken: string
): Promise<{ isValid: boolean; escrow?: EscrowResponse; error?: string }> {
  try {
    // Connect to Neutron RPC
    const cosmWasmClient = await CosmWasmClient.connect(HTTPAY_CONFIG.rpcEndpoint);
    const escrowQueryClient = new EscrowQueryClient(cosmWasmClient, HTTPAY_CONFIG.escrowAddress);

    // Fetch escrow data
    const escrow = await escrowQueryClient.getEscrow({ escrowId });

    // Validate escrow exists
    if (!escrow) {
      return { isValid: false, error: 'Escrow not found' };
    }

    console.log('Escrow data retrieved:', escrow);

    // Validate auth token matches (both tokens should be base64 encoded)
    const tokenMatches = escrow.auth_token === authToken;
    
    console.log('Auth token validation:', {
      stored: escrow.auth_token,
      provided: authToken,
      matches: tokenMatches
    });

    if (!tokenMatches) {
      return { isValid: false, error: 'Invalid auth token' };
    }

    // Validate escrow hasn't expired (check against current block height)
    // Note: In a real implementation, you'd need to get current block height
    // For demo purposes, we'll assume it's valid if expires > 0
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
 * Returns simplified weather data for San Francisco
 */
function generateWeatherData() {
  return {
    ...weatherData,
    lastUpdated: new Date().toISOString(),
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const escrowId = searchParams.get('escrowId');
    const authToken = searchParams.get('authToken');

    // Validate required fields
    if (!escrowId || !authToken) {
      console.log('Missing required parameters - returning 402');
      const response = NextResponse.json(
        {
          success: false,
          error: 'Payment Required',
          message: 'Valid escrowId and authToken are required to access this service',
          hint: 'Add query parameters: ?escrowId=123&authToken=your-token',
          received: {
            escrowId: escrowId || 'missing',
            authToken: authToken ? 'provided' : 'missing'
          }
        },
        { status: 402 }
      );
      
      return response;
    }

    // Parse escrowId to number
    const escrowIdNum = parseInt(escrowId, 10);
    if (isNaN(escrowIdNum)) {
      const response = NextResponse.json(
        {
          success: false,
          error: 'Payment Required',
          message: 'Invalid escrowId format - must be a number',
        },
        { status: 402 }
      );
      
      return response;
    }

    console.log('Validating escrow:', { escrowIdNum, authToken: `${authToken.substring(0, 10)}...` });

    // Validate escrow using HTTPay SDK
    const validation = await validateEscrow(escrowIdNum, authToken);

    if (!validation.isValid) {
      console.log('Escrow validation failed:', validation.error);
      const response = NextResponse.json(
        {
          success: false,
          error: 'Payment Required',
          message: validation.error || 'Invalid escrow credentials',
        },
        { status: 402 }
      );
      
      return response;
    }

    console.log('Escrow validation successful, generating weather data');

    // Generate simplified weather data for San Francisco
    const weatherResponse = generateWeatherData();

    // Log usage for demo purposes
    console.log(`Weather API accessed successfully for escrow ${escrowIdNum} at ${new Date().toISOString()}`);

    const response = NextResponse.json({
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
        fee: '100000',
      },
    });
    
    return response;
    
  } catch (error) {
    console.error('Weather API error:', error);
    
    const response = NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'An error occurred while processing your request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
    
    return response;
  }
}
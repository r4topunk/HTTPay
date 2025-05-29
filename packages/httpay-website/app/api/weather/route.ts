import { NextRequest, NextResponse } from 'next/server';
import { HTTPayProvider } from 'httpay-sdk/src/abstractions/HTTPayProvider';
import type { HTTPayConfig, ToolConfig, PaymentRequest } from 'httpay-sdk/src/abstractions/types';

// HTTPay configuration for Neutron testnet
const httppayConfig: HTTPayConfig = {
  rpcEndpoint: process.env.NEXT_PUBLIC_RPC_ENDPOINT as string,
  registryAddress: process.env.NEXT_PUBLIC_REGISTRY_ADDRESS as string,
  escrowAddress: process.env.NEXT_PUBLIC_ESCROW_ADDRESS as string,
  gasPrice: '0.025untrn',
};

const toolConfig: ToolConfig = {
  toolId: 'weather',
  provider: {
    privateKey: process.env.CLIENT_PRIVATE_KEY as string,
  },
};

// Initialize HTTPay provider
const httppayProvider = new HTTPayProvider(httppayConfig, toolConfig);

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

    console.log('Processing payment with HTTPayProvider:', { escrowIdNum, authToken: `${authToken.substring(0, 10)}...` });

    // Initialize HTTPay provider
    await httppayProvider.initialize();

    // Create payment request
    const paymentRequest: PaymentRequest = {
      escrowId: escrowIdNum,
      authToken: authToken
    };

    // Handle complete payment flow using HTTPayProvider
    const paymentResult = await httppayProvider.handlePayment(paymentRequest);

    // Check validation result
    if (!paymentResult.validation.isValid) {
      console.log('Payment validation failed:', paymentResult.validation.error);
      return createErrorResponse(
        402,
        'Payment Required',
        paymentResult.validation.error || 'Invalid payment credentials'
      );
    }

    // Check processing result
    if (!paymentResult.processing?.success) {
      console.error('Payment processing failed:', paymentResult.processing?.error);
      return createErrorResponse(
        500,
        'Payment Processing Failed',
        'Failed to process payment for API usage',
        paymentResult.processing?.error
      );
    }

    console.log(`Payment processed successfully for escrow ${escrowIdNum}, tx: ${paymentResult.processing.txHash}`);

    // Generate and return weather data
    const weatherResponse = generateWeatherData();
    console.log(`Weather API accessed successfully for escrow ${escrowIdNum} at ${new Date().toISOString()}`);

    return NextResponse.json({
      success: true,
      data: weatherResponse,
      escrow: {
        id: escrowIdNum,
        provider: paymentResult.validation.escrow?.provider,
        maxFee: paymentResult.validation.escrow?.maxFee,
        expires: paymentResult.validation.escrow?.expires,
      },
      usage: {
        timestamp: new Date().toISOString(),
        fee: paymentResult.price || '0',
        transactionHash: paymentResult.processing.txHash,
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
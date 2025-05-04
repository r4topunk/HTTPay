/**
 * Error classes for ToolPay SDK
 */

/**
 * Base class for all ToolPay SDK errors
 */
export class ToolPayError extends Error {
  /** Error code */
  code: string;
  
  /** Additional error details */
  details: Record<string, unknown>;

  constructor(message: string, code: string = 'TOOLPAY_ERROR', details?: Record<string, unknown>) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.details = details || {}; // Initialize with empty object if not provided
    
    // Preserve stack trace in modern environments
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Error thrown for configuration issues
 */
export class ConfigurationError extends ToolPayError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'CONFIGURATION_ERROR', details);
  }
}

/**
 * Error thrown for network-related issues (RPC connection, timeouts, etc)
 */
export class NetworkError extends ToolPayError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'NETWORK_ERROR', details);
  }
}

/**
 * Error thrown for contract execution failures
 */
export class ContractError extends ToolPayError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'CONTRACT_ERROR', details);
  }
}

/**
 * Error thrown when escrow verification fails
 */
export class EscrowVerificationError extends ToolPayError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'ESCROW_VERIFICATION_ERROR', details);
  }
}

/**
 * Error thrown for usage reporting failures
 */
export class UsageReportingError extends ToolPayError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'USAGE_REPORTING_ERROR', details);
  }
}

/**
 * Error thrown for wallet-related issues
 */
export class WalletError extends ToolPayError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'WALLET_ERROR', details);
  }
}

/**
 * Convert any error to a ToolPayError
 * 
 * @param error - The error to convert
 * @param defaultMessage - Default message if error doesn't have one
 * @returns A ToolPayError or subclass
 */
export function normalizeError(error: unknown, defaultMessage = 'Unknown error'): ToolPayError {
  if (error instanceof ToolPayError) {
    return error;
  }

  // Type guard for objects with a message property
  function hasMessage(obj: unknown): obj is { message: string } {
    return (
      typeof obj === 'object' &&
      obj !== null &&
      'message' in obj &&
      typeof (obj as { message?: unknown }).message === 'string'
    );
  }

  const message = hasMessage(error) ? error.message : defaultMessage;
  
  // Try to categorize the error
  if (message.includes('network') || message.includes('connection') || message.includes('timeout')) {
    return new NetworkError(message, { originalError: error });
  }
  
  if (message.includes('wallet') || message.includes('signer') || message.includes('account')) {
    return new WalletError(message, { originalError: error });
  }
  
  if (message.includes('contract') || message.includes('execute') || message.includes('query')) {
    return new ContractError(message, { originalError: error });
  }
  
  // Default to generic ToolPayError
  return new ToolPayError(message, 'UNKNOWN_ERROR', { originalError: error });
}

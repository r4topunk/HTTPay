// Import types from the new SDK
import type { 
  Tool, 
  Escrow, 
  ToolRegistrationForm, 
  EscrowCreationForm, 
  EscrowVerificationForm, 
  UsagePostingForm, 
  EscrowsFilter, 
  LockFundsResult,
  HTTPaySDKContextType,
  HTTPaySDKConfig 
} from "../../../httpay-sdk/src/types";
import * as z from "zod";

// Re-export for backward compatibility
export type {
  Tool,
  Escrow,
  ToolRegistrationForm,
  EscrowCreationForm,
  EscrowVerificationForm,
  UsagePostingForm,
  EscrowsFilter,
  LockFundsResult,
  HTTPaySDKContextType,
  HTTPaySDKConfig
};

// Form schema for tool registration - keeping local definitions for validation
export const registerToolSchema = z.object({
  toolId: z.string().min(3, {
    message: "Tool ID must be at least 3 characters.",
  }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }),
  price: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Price must be a positive number.",
  }),
  endpoint: z.string().url({
    message: "Please enter a valid URL.",
  }),
});

export type RegisterToolFormData = z.infer<typeof registerToolSchema>;

// Use the Tool from the provider SDK directly
export type { Tool as ToolType } from "../../../httpay-sdk/src/types";

// API Response types for tool endpoint testing
export interface APISuccessResponse {
  [key: string]: unknown;
}

export interface APIErrorResponse {
  error: true;
  message: string;
  timestamp: string;
}

export type APIResponse = APISuccessResponse | APIErrorResponse;

// Use the Escrow from the provider SDK directly
export type { Escrow as EscrowType } from "../../../httpay-sdk/src/types";

// Enhanced status types for 2-step tool testing
export type TestToolStatus = 
  | "idle"              // Initial state - ready to start
  | "creating_escrow"   // Step 1: Creating escrow in progress
  | "escrow_created"    // Step 1 complete: Escrow successfully created, ready for API test
  | "escrow_error"      // Step 1 failed: Escrow creation failed
  | "testing_api"       // Step 2: API request in progress
  | "success"           // Both steps completed successfully
  | "api_error";        // Step 2 failed: API test failed (but escrow exists)

// Error details for specific steps
export interface EscrowCreationError {
  message: string;
  details?: string;
  timestamp: string;
}

export interface APITestError {
  message: string;
  details?: string;
  timestamp: string;
  statusCode?: number;
}

// Result types
// Local LockFundsResult that matches SDK structure

// Enhanced test tool data
export interface TestToolData {
  selectedTool: Tool | null;
  status: TestToolStatus;
  escrowId: string;
  escrowCreationError: EscrowCreationError | null;
  apiResponse: APIResponse | null;
  apiTestError: APITestError | null;
  authToken: string;
}

// Use the SDKContextType from the new SDK directly
export type { HTTPaySDKContextType as SDKContextType } from "../../../httpay-sdk/src/types";

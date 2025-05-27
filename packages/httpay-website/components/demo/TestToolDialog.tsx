import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import { formatAmount } from "@/lib/constants";
import type { Tool, APIResponse, APIErrorResponse, TestToolStatus, EscrowCreationError, APITestError } from "./types";

// Type guard to check if response is an error response
const isErrorResponse = (response: APIResponse): response is APIErrorResponse => {
  return 'error' in response && response.error === true;
};

interface TestToolDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedTool: Tool | null;
  testStatus: TestToolStatus;
  escrowId: string;
  escrowCreationError: EscrowCreationError | null;
  apiResponse: APIResponse | null;
  apiTestError: APITestError | null;
  authToken: string;
  onCreateEscrow: () => void;
  onTestAPI: () => void;
  onRetryEscrow: () => void;
  onRetryAPI: () => void;
}

export const TestToolDialog: React.FC<TestToolDialogProps> = ({
  open,
  onOpenChange,
  selectedTool,
  testStatus,
  escrowId,
  escrowCreationError,
  apiResponse,
  apiTestError,
  authToken,
  onCreateEscrow,
  onTestAPI,
  onRetryEscrow,
  onRetryAPI,
}) => {
  const getStepNumber = () => {
    switch (testStatus) {
      case "idle":
      case "creating_escrow":
      case "escrow_created":
      case "escrow_error":
        return 1;
      case "testing_api":
      case "success":
      case "api_error":
        return 2;
      default:
        return 1;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Test Tool: {selectedTool?.tool_id}
            <span className="text-sm font-normal text-muted-foreground">
              (Step {getStepNumber()} of 2)
            </span>
          </DialogTitle>
          <DialogDescription>
            Execute a comprehensive test of this tool through the HTTPay protocol
          </DialogDescription>
        </DialogHeader>

        {/* Initial state - Tool details and overview */}
        {testStatus === "idle" && (
          <div className="space-y-6 py-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <p className="text-sm font-medium">Tool Details</p>
                <p className="text-sm text-muted-foreground">
                  {selectedTool?.description || "No description available"}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <p className="text-sm font-medium">Price per Call</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedTool ? formatAmount(selectedTool.price) : "0"} NTRN
                  </p>
                </div>
                <div className="grid gap-2">
                  <p className="text-sm font-medium">Endpoint</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {selectedTool?.endpoint || "No endpoint"}
                  </p>
                </div>
              </div>
              <div className="grid gap-2">
                <p className="text-sm font-medium">Test Process</p>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white text-xs">1</span>
                    Create escrow and lock funds on the blockchain
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-muted-foreground text-xs">2</span>
                    Test the tool&apos;s API endpoint
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white text-xs mt-0.5">
                  💡
                </div>
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Two-Step Testing Process</p>
                  <p>This tool test is broken into two clear steps to give you full control and visibility:</p>
                  <ul className="mt-2 space-y-1 text-xs">
                    <li>• <strong>Step 1:</strong> Creates a real escrow transaction on-chain</li>
                    <li>• <strong>Step 2:</strong> Tests the actual API endpoint</li>
                  </ul>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={onCreateEscrow} className="gap-2">
                <span>Create Escrow</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Step 1: Escrow Creation */}
        {(testStatus === "creating_escrow" || testStatus === "escrow_created" || testStatus === "escrow_error") && (
          <div className="space-y-6 py-4">
            {/* Step indicator */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white text-sm">1</span>
                <span className="font-medium">Create Escrow</span>
              </div>
              <div className="flex-1 h-px bg-muted" />
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground text-sm">2</span>
                <span className="text-muted-foreground">Test API</span>
              </div>
            </div>

            {/* Step 1 Status */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {testStatus === "creating_escrow" && (
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                )}
                {testStatus === "escrow_created" && (
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                )}
                {testStatus === "escrow_error" && (
                  <AlertCircle className="h-6 w-6 text-destructive" />
                )}
                <div>
                  <p className="font-medium">
                    {testStatus === "creating_escrow" && "Creating escrow transaction..."}
                    {testStatus === "escrow_created" && "Escrow created successfully!"}
                    {testStatus === "escrow_error" && "Escrow creation failed"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {testStatus === "creating_escrow" && "Locking funds on the blockchain..."}
                    {testStatus === "escrow_created" && `Escrow ID: ${escrowId} • Auth Token: ${authToken}`}
                    {testStatus === "escrow_error" && "There was an error creating the escrow"}
                  </p>
                </div>
              </div>

              {/* Escrow creation error details */}
              {testStatus === "escrow_error" && escrowCreationError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-red-800 mb-2">Error Details:</p>
                  <p className="text-sm text-red-700">{escrowCreationError.message}</p>
                  {escrowCreationError.details && (
                    <p className="text-xs text-red-600 mt-2">{escrowCreationError.details}</p>
                  )}
                  <p className="text-xs text-red-500 mt-2">Time: {escrowCreationError.timestamp}</p>
                </div>
              )}

              {/* Success details */}
              {testStatus === "escrow_created" && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-green-800 mb-2">Escrow Details:</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-green-700 font-medium">Escrow ID:</p>
                      <p className="text-green-600 font-mono">{escrowId}</p>
                    </div>
                    <div>
                      <p className="text-green-700 font-medium">Amount Locked:</p>
                      <p className="text-green-600">{selectedTool ? formatAmount(selectedTool.price) : "0"} NTRN</p>
                    </div>
                    <div>
                      <p className="text-green-700 font-medium">Auth Token:</p>
                      <p className="text-green-600 font-mono text-xs">{authToken}</p>
                    </div>
                    <div>
                      <p className="text-green-700 font-medium">Tool ID:</p>
                      <p className="text-green-600">{selectedTool?.tool_id}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              {testStatus === "creating_escrow" && (
                <Button disabled className="gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating Escrow...
                </Button>
              )}
              {testStatus === "escrow_created" && (
                <>
                  <Button variant="outline" onClick={() => onOpenChange(false)}>
                    Close
                  </Button>
                  <Button onClick={onTestAPI} className="gap-2">
                    <span>Test API Endpoint</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </>
              )}
              {testStatus === "escrow_error" && (
                <>
                  <Button variant="outline" onClick={() => onOpenChange(false)}>
                    Close
                  </Button>
                  <Button onClick={onRetryEscrow} variant="secondary">
                    Retry Escrow Creation
                  </Button>
                </>
              )}
            </DialogFooter>
          </div>
        )}

        {/* Step 2: API Testing */}
        {(testStatus === "testing_api" || testStatus === "success" || testStatus === "api_error") && (
          <div className="space-y-6 py-4">
            {/* Step indicator */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
                <span className="text-green-600 font-medium">Create Escrow</span>
              </div>
              <div className="flex-1 h-px bg-green-200" />
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white text-sm">2</span>
                <span className="font-medium">Test API</span>
              </div>
            </div>

            {/* Step 2 Status */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {testStatus === "testing_api" && (
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                )}
                {testStatus === "success" && (
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                )}
                {testStatus === "api_error" && (
                  <AlertCircle className="h-6 w-6 text-destructive" />
                )}
                <div>
                  <p className="font-medium">
                    {testStatus === "testing_api" && "Testing API endpoint..."}
                    {testStatus === "success" && "API test completed successfully!"}
                    {testStatus === "api_error" && "API test failed"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {testStatus === "testing_api" && `Making GET request to ${selectedTool?.endpoint}`}
                    {testStatus === "success" && "The tool responded successfully"}
                    {testStatus === "api_error" && "The API endpoint failed to respond properly"}
                  </p>
                </div>
              </div>

              {/* Escrow info reminder */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-blue-800">
                    <strong>Escrow Created:</strong> ID {escrowId} • {selectedTool ? formatAmount(selectedTool.price) : "0"} NTRN locked
                  </span>
                </div>
              </div>

              {/* API Response */}
              {apiResponse && (
                <div className="space-y-3">
                  <p className="text-sm font-medium">API Response:</p>
                  <div className="bg-gray-50 border rounded-lg p-4 max-h-64 overflow-y-auto">
                    <pre className="text-xs text-gray-800 whitespace-pre-wrap">
                      {JSON.stringify(apiResponse, null, 2)}
                    </pre>
                  </div>
                  {isErrorResponse(apiResponse) && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-sm text-yellow-800">
                        <strong>Note:</strong> The API returned an error response, but your escrow was successfully created.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* API test error details */}
              {testStatus === "api_error" && apiTestError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-red-800 mb-2">API Test Error:</p>
                  <p className="text-sm text-red-700">{apiTestError.message}</p>
                  {apiTestError.statusCode && (
                    <p className="text-sm text-red-600 mt-1">Status Code: {apiTestError.statusCode}</p>
                  )}
                  {apiTestError.details && (
                    <p className="text-xs text-red-600 mt-2">{apiTestError.details}</p>
                  )}
                  <p className="text-xs text-red-500 mt-2">Time: {apiTestError.timestamp}</p>
                  
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-sm text-yellow-800">
                      <strong>Important:</strong> Your escrow (ID: {escrowId}) was successfully created despite the API test failure. 
                      The funds are safely locked and the tool provider can still claim them after providing the service.
                    </p>
                  </div>
                </div>
              )}

              {/* Success summary */}
              {testStatus === "success" && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-green-800 mb-2">Test Summary:</p>
                  <div className="text-sm text-green-700 space-y-1">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Escrow created successfully (ID: {escrowId})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>API endpoint responded successfully</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>{selectedTool ? formatAmount(selectedTool.price) : "0"} NTRN locked for tool usage</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              {testStatus === "testing_api" && (
                <Button disabled className="gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Testing API...
                </Button>
              )}
              {(testStatus === "success" || testStatus === "api_error") && (
                <>
                  <Button variant="outline" onClick={() => onOpenChange(false)}>
                    Close
                  </Button>
                  {testStatus === "api_error" && (
                    <Button onClick={onRetryAPI} variant="secondary">
                      Retry API Test
                    </Button>
                  )}
                </>
              )}
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

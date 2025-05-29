"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useSDK } from "@/providers/sdk-provider";
import {
  SDKConfiguration,
  WalletConnection,
} from "@/components/demo";
import { ToolRegistry } from "./demo/ToolRegistry";
import { RegisterToolForm } from "./demo/RegisterToolForm";
import { TestToolDialog } from "./demo/TestToolDialog";
import { DemoInfoBanner } from "./demo/DemoInfoBanner";
import { registerToolSchema } from "./demo/types";
import type { Tool, APIResponse, RegisterToolFormData, TestToolStatus, EscrowCreationError, APITestError } from "./demo/types";

const DemoSectionContent = () => {
  const {
    tools,
    loadTools,
    registerTool,
    lockFunds,
    loading,
    isConnected,
    walletAddress,
  } = useSDK();
  const { toast } = useToast();
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [testStatus, setTestStatus] = useState<TestToolStatus>("idle");
  const [escrowId, setEscrowId] = useState<string>("");
  const [escrowCreationError, setEscrowCreationError] = useState<EscrowCreationError | null>(null);
  const [apiResponse, setApiResponse] = useState<APIResponse | null>(null);
  const [apiTestError, setAPITestError] = useState<APITestError | null>(null);
  const [authToken, setAuthToken] = useState<string>("");

  // Form for tool registration
  const registerForm = useForm<RegisterToolFormData>({
    resolver: zodResolver(registerToolSchema),
    defaultValues: {
      toolId: "",
      description: "",
      price: "",
      endpoint: "",
    },
  });

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard`,
      });
    } catch {
      toast({
        title: "Copy failed",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  // Handle tool registration
  const onRegisterSubmit = async (
    values: RegisterToolFormData
  ) => {
    try {
      await registerTool({
        toolId: values.toolId,
        description: values.description,
        price: (Number.parseFloat(values.price) * 1000000).toString(), // Convert to untrn
        endpoint: values.endpoint,
      });

      registerForm.reset();
      toast({
        title: "Tool registered successfully",
        description: `Your tool "${values.toolId}" has been registered`,
      });
    } catch (error) {
      console.error("Error registering tool:", error);
      toast({
        title: "Registration failed",
        description: "Failed to register your tool. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle tool testing with enhanced 2-step process
  const handleTestTool = async (tool: Tool) => {
    if (!walletAddress) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to test the tool",
        variant: "destructive",
      });
      return;
    }

    // Reset all state for new test
    setSelectedTool(tool);
    setTestStatus("idle");
    setEscrowId("");
    setEscrowCreationError(null);
    setApiResponse(null);
    setAPITestError(null);
    setAuthToken("");
    setTestDialogOpen(true);
  };

  // Step 1: Create Escrow
  const handleCreateEscrow = async () => {
    if (!selectedTool || !walletAddress) return;

    setTestStatus("creating_escrow");
    setEscrowCreationError(null);

    try {
      // Generate auth token for this test
      const newAuthToken = `test-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      setAuthToken(newAuthToken);

      const escrowData = {
        toolId: selectedTool.tool_id,
        maxFee: selectedTool.price, // Fixed to 1 call for demo
        authToken: newAuthToken,
        ttl: "50",
      };

      const result = await lockFunds(escrowData);

      // Use the real escrow ID from the contract response (convert number to string for UI)
      if (result) {
        setEscrowId(result.escrowId.toString());
        
        setTestStatus("escrow_created");

        toast({
          title: "Escrow created successfully",
          description: `Escrow ID ${result.escrowId} created with ${selectedTool.price} NTRN locked`,
        });
      } else {
        throw new Error("Failed to get escrow result from lockFunds");
      }

    } catch (error) {
      console.error("Error creating escrow:", error);
      
      const errorDetails: EscrowCreationError = {
        message: error instanceof Error ? error.message : 'Unknown escrow creation error',
        details: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
      };
      
      setEscrowCreationError(errorDetails);
      setTestStatus("escrow_error");
      
      toast({
        title: "Escrow creation failed",
        description: "Failed to create escrow. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Step 2: Test API
  const handleTestAPI = async () => {
    if (!selectedTool || !escrowId || !authToken) {
      toast({
        title: "Missing required data",
        description: "Escrow ID and auth token are required to test the API",
        variant: "destructive",
      });
      return;
    }

    setTestStatus("testing_api");
    setAPITestError(null);
    setApiResponse(null);

    try {
      // Build the API URL with escrow credentials as query parameters
      // Smart URL handling: use relative URLs to avoid CORS issues with tunnels
      const currentOrigin = window.location.origin;
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      
      // Encode the auth token as base64 since escrow stores it encoded
      const encodedAuthToken = btoa(authToken);
      console.log('🔐 Auth token encoding:', {
        original: authToken,
        encoded: encodedAuthToken
      });
      
      let apiUrl: string;
      
      if (isLocalhost) {
        // Use relative URL for local development
        apiUrl = `/api/weather?escrowId=${escrowId}&authToken=${encodedAuthToken}`;
        console.log('🏠 Using local relative URL for API testing');
      } else {
        // For tunnel/external access, also use relative URL (same origin)
        apiUrl = `/api/weather?escrowId=${escrowId}&authToken=${encodedAuthToken}`;
        console.log('🌐 Using relative URL for tunnel/external testing');
      }

      console.log('Testing API with URL:', apiUrl);
      console.log('Current origin:', currentOrigin);

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${responseData.message || response.statusText}`);
      }

      setApiResponse(responseData as APIResponse);
      setTestStatus("success");

      toast({
        title: "API test successful",
        description: `Tool "${selectedTool.tool_id}" responded successfully with weather data`,
      });

    } catch (apiError) {
      console.error("API request failed:", apiError);
      
      const errorDetails: APITestError = {
        message: apiError instanceof Error ? apiError.message : 'Unknown API error',
        details: apiError instanceof Error ? apiError.stack : undefined,
        timestamp: new Date().toISOString(),
        statusCode: apiError instanceof Response ? apiError.status : undefined,
      };
      
      setAPITestError(errorDetails);
      
      // Create error response for display
      const errorResponse: APIResponse = {
        error: true,
        message: errorDetails.message,
        timestamp: errorDetails.timestamp,
      };
      setApiResponse(errorResponse);
      
      setTestStatus("api_error");
      
      toast({
        title: "API test failed",
        description: `The API at "${selectedTool.endpoint}" failed: ${errorDetails.message}`,
        variant: "destructive",
      });
    }
  };

  // Retry functions
  const handleRetryEscrow = async () => {
    setEscrowCreationError(null);
    await handleCreateEscrow();
  };

  const handleRetryAPI = async () => {
    setAPITestError(null);
    await handleTestAPI();
  };

  // Handle dialog close
  const handleDialogClose = (open: boolean) => {
    setTestDialogOpen(open);
    if (!open) {
      resetTestState();
    }
  };

  // Reset test state
  const resetTestState = () => {
    setTestStatus("idle");
    setEscrowId("");
    setEscrowCreationError(null);
    setApiResponse(null);
    setAPITestError(null);
    setAuthToken("");
  };

  return (
    <section id="demo" className="section-container bg-muted/30">
      <div className="container mx-auto">
        <div className="flex flex-col gap-12">
          <div className="space-y-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Try the Demo
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Experience HTTPay in action with real smart contracts
            </p>
          </div>

          <div className="max-w-6xl mx-auto w-full flex flex-col gap-6">
            <DemoInfoBanner />

            {/* SDK Configuration */}
            <SDKConfiguration />

            {/* Wallet Connection */}
            <WalletConnection />

            {isConnected ? (
              <Tabs defaultValue="registry" className="w-full mx-auto">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="registry">Tool Registry</TabsTrigger>
                  <TabsTrigger value="register">Register a Tool</TabsTrigger>
                </TabsList>

                <TabsContent value="registry" className="mt-6">
                  <ToolRegistry
                    tools={tools}
                    loading={loading.loadTools}
                    loadTools={loadTools}
                    handleTestTool={handleTestTool}
                    copyToClipboard={copyToClipboard}
                  />
                </TabsContent>

                <TabsContent value="register" className="mt-6">
                  <RegisterToolForm
                    registerForm={registerForm}
                    onRegisterSubmit={onRegisterSubmit}
                    loading={loading.registerTool}
                  />
                </TabsContent>
              </Tabs>
            ) : (
              <div className="mx-auto max-w-md border rounded-lg p-6 bg-white">
                <h3 className="text-lg font-semibold mb-2">Setup Required</h3>
                <p className="text-muted-foreground">
                  Configure SDK settings and connect your wallet to access the
                  demo
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Test Tool Dialog */}
      <TestToolDialog
        open={testDialogOpen}
        onOpenChange={handleDialogClose}
        selectedTool={selectedTool}
        testStatus={testStatus}
        escrowId={escrowId}
        escrowCreationError={escrowCreationError}
        apiResponse={apiResponse}
        apiTestError={apiTestError}
        authToken={authToken}
        onCreateEscrow={handleCreateEscrow}
        onTestAPI={handleTestAPI}
        onRetryEscrow={handleRetryEscrow}
        onRetryAPI={handleRetryAPI}
      />
    </section>
  );
};

export default function DemoSection() {
  return <DemoSectionContent />;
}

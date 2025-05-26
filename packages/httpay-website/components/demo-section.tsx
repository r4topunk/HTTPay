"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  SDKProvider,
  useSDK,
  SDKConfiguration,
  WalletConnection,
} from "@/components/demo";
import { ToolRegistry } from "./demo/ToolRegistry";
import { RegisterToolForm } from "./demo/RegisterToolForm";
import { TestToolDialog } from "./demo/TestToolDialog";
import { DemoInfoBanner } from "./demo/DemoInfoBanner";

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
  const [selectedTool, setSelectedTool] = useState<any>(null);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [testStatus, setTestStatus] = useState<
    "idle" | "creating_escrow" | "requesting_service" | "success" | "error"
  >("idle");
  const [escrowId, setEscrowId] = useState<string>("");

  // Form schema for tool registration
  const registerToolSchema = z.object({
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

  // Form for tool registration
  const registerForm = useForm<z.infer<typeof registerToolSchema>>({
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
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  // Handle tool registration
  const onRegisterSubmit = async (
    values: z.infer<typeof registerToolSchema>
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

  // Handle tool testing with escrow and request
  const handleTestTool = async (tool: any) => {
    if (!walletAddress) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to test the tool",
        variant: "destructive",
      });
      return;
    }

    setSelectedTool(tool);
    setTestStatus("idle");
    setEscrowId("");
    setTestDialogOpen(true);
  };

  const executeToolTest = async () => {
    if (!selectedTool || !walletAddress) return;

    setTestStatus("creating_escrow");

    try {
      // Step 1: Create escrow with the exact price (1 call only)
      const escrowData = {
        toolId: selectedTool.tool_id,
        maxFee: selectedTool.price, // Fixed to 1 call
        authToken: `test-${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)}`,
        ttl: "50",
      };

      await lockFunds(escrowData);

      // Mock escrow ID for demo (in real implementation, this would come from the contract response)
      const mockEscrowId = Math.floor(Math.random() * 10000).toString();
      setEscrowId(mockEscrowId);

      // Step 2: Simulate service request
      setTestStatus("requesting_service");

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Step 3: Success
      setTestStatus("success");

      toast({
        title: "Tool tested successfully",
        description: `Tool "${selectedTool.tool_id}" was successfully tested via escrow`,
      });

      // Auto-close after success
      setTimeout(() => {
        setTestDialogOpen(false);
        setTestStatus("idle");
      }, 3000);
    } catch (error) {
      console.error("Error testing tool:", error);
      setTestStatus("error");
      toast({
        title: "Test failed",
        description: "Failed to test the tool. Please try again.",
        variant: "destructive",
      });
    }
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
        onOpenChange={setTestDialogOpen}
        selectedTool={selectedTool}
        testStatus={testStatus}
        escrowId={escrowId}
        executeToolTest={executeToolTest}
      />
    </section>
  );
};

export default function DemoSection() {
  return (
    <SDKProvider>
      <DemoSectionContent />
    </SDKProvider>
  );
}

"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { formatAmount } from "@/lib/constants";
import { truncateAddress, cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  Info,
  ExternalLink,
  RefreshCw,
  Play,
  Copy,
} from "lucide-react";
import {
  SDKProvider,
  useSDK,
  SDKConfiguration,
  WalletConnection,
} from "@/components/demo";

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

const DemoSectionContent = () => {
  const { 
    tools, 
    loadTools, 
    registerTool, 
    lockFunds, 
    loading, 
    isConnected, 
    walletAddress 
  } = useSDK();
  const { toast } = useToast();
  const [selectedTool, setSelectedTool] = useState<any>(null);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [testStatus, setTestStatus] = useState<
    "idle" | "creating_escrow" | "requesting_service" | "success" | "error"
  >("idle");
  const [escrowId, setEscrowId] = useState<string>("");

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
        authToken: `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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

          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 flex items-start gap-3 max-w-4xl mx-auto">
            <Info className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">Live Demo</p>
              <p className="text-sm text-muted-foreground mt-1">
                This demo connects to the HTTPay smart contracts. Configure your SDK settings and connect your wallet to get started.
              </p>
            </div>
          </div>

          {/* SDK Configuration */}
          <SDKConfiguration />
          
          {/* Wallet Connection */}
          <WalletConnection />

          {isConnected ? (
            <Tabs defaultValue="registry" className="w-full max-w-4xl mx-auto">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="registry">Tool Registry</TabsTrigger>
                <TabsTrigger value="register">Register a Tool</TabsTrigger>
              </TabsList>

              <TabsContent value="registry" className="mt-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div>
                      <CardTitle>Available Tools</CardTitle>
                      <CardDescription>
                        Browse the registry of available tools that can be used by AI agents
                      </CardDescription>
                    </div>
                    <Button
                      onClick={loadTools}
                      disabled={loading.loadTools}
                      size="icon"
                      variant="outline"
                    >
                      <RefreshCw className={cn(
                        "h-4 w-4",
                        loading.loadTools && "animate-spin"
                      )} />
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {loading.loadTools ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin" />
                      </div>
                    ) : tools.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">
                        No tools found. Register the first tool!
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {tools.map((tool, index) => (
                          <div key={index} className="p-4 border rounded-lg space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="font-medium text-lg">{tool.tool_id}</div>
                              <div className="flex items-center gap-2">
                                <Badge variant={tool.is_active ? "default" : "secondary"}>
                                  {tool.is_active ? "Active" : "Inactive"}
                                </Badge>
                                <Button
                                  onClick={() => handleTestTool(tool)}
                                  size="sm"
                                  disabled={!tool.is_active}
                                  className="ml-2"
                                >
                                  <Play className="h-4 w-4 mr-1" />
                                  Test
                                </Button>
                              </div>
                            </div>

                            {tool.description && (
                              <div className="text-sm text-muted-foreground">
                                {tool.description}
                              </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                              <div>
                                <span className="font-medium">Price:</span> {formatAmount(tool.price)} NTRN
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="font-medium">Provider:</span>
                                <span className="font-mono">{truncateAddress(tool.provider)}</span>
                                <Button
                                  onClick={() => copyToClipboard(tool.provider, "Provider address")}
                                  size="icon"
                                  variant="ghost"
                                  className="h-4 w-4"
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="font-medium">Endpoint:</span>
                                <a 
                                  href={tool.endpoint} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                >
                                  <span className="max-w-[200px] truncate">{tool.endpoint}</span>
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="register" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Register a New Tool</CardTitle>
                    <CardDescription>
                      Add your service to the HTTPay registry for AI agents to discover and use
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...registerForm}>
                      <form
                        onSubmit={registerForm.handleSubmit(onRegisterSubmit)}
                        className="space-y-6"
                      >
                        <FormField
                          control={registerForm.control}
                          name="toolId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tool ID</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="my-awesome-tool"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                A unique identifier for your tool
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={registerForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Describe what your tool does..."
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                A brief description of your tool's functionality
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={registerForm.control}
                          name="price"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Price per Call (NTRN)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.000001"
                                  min="0.000001"
                                  placeholder="1.0"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                How much to charge per API call in NTRN
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={registerForm.control}
                          name="endpoint"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>API Endpoint</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="https://api.example.com/my-tool"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                The URL where your service can be accessed
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Button
                          type="submit"
                          className="w-full"
                          disabled={loading.registerTool}
                        >
                          {loading.registerTool ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Registering...
                            </>
                          ) : (
                            "Register Tool"
                          )}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <Card className="mx-auto max-w-md">
              <CardHeader>
                <CardTitle>Setup Required</CardTitle>
                <CardDescription>
                  Configure SDK settings and connect your wallet to access the demo
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>
      </div>

      {/* Test Tool Dialog */}
      <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Test Tool: {selectedTool?.tool_id}</DialogTitle>
            <DialogDescription>
              Execute a real transaction to test this tool via the HTTPay protocol
            </DialogDescription>
          </DialogHeader>

          {testStatus === "idle" ? (
            <div className="space-y-6 py-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <p className="text-sm font-medium">Tool Details</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedTool?.description || "No description available"}
                  </p>
                </div>

                <div className="grid gap-2">
                  <p className="text-sm font-medium">Price per Call</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedTool ? formatAmount(selectedTool.price) : "0"} NTRN
                  </p>
                </div>

                <div className="grid gap-2">
                  <p className="text-sm font-medium">Number of Calls</p>
                  <p className="text-sm text-muted-foreground">
                    1 call (fixed for demo)
                  </p>
                </div>

                <div className="grid gap-2">
                  <p className="text-sm font-medium">Total Cost</p>
                  <p className="text-sm font-semibold">
                    {selectedTool ? formatAmount(selectedTool.price) : "0"} NTRN
                  </p>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> This will create a real escrow transaction on the blockchain and attempt to call the service endpoint.
                </p>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setTestDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={executeToolTest}>
                  Execute Test
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">Status:</p>
                  <p className="text-sm">
                    {testStatus === "creating_escrow" && "Creating escrow..."}
                    {testStatus === "requesting_service" && "Requesting service..."}
                    {testStatus === "success" && "Test completed successfully"}
                    {testStatus === "error" && "Error occurred"}
                  </p>
                </div>

                {escrowId && (
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">Escrow ID:</p>
                    <p className="text-sm text-muted-foreground font-mono">
                      {escrowId}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-center py-4">
                {(testStatus === "creating_escrow" || testStatus === "requesting_service") && (
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                )}

                {testStatus === "success" && (
                  <CheckCircle2 className="h-12 w-12 text-green-500" />
                )}

                {testStatus === "error" && (
                  <AlertCircle className="h-12 w-12 text-destructive" />
                )}
              </div>

              <div className="text-center text-sm text-muted-foreground">
                {testStatus === "creating_escrow" &&
                  "Creating an escrow on the blockchain and locking funds..."}
                {testStatus === "requesting_service" &&
                  "Escrow created! Now requesting the service from the provider..."}
                {testStatus === "success" &&
                  "The tool was successfully tested through the HTTPay protocol"}
                {testStatus === "error" &&
                  "There was an error processing your request"}
              </div>

              <DialogFooter>
                {testStatus === "success" || testStatus === "error" ? (
                  <Button onClick={() => setTestDialogOpen(false)}>
                    Close
                  </Button>
                ) : (
                  <Button disabled>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </Button>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
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

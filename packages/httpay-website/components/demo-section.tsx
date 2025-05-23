"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { useChain } from "@interchain-kit/react"
import { formatAmount } from "@/lib/constants"
import { truncateAddress } from "@/lib/utils"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Loader2, AlertCircle, CheckCircle2, Info, ExternalLink } from "lucide-react"
import { defaultChainName } from "@/config/chain-config"

// Mock data for tools (in a real app, this would come from the contract)
const mockTools = [
  {
    id: "image-generator",
    provider: "neutron1provider1",
    description: "Generate images from text descriptions",
    price: "1000000", // 1 NTRN
    endpoint: "https://api.example.com/image-generator",
  },
  {
    id: "text-translator",
    provider: "neutron1provider2",
    description: "Translate text between languages",
    price: "500000", // 0.5 NTRN
    endpoint: "https://api.example.com/translator",
  },
  {
    id: "data-analyzer",
    provider: "neutron1provider3",
    description: "Analyze data and generate insights",
    price: "2000000", // 2 NTRN
    endpoint: "https://api.example.com/data-analyzer",
  },
  {
    id: "sentiment-analyzer",
    provider: "neutron1provider4",
    description: "Analyze sentiment in text content",
    price: "750000", // 0.75 NTRN
    endpoint: "https://api.example.com/sentiment",
  },
]

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
})

// Form schema for testing a tool
const testToolSchema = z.object({
  calls: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0 && Number(val) <= 10, {
    message: "Number of calls must be between 1 and 10.",
  }),
})

export default function DemoSection() {
  const { address } = useChain(defaultChainName)
  // Client implementation needs to be updated for Interchain Kit
  const [client, setClient] = useState(null)
  const { toast } = useToast()
  const [tools, setTools] = useState(mockTools)
  const [isLoading, setIsLoading] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [selectedTool, setSelectedTool] = useState<any>(null)
  const [testDialogOpen, setTestDialogOpen] = useState(false)
  const [testStatus, setTestStatus] = useState<"idle" | "locking" | "executing" | "releasing" | "success" | "error">(
    "idle",
  )
  const [txHash, setTxHash] = useState("")
  const [showGuide, setShowGuide] = useState(false)

  // Form for tool registration
  const registerForm = useForm<z.infer<typeof registerToolSchema>>({
    resolver: zodResolver(registerToolSchema),
    defaultValues: {
      toolId: "",
      description: "",
      price: "",
      endpoint: "",
    },
  })

  // Form for testing a tool
  const testForm = useForm<z.infer<typeof testToolSchema>>({
    resolver: zodResolver(testToolSchema),
    defaultValues: {
      calls: "1",
    },
  })

  // Simulate fetching tools from the registry contract
  useEffect(() => {
    const fetchTools = async () => {
      setIsLoading(true)
      try {
        // For demo, we'll use mock data with a delay to simulate loading
        setTimeout(() => {
          setTools(mockTools)
          setIsLoading(false)
        }, 1000)
      } catch (error) {
        console.error("Error fetching tools:", error)
        toast({
          title: "Error fetching tools",
          description: "Failed to load tools from the registry",
          variant: "destructive",
        })
        setIsLoading(false)
      }
    }

    fetchTools()
  }, [client, toast])

  // Handle tool registration
  const onRegisterSubmit = async (values: z.infer<typeof registerToolSchema>) => {
    if (!address || !client) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to register a tool",
        variant: "destructive",
      })
      return
    }

    setIsRegistering(true)
    try {
      // For demo, we'll simulate a successful registration
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Add the new tool to our local state
      const newTool = {
        id: values.toolId,
        provider: address,
        description: values.description,
        price: (Number.parseFloat(values.price) * 1000000).toString(), // Convert to uNTRN
        endpoint: values.endpoint,
      }

      setTools([...tools, newTool])

      toast({
        title: "Tool registered successfully",
        description: `Your tool "${values.toolId}" has been registered`,
      })

      // Reset the form
      registerForm.reset()
    } catch (error) {
      console.error("Error registering tool:", error)
      toast({
        title: "Registration failed",
        description: "Failed to register your tool. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsRegistering(false)
    }
  }

  // Handle tool testing
  const onTestSubmit = async (values: z.infer<typeof testToolSchema>) => {
    if (!address || !client || !selectedTool) {
      toast({
        title: "Cannot test tool",
        description: "Please connect your wallet and select a tool",
        variant: "destructive",
      })
      return
    }

    setIsTesting(true)
    setTestStatus("locking")

    try {
      // Calculate total amount to lock
      const totalAmount = (Number.parseInt(selectedTool.price) * Number.parseInt(values.calls)).toString()

      // For demo, we'll simulate the escrow process
      await new Promise((resolve) => setTimeout(resolve, 2000))
      setTxHash("ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890")

      // Simulate service execution
      setTestStatus("executing")
      await new Promise((resolve) => setTimeout(resolve, 3000))

      // Simulate funds release
      setTestStatus("releasing")
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Success
      setTestStatus("success")

      toast({
        title: "Tool tested successfully",
        description: `Payment for ${values.calls} call(s) to "${selectedTool.id}" has been processed`,
      })
    } catch (error) {
      console.error("Error testing tool:", error)
      setTestStatus("error")
      toast({
        title: "Test failed",
        description: "Failed to test the tool. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsTesting(false)
      // Reset after a delay on success
      if (testStatus === "success") {
        setTimeout(() => {
          setTestDialogOpen(false)
          setTestStatus("idle")
          testForm.reset()
        }, 3000)
      }
    }
  }

  // Open test dialog for a specific tool
  const handleTestTool = (tool: any) => {
    setSelectedTool(tool)
    setTestStatus("idle")
    setTxHash("")
    testForm.reset({ calls: "1" })
    setTestDialogOpen(true)
  }

  return (
    <section id="demo" className="section-container bg-muted/30">
      <div className="container mx-auto">
        <div className="flex flex-col gap-12">
          <div className="space-y-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Try the Demo</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Experience HTTPay in action on the Neutron testnet
            </p>
          </div>

          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 flex items-start gap-3 max-w-4xl mx-auto">
            <Info className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">Demo Mode</p>
              <p className="text-sm text-muted-foreground mt-1">
                This is a simulated demo using mock data. In a production environment, this would connect to the Neutron
                testnet using Keplr wallet and interact with deployed smart contracts.
              </p>
              <Button
                variant="link"
                className="text-sm p-0 h-auto mt-2 text-primary"
                onClick={() => setShowGuide(!showGuide)}
              >
                {showGuide ? "Hide CosmJS Integration Guide" : "View CosmJS Integration Guide"}
              </Button>
            </div>
          </div>

          {showGuide && (
            <Card className="max-w-4xl mx-auto">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>CosmJS Integration Guide</span>
                </CardTitle>
                <CardDescription>
                  How to properly integrate CosmJS with Next.js for Cosmos blockchain interactions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">1. Install Required Dependencies</h3>
                  <div className="bg-muted p-3 rounded-md overflow-x-auto">
                    <pre className="text-sm">
                      <code>npm install @cosmjs/cosmwasm-stargate @cosmjs/proto-signing @cosmjs/stargate</code>
                    </pre>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    These packages provide the core functionality for interacting with CosmWasm smart contracts on
                    Cosmos-based blockchains.
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">2. Create a Proper Wallet Provider</h3>
                  <div className="bg-muted p-3 rounded-md overflow-x-auto">
                    <pre className="text-sm">
                      <code>
                        {`// wallet-provider.tsx
"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useToast } from "@/components/ui/use-toast"

// Define types for Keplr window object
interface KeplrWindow extends Window {
  keplr?: {
    enable: (chainId: string) => Promise<void>
    getOfflineSigner: (chainId: string) => any
  }
}

// Create context with default values
export const WalletContext = createContext({/* default values */})

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null)
  const [client, setClient] = useState<any | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const { toast } = useToast()

  // Connect function
  const connect = async () => {
    try {
      setIsConnecting(true)
      
      // Check if we're in a browser environment
      if (typeof window === "undefined") {
        throw new Error("Cannot connect wallet in server environment")
      }

      const keplrWindow = window as KeplrWindow
      
      // Check if Keplr is installed
      if (!keplrWindow.keplr) {
        toast({
          title: "Keplr wallet not found",
          description: "Please install Keplr extension to connect",
          variant: "destructive",
        })
        return
      }

      // Request access to the chain
      await keplrWindow.keplr.enable(CHAIN_ID)
      
      // Get the offline signer
      const offlineSigner = keplrWindow.keplr.getOfflineSigner(CHAIN_ID)
      
      // Get the user's account
      const accounts = await offlineSigner.getAccounts()
      const userAddress = accounts[0].address
      
      // Dynamically import CosmJS to avoid polyfill issues
      const { SigningCosmWasmClient } = await import("@cosmjs/cosmwasm-stargate")
      const { GasPrice } = await import("@cosmjs/stargate")
      
      // Create a CosmWasm client
      const cosmWasmClient = await SigningCosmWasmClient.connectWithSigner(
        RPC_ENDPOINT,
        offlineSigner,
        {
          gasPrice: GasPrice.fromString("0.025untrn"),
        }
      )
      
      // Update state
      setAddress(userAddress)
      setClient(cosmWasmClient)
      
      // Rest of the function...
    } catch (error) {
      // Error handling...
    } finally {
      setIsConnecting(false)
    }
  }

  // Rest of the component...
}`}
                      </code>
                    </pre>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">3. Configure Next.js for Client-Side Only Execution</h3>
                  <p className="text-sm text-muted-foreground">
                    To avoid hydration issues, ensure the wallet provider only runs on the client side:
                  </p>
                  <div className="bg-muted p-3 rounded-md overflow-x-auto">
                    <pre className="text-sm">
                      <code>
                        {`// app/layout.tsx
import dynamic from "next/dynamic"

// Dynamically import the WalletProvider with no SSR
const WalletProvider = dynamic(
  () => import("@/lib/wallet-provider").then(mod => mod.WalletProvider),
  { ssr: false }
)`}
                      </code>
                    </pre>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">4. Handle Polyfill Issues</h3>
                  <p className="text-sm text-muted-foreground">
                    CosmJS requires certain polyfills that might not be available in Next.js by default. Add the
                    following to your next.config.js:
                  </p>
                  <div className="bg-muted p-3 rounded-md overflow-x-auto">
                    <pre className="text-sm">
                      <code>
                        {`// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        path: require.resolve('path-browserify'),
      };
    }
    return config;
  },
};

module.exports = nextConfig;`}
                      </code>
                    </pre>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    You'll also need to install these additional dependencies:
                  </p>
                  <div className="bg-muted p-3 rounded-md overflow-x-auto">
                    <pre className="text-sm">
                      <code>npm install crypto-browserify stream-browserify path-browserify</code>
                    </pre>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">5. Interacting with Smart Contracts</h3>
                  <p className="text-sm text-muted-foreground">
                    Once you have a connected client, you can interact with smart contracts:
                  </p>
                  <div className="bg-muted p-3 rounded-md overflow-x-auto">
                    <pre className="text-sm">
                      <code>
                        {`// Query contract state
const queryResult = await client.queryContractSmart(
  CONTRACT_ADDRESS,
  { get_tools: {} } // Your query message
);

// Execute a contract function
const executeResult = await client.execute(
  address, // sender address
  CONTRACT_ADDRESS,
  { register_tool: { /* your message */ } }, // Your execute message
  "auto", // automatic gas estimation
  "Optional memo"
);

// Get transaction hash
const txHash = executeResult.transactionHash;`}
                      </code>
                    </pre>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">6. Best Practices</h3>
                  <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                    <li>Always dynamically import CosmJS libraries to avoid SSR issues</li>
                    <li>Use try/catch blocks for all blockchain interactions</li>
                    <li>Provide clear feedback to users during transactions</li>
                    <li>Store minimal wallet state in localStorage for persistence</li>
                    <li>Implement proper disconnection and cleanup</li>
                    <li>Consider using React Query for caching contract queries</li>
                  </ul>
                </div>

                <div className="flex justify-end">
                  <Button variant="outline" size="sm" className="gap-2" asChild>
                    <a href="https://docs.cosmjs.zone" target="_blank" rel="noopener noreferrer">
                      <span>Official CosmJS Documentation</span>
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {!address ? (
            <Card className="mx-auto max-w-md">
              <CardHeader>
                <CardTitle>Connect Your Wallet</CardTitle>
                <CardDescription>Connect your wallet to interact with the HTTPay protocol</CardDescription>
              </CardHeader>
              <CardFooter>
                <Button
                  className="w-full"
                  onClick={() => {
                    if (typeof window !== "undefined" && window.scrollTo) {
                      window.scrollTo({ top: 0, behavior: "smooth" })
                    }
                  }}
                >
                  Connect Wallet
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <Tabs defaultValue="registry" className="w-full max-w-4xl mx-auto">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="registry">Tool Registry</TabsTrigger>
                <TabsTrigger value="register">Register a Tool</TabsTrigger>
              </TabsList>

              <TabsContent value="registry" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Available Tools</CardTitle>
                    <CardDescription>
                      Browse the registry of available tools that can be used by AI agents
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      </div>
                    ) : tools.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No tools registered yet. Be the first to register a tool!
                      </div>
                    ) : (
                      // Card grid layout instead of table
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {tools.map((tool) => (
                          <Card key={tool.id} className="overflow-hidden">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-lg">{tool.id}</CardTitle>
                              <CardDescription className="flex items-center gap-1">
                                Provider: {truncateAddress(tool.provider)}
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="pb-2">
                              <p className="text-sm mb-4">{tool.description}</p>
                              <div className="flex justify-between items-center text-sm">
                                <span className="font-medium">Price: {formatAmount(tool.price)} NTRN</span>
                              </div>
                            </CardContent>
                            <CardFooter className="pt-2">
                              <Button className="w-full" size="sm" onClick={() => handleTestTool(tool)}>
                                Test Tool
                              </Button>
                            </CardFooter>
                          </Card>
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
                      <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-6">
                        <FormField
                          control={registerForm.control}
                          name="toolId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tool ID</FormLabel>
                              <FormControl>
                                <Input placeholder="my-awesome-tool" {...field} />
                              </FormControl>
                              <FormDescription>A unique identifier for your tool</FormDescription>
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
                                <Textarea placeholder="Describe what your tool does..." {...field} />
                              </FormControl>
                              <FormDescription>A brief description of your tool's functionality</FormDescription>
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
                                <Input type="number" step="0.000001" min="0.000001" placeholder="1.0" {...field} />
                              </FormControl>
                              <FormDescription>How much to charge per API call in NTRN</FormDescription>
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
                                <Input placeholder="https://api.example.com/my-tool" {...field} />
                              </FormControl>
                              <FormDescription>The URL where your service can be accessed</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Button type="submit" className="w-full" disabled={isRegistering}>
                          {isRegistering ? (
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
          )}
        </div>
      </div>

      {/* Test Tool Dialog */}
      <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Test Tool: {selectedTool?.id}</DialogTitle>
            <DialogDescription>Simulate an AI agent using this tool via the HTTPay protocol</DialogDescription>
          </DialogHeader>

          {testStatus === "idle" ? (
            <Form {...testForm}>
              <form onSubmit={testForm.handleSubmit(onTestSubmit)} className="space-y-6">
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <p className="text-sm font-medium">Tool Details</p>
                    <p className="text-sm text-muted-foreground">{selectedTool?.description}</p>
                  </div>

                  <div className="grid gap-2">
                    <p className="text-sm font-medium">Price</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedTool ? formatAmount(selectedTool.price) : "0"} NTRN per call
                    </p>
                  </div>

                  <FormField
                    control={testForm.control}
                    name="calls"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Number of Calls</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" max="10" {...field} />
                        </FormControl>
                        <FormDescription>How many times to call this tool (1-10)</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-2">
                    <p className="text-sm font-medium">Total Cost</p>
                    <p className="text-sm">
                      {selectedTool && testForm.watch("calls")
                        ? formatAmount(
                            (
                              Number.parseInt(selectedTool.price) * Number.parseInt(testForm.watch("calls") || "1")
                            ).toString(),
                          )
                        : "0"}{" "}
                      NTRN
                    </p>
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setTestDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Test Tool</Button>
                </DialogFooter>
              </form>
            </Form>
          ) : (
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">Status:</p>
                  <p className="text-sm">
                    {testStatus === "locking" && "Locking funds in escrow..."}
                    {testStatus === "executing" && "Executing service..."}
                    {testStatus === "releasing" && "Releasing payment..."}
                    {testStatus === "success" && "Payment completed successfully"}
                    {testStatus === "error" && "Error processing payment"}
                  </p>
                </div>

                {txHash && (
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">Transaction:</p>
                    <p className="text-sm text-muted-foreground break-all">{txHash}</p>
                  </div>
                )}
              </div>

              <div className="flex justify-center py-4">
                {(testStatus === "locking" || testStatus === "executing" || testStatus === "releasing") && (
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                )}

                {testStatus === "success" && <CheckCircle2 className="h-12 w-12 text-green-500" />}

                {testStatus === "error" && <AlertCircle className="h-12 w-12 text-destructive" />}
              </div>

              <div className="text-center text-sm text-muted-foreground">
                {testStatus === "locking" && "Creating an escrow on the blockchain..."}
                {testStatus === "executing" && "The provider is executing the requested service..."}
                {testStatus === "releasing" && "Verifying service delivery and releasing payment..."}
                {testStatus === "success" && "The tool was successfully tested and payment was processed"}
                {testStatus === "error" && "There was an error processing your request"}
              </div>

              <DialogFooter>
                {testStatus === "success" || testStatus === "error" ? (
                  <Button onClick={() => setTestDialogOpen(false)}>Close</Button>
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
  )
}

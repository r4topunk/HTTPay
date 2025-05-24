'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from '@/hooks/use-toast'
import { PayPerToolSDK } from '@toolpay/provider-sdk'
import type { PayPerToolSDKConfig } from '@toolpay/provider-sdk'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function DebugPage() {
  const { toast } = useToast()
  const [sdk, setSdk] = useState<PayPerToolSDK | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [sdkConfig, setSdkConfig] = useState<PayPerToolSDKConfig>({
    rpcEndpoint: 'https://rpc-pion-1.neutron.org',
    chainId: 'pion-1',
    registryAddress: 'neutron1zyfl347avgyncyfuqy5px2fapsy4slug83lnrg8vjxxp5jr42hgscv3xv2',
    escrowAddress: 'neutron1nhg2sqnfs9q5hzh7g0z6vwxqfghtqe65qdjmwdkajkfy2kqws7xsmfn9hx',
  })

  // State for different operations
  const [privateKey, setPrivateKey] = useState('')
  const [tools, setTools] = useState<any[]>([])
  const [escrows, setEscrows] = useState<any[]>([])
  const [loading, setLoading] = useState<Record<string, boolean>>({})

  // Tool registration form
  const [toolRegistration, setToolRegistration] = useState({
    toolId: '',
    price: '',
    description: ''
  })

  // Escrow creation form
  const [escrowCreation, setEscrowCreation] = useState({
    toolId: '',
    maxFee: '',
    authToken: '',
    ttl: '10'
  })

  // Escrow verification form
  const [escrowVerification, setEscrowVerification] = useState({
    escrowId: '',
    authToken: '',
    providerAddr: ''
  })

  // Usage posting form
  const [usagePosting, setUsagePosting] = useState({
    escrowId: '',
    usageFee: ''
  })

  const setLoadingState = (key: string, value: boolean) => {
    setLoading(prev => ({ ...prev, [key]: value }))
  }

  const handleError = (error: any, operation: string) => {
    console.error(`Error in ${operation}:`, error)
    toast({
      title: `Error in ${operation}`,
      description: error.message || 'An unknown error occurred',
      variant: 'destructive'
    })
  }

  const initializeSDK = async () => {
    try {
      setLoadingState('init', true)
      const newSdk = new PayPerToolSDK(sdkConfig)
      await newSdk.connect()
      setSdk(newSdk)
      setIsConnected(true)
      toast({
        title: 'SDK Initialized',
        description: 'Connected to the blockchain successfully'
      })
    } catch (error) {
      handleError(error, 'SDK initialization')
    } finally {
      setLoadingState('init', false)
    }
  }

  const connectWallet = async () => {
    if (!sdk || !privateKey) {
      toast({
        title: 'Error',
        description: 'Please provide a private key',
        variant: 'destructive'
      })
      return
    }

    try {
      setLoadingState('wallet', true)
      await sdk.connectWithPrivateKey(privateKey)
      const address = await sdk.getWalletAddress()
      setWalletAddress(address)
      toast({
        title: 'Wallet Connected',
        description: `Connected with address: ${address}`
      })
    } catch (error) {
      handleError(error, 'wallet connection')
    } finally {
      setLoadingState('wallet', false)
    }
  }

  const registerTool = async () => {
    if (!sdk || !walletAddress) {
      toast({
        title: 'Error',
        description: 'Please connect wallet first',
        variant: 'destructive'
      })
      return
    }

    try {
      setLoadingState('register', true)
      const txHash = await sdk.registry.registerTool(
        walletAddress,
        toolRegistration.toolId,
        toolRegistration.price,
        toolRegistration.description
      )
      toast({
        title: 'Tool Registered',
        description: `Tool ${toolRegistration.toolId} registered successfully. TX: ${txHash}`
      })
      await loadTools()
    } catch (error) {
      handleError(error, 'tool registration')
    } finally {
      setLoadingState('register', false)
    }
  }

  const loadTools = async () => {
    if (!sdk) return

    try {
      setLoadingState('loadTools', true)
      const result = await sdk.registry.getTools()
      setTools(result.tools)
    } catch (error) {
      handleError(error, 'loading tools')
    } finally {
      setLoadingState('loadTools', false)
    }
  }

  const lockFunds = async () => {
    if (!sdk || !walletAddress) {
      toast({
        title: 'Error',
        description: 'Please connect wallet first',
        variant: 'destructive'
      })
      return
    }

    try {
      setLoadingState('lockFunds', true)
      const currentBlockHeight = await getCurrentBlockHeight()
      const expires = currentBlockHeight + parseInt(escrowCreation.ttl)
      
      const result = await sdk.escrow.lockFunds(
        walletAddress,
        escrowCreation.toolId,
        escrowCreation.maxFee,
        Buffer.from(escrowCreation.authToken).toString('base64'),
        expires,
        [{ denom: 'untrn', amount: escrowCreation.maxFee }]
      )
      toast({
        title: 'Funds Locked',
        description: `Escrow ${result.escrowId} created successfully. TX: ${result.transactionHash}`
      })
      await loadEscrows()
    } catch (error) {
      handleError(error, 'locking funds')
    } finally {
      setLoadingState('lockFunds', false)
    }
  }

  const getCurrentBlockHeight = async (): Promise<number> => {
    if (!sdk) throw new Error('SDK not initialized')
    const client = sdk.getClient()
    if (!client) throw new Error('No client available')
    const height = await client.getHeight()
    return height
  }

  const loadEscrows = async () => {
    if (!sdk) return

    try {
      setLoadingState('loadEscrows', true)
      // Note: The SDK doesn't have a method to list all escrows, so we'll just show the ones we create
      // In a real implementation, you'd need to track escrow IDs or implement a query method
      setEscrows([])
    } catch (error) {
      handleError(error, 'loading escrows')
    } finally {
      setLoadingState('loadEscrows', false)
    }
  }

  const verifyEscrow = async () => {
    if (!sdk) {
      toast({
        title: 'Error',
        description: 'Please initialize SDK first',
        variant: 'destructive'
      })
      return
    }

    try {
      setLoadingState('verify', true)
      const result = await sdk.escrowVerifier.verifyEscrow({
        escrowId: escrowVerification.escrowId,
        authToken: escrowVerification.authToken,
        providerAddr: escrowVerification.providerAddr
      })
      
      toast({
        title: 'Escrow Verification',
        description: result.isValid ? 'Escrow is valid' : `Invalid: ${result.error}`,
        variant: result.isValid ? 'default' : 'destructive'
      })
    } catch (error) {
      handleError(error, 'escrow verification')
    } finally {
      setLoadingState('verify', false)
    }
  }

  const postUsage = async () => {
    if (!sdk || !walletAddress) {
      toast({
        title: 'Error',
        description: 'Please connect wallet first',
        variant: 'destructive'
      })
      return
    }

    try {
      setLoadingState('usage', true)
      const result = await sdk.postUsage(walletAddress, {
        escrowId: usagePosting.escrowId,
        usageFee: usagePosting.usageFee
      })
      
      toast({
        title: 'Usage Posted',
        description: `Usage reported successfully. TX: ${result.txHash}`
      })
    } catch (error) {
      handleError(error, 'posting usage')
    } finally {
      setLoadingState('usage', false)
    }
  }

  useEffect(() => {
    if (isConnected && sdk) {
      loadTools()
      loadEscrows()
    }
  }, [isConnected, sdk])

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold">PayPerTool SDK Debug Console</h1>
        <p className="text-muted-foreground mt-2">
          Test and interact with the PayPerTool smart contracts
        </p>
      </div>

      {/* SDK Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>SDK Configuration</CardTitle>
          <CardDescription>
            Configure the SDK connection settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="rpc">RPC Endpoint</Label>
              <Input
                id="rpc"
                value={sdkConfig.rpcEndpoint}
                onChange={(e) => setSdkConfig(prev => ({ ...prev, rpcEndpoint: e.target.value }))}
                disabled={isConnected}
              />
            </div>
            <div>
              <Label htmlFor="chainId">Chain ID</Label>
              <Input
                id="chainId"
                value={sdkConfig.chainId}
                onChange={(e) => setSdkConfig(prev => ({ ...prev, chainId: e.target.value }))}
                disabled={isConnected}
              />
            </div>
            <div>
              <Label htmlFor="registry">Registry Address</Label>
              <Input
                id="registry"
                value={sdkConfig.registryAddress}
                onChange={(e) => setSdkConfig(prev => ({ ...prev, registryAddress: e.target.value }))}
                disabled={isConnected}
              />
            </div>
            <div>
              <Label htmlFor="escrow">Escrow Address</Label>
              <Input
                id="escrow"
                value={sdkConfig.escrowAddress}
                onChange={(e) => setSdkConfig(prev => ({ ...prev, escrowAddress: e.target.value }))}
                disabled={isConnected}
              />
            </div>
          </div>
          <div className="flex gap-4">
            <Button 
              onClick={initializeSDK} 
              disabled={isConnected || loading.init}
            >
              {loading.init ? 'Initializing...' : isConnected ? 'Connected' : 'Initialize SDK'}
            </Button>
            {isConnected && (
              <Badge variant="secondary">
                ✓ Connected to {sdkConfig.chainId}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Wallet Connection */}
      {isConnected && (
        <Card>
          <CardHeader>
            <CardTitle>Wallet Connection</CardTitle>
            <CardDescription>
              Connect your wallet to perform transactions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="privateKey">Private Key (hex)</Label>
              <Input
                id="privateKey"
                type="password"
                value={privateKey}
                onChange={(e) => setPrivateKey(e.target.value)}
                placeholder="Enter your private key..."
                disabled={!!walletAddress}
              />
            </div>
            <div className="flex gap-4 items-center">
              <Button 
                onClick={connectWallet} 
                disabled={!!walletAddress || loading.wallet}
              >
                {loading.wallet ? 'Connecting...' : walletAddress ? 'Connected' : 'Connect Wallet'}
              </Button>
              {walletAddress && (
                <Badge variant="secondary">
                  {walletAddress}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main SDK Operations */}
      {isConnected && (
        <Tabs defaultValue="tools" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="tools">Tools & Registry</TabsTrigger>
            <TabsTrigger value="escrows">Escrows</TabsTrigger>
            <TabsTrigger value="verification">Verification</TabsTrigger>
            <TabsTrigger value="usage">Usage & Claims</TabsTrigger>
          </TabsList>

          <TabsContent value="tools" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Tool Registration */}
              <Card>
                <CardHeader>
                  <CardTitle>Register Tool</CardTitle>
                  <CardDescription>
                    Register a new tool as a provider
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="toolId">Tool ID</Label>
                    <Input
                      id="toolId"
                      value={toolRegistration.toolId}
                      onChange={(e) => setToolRegistration(prev => ({ ...prev, toolId: e.target.value }))}
                      placeholder="sentiment-api"
                    />
                  </div>
                  <div>
                    <Label htmlFor="price">Price (untrn)</Label>
                    <Input
                      id="price"
                      value={toolRegistration.price}
                      onChange={(e) => setToolRegistration(prev => ({ ...prev, price: e.target.value }))}
                      placeholder="1000000"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={toolRegistration.description}
                      onChange={(e) => setToolRegistration(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="AI-powered sentiment analysis tool"
                    />
                  </div>
                  <Button 
                    onClick={registerTool} 
                    disabled={!walletAddress || loading.register}
                    className="w-full"
                  >
                    {loading.register ? 'Registering...' : 'Register Tool'}
                  </Button>
                </CardContent>
              </Card>

              {/* Available Tools */}
              <Card>
                <CardHeader>
                  <CardTitle>Available Tools</CardTitle>
                  <CardDescription>
                    Browse registered tools
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={loadTools} 
                    disabled={loading.loadTools}
                    className="mb-4"
                  >
                    {loading.loadTools ? 'Loading...' : 'Refresh Tools'}
                  </Button>
                  <div className="space-y-2">
                    {tools.length === 0 ? (
                      <p className="text-muted-foreground">No tools found</p>
                    ) : (
                      tools.map((tool, index) => (
                        <div key={index} className="p-3 border rounded">
                          <div className="font-medium">{tool.tool_id}</div>
                          <div className="text-sm text-muted-foreground">
                            Price: {tool.price} untrn
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Provider: {tool.provider}
                          </div>
                          <Badge variant={tool.is_active ? "default" : "secondary"}>
                            {tool.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="escrows" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Create Escrow */}
              <Card>
                <CardHeader>
                  <CardTitle>Lock Funds in Escrow</CardTitle>
                  <CardDescription>
                    Create an escrow for tool usage
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="escrowToolId">Tool ID</Label>
                    <Input
                      id="escrowToolId"
                      value={escrowCreation.toolId}
                      onChange={(e) => setEscrowCreation(prev => ({ ...prev, toolId: e.target.value }))}
                      placeholder="sentiment-api"
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxFee">Max Fee (untrn)</Label>
                    <Input
                      id="maxFee"
                      value={escrowCreation.maxFee}
                      onChange={(e) => setEscrowCreation(prev => ({ ...prev, maxFee: e.target.value }))}
                      placeholder="1000000"
                    />
                  </div>
                  <div>
                    <Label htmlFor="authToken">Auth Token</Label>
                    <Input
                      id="authToken"
                      value={escrowCreation.authToken}
                      onChange={(e) => setEscrowCreation(prev => ({ ...prev, authToken: e.target.value }))}
                      placeholder="secret-auth-token"
                    />
                  </div>
                  <div>
                    <Label htmlFor="ttl">TTL (blocks)</Label>
                    <Input
                      id="ttl"
                      value={escrowCreation.ttl}
                      onChange={(e) => setEscrowCreation(prev => ({ ...prev, ttl: e.target.value }))}
                      placeholder="10"
                    />
                  </div>
                  <Button 
                    onClick={lockFunds} 
                    disabled={!walletAddress || loading.lockFunds}
                    className="w-full"
                  >
                    {loading.lockFunds ? 'Locking Funds...' : 'Lock Funds'}
                  </Button>
                </CardContent>
              </Card>

              {/* Escrow List */}
              <Card>
                <CardHeader>
                  <CardTitle>Escrows</CardTitle>
                  <CardDescription>
                    View created escrows
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={loadEscrows} 
                    disabled={loading.loadEscrows}
                    className="mb-4"
                  >
                    {loading.loadEscrows ? 'Loading...' : 'Refresh Escrows'}
                  </Button>
                  <div className="space-y-2">
                    {escrows.length === 0 ? (
                      <Alert>
                        <AlertDescription>
                          No escrows found. Create an escrow to see it here.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      escrows.map((escrow, index) => (
                        <div key={index} className="p-3 border rounded">
                          <div className="font-medium">Escrow ID: {escrow.id}</div>
                          <div className="text-sm text-muted-foreground">
                            Tool: {escrow.tool_id}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Max Fee: {escrow.max_fee} untrn
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="verification" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Verify Escrow</CardTitle>
                <CardDescription>
                  Verify escrow validity and authorization
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="verifyEscrowId">Escrow ID</Label>
                    <Input
                      id="verifyEscrowId"
                      value={escrowVerification.escrowId}
                      onChange={(e) => setEscrowVerification(prev => ({ ...prev, escrowId: e.target.value }))}
                      placeholder="123"
                    />
                  </div>
                  <div>
                    <Label htmlFor="verifyAuthToken">Auth Token</Label>
                    <Input
                      id="verifyAuthToken"
                      value={escrowVerification.authToken}
                      onChange={(e) => setEscrowVerification(prev => ({ ...prev, authToken: e.target.value }))}
                      placeholder="secret-auth-token"
                    />
                  </div>
                  <div>
                    <Label htmlFor="verifyProviderAddr">Provider Address</Label>
                    <Input
                      id="verifyProviderAddr"
                      value={escrowVerification.providerAddr}
                      onChange={(e) => setEscrowVerification(prev => ({ ...prev, providerAddr: e.target.value }))}
                      placeholder="neutron1..."
                    />
                  </div>
                </div>
                <Button 
                  onClick={verifyEscrow} 
                  disabled={loading.verify}
                  className="w-full"
                >
                  {loading.verify ? 'Verifying...' : 'Verify Escrow'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="usage" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Post Usage & Claim Funds</CardTitle>
                <CardDescription>
                  Report tool usage and claim payment
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="usageEscrowId">Escrow ID</Label>
                    <Input
                      id="usageEscrowId"
                      value={usagePosting.escrowId}
                      onChange={(e) => setUsagePosting(prev => ({ ...prev, escrowId: e.target.value }))}
                      placeholder="123"
                    />
                  </div>
                  <div>
                    <Label htmlFor="usageFee">Usage Fee (untrn)</Label>
                    <Input
                      id="usageFee"
                      value={usagePosting.usageFee}
                      onChange={(e) => setUsagePosting(prev => ({ ...prev, usageFee: e.target.value }))}
                      placeholder="500000"
                    />
                  </div>
                </div>
                <Button 
                  onClick={postUsage} 
                  disabled={!walletAddress || loading.usage}
                  className="w-full"
                >
                  {loading.usage ? 'Posting Usage...' : 'Post Usage & Claim'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}

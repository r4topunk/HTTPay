"use client";

import React, { createContext, useContext, useCallback, useState, useEffect, ReactNode } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useChain } from "@cosmos-kit/react";
import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import {
  RegistryQueryClient,
  RegistryClient,
  ToolResponse,
  ToolsResponse,
  Uint128,
} from "httpay-sdk";

// Default chain configuration
const defaultChainName = "neutrontestnet";

// Configuration for the V2 SDK
interface V2SDKConfig {
  rpcEndpoint: string;
  chainId: string;
  registryAddress: string;
  gasPrice: string;
  gasAdjustment: number;
}

// Context state type
interface V2SDKContextType {
  // Connection state
  isConnected: boolean;
  hasSigningCapabilities: boolean;
  
  // Clients
  queryClient: RegistryQueryClient | null;
  signingClient: RegistryClient | null;
  
  // Data
  tools: ToolResponse[];
  
  // Loading states
  loading: Record<string, boolean>;
  
  // Actions
  loadTools: () => Promise<void>;
  registerTool: (toolData: ToolRegistrationForm) => Promise<void>;
  
  // Wallet integration
  walletAddress: string | undefined;
  isWalletConnected: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  
  // Config
  sdkConfig: V2SDKConfig;
  setSdkConfig: (config: V2SDKConfig) => void;
}

// Form data types
interface ToolRegistrationForm {
  toolId: string;
  price: string;
  description: string;
  endpoint: string;
  denom?: string;
}

const V2SDKContext = createContext<V2SDKContextType | undefined>(undefined);

export const useV2SDK = () => {
  const context = useContext(V2SDKContext);
  if (!context) {
    throw new Error("useV2SDK must be used within a V2SDKProvider");
  }
  return context;
};

interface V2SDKProviderProps {
  children: ReactNode;
}

export const V2SDKProvider = ({ children }: V2SDKProviderProps) => {
  const { toast } = useToast();
  
  // State
  const [queryClient, setQueryClient] = useState<RegistryQueryClient | null>(null);
  const [signingClient, setSigningClient] = useState<RegistryClient | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [hasSigningCapabilities, setHasSigningCapabilities] = useState(false);
  const [tools, setTools] = useState<ToolResponse[]>([]);
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  // CosmosKit integration
  const {
    address: walletAddress,
    isWalletConnected,
    getSigningCosmWasmClient,
    connect: connectWallet,
    disconnect: disconnectWallet,
  } = useChain(defaultChainName);

  // SDK Configuration
  const [sdkConfig, setSdkConfig] = useState<V2SDKConfig>({
    rpcEndpoint: "https://rpc-falcron.pion-1.ntrn.tech",
    chainId: "pion-1",
    registryAddress: "neutron1jnxjn7097hqa3snqgwch2vpssnhel3wftfcgw6pjk34mzk4dfjhq243xxn",
    gasPrice: "0.0053untrn",
    gasAdjustment: 1.3,
  });

  // Utility functions
  const setLoadingState = useCallback((key: string, value: boolean) => {
    setLoading(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleError = useCallback((error: Error | unknown, operation: string) => {
    console.error(`Error in ${operation}:`, error);
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    toast({
      title: "Error",
      description: `${operation} failed: ${message}`,
      variant: "destructive",
    });
  }, [toast]);

  // Initialize read-only client
  const initializeQueryClient = useCallback(async () => {
    try {
      setLoadingState("connecting", true);
      
      const cosmWasmClient = await CosmWasmClient.connect(sdkConfig.rpcEndpoint);
      const client = new RegistryQueryClient(cosmWasmClient, sdkConfig.registryAddress);
      
      setQueryClient(client);
      setIsConnected(true);
      
      toast({
        title: "SDK Connected",
        description: "Read-only connection established",
      });
    } catch (error) {
      handleError(error, "SDK connection");
    } finally {
      setLoadingState("connecting", false);
    }
  }, [sdkConfig, setLoadingState, handleError, toast]);

  // Initialize signing client with wallet
  const initializeSigningClient = useCallback(async () => {
    if (!walletAddress || !isWalletConnected) {
      return;
    }

    try {
      setLoadingState("wallet", true);
      
      const signingCosmWasmClient = await getSigningCosmWasmClient();
      const client = new RegistryClient(
        signingCosmWasmClient,
        walletAddress,
        sdkConfig.registryAddress
      );
      
      setSigningClient(client);
      setHasSigningCapabilities(true);
      
      toast({
        title: "Wallet Connected",
        description: `Signing capabilities enabled for ${walletAddress}`,
      });
    } catch (error) {
      handleError(error, "wallet connection");
      setHasSigningCapabilities(false);
    } finally {
      setLoadingState("wallet", false);
    }
  }, [walletAddress, isWalletConnected, getSigningCosmWasmClient, sdkConfig, setLoadingState, handleError, toast]);

  // Load tools from registry
  const loadTools = useCallback(async () => {
    if (!queryClient) return;

    try {
      setLoadingState("tools", true);
      
      const response: ToolsResponse = await queryClient.getTools();
      setTools(response.tools);
    } catch (error) {
      handleError(error, "loading tools");
    } finally {
      setLoadingState("tools", false);
    }
  }, [queryClient, setLoadingState, handleError]);

  // Register a new tool
  const registerTool = useCallback(async (toolData: ToolRegistrationForm) => {
    if (!signingClient || !walletAddress) {
      toast({
        title: "Error",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoadingState("register", true);

      const result = await signingClient.registerTool({
        toolId: toolData.toolId,
        price: toolData.price as Uint128,
        description: toolData.description,
        endpoint: toolData.endpoint,
        denom: toolData.denom,
      });

      toast({
        title: "Tool Registered",
        description: `Tool ${toolData.toolId} registered successfully. TX: ${result.transactionHash}`,
      });

      // Reload tools after successful registration
      await loadTools();
    } catch (error) {
      handleError(error, "tool registration");
    } finally {
      setLoadingState("register", false);
    }
  }, [signingClient, walletAddress, setLoadingState, handleError, toast, loadTools]);

  // Initialize query client on config change
  useEffect(() => {
    initializeQueryClient();
  }, [initializeQueryClient]);

  // Initialize signing client when wallet connects
  useEffect(() => {
    if (isWalletConnected && walletAddress) {
      initializeSigningClient();
    } else {
      setSigningClient(null);
      setHasSigningCapabilities(false);
    }
  }, [isWalletConnected, walletAddress, initializeSigningClient]);

  // Load tools when query client is available
  useEffect(() => {
    if (queryClient && isConnected) {
      loadTools();
    }
  }, [queryClient, isConnected, loadTools]);

  const value: V2SDKContextType = {
    // Connection state
    isConnected,
    hasSigningCapabilities,
    
    // Clients
    queryClient,
    signingClient,
    
    // Data
    tools,
    
    // Loading states
    loading,
    
    // Actions
    loadTools,
    registerTool,
    
    // Wallet integration
    walletAddress,
    isWalletConnected,
    connectWallet,
    disconnectWallet,
    
    // Config
    sdkConfig,
    setSdkConfig,
  };

  return (
    <V2SDKContext.Provider value={value}>
      {children}
    </V2SDKContext.Provider>
  );
};

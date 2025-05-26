"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useToast } from "@/components/ui/use-toast";
import { HTTPaySDK } from "httpay";
import type { HTTPaySDKConfig } from "httpay";
import { useChain } from "@cosmos-kit/react";
import { defaultChainName } from "@/config/chain-config";
import {
  SDKContextType,
  Tool,
  Escrow,
  ToolRegistrationForm,
  EscrowCreationForm,
  EscrowVerificationForm,
  UsagePostingForm,
  EscrowsFilter,
  LockFundsResult,
} from "./types";

const SDKContext = createContext<SDKContextType | undefined>(undefined);

export const useSDK = () => {
  const context = useContext(SDKContext);
  if (!context) {
    throw new Error("useSDK must be used within an SDKProvider");
  }
  return context;
};

interface SDKProviderProps {
  children: ReactNode;
}

export const SDKProvider = ({ children }: SDKProviderProps) => {
  const { toast } = useToast();
  const [sdk, setSdk] = useState<HTTPaySDK | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [hasSigningCapabilities, setHasSigningCapabilities] = useState(false);
  const [tools, setTools] = useState<Tool[]>([]);
  const [escrows, setEscrows] = useState<Escrow[]>([]);
  const [escrowsFilter, setEscrowsFilter] = useState<EscrowsFilter>({});
  const [hasMoreEscrows, setHasMoreEscrows] = useState(false);
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [currentBlockHeight, setCurrentBlockHeight] = useState<number | null>(null);

  // CosmosKit integration
  const {
    address: walletAddress,
    status: walletStatus,
    message: walletMessage,
    isWalletConnected,
    isWalletConnecting,
    isWalletDisconnected,
    isWalletError,
    getSigningCosmWasmClient,
    connect: connectWallet,
    disconnect: disconnectWallet,
    enable,
  } = useChain(defaultChainName);

  const [sdkConfig, setSdkConfig] = useState<HTTPaySDKConfig>({
    rpcEndpoint: "https://rpc-falcron.pion-1.ntrn.tech",
    chainId: "pion-1",
    registryAddress:
      "neutron1jnxjn7097hqa3snqgwch2vpssnhel3wftfcgw6pjk34mzk4dfjhq243xxn",
    escrowAddress:
      "neutron196v7vyr6dw0xglzgrnsaxwn8hcy2hrmttgu65q5z5fyvfg3jeadswrhahs",
    gasPrice: "0.0053untrn",
    gasAdjustment: 1.3,
  });

  const setLoadingState = useCallback((key: string, value: boolean) => {
    setLoading((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleError = useCallback((error: Error | unknown, operation: string) => {
    console.error(`Error in ${operation}:`, error);
    toast({
      title: `Error in ${operation}`,
      description: error instanceof Error ? error.message : "An unknown error occurred",
      variant: "destructive",
    });
  }, [toast]);

  const initializeSDK = useCallback(async () => {
    try {
      setLoadingState("init", true);
      const newSdk = new HTTPaySDK(sdkConfig);
      await newSdk.connect();
      setSdk(newSdk);
      setIsConnected(true);
      setHasSigningCapabilities(false);
      toast({
        title: "SDK Initialized",
        description: "Connected to the blockchain successfully",
      });
    } catch (error) {
      handleError(error, "SDK initialization");
    } finally {
      setLoadingState("init", false);
    }
  }, [sdkConfig, setLoadingState, handleError, toast]);

  const initSDKWithWallet = useCallback(async () => {
    console.log("initSDKWithWallet called with:", { walletAddress, isWalletConnected });
    
    if (!walletAddress || !isWalletConnected) {
      console.warn("Cannot initialize SDK with wallet - wallet not ready:", { walletAddress, isWalletConnected });
      toast({
        title: "Error",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return null;
    }

    try {
      setLoadingState("wallet", true);

      console.log("Initializing SDK with wallet...", { walletAddress, isWalletConnected });

      // Create a new SDK instance with the current configuration
      const newSdk = new HTTPaySDK(sdkConfig);
      
      // First connect to establish base client
      await newSdk.connect();
      console.log("SDK base connection established");

      // Get the signing client from CosmosKit
      const signingClient = await getSigningCosmWasmClient();
      console.log("Got signing client from CosmosKit:", !!signingClient);
      
      // Connect the SDK with the signing client
      // This ensures the gasPrice from sdkConfig is properly used
      newSdk.connectWithSigningClient(signingClient);

      console.log("SDK connected with signing capabilities", newSdk.getClient());

      setSdk(newSdk);
      setIsConnected(true);
      setHasSigningCapabilities(true);

      console.log("State updated: SDK set, isConnected=true, hasSigningCapabilities=true");

      toast({
        title: "SDK Connected with Wallet",
        description: `Using wallet address: ${walletAddress}`,
      });

      return newSdk;
    } catch (error) {
      console.error("Failed to initialize SDK with wallet:", error);
      setHasSigningCapabilities(false);
      setIsConnected(false);
      setSdk(null);
      handleError(error, "wallet connection");
      return null;
    } finally {
      setLoadingState("wallet", false);
    }
  }, [walletAddress, isWalletConnected, sdkConfig, getSigningCosmWasmClient, setLoadingState, handleError, toast]);

  const loadTools = useCallback(async () => {
    if (!sdk) return;

    try {
      setLoadingState("loadTools", true);
      const result = await sdk.registry.getTools();
      setTools(result.tools);
    } catch (error) {
      handleError(error, "loading tools");
    } finally {
      setLoadingState("loadTools", false);
    }
  }, [sdk, setLoadingState, handleError]);

  const registerTool = useCallback(async (toolData: ToolRegistrationForm) => {
    console.log("registerTool called with state:", { 
      hasSdk: !!sdk, 
      walletAddress, 
      isWalletConnected, 
      isConnected, 
      hasSigningCapabilities 
    });

    if (!sdk || !walletAddress || !isWalletConnected) {
      toast({
        title: "Error",
        description: "Please connect wallet first",
        variant: "destructive",
      });
      return;
    }

    if (!hasSigningCapabilities) {
      console.error("Attempting to register tool without signing capabilities", {
        sdk: !!sdk,
        walletAddress,
        walletStatus,
        isConnected,
        hasSigningCapabilities
      });
      toast({
        title: "Error",
        description: "SDK does not have signing capabilities. Please reconnect your wallet.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoadingState("register", true);

      console.log("Registering tool with data:", toolData);
      console.log("SDK has signing capabilities:", hasSigningCapabilities);
      console.log("Current SDK client:", sdk.getClient());

      // Use the SDK's high-level registerTool method instead of manually constructing messages
      const transactionHash = await sdk.registry.registerTool(
        walletAddress,
        toolData.toolId,
        toolData.price,
        toolData.description,
        toolData.endpoint
      );

      toast({
        title: "Tool Registered",
        description: `Tool ${toolData.toolId} registered successfully. TX: ${transactionHash}`,
      });
      await loadTools();
    } catch (error) {
      console.error("Tool registration failed:", error);
      handleError(error, "tool registration");
    } finally {
      setLoadingState("register", false);
    }
  }, [sdk, walletAddress, isWalletConnected, isConnected, hasSigningCapabilities, setLoadingState, handleError, toast, loadTools]);

  const updateEndpoint = useCallback(async (toolId: string, endpoint: string) => {
    if (!sdk || !walletAddress || !isWalletConnected) {
      toast({
        title: "Error",
        description: "Please connect wallet first",
        variant: "destructive",
      });
      return;
    }

    if (!hasSigningCapabilities) {
      toast({
        title: "Error",
        description: "SDK does not have signing capabilities. Please reconnect your wallet.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoadingState("updateEndpoint", true);

      const transactionHash = await sdk.registry.updateEndpoint(
        walletAddress,
        toolId,
        endpoint
      );

      toast({
        title: "Endpoint Updated",
        description: `Endpoint for ${toolId} updated successfully. TX: ${transactionHash}`,
      });
      await loadTools();
    } catch (error) {
      console.error("Endpoint update failed:", error);
      handleError(error, "endpoint update");
    } finally {
      setLoadingState("updateEndpoint", false);
    }
  }, [sdk, walletAddress, isWalletConnected, isConnected, hasSigningCapabilities, setLoadingState, handleError, toast, loadTools]);

  const getCurrentBlockHeight = useCallback(async (): Promise<number> => {
    if (!sdk) throw new Error("SDK not initialized");
    const client = sdk.getClient();
    if (!client) throw new Error("No client available");
    const height = await client.getHeight();
    return height;
  }, [sdk]);

  const updateBlockHeight = useCallback(async () => {
    if (!sdk || !isConnected) return;
    
    try {
      const height = await getCurrentBlockHeight();
      setCurrentBlockHeight(height);
    } catch (error) {
      // Silently fail for block height updates to avoid spam
      console.warn("Failed to fetch block height:", error);
    }
  }, [sdk, isConnected, getCurrentBlockHeight]);

  // Set up interval to update block height every 10 seconds when connected
  useEffect(() => {
    if (!isConnected || !sdk) {
      setCurrentBlockHeight(null);
      return;
    }

    // Initial fetch
    updateBlockHeight();

    // Set up interval
    const interval = setInterval(updateBlockHeight, 1000); // 1 second

    return () => clearInterval(interval);
  }, [isConnected, sdk, updateBlockHeight]);

  const loadEscrows = useCallback(async (filter?: EscrowsFilter) => {
    if (!sdk) return;

    try {
      setLoadingState("loadEscrows", true);
      
      // If a new filter is provided, update the current filter and reset pagination
      if (filter !== undefined) {
        setEscrowsFilter(filter);
        setEscrows([]); // Clear existing escrows when applying new filter
      }
      
      // Use provided filter or current filter
      const activeFilter = filter !== undefined ? filter : escrowsFilter;
      
      // Query escrows with current filter
      const result = await sdk.getEscrows({
        caller: activeFilter.caller,
        provider: activeFilter.provider,
        startAfter: activeFilter.startAfter,
        limit: activeFilter.limit || 10, // Default limit of 10
      });

      // Update escrows state - replace if new filter, append if pagination
      if (filter !== undefined) {
        setEscrows(result.escrows);
      } else {
        setEscrows(prev => [...prev, ...result.escrows]);
      }
      
      // Check if there are more escrows available
      setHasMoreEscrows(result.escrows.length >= (activeFilter.limit || 10));
      
    } catch (error) {
      handleError(error, "loading escrows");
    } finally {
      setLoadingState("loadEscrows", false);
    }
  }, [sdk, escrowsFilter, setLoadingState, handleError]);

  const lockFunds = useCallback(async (escrowData: EscrowCreationForm) => {
    if (!sdk || !walletAddress || !isWalletConnected) {
      toast({
        title: "Error",
        description: "Please connect wallet first",
        variant: "destructive",
      });
      return;
    }

    if (!hasSigningCapabilities) {
      toast({
        title: "Error",
        description: "SDK does not have signing capabilities. Please reconnect your wallet.",
        variant: "destructive",
      });
      console.error("Attempting to lock funds without signing capabilities");
      return;
    }

    try {
      setLoadingState("lockFunds", true);

      const currentBlockHeight = await getCurrentBlockHeight();
      const expires = currentBlockHeight + parseInt(escrowData.ttl);
      
      // Convert authToken to base64 if needed
      const authToken = Buffer.from(escrowData.authToken).toString("base64");
      
      // Use the SDK's high-level lockFunds method
      const funds = [{ denom: "untrn", amount: escrowData.maxFee }];
      const result = await sdk.escrow.lockFunds(
        walletAddress,
        escrowData.toolId,
        escrowData.maxFee,
        authToken,
        expires,
        funds
      );

      toast({
        title: "Funds Locked",
        description: `Escrow ${result.escrowId} created successfully. TX: ${result.transactionHash}`,
      });
      await loadEscrows();
      return result; // Return the result so caller can access escrowId and transactionHash
    } catch (error) {
      console.error("Lock funds failed:", error);
      handleError(error, "locking funds");
    } finally {
      setLoadingState("lockFunds", false);
    }
  }, [sdk, walletAddress, isWalletConnected, hasSigningCapabilities, getCurrentBlockHeight, setLoadingState, handleError, toast, loadEscrows]);

  const verifyEscrow = useCallback(async (verificationData: EscrowVerificationForm) => {
    if (!sdk) {
      toast({
        title: "Error",
        description: "Please initialize SDK first",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoadingState("verify", true);
      const result = await sdk.escrowVerifier.verifyEscrow({
        escrowId: verificationData.escrowId,
        authToken: verificationData.authToken,
        providerAddr: verificationData.providerAddr,
      });

      toast({
        title: "Escrow Verification",
        description: result.isValid
          ? "Escrow is valid"
          : `Invalid: ${result.error}`,
        variant: result.isValid ? "default" : "destructive",
      });
    } catch (error) {
      handleError(error, "escrow verification");
    } finally {
      setLoadingState("verify", false);
    }
  }, [sdk, setLoadingState, handleError, toast]);

  const postUsage = useCallback(async (usageData: UsagePostingForm) => {
    if (!sdk || !walletAddress || !isWalletConnected) {
      toast({
        title: "Error",
        description: "Please connect wallet first",
        variant: "destructive",
      });
      return;
    }

    if (!hasSigningCapabilities) {
      toast({
        title: "Error",
        description: "SDK does not have signing capabilities. Please reconnect your wallet.",
        variant: "destructive",
      });
      console.error("Attempting to post usage without signing capabilities");
      return;
    }

    try {
      setLoadingState("usage", true);

      // Use the SDK's high-level postUsage method
      const result = await sdk.postUsage(walletAddress, {
        escrowId: usageData.escrowId,
        usageFee: usageData.usageFee,
        options: {
          memo: "Payment for tool usage",
        }
      });

      toast({
        title: "Usage Posted",
        description: `Usage reported successfully. TX: ${result.txHash}`,
      });
    } catch (error) {
      console.error("Post usage failed:", error);
      handleError(error, "posting usage");
    } finally {
      setLoadingState("usage", false);
    }
  }, [sdk, walletAddress, isWalletConnected, hasSigningCapabilities, setLoadingState, handleError, toast]);

  const loadMoreEscrows = useCallback(async () => {
    if (!hasMoreEscrows || escrows.length === 0) return;

    // Set the startAfter to the last escrow's ID for pagination
    const lastEscrowId = escrows[escrows.length - 1].escrow_id;
    const paginationFilter = {
      ...escrowsFilter,
      startAfter: lastEscrowId,
    };

    await loadEscrows(paginationFilter);
  }, [hasMoreEscrows, escrows, escrowsFilter, loadEscrows]);

  const resetEscrowsFilter = useCallback(async () => {
    const emptyFilter: EscrowsFilter = {};
    setEscrowsFilter(emptyFilter);
    setEscrows([]);
    setHasMoreEscrows(false);
    await loadEscrows(emptyFilter);
  }, [loadEscrows]);

  const forceReconnectWallet = useCallback(async () => {
    console.log("Force reconnecting wallet...");
    if (isWalletConnected && walletAddress) {
      await initSDKWithWallet();
    } else {
      console.warn("Cannot force reconnect - wallet not connected:", { isWalletConnected, walletAddress });
    }
  }, [isWalletConnected, walletAddress, initSDKWithWallet]);

  // Monitor wallet status changes
  useEffect(() => {
    console.log("Wallet status changed:", { isWalletConnected, walletAddress, isConnected, hasSigningCapabilities });
    
    if (isWalletConnected && walletAddress) {
      // Always reinitialize SDK with wallet when wallet connects
      // This handles both cases: no SDK yet, or SDK in read-only mode
      console.log("Wallet connected, initializing SDK with signing capabilities...");
      const initSdk = async () => {
        try {
          const result = await initSDKWithWallet();
          console.log("SDK initialization result:", result ? "success" : "failed");
        } catch (error) {
          console.error("Failed to initialize SDK with wallet in useEffect:", error);
        }
      };
      // Add a small delay to ensure the wallet is fully ready
      setTimeout(initSdk, 100);
    } else if (!isWalletConnected && isConnected) {
      console.log("Wallet disconnected, resetting SDK...");
      setIsConnected(false);
      setHasSigningCapabilities(false);
      setSdk(null);
    }
  }, [isWalletConnected, walletAddress]); // Removed initSDKWithWallet from dependencies to prevent recreation loops

  // Load data when SDK is initialized
  useEffect(() => {
    if (isConnected && sdk) {
      loadTools();
      loadEscrows();
    }
  }, [isConnected, sdk, loadTools, loadEscrows]);

  const value: SDKContextType = {
    sdk,
    isConnected,
    hasSigningCapabilities,
    loading,
    tools,
    escrows,
    hasMoreEscrows,
    sdkConfig,
    walletAddress,
    isWalletConnected,
    isWalletConnecting,
    isWalletDisconnected,
    isWalletError,
    currentBlockHeight,
    setSdkConfig,
    initializeSDK,
    initSDKWithWallet,
    forceReconnectWallet,
    registerTool,
    updateEndpoint,
    loadTools,
    lockFunds,
    loadEscrows,
    loadMoreEscrows,
    resetEscrowsFilter,
    verifyEscrow,
    postUsage,
    connectWallet,
    disconnectWallet,
    setLoadingState,
    handleError,
  };

  return <SDKContext.Provider value={value}>{children}</SDKContext.Provider>;
};

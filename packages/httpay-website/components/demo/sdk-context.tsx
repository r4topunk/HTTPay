"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useToast } from "@/hooks/use-toast";
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
  const [tools, setTools] = useState<Tool[]>([]);
  const [escrows, setEscrows] = useState<Escrow[]>([]);
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  // CosmosKit integration
  const {
    address: walletAddress,
    status: walletStatus,
    getSigningCosmWasmClient,
    connect: connectWallet,
    disconnect: disconnectWallet,
  } = useChain(defaultChainName);

  const [sdkConfig, setSdkConfig] = useState<HTTPaySDKConfig>({
    rpcEndpoint: "https://rpc-falcron.pion-1.ntrn.tech",
    chainId: "pion-1",
    registryAddress:
      "neutron1zyfl347avgyncyfuqy5px2fapsy4slug83lnrg8vjxxp5jr42hgscv3xv2",
    escrowAddress:
      "neutron1nhg2sqnfs9q5hzh7g0z6vwxqfghtqe65qdjmwdkajkfy2kqws7xsmfn9hx",
    gasPrice: "0.0053untrn",
    gasAdjustment: 1.3,
  });

  const setLoadingState = useCallback((key: string, value: boolean) => {
    setLoading((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleError = useCallback((error: any, operation: string) => {
    console.error(`Error in ${operation}:`, error);
    toast({
      title: `Error in ${operation}`,
      description: error.message || "An unknown error occurred",
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
    if (!walletAddress || walletStatus !== "Connected") {
      toast({
        title: "Error",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return null;
    }

    try {
      setLoadingState("wallet", true);

      // Create a new SDK instance with the current configuration
      const newSdk = new HTTPaySDK(sdkConfig);
      
      // First connect to establish base client
      await newSdk.connect();

      // Get the signing client from CosmosKit
      const signingClient = await getSigningCosmWasmClient();
      
      // Connect the SDK with the signing client
      // This ensures the gasPrice from sdkConfig is properly used
      newSdk.connectWithSigningClient(signingClient);

      console.log("Sdk client", newSdk.getClient());

      setSdk(newSdk);
      setIsConnected(true);

      toast({
        title: "SDK Connected with Wallet",
        description: `Using wallet address: ${walletAddress}`,
      });

      return newSdk;
    } catch (error) {
      handleError(error, "wallet connection");
      return null;
    } finally {
      setLoadingState("wallet", false);
    }
  }, [walletAddress, walletStatus, sdkConfig, getSigningCosmWasmClient, setLoadingState, handleError, toast]);

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
    if (!sdk || !walletAddress || walletStatus !== "Connected") {
      toast({
        title: "Error",
        description: "Please connect wallet first",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoadingState("register", true);

      // Use the SDK's high-level registerTool method instead of manually constructing messages
      const transactionHash = await sdk.registry.registerTool(
        walletAddress,
        toolData.toolId,
        toolData.price,
        toolData.description
      );

      toast({
        title: "Tool Registered",
        description: `Tool ${toolData.toolId} registered successfully. TX: ${transactionHash}`,
      });
      await loadTools();
    } catch (error) {
      handleError(error, "tool registration");
    } finally {
      setLoadingState("register", false);
    }
  }, [sdk, walletAddress, walletStatus, setLoadingState, handleError, toast, loadTools]);

  const getCurrentBlockHeight = useCallback(async (): Promise<number> => {
    if (!sdk) throw new Error("SDK not initialized");
    const client = sdk.getClient();
    if (!client) throw new Error("No client available");
    const height = await client.getHeight();
    return height;
  }, [sdk]);

  const loadEscrows = useCallback(async () => {
    if (!sdk) return;

    try {
      setLoadingState("loadEscrows", true);
      setEscrows([]);
    } catch (error) {
      handleError(error, "loading escrows");
    } finally {
      setLoadingState("loadEscrows", false);
    }
  }, [sdk, setLoadingState, handleError]);

  const lockFunds = useCallback(async (escrowData: EscrowCreationForm) => {
    if (!sdk || !walletAddress || walletStatus !== "Connected") {
      toast({
        title: "Error",
        description: "Please connect wallet first",
        variant: "destructive",
      });
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
    } catch (error) {
      handleError(error, "locking funds");
    } finally {
      setLoadingState("lockFunds", false);
    }
  }, [sdk, walletAddress, walletStatus, getCurrentBlockHeight, setLoadingState, handleError, toast, loadEscrows]);

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
    if (!sdk || !walletAddress || walletStatus !== "Connected") {
      toast({
        title: "Error",
        description: "Please connect wallet first",
        variant: "destructive",
      });
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
      handleError(error, "posting usage");
    } finally {
      setLoadingState("usage", false);
    }
  }, [sdk, walletAddress, walletStatus, setLoadingState, handleError, toast]);

  // Monitor wallet status changes
  useEffect(() => {
    if (walletStatus === "Connected" && walletAddress && !isConnected) {
      const initSdk = async () => {
        await initSDKWithWallet();
      };
      initSdk();
    } else if (walletStatus !== "Connected" && isConnected) {
      setIsConnected(false);
      setSdk(null);
    }
  }, [walletStatus, walletAddress, isConnected, initSDKWithWallet]);

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
    loading,
    tools,
    escrows,
    sdkConfig,
    walletAddress,
    walletStatus,
    setSdkConfig,
    initializeSDK,
    initSDKWithWallet,
    registerTool,
    loadTools,
    lockFunds,
    loadEscrows,
    verifyEscrow,
    postUsage,
    connectWallet,
    disconnectWallet,
    setLoadingState,
    handleError,
  };

  return <SDKContext.Provider value={value}>{children}</SDKContext.Provider>;
};

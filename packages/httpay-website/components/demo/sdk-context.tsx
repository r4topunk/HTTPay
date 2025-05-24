"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useToast } from "@/hooks/use-toast";
import { PayPerToolSDK } from "@toolpay/provider-sdk";
import type { PayPerToolSDKConfig } from "@toolpay/provider-sdk";
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
  const [sdk, setSdk] = useState<PayPerToolSDK | null>(null);
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

  const [sdkConfig, setSdkConfig] = useState<PayPerToolSDKConfig>({
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
      const newSdk = new PayPerToolSDK(sdkConfig);
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

      const newSdk = new PayPerToolSDK(sdkConfig);
      await newSdk.connect();

      if (typeof newSdk.connectWithCosmosKit === "function") {
        newSdk.connectWithCosmosKit(getSigningCosmWasmClient, walletAddress);
      }

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

  const executeWithWallet = useCallback(async (
    contractAddress: string,
    msg: Record<string, unknown>,
    gasLimit: number,
    funds: { denom: string; amount: string }[] = []
  ) => {
    if (!sdk || !walletAddress || walletStatus !== "Connected") {
      throw new Error("Wallet not connected or SDK not initialized");
    }

    return sdk.executeWithCosmosKit(contractAddress, msg, gasLimit, funds);
  }, [sdk, walletAddress, walletStatus]);

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

      const msg = {
        register_tool: {
          tool_id: toolData.toolId,
          price: toolData.price,
          description: toolData.description,
        },
      };

      const gasLimit = 300000;
      const result = await executeWithWallet(
        sdk.registry.getContractAddress(),
        msg,
        gasLimit
      );

      toast({
        title: "Tool Registered",
        description: `Tool ${toolData.toolId} registered successfully. TX: ${result.transactionHash}`,
      });
      await loadTools();
    } catch (error) {
      handleError(error, "tool registration");
    } finally {
      setLoadingState("register", false);
    }
  }, [sdk, walletAddress, walletStatus, executeWithWallet, setLoadingState, handleError, toast]);

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

  const getCurrentBlockHeight = useCallback(async (): Promise<number> => {
    if (!sdk) throw new Error("SDK not initialized");
    const client = sdk.getClient();
    if (!client) throw new Error("No client available");
    const height = await client.getHeight();
    return height;
  }, [sdk]);

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

      const msg = {
        lock_funds: {
          tool_id: escrowData.toolId,
          max_fee: escrowData.maxFee,
          auth_token: Buffer.from(escrowData.authToken).toString("base64"),
          expires: expires,
        },
      };

      const gasLimit = 400000;
      const funds = [{ denom: "untrn", amount: escrowData.maxFee }];

      const result = await executeWithWallet(
        sdk.escrow.getContractAddress(),
        msg,
        gasLimit,
        funds
      );

      let escrowId = "unknown";
      try {
        const events = result.events || [];
        const wasmEvent = events.find((event: any) => event.type === "wasm");
        if (wasmEvent) {
          const escrowIdAttr = wasmEvent.attributes.find(
            (attr: any) => attr.key === "escrow_id"
          );
          if (escrowIdAttr) {
            escrowId = escrowIdAttr.value;
          }
        }
      } catch (parseError) {
        console.error("Failed to parse escrow ID from tx events:", parseError);
      }

      toast({
        title: "Funds Locked",
        description: `Escrow ${escrowId} created successfully. TX: ${result.transactionHash}`,
      });
      await loadEscrows();
    } catch (error) {
      handleError(error, "locking funds");
    } finally {
      setLoadingState("lockFunds", false);
    }
  }, [sdk, walletAddress, walletStatus, getCurrentBlockHeight, executeWithWallet, setLoadingState, handleError, toast]);

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

      const msg = {
        post_usage: {
          escrow_id: usageData.escrowId,
          usage_fee: usageData.usageFee,
        },
      };

      const gasLimit = 350000;
      const result = await executeWithWallet(
        sdk.escrow.getContractAddress(),
        msg,
        gasLimit
      );

      toast({
        title: "Usage Posted",
        description: `Usage reported successfully. TX: ${result.transactionHash}`,
      });
    } catch (error) {
      handleError(error, "posting usage");
    } finally {
      setLoadingState("usage", false);
    }
  }, [sdk, walletAddress, walletStatus, executeWithWallet, setLoadingState, handleError, toast]);

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

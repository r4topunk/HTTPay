import { useCallback, useState, useEffect } from "react";
import { useChain } from "@cosmos-kit/react";
import { useToast } from "@/components/ui/use-toast";
import { defaultChainName } from "@/config/chain-config";
import type { HTTPaySDKConfig, HTTPayClients, LoadingStates } from "../types";
import { createQueryClients, createSigningClients, createEmptyClients, handleSDKError } from "../utils/client-utils";

interface UseWalletIntegrationProps {
  config: HTTPaySDKConfig;
  setLoadingState: (key: string, loading: boolean) => void;
}

export function useWalletIntegration({ config, setLoadingState }: UseWalletIntegrationProps) {
  const { toast } = useToast();
  const [clients, setClients] = useState<HTTPayClients>(createEmptyClients());
  const [isConnected, setIsConnected] = useState(false);
  const [hasSigningCapabilities, setHasSigningCapabilities] = useState(false);

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

  const handleError = useCallback((error: unknown, operation: string) => {
    const normalizedError = handleSDKError(error, operation);
    console.error(normalizedError);
    toast({
      title: `Error in ${operation}`,
      description: normalizedError.message,
      variant: "destructive",
    });
  }, [toast]);

  // Initialize read-only SDK connection
  const initializeSDK = useCallback(async () => {
    try {
      setLoadingState("connecting", true);
      
      const queryClients = await createQueryClients(config);
      
      setClients(prev => ({
        ...prev,
        cosmWasmClient: queryClients.cosmWasmClient,
        registryQuery: queryClients.registryQuery,
        escrowQuery: queryClients.escrowQuery,
      }));
      
      setIsConnected(true);
      setHasSigningCapabilities(false);
      
      toast({
        title: "SDK Initialized",
        description: "Connected to the blockchain successfully",
      });
    } catch (error) {
      handleError(error, "SDK initialization");
      setIsConnected(false);
      setHasSigningCapabilities(false);
    } finally {
      setLoadingState("connecting", false);
    }
  }, [config, setLoadingState, handleError, toast]);

  // Initialize SDK with wallet signing capabilities
  const initializeWalletSDK = useCallback(async () => {
    console.log("initializeWalletSDK called with:", { walletAddress, isWalletConnected });
    
    if (!walletAddress || !isWalletConnected) {
      console.warn("Cannot initialize SDK with wallet - wallet not ready:", { walletAddress, isWalletConnected });
      toast({
        title: "Error",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoadingState("wallet", true);

      console.log("Initializing SDK with wallet...", { walletAddress, isWalletConnected });

      // Get the signing client from CosmosKit
      const signingClient = await getSigningCosmWasmClient();
      console.log("Got signing client from CosmosKit:", !!signingClient);
      
      // Create query clients if not already created
      const queryClients = clients.cosmWasmClient 
        ? { 
            cosmWasmClient: clients.cosmWasmClient,
            registryQuery: clients.registryQuery!,
            escrowQuery: clients.escrowQuery!,
          }
        : await createQueryClients(config);
      
      // Create signing clients
      const signingClientsResult = createSigningClients(signingClient, walletAddress, config);

      console.log("SDK connected with signing capabilities");

      setClients({
        cosmWasmClient: queryClients.cosmWasmClient,
        registryQuery: queryClients.registryQuery,
        escrowQuery: queryClients.escrowQuery,
        signingClient,
        registry: signingClientsResult.registry,
        escrow: signingClientsResult.escrow,
      });
      
      setIsConnected(true);
      setHasSigningCapabilities(true);

      console.log("State updated: clients set, isConnected=true, hasSigningCapabilities=true");

      toast({
        title: "SDK Connected with Wallet",
        description: `Using wallet address: ${walletAddress}`,
      });
    } catch (error) {
      console.error("Failed to initialize SDK with wallet:", error);
      setHasSigningCapabilities(false);
      handleError(error, "wallet connection");
    } finally {
      setLoadingState("wallet", false);
    }
  }, [walletAddress, isWalletConnected, config, clients, getSigningCosmWasmClient, setLoadingState, handleError, toast]);

  const forceReconnectWallet = useCallback(async () => {
    console.log("Force reconnecting wallet...");
    if (isWalletConnected && walletAddress) {
      await initializeWalletSDK();
    } else {
      console.warn("Cannot force reconnect - wallet not connected:", { isWalletConnected, walletAddress });
    }
  }, [isWalletConnected, walletAddress, initializeWalletSDK]);

  // Monitor wallet status changes
  useEffect(() => {
    console.log("Wallet status changed:", { isWalletConnected, walletAddress, isConnected, hasSigningCapabilities });
    
    if (isWalletConnected && walletAddress) {
      // Always reinitialize SDK with wallet when wallet connects
      console.log("Wallet connected, initializing SDK with signing capabilities...");
      const initSdk = async () => {
        try {
          await initializeWalletSDK();
          console.log("SDK initialization result: success");
        } catch (error) {
          console.error("Failed to initialize SDK with wallet in useEffect:", error);
        }
      };
      // Add a small delay to ensure the wallet is fully ready
      setTimeout(initSdk, 100);
    } else if (!isWalletConnected && isConnected) {
      console.log("Wallet disconnected, removing signing capabilities...");
      setHasSigningCapabilities(false);
      // Keep query capabilities but remove signing clients
      setClients(prev => ({
        ...prev,
        signingClient: null,
        registry: null,
        escrow: null,
      }));
    }
  }, [isWalletConnected, walletAddress]); // Removed initializeWalletSDK from dependencies to prevent recreation loops

  return {
    clients,
    isConnected,
    hasSigningCapabilities,
    walletAddress,
    isWalletConnected,
    isWalletConnecting,
    isWalletDisconnected,
    isWalletError,
    walletStatus,
    walletMessage,
    initializeSDK,
    initializeWalletSDK,
    forceReconnectWallet,
    connectWallet,
    disconnectWallet,
  };
}

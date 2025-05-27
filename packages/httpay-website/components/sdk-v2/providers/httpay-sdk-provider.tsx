import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { useChain } from "@cosmos-kit/react";
import { defaultChainName } from "@/config/chain-config";
import { useToast } from "@/components/ui/use-toast";

import type { 
  HTTPaySDKConfig, 
  HTTPayClients, 
  ConnectionState, 
  LoadingStates,
  HTTPaySDKContextType,
  EscrowsFilter,
  Tool,
  Escrow
} from "../types";

import { createQueryClients, createSigningClients, createEmptyClients } from "../utils/client-utils";
import { useRegistry } from "../hooks/use-registry";
import { useEscrow } from "../hooks/use-escrow";
import { useWalletIntegration } from "../hooks/use-wallet-integration";
import { useBlockHeight } from "../hooks/use-block-height";

// Create the context
const HTTPaySDKContext = createContext<HTTPaySDKContextType | undefined>(undefined);

// Default configuration
const defaultConfig: HTTPaySDKConfig = {
  rpcEndpoint: "https://rpc-falcron.pion-1.ntrn.tech",
  chainId: "pion-1",
  registryAddress: "neutron1jnxjn7097hqa3snqgwch2vpssnhel3wftfcgw6pjk34mzk4dfjhq243xxn",
  escrowAddress: "neutron196v7vyr6dw0xglzgrnsaxwn8hcy2hrmttgu65q5z5fyvfg3jeadswrhahs",
  gasPrice: "0.0053untrn",
  gasAdjustment: 1.3,
};

// Default loading states
const defaultLoadingStates: LoadingStates = {
  connecting: false,
  wallet: false,
  tools: false,
  escrows: false,
  registerTool: false,
  updateEndpoint: false,
  lockFunds: false,
  verifyEscrow: false,
  postUsage: false,
  pauseTool: false,
  resumeTool: false,
  updatePrice: false,
  updateDenom: false,
  refundEscrow: false,
  claimFees: false,
};

interface HTTPaySDKProviderProps {
  children: ReactNode;
  initialConfig?: Partial<HTTPaySDKConfig>;
}

export function HTTPaySDKProvider({ children, initialConfig }: HTTPaySDKProviderProps) {
  const { toast } = useToast();
  
  // Configuration state
  const [config, setConfig] = useState<HTTPaySDKConfig>({
    ...defaultConfig,
    ...initialConfig,
  });

  // Client state
  const [clients, setClients] = useState<HTTPayClients>(createEmptyClients());

  // Connection state
  const [connection, setConnection] = useState<ConnectionState>({
    isConnected: false,
    hasSigningCapabilities: false,
    walletAddress: null,
    currentBlockHeight: null,
  });

  // Loading states
  const [loading, setLoading] = useState<LoadingStates>(defaultLoadingStates);
  const [escrowsFilter, setEscrowsFilter] = useState<EscrowsFilter>({});

  // Wallet integration
  const {
    address: walletAddress,
    isWalletConnected,
    getSigningCosmWasmClient,
  } = useChain(defaultChainName);

  // Block height tracking
  const { currentBlockHeight, getCurrentBlockHeight } = useBlockHeight({ 
    clients, 
    isConnected: connection.isConnected 
  });

  // Update connection state when wallet or block height changes
  useEffect(() => {
    setConnection(prev => ({
      ...prev,
      walletAddress: walletAddress || null,
      currentBlockHeight,
    }));
  }, [walletAddress, currentBlockHeight]);

  // Loading state helper
  const setLoadingState = useCallback((key: keyof LoadingStates, value: boolean) => {
    setLoading(prev => ({ ...prev, [key]: value }));
  }, []);

  // Configuration update
  const updateConfig = useCallback((newConfig: Partial<HTTPaySDKConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  // SDK initialization (query-only)
  const initializeSDK = useCallback(async () => {
    try {
      setLoadingState("init", true);
      
      const queryClients = await createQueryClients(config);
      
      setClients(prev => ({
        ...prev,
        cosmWasmClient: queryClients.cosmWasmClient,
        registryQuery: queryClients.registryQuery,
        escrowQuery: queryClients.escrowQuery,
      }));

      setConnection(prev => ({
        ...prev,
        isConnected: true,
        hasSigningCapabilities: false,
      }));

      toast({
        title: "SDK Initialized",
        description: "Connected to the blockchain successfully",
      });
    } catch (error) {
      console.error("Error initializing SDK:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to initialize SDK",
        variant: "destructive",
      });
    } finally {
      setLoadingState("init", false);
    }
  }, [config, setLoadingState, toast]);

  // SDK initialization with wallet (signing capabilities)
  const initSDKWithWallet = useCallback(async (): Promise<boolean> => {
    if (!walletAddress || !isWalletConnected) {
      toast({
        title: "Error",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return false;
    }

    try {
      setLoadingState("wallet", true);

      // First ensure we have query clients
      if (!clients.cosmWasmClient || !clients.registryQuery || !clients.escrowQuery) {
        const queryClients = await createQueryClients(config);
        setClients(prev => ({
          ...prev,
          cosmWasmClient: queryClients.cosmWasmClient,
          registryQuery: queryClients.registryQuery,
          escrowQuery: queryClients.escrowQuery,
        }));
      }

      // Get signing client from wallet
      const signingClient = await getSigningCosmWasmClient();
      
      // Create signing clients
      const signingClients = createSigningClients(signingClient, walletAddress, config);

      setClients(prev => ({
        ...prev,
        signingClient,
        registry: signingClients.registry,
        escrow: signingClients.escrow,
      }));

      setConnection(prev => ({
        ...prev,
        isConnected: true,
        hasSigningCapabilities: true,
      }));

      toast({
        title: "SDK Connected with Wallet",
        description: `Using wallet address: ${walletAddress}`,
      });

      return true;
    } catch (error) {
      console.error("Error connecting wallet to SDK:", error);
      setConnection(prev => ({
        ...prev,
        hasSigningCapabilities: false,
      }));
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to connect wallet",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoadingState("wallet", false);
    }
  }, [walletAddress, isWalletConnected, clients, config, getSigningCosmWasmClient, setLoadingState, toast]);

  // Disconnect
  const disconnect = useCallback(() => {
    setClients(createEmptyClients());
    setConnection({
      isConnected: false,
      hasSigningCapabilities: false,
      walletAddress: null,
      currentBlockHeight: null,
    });
    setEscrowsFilter({});
  }, []);

  // Initialize specialized hooks with dependency injection
  const { tools, ...registryMethods } = useRegistry({
    clients,
    walletAddress: walletAddress || null,
    isWalletConnected,
    hasSigningCapabilities: connection.hasSigningCapabilities,
    loading,
    setLoadingState,
  });

  const { escrows, hasMoreEscrows, ...escrowMethods } = useEscrow({
    clients,
    walletAddress: walletAddress || null,
    isWalletConnected,
    hasSigningCapabilities: connection.hasSigningCapabilities,
    loading,
    setLoadingState,
    getCurrentBlockHeight,
  });

  // Load tools effect
  const loadTools = useCallback(async () => {
    await registryMethods.loadTools();
  }, [registryMethods]);

  // Load escrows effect
  const loadEscrows = useCallback(async (filter?: EscrowsFilter) => {
    await escrowMethods.loadEscrows(filter || escrowsFilter);
  }, [escrowMethods, escrowsFilter]);

  // Load more escrows
  const loadMoreEscrows = useCallback(async () => {
    if (!hasMoreEscrows) return;
    
    const startAfter = escrows.length > 0 ? escrows[escrows.length - 1].escrow_id : undefined;
    await escrowMethods.loadEscrows({
      ...escrowsFilter,
      startAfter,
    });
  }, [escrowMethods, escrowsFilter, escrows, hasMoreEscrows]);

  // Update escrows filter
  const updateEscrowsFilter = useCallback((filter: Partial<EscrowsFilter>) => {
    setEscrowsFilter(prev => ({ ...prev, ...filter }));
  }, []);

  // Reset escrows filter
  const resetEscrowsFilter = useCallback(async () => {
    setEscrowsFilter({});
  }, []);

  // Create context value
  const contextValue: HTTPaySDKContextType = {
    // Configuration and clients
    config,
    setConfig,
    clients,
    
    // Connection state
    isConnected: connection.isConnected,
    hasSigningCapabilities: connection.hasSigningCapabilities,
    walletAddress: connection.walletAddress,
    isWalletConnected,
    isWalletConnecting: false, // TODO: implement
    currentBlockHeight: connection.currentBlockHeight,
    
    // Loading states
    loading,
    setLoadingState,
    
    // Data
    tools,
    escrows,
    hasMoreEscrows,
    
    // Connection methods
    initializeSDK,
    initializeWalletSDK: async () => { await initSDKWithWallet(); },
    forceReconnectWallet: async () => {}, // TODO: implement
    connectWallet: async () => {}, // TODO: implement
    disconnectWallet: async () => {}, // TODO: implement
    
    // Registry methods
    loadTools,
    registerTool: registryMethods.registerTool,
    updatePrice: registryMethods.updatePrice,
    updateEndpoint: registryMethods.updateEndpoint,
    updateDenom: registryMethods.updateDenom,
    pauseTool: registryMethods.pauseTool,
    resumeTool: registryMethods.resumeTool,
    
    // Escrow methods
    loadEscrows,
    loadMoreEscrows,
    resetEscrowsFilter,
    lockFunds: escrowMethods.lockFunds,
    verifyEscrow: escrowMethods.verifyEscrow,
    postUsage: escrowMethods.postUsage,
    refundExpired: escrowMethods.refundExpired,
    claimFees: escrowMethods.claimFees,
    
    // Utility methods
    getCurrentBlockHeight,
    handleError: (error: Error | unknown, operation: string) => {
      console.error(`Error in ${operation}:`, error);
    },
  };

  return (
    <HTTPaySDKContext.Provider value={contextValue}>
      {children}
    </HTTPaySDKContext.Provider>
  );
}

// Hook to use the SDK context
export function useHTTPaySDK(): HTTPaySDKContextType {
  const context = useContext(HTTPaySDKContext);
  if (!context) {
    throw new Error("useHTTPaySDK must be used within an HTTPaySDKProvider");
  }
  return context;
}

// Export for compatibility with existing code
export const useSDK = useHTTPaySDK;

"use client";

import { useToast } from "@/components/ui/use-toast";
import { defaultChainName } from "@/config/chain-config";
import { HTTPaySDKProvider, useHTTPaySDK } from "httpay/react";
import { useChain } from "@cosmos-kit/react";
import React, { ReactNode } from "react";

// Re-export the hook for compatibility
export const useSDK = useHTTPaySDK;

interface SDKProviderProps {
  children: ReactNode;
}

/**
 * Provides the HTTPay SDK context to the application.
 * This component integrates with Cosmos Kit to get wallet information
 * and provides it to the HTTPay SDK.
 */
export const SDKProvider = ({ children }: SDKProviderProps) => {
  const { toast } = useToast();
  
  // Get wallet information from Cosmos Kit
  const {
    address: walletAddress,
    isWalletConnected,
    getSigningCosmWasmClient,
  } = useChain(defaultChainName);

  // Wrap the toast function to match the expected signature
  const toastFunction = (options: { title: string; description?: string; variant?: "default" | "destructive" }) => {
    toast({
      title: options.title,
      description: options.description,
      variant: options.variant,
    });
  };

  return (
    <HTTPaySDKProvider 
      chainName={defaultChainName} 
      toast={toastFunction}
      walletAddress={walletAddress}
      isWalletConnected={isWalletConnected}
      getSigningCosmWasmClient={getSigningCosmWasmClient}
    >
      {children}
    </HTTPaySDKProvider>
  );
};

"use client";

import React, { type ReactNode, useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { defaultChainName } from "@/config/chain-config";
import { ReactSDK } from "httpay-sdk";

// Re-export the hook for compatibility
export const useSDK = ReactSDK.useHTTPaySDK;

interface SDKProviderProps {
  children: ReactNode;
}

export const SDKProvider = ({ children }: SDKProviderProps) => {
  const { toast } = useToast();

  // Wrap the toast function to match the expected signature
  const toastFunction = (options: { title: string; description?: string; variant?: "default" | "destructive" }) => {
    toast({
      title: options.title,
      description: options.description,
      variant: options.variant,
    });
  };

  return (
    <ReactSDK.HTTPaySDKProvider chainName={defaultChainName} toast={toastFunction}>
      {children as any}
    </ReactSDK.HTTPaySDKProvider>
  );
};

"use client";

import { PropsWithChildren } from "react";
import { WalletProvider } from "./cosmos-kit-provider";
import { SDKProvider } from "@/providers/sdk-provider";

/**
 * Combines wallet and SDK providers into a single component
 * to ensure proper initialization order.
 */
export function WalletAndSDKProvider({ children }: PropsWithChildren) {
  return (
    <WalletProvider>
      <SDKProvider>
        {children}
      </SDKProvider>
    </WalletProvider>
  );
}

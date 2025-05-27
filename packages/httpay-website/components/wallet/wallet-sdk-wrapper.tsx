"use client";

import { PropsWithChildren } from "react";
import { WalletProvider } from "./cosmos-kit-provider";
import { SDKProvider } from "@/components/demo/sdk-context";

export function WalletAndSDKProvider({ children }: PropsWithChildren) {
  return (
    <WalletProvider>
      <SDKProvider>
        {children}
      </SDKProvider>
    </WalletProvider>
  );
}

"use client";

import { PropsWithChildren } from "react";
import dynamic from "next/dynamic";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";

// Create a wrapper that ensures WalletProvider is loaded before SDKProvider
// Dynamic import prevents SSR issues with wallet components
const DynamicWalletAndSDKProvider = dynamic(
  () => import("@/components/wallet").then(mod => mod.WalletAndSDKProvider),
  { ssr: false }
);

export function Providers({ children }: PropsWithChildren) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      storageKey="httpay-theme"
    >
      <DynamicWalletAndSDKProvider>
        {children}
        <Toaster />
      </DynamicWalletAndSDKProvider>
    </ThemeProvider>
  );
}

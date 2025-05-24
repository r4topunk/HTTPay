"use client";

import { PropsWithChildren } from "react";
import dynamic from "next/dynamic";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";

// Dynamically import WalletProvider with SSR disabled
const WalletProvider = dynamic(
  () => import("@/components/wallet/cosmos-kit-provider").then(mod => mod.WalletProvider),
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
      <WalletProvider>
        {children}
        <Toaster />
      </WalletProvider>
    </ThemeProvider>
  );
}

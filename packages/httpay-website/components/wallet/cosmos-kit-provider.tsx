"use client";

import { chains, assets } from "chain-registry";
import { wallets } from "@cosmos-kit/keplr-extension";
import { ChainProvider } from "@cosmos-kit/react";
import { PropsWithChildren } from "react";

export function WalletProvider({ children }: PropsWithChildren) {
  return (
    <ChainProvider
      chains={chains}
      assetLists={assets}
      wallets={wallets}
      throwErrors
    >
      {children}
    </ChainProvider>
  );
}

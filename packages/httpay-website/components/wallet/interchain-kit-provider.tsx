"use client";

import { assetLists, chains } from "@chain-registry/v2";
import { keplrWallet } from "@interchain-kit/keplr-extension";
import { leapWallet } from "@interchain-kit/leap-extension";
import { ChainProvider, InterchainWalletModal } from "@interchain-kit/react";
import { PropsWithChildren } from "react";

export function WalletProvider({ children }: PropsWithChildren) {
  return (
    <ChainProvider
      chains={chains}
      assetLists={assetLists}
      wallets={[keplrWallet, leapWallet]}
      walletModal={InterchainWalletModal}
    >
        {children}
    </ChainProvider>
  );
}

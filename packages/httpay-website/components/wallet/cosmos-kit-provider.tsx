"use client";

import { chains, assets } from "chain-registry";
import { wallets } from "@cosmos-kit/keplr-extension";
import { ChainProvider } from "@cosmos-kit/react";
import { PropsWithChildren } from "react";
import { SignerOptions } from "@cosmos-kit/core";
import { Chain } from "@chain-registry/types";
import { GasPrice } from "@cosmjs/stargate";

const signerOptions: SignerOptions = {
  // @ts-ignore
  signingCosmwasm: (chain: string | Chain) => {
    return {
      gasPrice: GasPrice.fromString("0.0025untrn"),
    };
  }
};

export function WalletProvider({ children }: PropsWithChildren) {
  return (
    <ChainProvider
      chains={chains}
      assetLists={assets}
      wallets={wallets}
      throwErrors
      signerOptions={signerOptions}
    >
      {children}
    </ChainProvider>
  );
}

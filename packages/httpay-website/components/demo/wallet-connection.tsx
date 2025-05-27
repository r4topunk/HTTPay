"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSDK } from "@/providers/sdk-provider";

export const WalletConnection = () => {
  const { 
    walletAddress, 
    isWalletConnected,
    isWalletConnecting,
    connectWallet, 
    disconnectWallet, 
    loading, 
    isConnected 
  } = useSDK();

  if (!isConnected) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Wallet Connection</CardTitle>
        <CardDescription>
          Connect your wallet to perform transactions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4 items-center">
          {!isWalletConnected ? (
            <Button
              onClick={connectWallet}
              disabled={loading.wallet || isWalletConnecting}
            >
              {isWalletConnecting
                ? "Connecting..."
                : "Connect Wallet"}
            </Button>
          ) : (
            <>
              <Badge
                className="px-4 py-2 flex items-center gap-2"
                variant="secondary"
              >
                <div className="w-2 h-2 rounded-full bg-green-500" />
                {walletAddress}
              </Badge>
              <Button
                onClick={disconnectWallet}
                variant="outline"
                size="sm"
              >
                Disconnect
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

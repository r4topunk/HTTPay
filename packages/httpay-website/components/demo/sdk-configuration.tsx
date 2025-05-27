"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useSDK } from "./sdk-context";

export const SDKConfiguration = () => {
  const { 
    config, 
    setConfig, 
    initializeSDK, 
    forceReconnectWallet,
    isConnected, 
    hasSigningCapabilities,
    isWalletConnected,
    walletAddress,
    loading,
    currentBlockHeight
  } = useSDK();

  return (
    <Card>
      <CardHeader>
        <CardTitle>SDK Configuration</CardTitle>
        <CardDescription>
          Configure the SDK connection settings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="rpc">RPC Endpoint</Label>
            <Input
              id="rpc"
              value={config.rpcEndpoint}
              onChange={(e) =>
                setConfig({
                  ...config,
                  rpcEndpoint: e.target.value,
                })
              }
              disabled={isConnected}
            />
          </div>
          <div>
            <Label htmlFor="chainId">Chain ID</Label>
            <Input
              id="chainId"
              value={config.chainId}
              onChange={(e) =>
                setConfig({
                  ...config,
                  chainId: e.target.value,
                })
              }
              disabled={isConnected}
            />
          </div>
          <div>
            <Label htmlFor="registry">Registry Address</Label>
            <Input
              id="registry"
              value={config.registryAddress}
              onChange={(e) =>
                setConfig({
                  ...config,
                  registryAddress: e.target.value,
                })
              }
              disabled={isConnected}
            />
          </div>
          <div>
            <Label htmlFor="escrow">Escrow Address</Label>
            <Input
              id="escrow"
              value={config.escrowAddress}
              onChange={(e) =>
                setConfig({
                  ...config,
                  escrowAddress: e.target.value,
                })
              }
              disabled={isConnected}
            />
          </div>
          <div>
            <Label htmlFor="gasPrice">Gas Price</Label>
            <Input
              id="gasPrice"
              value={config.gasPrice}
              onChange={(e) =>
                setConfig({
                  ...config,
                  gasPrice: e.target.value,
                })
              }
              placeholder="0.025untrn"
              disabled={isConnected}
            />
          </div>
        </div>
        <div className="flex gap-4">
          <Button
            onClick={initializeSDK}
            disabled={isConnected || loading.init}
          >
            {loading.init
              ? "Initializing..."
              : isConnected
              ? "Connected"
              : "Initialize SDK"}
          </Button>
          
          {isWalletConnected && walletAddress && !hasSigningCapabilities && (
            <Button
              onClick={forceReconnectWallet}
              disabled={loading.wallet}
              variant="destructive"
            >
              Force Reconnect
            </Button>
          )}
          
          {isConnected && (
            <Badge
              className="px-4 py-2 flex items-center gap-2"
              variant="secondary"
            >
              <div className="w-2 h-2 rounded-full bg-green-500" />
              Connected to {config.chainId}
            </Badge>
          )}
          {isConnected && (
            <Badge
              className="px-4 py-2 flex items-center gap-2"
              variant={hasSigningCapabilities ? "secondary" : "outline"}
            >
              <div className={`w-2 h-2 rounded-full ${hasSigningCapabilities ? 'bg-green-500' : 'bg-gray-400'}`} />
              {hasSigningCapabilities ? "Signing Enabled" : "Read Only"}
            </Badge>
          )}
          {isConnected && (
            <Badge
              className="px-4 py-2 flex items-center gap-2"
              variant="secondary"
            >
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              Block: {currentBlockHeight !== null ? currentBlockHeight.toLocaleString() : "Loading..."}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

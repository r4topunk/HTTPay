"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSDK } from "./sdk-context";

export const DebugStatus = () => {
  const { 
    clients,
    isConnected, 
    hasSigningCapabilities,
    walletAddress,
    isWalletConnected,
    isWalletConnecting,
    loading 
  } = useSDK();

  // Derive wallet error state - if we're not connecting and not connected, assume no error
  // In a real app, you'd want to track error state explicitly
  const isWalletError = false; // Could be derived from error handling
  const isWalletDisconnected = !isWalletConnected && !isWalletConnecting;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Debug Status</CardTitle>
        <CardDescription>
          Current state of SDK and wallet connection
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Wallet Status:</strong> 
            <Badge variant={isWalletConnected ? "default" : "secondary"} className="ml-2">
              {isWalletConnected ? "Connected" : 
               isWalletConnecting ? "Connecting" :
               isWalletError ? "Error" : "Disconnected"}
            </Badge>
          </div>
          <div>
            <strong>Wallet Address:</strong> 
            <span className="ml-2 font-mono text-xs">
              {walletAddress ? `${walletAddress.slice(0, 10)}...${walletAddress.slice(-6)}` : "None"}
            </span>
          </div>
          <div>
            <strong>SDK Connected:</strong> 
            <Badge variant={isConnected ? "default" : "secondary"} className="ml-2">
              {isConnected ? "Yes" : "No"}
            </Badge>
          </div>
          <div>
            <strong>Signing Capabilities:</strong> 
            <Badge variant={hasSigningCapabilities ? "default" : "destructive"} className="ml-2">
              {hasSigningCapabilities ? "Yes" : "No"}
            </Badge>
          </div>
          <div>
            <strong>SDK Instance:</strong> 
            <Badge variant={clients.cosmWasmClient ? "default" : "secondary"} className="ml-2">
              {clients.cosmWasmClient ? "Available" : "None"}
            </Badge>
          </div>
          <div>
            <strong>Loading States:</strong> 
            <div className="ml-2 space-x-1">
              {Object.entries(loading).map(([key, value]) => 
                value && (
                  <Badge key={key} variant="outline" className="text-xs">
                    {key}
                  </Badge>
                )
              )}
              {Object.values(loading).every(v => !v) && (
                <Badge variant="secondary" className="text-xs">None</Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

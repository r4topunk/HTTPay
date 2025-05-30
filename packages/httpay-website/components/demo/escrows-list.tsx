"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useSDK } from "@/providers/sdk-provider";
import type { EscrowsFilter } from "./types";

export const EscrowsList = () => {
  const { 
    escrows, 
    loadEscrows, 
    loadMoreEscrows, 
    resetEscrowsFilter, 
    hasMoreEscrows,
    loading, 
    walletAddress,
    isWalletConnected,
    currentBlockHeight,
    refundExpired
  } = useSDK();

  const [filterCaller, setFilterCaller] = useState("");
  const [filterProvider, setFilterProvider] = useState("");

  const handleApplyFilter = async () => {
    const filter: EscrowsFilter = {};
    
    if (filterCaller.trim()) {
      filter.caller = filterCaller.trim();
    }
    
    if (filterProvider.trim()) {
      filter.provider = filterProvider.trim();
    }

    await loadEscrows(filter);
  };

  const handleMyEscrows = async () => {
    if (!isWalletConnected || !walletAddress) {
      return;
    }

    const filter: EscrowsFilter = {
      caller: walletAddress,
    };

    setFilterCaller(walletAddress);
    setFilterProvider("");
    await loadEscrows(filter);
  };

  const handleReset = async () => {
    setFilterCaller("");
    setFilterProvider("");
    await resetEscrowsFilter();
  };

  const handleRefund = async (escrowId: number) => {
    if (!isWalletConnected || !walletAddress) {
      return;
    }

    try {
      await refundExpired(escrowId);
      // Reload escrows to update the list after refund
      await loadEscrows();
    } catch (error) {
      console.error("Failed to refund escrow:", error);
    }
  };

  const isEscrowExpired = (expires: number) => {
    return currentBlockHeight !== null && expires < currentBlockHeight;
  };

  const canRefundEscrow = (escrow: any) => {
    // User can refund if they are the caller and the escrow is expired
    return (
      isWalletConnected &&
      walletAddress &&
      escrow.caller === walletAddress &&
      isEscrowExpired(escrow.expires)
    );
  };

  const formatExpiration = (expires: number) => {
    const isExpired = isEscrowExpired(expires);
    const status = isExpired ? " (Expired)" : "";
    return `Block ${expires}${status}`;
  };

  const formatAuthToken = (authToken: string) => {
    if (!authToken) return "N/A";
    // Show first 8 characters and last 4 for readability
    if (authToken.length <= 12) return authToken;
    return `${authToken.slice(0, 8)}...${authToken.slice(-4)}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Escrows</CardTitle>
        <CardDescription>View and filter escrows</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filter Controls */}
        <div className="space-y-4 mb-6 p-4 border rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="caller-filter">Filter by Caller</Label>
              <Input
                id="caller-filter"
                placeholder="Enter caller address..."
                value={filterCaller}
                onChange={(e) => setFilterCaller(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="provider-filter">Filter by Provider</Label>
              <Input
                id="provider-filter"
                placeholder="Enter provider address..."
                value={filterProvider}
                onChange={(e) => setFilterProvider(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleApplyFilter}
              disabled={loading.loadEscrows}
              variant="default"
            >
              {loading.loadEscrows ? "Loading..." : "Apply Filter"}
            </Button>
            
            <Button
              onClick={handleMyEscrows}
              disabled={loading.loadEscrows || !isWalletConnected}
              variant="secondary"
            >
              My Escrows
            </Button>
            
            <Button
              onClick={handleReset}
              disabled={loading.loadEscrows}
              variant="outline"
            >
              Reset
            </Button>
          </div>
        </div>

        {/* Escrows List */}
        <div className="space-y-3">
          {escrows.length === 0 ? (
            <Alert>
              <AlertDescription>
                No escrows found. Try adjusting your filters or create a new escrow.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              {escrows.map((escrow, index) => (
                <div key={`escrow-${escrow.escrow_id}-${index}`} className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-lg">
                      Escrow #{escrow.escrow_id}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {escrow.max_fee} {escrow.denom}
                      </Badge>
                      {canRefundEscrow(escrow) && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRefund(escrow.escrow_id)}
                          disabled={loading.refundEscrow}
                        >
                          {loading.refundEscrow ? "Refunding..." : "Refund"}
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="font-medium">Caller:</span>{" "}
                      <span className="text-muted-foreground font-mono">
                        {escrow.caller.slice(0, 10)}...{escrow.caller.slice(-8)}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Provider:</span>{" "}
                      <span className="text-muted-foreground font-mono">
                        {escrow.provider.slice(0, 10)}...{escrow.provider.slice(-8)}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Expires:</span>{" "}
                      <span className={`text-muted-foreground ${isEscrowExpired(escrow.expires) ? 'text-red-600 font-medium' : ''}`}>
                        {formatExpiration(escrow.expires)}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Auth Token:</span>{" "}
                      <span className="text-muted-foreground font-mono">
                        {formatAuthToken(escrow.auth_token)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Load More Button */}
              {hasMoreEscrows && (
                <div className="flex justify-center mt-6">
                  <Button
                    onClick={loadMoreEscrows}
                    disabled={loading.loadEscrows}
                    variant="outline"
                  >
                    {loading.loadEscrows ? "Loading..." : "Load More"}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

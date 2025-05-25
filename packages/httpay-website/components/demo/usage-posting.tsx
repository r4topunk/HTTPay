"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSDK } from "./sdk-context";
import { UsagePostingForm } from "./types";

export const UsagePosting = () => {
  const { postUsage, walletAddress, isWalletConnected, loading } = useSDK();
  
  const [usagePosting, setUsagePosting] = useState<UsagePostingForm>({
    escrowId: "",
    usageFee: "",
  });

  const handleSubmit = async () => {
    await postUsage(usagePosting);
    // Reset form after successful posting
    setUsagePosting({
      escrowId: "",
      usageFee: "",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Post Usage & Claim Funds</CardTitle>
        <CardDescription>
          Report tool usage and claim payment
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="usageEscrowId">Escrow ID</Label>
            <Input
              id="usageEscrowId"
              value={usagePosting.escrowId}
              onChange={(e) =>
                setUsagePosting((prev) => ({
                  ...prev,
                  escrowId: e.target.value,
                }))
              }
              placeholder="123"
            />
          </div>
          <div>
            <Label htmlFor="usageFee">Usage Fee (untrn)</Label>
            <Input
              id="usageFee"
              value={usagePosting.usageFee}
              onChange={(e) =>
                setUsagePosting((prev) => ({
                  ...prev,
                  usageFee: e.target.value,
                }))
              }
              placeholder="500000"
            />
          </div>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={
            !walletAddress ||
            !isWalletConnected ||
            loading.usage
          }
          className="w-full"
        >
          {loading.usage ? "Posting Usage..." : "Post Usage & Claim"}
        </Button>
      </CardContent>
    </Card>
  );
};

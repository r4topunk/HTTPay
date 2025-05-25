"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSDK } from "./sdk-context";
import { EscrowCreationForm } from "./types";

export const EscrowCreation = () => {
  const { lockFunds, walletAddress, isWalletConnected, loading } = useSDK();
  
  const [escrowCreation, setEscrowCreation] = useState<EscrowCreationForm>({
    toolId: "",
    maxFee: "",
    authToken: "",
    ttl: "10",
  });

  const handleSubmit = async () => {
    await lockFunds(escrowCreation);
    // Reset form after successful creation
    setEscrowCreation({
      toolId: "",
      maxFee: "",
      authToken: "",
      ttl: "10",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lock Funds in Escrow</CardTitle>
        <CardDescription>
          Create an escrow for tool usage
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="escrowToolId">Tool ID</Label>
          <Input
            id="escrowToolId"
            value={escrowCreation.toolId}
            onChange={(e) =>
              setEscrowCreation((prev) => ({
                ...prev,
                toolId: e.target.value,
              }))
            }
            placeholder="sentiment-api"
          />
        </div>
        <div>
          <Label htmlFor="maxFee">Max Fee (untrn)</Label>
          <Input
            id="maxFee"
            value={escrowCreation.maxFee}
            onChange={(e) =>
              setEscrowCreation((prev) => ({
                ...prev,
                maxFee: e.target.value,
              }))
            }
            placeholder="1000000"
          />
        </div>
        <div>
          <Label htmlFor="authToken">Auth Token</Label>
          <Input
            id="authToken"
            value={escrowCreation.authToken}
            onChange={(e) =>
              setEscrowCreation((prev) => ({
                ...prev,
                authToken: e.target.value,
              }))
            }
            placeholder="secret-auth-token"
          />
        </div>
        <div>
          <Label htmlFor="ttl">TTL (blocks)</Label>
          <Input
            id="ttl"
            value={escrowCreation.ttl}
            onChange={(e) =>
              setEscrowCreation((prev) => ({
                ...prev,
                ttl: e.target.value,
              }))
            }
            placeholder="10"
          />
        </div>
        <Button
          onClick={handleSubmit}
          disabled={
            !walletAddress ||
            !isWalletConnected ||
            loading.lockFunds
          }
          className="w-full"
        >
          {loading.lockFunds ? "Locking Funds..." : "Lock Funds"}
        </Button>
      </CardContent>
    </Card>
  );
};

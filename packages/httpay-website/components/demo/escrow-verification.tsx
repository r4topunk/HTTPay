"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSDK } from "./sdk-context";
import { EscrowVerificationForm } from "./types";

export const EscrowVerification = () => {
  const { verifyEscrow, loading } = useSDK();
  
  const [escrowVerification, setEscrowVerification] = useState<EscrowVerificationForm>({
    escrowId: "",
    authToken: "",
    providerAddr: "",
  });

  const handleSubmit = async () => {
    await verifyEscrow(escrowVerification);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Verify Escrow</CardTitle>
        <CardDescription>
          Verify escrow validity and authorization
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="verifyEscrowId">Escrow ID</Label>
            <Input
              id="verifyEscrowId"
              value={escrowVerification.escrowId}
              onChange={(e) =>
                setEscrowVerification((prev: EscrowVerificationForm) => ({
                  ...prev,
                  escrowId: e.target.value,
                }))
              }
              placeholder="123"
            />
          </div>
          <div>
            <Label htmlFor="verifyAuthToken">Auth Token</Label>
            <Input
              id="verifyAuthToken"
              value={escrowVerification.authToken}
              onChange={(e) =>
                setEscrowVerification((prev: EscrowVerificationForm) => ({
                  ...prev,
                  authToken: e.target.value,
                }))
              }
              placeholder="secret-auth-token"
            />
          </div>
          <div>
            <Label htmlFor="verifyProviderAddr">Provider Address</Label>
            <Input
              id="verifyProviderAddr"
              value={escrowVerification.providerAddr}
              onChange={(e) =>
                setEscrowVerification((prev: EscrowVerificationForm) => ({
                  ...prev,
                  providerAddr: e.target.value,
                }))
              }
              placeholder="neutron1..."
            />
          </div>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={loading.verify}
          className="w-full"
        >
          {loading.verify ? "Verifying..." : "Verify Escrow"}
        </Button>
      </CardContent>
    </Card>
  );
};

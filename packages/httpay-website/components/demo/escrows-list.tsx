"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSDK } from "./sdk-context";

export const EscrowsList = () => {
  const { escrows, loadEscrows, loading } = useSDK();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Escrows</CardTitle>
        <CardDescription>View created escrows</CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          onClick={loadEscrows}
          disabled={loading.loadEscrows}
          className="mb-4"
        >
          {loading.loadEscrows ? "Loading..." : "Refresh Escrows"}
        </Button>
        <div className="space-y-2">
          {escrows.length === 0 ? (
            <Alert>
              <AlertDescription>
                No escrows found. Create an escrow to see it here.
              </AlertDescription>
            </Alert>
          ) : (
            escrows.map((escrow, index) => (
              <div key={index} className="p-3 border rounded">
                <div className="font-medium">
                  Escrow ID: {escrow.id}
                </div>
                <div className="text-sm text-muted-foreground">
                  Tool: {escrow.tool_id}
                </div>
                <div className="text-sm text-muted-foreground">
                  Max Fee: {escrow.max_fee} untrn
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

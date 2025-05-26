"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useV2SDK } from "./v2-sdk-provider";

interface ToolRegistrationForm {
  toolId: string;
  price: string;
  description: string;
  endpoint: string;
  denom?: string;
}

export const V2ToolRegistration = () => {
  const { registerTool, walletAddress, isWalletConnected, hasSigningCapabilities, loading } = useV2SDK();
  
  const [toolRegistration, setToolRegistration] = useState<ToolRegistrationForm>({
    toolId: "",
    price: "",
    description: "",
    endpoint: "",
    denom: "untrn",
  });

  const handleSubmit = async () => {
    await registerTool(toolRegistration);
    // Reset form after successful registration
    setToolRegistration({
      toolId: "",
      price: "",
      description: "",
      endpoint: "",
      denom: "untrn",
    });
  };

  const isFormValid = toolRegistration.toolId && 
                     toolRegistration.price && 
                     toolRegistration.description && 
                     toolRegistration.endpoint;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Register Tool (V2 SDK)</CardTitle>
        <CardDescription>
          Register a new tool using the CosmWasm ts-codegen generated SDK
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="v2-toolId">Tool ID</Label>
          <Input
            id="v2-toolId"
            value={toolRegistration.toolId}
            onChange={(e) =>
              setToolRegistration((prev) => ({
                ...prev,
                toolId: e.target.value,
              }))
            }
            placeholder="sentiment-api"
          />
        </div>
        <div>
          <Label htmlFor="v2-price">Price (in smallest unit)</Label>
          <Input
            id="v2-price"
            value={toolRegistration.price}
            onChange={(e) =>
              setToolRegistration((prev) => ({
                ...prev,
                price: e.target.value,
              }))
            }
            placeholder="1000000"
          />
        </div>
        <div>
          <Label htmlFor="v2-denom">Denomination</Label>
          <Input
            id="v2-denom"
            value={toolRegistration.denom}
            onChange={(e) =>
              setToolRegistration((prev) => ({
                ...prev,
                denom: e.target.value,
              }))
            }
            placeholder="untrn"
          />
        </div>
        <div>
          <Label htmlFor="v2-description">Description</Label>
          <Textarea
            id="v2-description"
            value={toolRegistration.description}
            onChange={(e) =>
              setToolRegistration((prev) => ({
                ...prev,
                description: e.target.value,
              }))
            }
            placeholder="AI-powered sentiment analysis tool"
          />
        </div>
        <div>
          <Label htmlFor="v2-endpoint">API Endpoint</Label>
          <Input
            id="v2-endpoint"
            value={toolRegistration.endpoint}
            onChange={(e) =>
              setToolRegistration((prev) => ({
                ...prev,
                endpoint: e.target.value,
              }))
            }
            placeholder="https://api.example.com/sentiment"
          />
        </div>
        
        {!isWalletConnected && (
          <div className="p-3 bg-orange-50 border border-orange-200 rounded-md">
            <p className="text-sm text-orange-800">
              Please connect your wallet to register tools
            </p>
          </div>
        )}
        
        {isWalletConnected && !hasSigningCapabilities && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">
              Wallet connected but signing capabilities not available
            </p>
          </div>
        )}

        <Button
          onClick={handleSubmit}
          disabled={
            !isFormValid ||
            !walletAddress ||
            !isWalletConnected ||
            !hasSigningCapabilities ||
            loading.register
          }
          className="w-full"
        >
          {loading.register ? "Registering..." : "Register Tool"}
        </Button>
        
        {walletAddress && (
          <p className="text-xs text-muted-foreground">
            Connected as: {walletAddress.slice(0, 20)}...
          </p>
        )}
      </CardContent>
    </Card>
  );
};

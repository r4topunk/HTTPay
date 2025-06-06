"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSDK } from "@/providers/sdk-provider";
import { ToolRegistrationForm } from "./types";

export const ToolRegistration = () => {
  const { registerTool, walletAddress, isWalletConnected, loading } = useSDK();
  
  const [toolRegistration, setToolRegistration] = useState<ToolRegistrationForm>({
    toolId: "",
    price: "",
    description: "",
    endpoint: "",
  });

  const handleSubmit = async () => {
    await registerTool(toolRegistration);
    // Reset form after successful registration
    setToolRegistration({
      toolId: "",
      price: "",
      description: "",
      endpoint: "",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Register Tool</CardTitle>
        <CardDescription>
          Register a new tool as a provider
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="toolId">Tool ID</Label>
          <Input
            id="toolId"
            value={toolRegistration.toolId}
            onChange={(e) =>
              setToolRegistration((prev: ToolRegistrationForm) => ({
                ...prev,
                toolId: e.target.value,
              }))
            }
            placeholder="sentiment-api"
          />
        </div>
        <div>
          <Label htmlFor="price">Price (untrn)</Label>
          <Input
            id="price"
            value={toolRegistration.price}
            onChange={(e) =>
              setToolRegistration((prev: ToolRegistrationForm) => ({
                ...prev,
                price: e.target.value,
              }))
            }
            placeholder="1000000"
          />
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={toolRegistration.description}
            onChange={(e) =>
              setToolRegistration((prev: ToolRegistrationForm) => ({
                ...prev,
                description: e.target.value,
              }))
            }
            placeholder="AI-powered sentiment analysis tool"
          />
        </div>
        <div>
          <Label htmlFor="endpoint">API Endpoint</Label>
          <Input
            id="endpoint"
            value={toolRegistration.endpoint}
            onChange={(e) =>
              setToolRegistration((prev: ToolRegistrationForm) => ({
                ...prev,
                endpoint: e.target.value,
              }))
            }
            placeholder="https://api.example.com/sentiment"
          />
        </div>
        <Button
          onClick={handleSubmit}
          disabled={
            !walletAddress ||
            !isWalletConnected ||
            loading.register
          }
          className="w-full"
        >
          {loading.register ? "Registering..." : "Register Tool"}
        </Button>
      </CardContent>
    </Card>
  );
};

"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Copy, ExternalLink } from "lucide-react";
import { useV2SDK } from "./v2-sdk-provider";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

export const V2ToolsList = () => {
  const { tools, loadTools, loading, isConnected } = useV2SDK();
  const { toast } = useToast();

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard`,
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const formatPrice = (price: string, denom: string) => {
    // Convert from smallest unit to readable format
    const numPrice = parseInt(price);
    if (denom === "untrn") {
      return `${(numPrice / 1_000_000).toFixed(6)} NTRN`;
    }
    return `${price} ${denom}`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Tools Registry (V2 SDK)</CardTitle>
            <CardDescription>
              Browse tools using the generated Registry client
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadTools}
            disabled={loading.tools || !isConnected}
          >
            <RefreshCw className={cn("h-4 w-4", loading.tools && "animate-spin")} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!isConnected ? (
          <div className="text-center p-8">
            <p className="text-muted-foreground">
              Connecting to blockchain...
            </p>
          </div>
        ) : loading.tools ? (
          <div className="text-center p-8">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading tools...</p>
          </div>
        ) : tools.length === 0 ? (
          <div className="text-center p-8">
            <p className="text-muted-foreground">No tools registered yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tools.map((tool) => (
              <div
                key={tool.tool_id}
                className="border rounded-lg p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{tool.tool_id}</h3>
                    <p className="text-sm text-muted-foreground">
                      {tool.description}
                    </p>
                  </div>
                  <Badge variant={tool.is_active ? "default" : "secondary"}>
                    {tool.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Price:</span>
                    <p className="text-muted-foreground">
                      {formatPrice(tool.price, tool.denom)}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium">Provider:</span>
                    <p className="text-muted-foreground font-mono text-xs">
                      {tool.provider.slice(0, 20)}...
                    </p>
                  </div>
                </div>

                <div>
                  <span className="font-medium text-sm">Endpoint:</span>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-muted-foreground text-sm flex-1 truncate">
                      {tool.endpoint}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(tool.endpoint, "Endpoint")}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(tool.endpoint, "_blank")}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, Play, Copy, ExternalLink } from "lucide-react";
import { formatAmount } from "@/lib/constants";
import { truncateAddress, cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import React from "react";
import type { Tool } from "./types";

interface ToolRegistryProps {
  tools: Tool[];
  loading: boolean;
  loadTools: () => void;
  handleTestTool: (tool: Tool) => void;
  copyToClipboard: (text: string, label: string) => void;
}

export const ToolRegistry: React.FC<ToolRegistryProps> = ({
  tools,
  loading,
  loadTools,
  handleTestTool,
  copyToClipboard,
}) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle>Available Tools</CardTitle>
          <CardDescription>
            Browse the registry of available tools that can be used by AI agents
          </CardDescription>
        </div>
        <Button
          onClick={loadTools}
          disabled={loading}
          size="icon"
          variant="outline"
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : tools.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No tools found. Register the first tool!
          </p>
        ) : (
          <div className="space-y-4">
            {tools.map((tool, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-lg">{tool.tool_id}</div>
                  <div className="flex items-center gap-2">
                    <Badge variant={tool.is_active ? "default" : "secondary"}>
                      {tool.is_active ? "Active" : "Inactive"}
                    </Badge>
                    <Button
                      onClick={() => handleTestTool(tool)}
                      size="sm"
                      disabled={!tool.is_active}
                      className="ml-2"
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Test
                    </Button>
                  </div>
                </div>
                {tool.description && (
                  <div className="text-sm text-muted-foreground">
                    {tool.description}
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                  <div>
                    <span className="font-medium">Price:</span> {formatAmount(tool.price)} NTRN
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-medium">Provider:</span>
                    <span className="font-mono">{truncateAddress(tool.provider)}</span>
                    <Button
                      onClick={() => copyToClipboard(tool.provider, "Provider address")}
                      size="icon"
                      variant="ghost"
                      className="h-4 w-4"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-medium">Endpoint:</span>
                    <a
                      href={tool.endpoint}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      <span className="max-w-[200px] truncate">{tool.endpoint}</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
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

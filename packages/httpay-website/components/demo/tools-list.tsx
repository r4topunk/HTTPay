"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Copy, Edit, RefreshCw } from "lucide-react";
import { useSDK } from "@/providers/sdk-provider";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

export const ToolsList = () => {
  const { tools, loadTools, updateEndpoint, loading, walletAddress } = useSDK();
  const { toast } = useToast();
  const [editingTool, setEditingTool] = useState<string | null>(null);
  const [newEndpoint, setNewEndpoint] = useState("");

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard`,
      });
    } catch {
      toast({
        title: "Copy failed",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleUpdateEndpoint = async () => {
    if (!editingTool || !newEndpoint) return;

    await updateEndpoint(editingTool, newEndpoint);
    setEditingTool(null);
    setNewEndpoint("");
  };

  const openUpdateDialog = (toolId: string, currentEndpoint: string) => {
    setEditingTool(toolId);
    setNewEndpoint(currentEndpoint);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle>Available Tools</CardTitle>
          <CardDescription>Browse registered tools</CardDescription>
        </div>
        <Button
          onClick={loadTools}
          disabled={loading.loadTools}
          size="icon"
          variant="outline"
        >
          <RefreshCw className={cn(
            "h-4 w-4",
            loading.loadTools && "animate-spin"
          )} />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {tools.length === 0 ? (
            <p className="text-muted-foreground">No tools found</p>
          ) : (
            tools.map((tool, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-1">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-xl">{tool.tool_id}</div>
                  <Badge variant={tool.is_active ? "default" : "secondary"}>
                    {tool.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>

                <div className="text-muted-foreground">
                  <strong>Price:</strong> {tool.price} untrn
                </div>
                <div className="text-muted-foreground">
                  <strong>Provider:</strong> {tool.provider}
                </div>

                {tool.description && (
                  <div className="text-muted-foreground">
                    <strong>Description:</strong> {tool.description}
                  </div>
                )}

                <div className="space-y-2">
                  <div className="text-muted-foreground">
                    <strong>API Endpoint:</strong>
                  </div>
                  <div className="flex items-center gap-1 p-2 pl-4 bg-muted rounded-xl text-sm font-mono">
                    <span className="flex-1 truncate">{tool.endpoint}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(tool.endpoint, "Endpoint")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    {walletAddress === tool.provider && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              openUpdateDialog(tool.tool_id, tool.endpoint)
                            }
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Update Endpoint</DialogTitle>
                            <DialogDescription>
                              Update the API endpoint for {tool.tool_id}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="new-endpoint">
                                New Endpoint URL
                              </Label>
                              <Input
                                id="new-endpoint"
                                value={newEndpoint}
                                onChange={(e) => setNewEndpoint(e.target.value)}
                                placeholder="https://api.example.com/endpoint"
                              />
                            </div>
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setEditingTool(null);
                                  setNewEndpoint("");
                                }}
                              >
                                Cancel
                              </Button>
                              <Button
                                onClick={handleUpdateEndpoint}
                                disabled={
                                  loading.updateEndpoint || !newEndpoint
                                }
                              >
                                {loading.updateEndpoint
                                  ? "Updating..."
                                  : "Update Endpoint"}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

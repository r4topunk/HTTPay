"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSDK } from "./sdk-context";

export const ToolsList = () => {
  const { tools, loadTools, loading } = useSDK();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Available Tools</CardTitle>
        <CardDescription>Browse registered tools</CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          onClick={loadTools}
          disabled={loading.loadTools}
          className="mb-4"
        >
          {loading.loadTools ? "Loading..." : "Refresh Tools"}
        </Button>
        <div className="space-y-2">
          {tools.length === 0 ? (
            <p className="text-muted-foreground">No tools found</p>
          ) : (
            tools.map((tool, index) => (
              <div key={index} className="p-3 border rounded">
                <div className="font-medium">{tool.tool_id}</div>
                <div className="text-sm text-muted-foreground">
                  Price: {tool.price} untrn
                </div>
                <div className="text-sm text-muted-foreground">
                  Provider: {tool.provider}
                </div>
                {tool.description && (
                  <div className="text-sm text-muted-foreground mt-1">
                    {tool.description}
                  </div>
                )}
                <Badge
                  variant={tool.is_active ? "default" : "secondary"}
                  className="mt-2"
                >
                  {tool.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

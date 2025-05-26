"use client";

import { Toaster } from "@/components/ui/toaster";
import { V2SDKProvider, V2ToolRegistration, V2ToolsList } from "@/components/v2-demo";

export default function TestPage() {
  return (
    <V2SDKProvider>
      <div className="container mx-auto py-8 space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold">HTTPay V2 SDK Test Console</h1>
          <p className="text-muted-foreground mt-2">
            Test the new CosmWasm ts-codegen generated SDK
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <V2ToolRegistration />
          <V2ToolsList />
        </div>
      </div>
      <Toaster />
    </V2SDKProvider>
  );
}

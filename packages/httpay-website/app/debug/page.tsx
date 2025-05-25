"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toaster } from "@/components/ui/toaster";
import {
  SDKProvider,
  SDKConfiguration,
  WalletConnection,
  ToolRegistration,
  ToolsList,
  EscrowCreation,
  EscrowsList,
  EscrowVerification,
  UsagePosting,
  useSDK,
} from "@/components/demo";

const DebugPageContent = () => {
  const { isConnected } = useSDK();

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold">HTTPay SDK Debug Console</h1>
        <p className="text-muted-foreground mt-2">
          Test and interact with the HTTPay smart contracts
        </p>
      </div>

      <SDKConfiguration />
      <WalletConnection />

      {isConnected && (
        <Tabs defaultValue="tools" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="tools">Tools & Registry</TabsTrigger>
            <TabsTrigger value="escrows">Escrows</TabsTrigger>
            <TabsTrigger value="verification">Verification</TabsTrigger>
            <TabsTrigger value="usage">Usage & Claims</TabsTrigger>
          </TabsList>

          <TabsContent value="tools" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ToolRegistration />
              <ToolsList />
            </div>
          </TabsContent>

          <TabsContent value="escrows" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <EscrowCreation />
              <EscrowsList />
            </div>
          </TabsContent>

          <TabsContent value="verification" className="space-y-4">
            <EscrowVerification />
          </TabsContent>

          <TabsContent value="usage" className="space-y-4">
            <UsagePosting />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default function DebugPage() {
  return (
    <SDKProvider>
      <DebugPageContent />
      <Toaster />
    </SDKProvider>
  );
}

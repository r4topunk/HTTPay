/**
 * Migration Guide: Using SDK v2 instead of v1
 * 
 * This file demonstrates how to migrate from the old sdk-context.tsx to the new SDK v2.
 * 
 * OLD IMPORTS (v1):
 * import { useSDK } from "@/components/demo/sdk-context";
 * import { HTTPaySDK } from "httpay";
 * 
 * NEW IMPORTS (v2):
 * import { useHTTPaySDK } from "@/components/sdk-v2";
 * import { RegistryClient, EscrowClient } from "httpay-sdk";
 * 
 * BREAKING CHANGES:
 * 1. The main hook is now `useHTTPaySDK()` instead of `useSDK()`
 * 2. Uses individual RegistryClient and EscrowClient instead of a single HTTPaySDK class
 * 3. Connection state is now individual properties (isConnected, hasSigningCapabilities, walletAddress)
 * 4. Better TypeScript support with generated types
 * 5. Separated hooks for different concerns
 * 6. More granular loading states
 * 7. Functions now return void and use error handling instead of result checking
 * 
 * COMPATIBILITY:
 * - The main API surface remains largely the same
 * - Most existing component code should work with minimal changes
 * - Better error handling and loading states
 * - Use try/catch instead of checking return values
 */

"use client";

import React from "react";
import { HTTPaySDKProvider, useHTTPaySDK } from "@/components/sdk-v2";

// Example usage in a component
function ToolRegistrationExample() {
  const { 
    registerTool, 
    loading, 
    isConnected,
    hasSigningCapabilities,
    walletAddress,
    tools,
    loadTools 
  } = useHTTPaySDK();

  const handleRegisterTool = async () => {
    try {
      await registerTool({
        toolId: "example-tool",
        description: "An example tool for demonstration",
        price: "1000000", // 1 NTRN in micro units
        endpoint: "https://example.com/api",
      });

      console.log("Tool registered successfully");
      // Refresh tools list
      await loadTools();
    } catch (error) {
      console.error("Failed to register tool:", error);
    }
  };

  if (!isConnected) {
    return <div>Not connected to SDK</div>;
  }

  if (!hasSigningCapabilities) {
    return <div>No wallet connected</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Tool Registration (SDK v2)</h2>
      
      <div className="mb-4">
        <p>Connected: {isConnected ? "✅" : "❌"}</p>
        <p>Wallet: {walletAddress || "Not connected"}</p>
        <p>Tools loaded: {tools.length}</p>
      </div>

      <button
        onClick={handleRegisterTool}
        disabled={loading.registerTool}
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {loading.registerTool ? "Registering..." : "Register Tool"}
      </button>
    </div>
  );
}

// Example of wrapping your app with the new provider
function App() {
  return (
    <HTTPaySDKProvider
      initialConfig={{
        // Override default config if needed
        gasPrice: "0.005untrn",
        gasAdjustment: 1.4,
      }}
    >
      <ToolRegistrationExample />
    </HTTPaySDKProvider>
  );
}

export default App;

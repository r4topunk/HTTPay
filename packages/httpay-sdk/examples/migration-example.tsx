/**
 * Migration Guide: Using HTTPay SDK v2
 * 
 * This file demonstrates how to use the HTTPay SDK v2 in your React application.
 * 
 * IMPORTS:
 * import { HTTPaySDKProvider, useHTTPaySDK } from "httpay/v2";
 * import { RegistryClient, EscrowClient } from "httpay";
 * 
 * KEY FEATURES:
 * 1. The main hook is `useHTTPaySDK()` for accessing SDK functionality
 * 2. Uses individual RegistryClient and EscrowClient for contract interactions
 * 3. Connection state properties: isConnected, hasSigningCapabilities, walletAddress
 * 4. Better TypeScript support with generated types
 * 5. Separated hooks for different concerns
 * 6. More granular loading states
 * 7. Error handling via toast notifications (provided by application)
 * 
 * REQUIREMENTS:
 * - The application must provide a toast function for notifications
 * - The application must provide the chain name for Cosmos Kit integration
 * - CosmWasm/CosmJS dependencies must be installed
 */

import React from "react";
// Note: These imports should be from "httpay" when using the published package
import { HTTPaySDKProvider, useHTTPaySDK } from "../src/providers/httpay-sdk-provider";

// Example toast function - you would import this from your UI library
const exampleToast = ({ title, description, variant }: {
  title: string;
  description: string;
  variant?: "default" | "destructive";
}) => {
  console.log(`[${variant || "default"}] ${title}: ${description}`);
};

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
        denom: "untrn",
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
      chainName="neutrontestnet" // Provide the chain name for Cosmos Kit
      toast={exampleToast} // Provide your toast function
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

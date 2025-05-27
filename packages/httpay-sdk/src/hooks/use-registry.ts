import { useCallback, useState } from "react";
import type { ToolRegistrationForm, Tool, LoadingStates, HTTPayClients } from "../types";
import { handleSDKError } from "../utils/client-utils";

// Define types for toast functionality to be provided by the consuming application
export interface ToastFunction {
  (options: {
    title: string;
    description: string;
    variant?: "default" | "destructive";
  }): void;
}

interface UseRegistryProps {
  clients: HTTPayClients;
  walletAddress: string | null;
  isWalletConnected: boolean;
  hasSigningCapabilities: boolean;
  loading: LoadingStates;
  setLoadingState: (key: string, loading: boolean) => void;
  toast: ToastFunction; // Application provides the toast function
}

export function useRegistry({
  clients,
  walletAddress,
  isWalletConnected,
  hasSigningCapabilities,
  loading,
  setLoadingState,
  toast,
}: UseRegistryProps) {
  const [tools, setTools] = useState<Tool[]>([]);

  const handleError = useCallback((error: unknown, operation: string) => {
    const normalizedError = handleSDKError(error, operation);
    console.error(normalizedError);
    toast({
      title: `Error in ${operation}`,
      description: normalizedError.message,
      variant: "destructive",
    });
  }, [toast]);

  const validateSigningRequirements = useCallback(() => {
    if (!walletAddress || !isWalletConnected) {
      toast({
        title: "Error",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return false;
    }

    if (!hasSigningCapabilities || !clients.registry) {
      toast({
        title: "Error",
        description: "SDK does not have signing capabilities. Please reconnect your wallet.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  }, [walletAddress, isWalletConnected, hasSigningCapabilities, clients.registry, toast]);

  const loadTools = useCallback(async () => {
    if (!clients.registryQuery) {
      console.warn("Registry query client not available");
      return;
    }

    try {
      setLoadingState("tools", true);
      const response = await clients.registryQuery.getTools();
      setTools(response.tools);
    } catch (error) {
      handleError(error, "loading tools");
    } finally {
      setLoadingState("tools", false);
    }
  }, [clients.registryQuery, setLoadingState, handleError]);

  const registerTool = useCallback(async (toolData: ToolRegistrationForm) => {
    if (!validateSigningRequirements() || !clients.registry) return;

    try {
      setLoadingState("registerTool", true);

      const result = await clients.registry.registerTool({
        toolId: toolData.toolId,
        price: toolData.price,
        description: toolData.description,
        endpoint: toolData.endpoint,
        denom: toolData.denom,
      });

      toast({
        title: "Tool Registered",
        description: `Tool ${toolData.toolId} registered successfully. TX: ${result.transactionHash}`,
      });

      // Reload tools to get the updated list
      await loadTools();
    } catch (error) {
      handleError(error, "tool registration");
    } finally {
      setLoadingState("registerTool", false);
    }
  }, [validateSigningRequirements, clients.registry, setLoadingState, toast, handleError, loadTools]);

  const updateEndpoint = useCallback(async (toolId: string, endpoint: string) => {
    if (!validateSigningRequirements() || !clients.registry) return;

    try {
      setLoadingState("updateEndpoint", true);

      const result = await clients.registry.updateEndpoint({
        toolId,
        endpoint,
      });

      toast({
        title: "Endpoint Updated",
        description: `Endpoint for ${toolId} updated successfully. TX: ${result.transactionHash}`,
      });

      await loadTools();
    } catch (error) {
      handleError(error, "endpoint update");
    } finally {
      setLoadingState("updateEndpoint", false);
    }
  }, [validateSigningRequirements, clients.registry, setLoadingState, toast, handleError, loadTools]);

  const updatePrice = useCallback(async (toolId: string, price: string) => {
    if (!validateSigningRequirements() || !clients.registry) return;

    try {
      setLoadingState("updatePrice", true);

      const result = await clients.registry.updatePrice({
        toolId,
        price,
      });

      toast({
        title: "Price Updated",
        description: `Price for ${toolId} updated successfully. TX: ${result.transactionHash}`,
      });

      await loadTools();
    } catch (error) {
      handleError(error, "price update");
    } finally {
      setLoadingState("updatePrice", false);
    }
  }, [validateSigningRequirements, clients.registry, setLoadingState, toast, handleError, loadTools]);

  const updateDenom = useCallback(async (toolId: string, denom: string) => {
    if (!validateSigningRequirements() || !clients.registry) return;

    try {
      setLoadingState("updateDenom", true);

      const result = await clients.registry.updateDenom({
        toolId,
        denom,
      });

      toast({
        title: "Denomination Updated",
        description: `Denomination for ${toolId} updated successfully. TX: ${result.transactionHash}`,
      });

      await loadTools();
    } catch (error) {
      handleError(error, "denomination update");
    } finally {
      setLoadingState("updateDenom", false);
    }
  }, [validateSigningRequirements, clients.registry, setLoadingState, toast, handleError, loadTools]);

  const pauseTool = useCallback(async (toolId: string) => {
    if (!validateSigningRequirements() || !clients.registry) return;

    try {
      setLoadingState("pauseTool", true);

      const result = await clients.registry.pauseTool({
        toolId,
      });

      toast({
        title: "Tool Paused",
        description: `Tool ${toolId} paused successfully. TX: ${result.transactionHash}`,
      });

      await loadTools();
    } catch (error) {
      handleError(error, "tool pause");
    } finally {
      setLoadingState("pauseTool", false);
    }
  }, [validateSigningRequirements, clients.registry, setLoadingState, toast, handleError, loadTools]);

  const resumeTool = useCallback(async (toolId: string) => {
    if (!validateSigningRequirements() || !clients.registry) return;

    try {
      setLoadingState("resumeTool", true);

      const result = await clients.registry.resumeTool({
        toolId,
      });

      toast({
        title: "Tool Resumed",
        description: `Tool ${toolId} resumed successfully. TX: ${result.transactionHash}`,
      });

      await loadTools();
    } catch (error) {
      handleError(error, "tool resume");
    } finally {
      setLoadingState("resumeTool", false);
    }
  }, [validateSigningRequirements, clients.registry, setLoadingState, toast, handleError, loadTools]);

  return {
    tools,
    loadTools,
    registerTool,
    updateEndpoint,
    updatePrice,
    updateDenom,
    pauseTool,
    resumeTool,
  };
}

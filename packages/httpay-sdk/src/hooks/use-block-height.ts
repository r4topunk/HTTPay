import { useCallback, useState, useEffect } from "react";
import type { HTTPayClients } from "../types";

interface UseBlockHeightProps {
  clients: HTTPayClients;
  isConnected: boolean;
}

export function useBlockHeight({ clients, isConnected }: UseBlockHeightProps) {
  const [currentBlockHeight, setCurrentBlockHeight] = useState<number | null>(null);

  const getCurrentBlockHeight = useCallback(async (): Promise<number> => {
    if (!clients.cosmWasmClient) {
      throw new Error("SDK not initialized");
    }
    
    const height = await clients.cosmWasmClient.getHeight();
    return height;
  }, [clients.cosmWasmClient]);

  const updateBlockHeight = useCallback(async () => {
    if (!isConnected || !clients.cosmWasmClient) {
      return;
    }
    
    try {
      const height = await getCurrentBlockHeight();
      setCurrentBlockHeight(height);
    } catch (error) {
      // Silently fail for block height updates to avoid spam
      console.warn("Failed to fetch block height:", error);
    }
  }, [isConnected, clients.cosmWasmClient, getCurrentBlockHeight]);

  // Set up interval to update block height every second when connected
  useEffect(() => {
    if (!isConnected || !clients.cosmWasmClient) {
      setCurrentBlockHeight(null);
      return;
    }

    // Initial fetch
    updateBlockHeight();

    // Set up interval
    const interval = setInterval(updateBlockHeight, 1000); // 1 second

    return () => clearInterval(interval);
  }, [isConnected, clients.cosmWasmClient, updateBlockHeight]);

  return {
    currentBlockHeight,
    getCurrentBlockHeight,
    updateBlockHeight,
  };
}

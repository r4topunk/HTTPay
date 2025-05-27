import { useCallback, useState } from "react";
import { Coin } from "@cosmjs/amino";
import { useToast } from "@/components/ui/use-toast";
import type { 
  EscrowCreationForm, 
  EscrowVerificationForm, 
  UsagePostingForm,
  Escrow, 
  EscrowsFilter,
  LockFundsResult,
  VerificationResult,
  LoadingStates, 
  HTTPayClients 
} from "../types";
import { handleSDKError, toBase64, extractEscrowIdFromTx } from "../utils/client-utils";

interface UseEscrowProps {
  clients: HTTPayClients;
  walletAddress: string | null;
  isWalletConnected: boolean;
  hasSigningCapabilities: boolean;
  loading: LoadingStates;
  setLoadingState: (key: string, loading: boolean) => void;
  getCurrentBlockHeight: () => Promise<number>;
}

export function useEscrow({
  clients,
  walletAddress,
  isWalletConnected,
  hasSigningCapabilities,
  loading,
  setLoadingState,
  getCurrentBlockHeight,
}: UseEscrowProps) {
  const { toast } = useToast();
  const [escrows, setEscrows] = useState<Escrow[]>([]);
  const [escrowsFilter, setEscrowsFilter] = useState<EscrowsFilter>({});
  const [hasMoreEscrows, setHasMoreEscrows] = useState(false);

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

    if (!hasSigningCapabilities || !clients.escrow) {
      toast({
        title: "Error",
        description: "SDK does not have signing capabilities. Please reconnect your wallet.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  }, [walletAddress, isWalletConnected, hasSigningCapabilities, clients.escrow, toast]);

  const loadEscrows = useCallback(async (filter?: EscrowsFilter) => {
    if (!clients.escrowQuery) {
      console.warn("Escrow query client not available");
      return;
    }

    try {
      setLoadingState("escrows", true);
      
      // If a new filter is provided, update the current filter and reset pagination
      if (filter !== undefined) {
        setEscrowsFilter(filter);
        setEscrows([]); // Clear existing escrows when applying new filter
      }
      
      // Use provided filter or current filter
      const activeFilter = filter !== undefined ? filter : escrowsFilter;
      
      // Query escrows with current filter
      const result = await clients.escrowQuery.getEscrows({
        caller: activeFilter.caller,
        provider: activeFilter.provider,
        startAfter: activeFilter.startAfter,
        limit: activeFilter.limit || 10, // Default limit of 10
      });

      // Update escrows state - replace if new filter, append if pagination
      if (filter !== undefined) {
        setEscrows(result.escrows);
      } else {
        setEscrows(prev => [...prev, ...result.escrows]);
      }
      
      // Check if there are more escrows available
      setHasMoreEscrows(result.escrows.length >= (activeFilter.limit || 10));
      
    } catch (error) {
      handleError(error, "loading escrows");
    } finally {
      setLoadingState("escrows", false);
    }
  }, [clients.escrowQuery, escrowsFilter, setLoadingState, handleError]);

  const loadMoreEscrows = useCallback(async () => {
    if (!hasMoreEscrows || escrows.length === 0) return;

    // Set the startAfter to the last escrow's ID for pagination
    const lastEscrowId = escrows[escrows.length - 1].escrow_id;
    const paginationFilter = {
      ...escrowsFilter,
      startAfter: lastEscrowId,
    };

    await loadEscrows(paginationFilter);
  }, [hasMoreEscrows, escrows, escrowsFilter, loadEscrows]);

  const resetEscrowsFilter = useCallback(async () => {
    const emptyFilter: EscrowsFilter = {};
    setEscrowsFilter(emptyFilter);
    setEscrows([]);
    setHasMoreEscrows(false);
    await loadEscrows(emptyFilter);
  }, [loadEscrows]);

  const lockFunds = useCallback(async (escrowData: EscrowCreationForm): Promise<LockFundsResult | undefined> => {
    if (!validateSigningRequirements() || !clients.escrow) return;

    try {
      setLoadingState("lockFunds", true);

      const currentBlockHeight = await getCurrentBlockHeight();
      const expires = currentBlockHeight + parseInt(escrowData.ttl);
      
      // Convert authToken to base64 if needed
      const authToken = toBase64(escrowData.authToken);
      
      // Prepare funds to send with the transaction
      const funds: Coin[] = [{ denom: "untrn", amount: escrowData.maxFee }];
      
      const result = await clients.escrow.lockFunds({
        toolId: escrowData.toolId,
        maxFee: escrowData.maxFee,
        authToken,
        expires,
      }, "auto", undefined, funds);

      // Extract escrow ID from transaction events if available
      const escrowId = extractEscrowIdFromTx(result.transactionHash, [...(result.events || [])]) || 0;
      
      const lockResult: LockFundsResult = {
        transactionHash: result.transactionHash,
        escrowId,
        denom: "untrn",
      };

      toast({
        title: "Funds Locked",
        description: `Escrow ${escrowId} created successfully. TX: ${result.transactionHash}`,
      });

      await loadEscrows();
      return lockResult;
    } catch (error) {
      handleError(error, "locking funds");
    } finally {
      setLoadingState("lockFunds", false);
    }
  }, [validateSigningRequirements, clients.escrow, getCurrentBlockHeight, setLoadingState, toast, handleError, loadEscrows]);

  const verifyEscrow = useCallback(async (verificationData: EscrowVerificationForm): Promise<VerificationResult> => {
    if (!clients.escrowQuery) {
      const error = "Please initialize SDK first";
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
      return { isValid: false, error };
    }

    try {
      setLoadingState("verifyEscrow", true);
      
      const escrowId = parseInt(verificationData.escrowId, 10);
      const escrow = await clients.escrowQuery.getEscrow({ escrowId });
      
      // Get current block height
      const blockHeight = await getCurrentBlockHeight();
      
      // Check if escrow is expired
      if (escrow.expires < blockHeight) {
        return {
          isValid: false,
          error: "Escrow is expired",
          escrow,
          blockHeight,
        };
      }
      
      // Check if provider address matches
      if (escrow.provider !== verificationData.providerAddr) {
        return {
          isValid: false,
          error: "Provider address mismatch",
          escrow,
          blockHeight,
        };
      }
      
      // Check if auth token matches
      if (escrow.auth_token !== verificationData.authToken) {
        return {
          isValid: false,
          error: "Auth token mismatch",
          escrow,
          blockHeight,
        };
      }
      
      // All checks passed
      const result: VerificationResult = {
        isValid: true,
        escrow,
        blockHeight,
      };
      
      toast({
        title: "Escrow Verification",
        description: "Escrow is valid",
      });
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      handleError(error, "escrow verification");
      return {
        isValid: false,
        error: errorMessage,
      };
    } finally {
      setLoadingState("verifyEscrow", false);
    }
  }, [clients.escrowQuery, getCurrentBlockHeight, setLoadingState, toast, handleError]);

  const postUsage = useCallback(async (usageData: UsagePostingForm) => {
    if (!validateSigningRequirements() || !clients.escrow) return;

    try {
      setLoadingState("postUsage", true);

      const result = await clients.escrow.release({
        escrowId: parseInt(usageData.escrowId, 10),
        usageFee: usageData.usageFee,
      });

      toast({
        title: "Usage Posted",
        description: `Usage reported successfully. TX: ${result.transactionHash}`,
      });

      await loadEscrows();
    } catch (error) {
      handleError(error, "posting usage");
    } finally {
      setLoadingState("postUsage", false);
    }
  }, [validateSigningRequirements, clients.escrow, setLoadingState, toast, handleError, loadEscrows]);

  const refundExpired = useCallback(async (escrowId: number) => {
    if (!validateSigningRequirements() || !clients.escrow) return;

    try {
      setLoadingState("refundEscrow", true);

      const result = await clients.escrow.refundExpired({
        escrowId,
      });

      toast({
        title: "Refund Processed",
        description: `Escrow ${escrowId} refunded successfully. TX: ${result.transactionHash}`,
      });

      await loadEscrows();
    } catch (error) {
      handleError(error, "refunding escrow");
    } finally {
      setLoadingState("refundEscrow", false);
    }
  }, [validateSigningRequirements, clients.escrow, setLoadingState, toast, handleError, loadEscrows]);

  const claimFees = useCallback(async (denom?: string) => {
    if (!validateSigningRequirements() || !clients.escrow) return;

    try {
      setLoadingState("claimFees", true);

      const result = await clients.escrow.claimFees({
        denom,
      });

      toast({
        title: "Fees Claimed",
        description: `Fees claimed successfully. TX: ${result.transactionHash}`,
      });
    } catch (error) {
      handleError(error, "claiming fees");
    } finally {
      setLoadingState("claimFees", false);
    }
  }, [validateSigningRequirements, clients.escrow, setLoadingState, toast, handleError]);

  return {
    escrows,
    hasMoreEscrows,
    loadEscrows,
    loadMoreEscrows,
    resetEscrowsFilter,
    lockFunds,
    verifyEscrow,
    postUsage,
    refundExpired,
    claimFees,
  };
}

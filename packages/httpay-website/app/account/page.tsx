"use client";

import { useChain } from '@cosmos-kit/react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConnectButton } from '@/components/wallet/connect-button';
import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { defaultChainName } from '@/config/chain-config';

// Define types for our balance data
type Balance = {
  amount: string;
  denom: string;
};

type BalanceResponse = {
  balance: Balance;
};

// Mock balance data
const MOCK_BALANCES: Record<string, Balance> = {
  'untrn': { amount: '10000000', denom: 'untrn' }, // 10 NTRN
  'uatom': { amount: '5000000', denom: 'uatom' },  // 5 ATOM
  'uosmo': { amount: '25000000', denom: 'uosmo' }, // 25 OSMO
  'ujuno': { amount: '7500000', denom: 'ujuno' },  // 7.5 JUNO
};

// Mock getBalance function to replace interchainjs
const getBalance = async (_rpcEndpoint: string, params: { address: string, denom: string }): Promise<BalanceResponse> => {
  console.log(`Fetching mock balance for ${params.address}, denom: ${params.denom}`);
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 700));
  
  // Return mocked balance or zero balance if denom not in mock data
  return { 
    balance: MOCK_BALANCES[params.denom] || { amount: '0', denom: params.denom }
  };
};

export default function AccountPage() {
  const { address, status, assets, getRpcEndpoint } = useChain(defaultChainName);
  const [balances, setBalances] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const isWalletConnected = status === 'Connected';

  const fetchBalances = async () => {
    if (!address || !isWalletConnected) return;
    
    try {
      setIsLoading(true);
      // We don't actually need the RPC endpoint for our mock data
      // but still call the function to mimic real behavior
      await getRpcEndpoint();
      
      // Get available asset denoms from assets or use default if not available
      // Add some common Cosmos tokens if assets are not yet loaded
      const defaultDenoms = ['untrn', 'uatom', 'uosmo', 'ujuno', 'uscrt'];
      const denomsToQuery = assets?.assets?.map((asset: any) => asset.base) || defaultDenoms;
      
      // Add some randomness to the mock data to simulate market changes on each refresh
      Object.keys(MOCK_BALANCES).forEach(denom => {
        const currentAmount = parseInt(MOCK_BALANCES[denom].amount);
        // Random fluctuation between -5% and +5%
        const fluctuation = 0.95 + (Math.random() * 0.1);
        const newAmount = Math.floor(currentAmount * fluctuation).toString();
        MOCK_BALANCES[denom].amount = newAmount;
      });
      
      const balancePromises = denomsToQuery.map((denom: string) => 
        getBalance("mock-rpc-endpoint", {
          address,
          denom,
        }).catch(err => {
          console.error(`Failed to fetch balance for ${denom}:`, err);
          return null;
        })
      );
      
      const results = await Promise.all(balancePromises);
      const validBalances = results
        .filter((result: any) => result !== null)
        .map((result: any) => result?.balance);
      
      console.log('Mock balance response:', validBalances);
      setBalances(validBalances);
    } catch (error) {
      console.error('Error fetching balances:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to format token display
  const formatTokenInfo = (balance: any) => {
    if (!balance) return { symbol: 'Unknown', amount: '0' };
    
    // Find the matching asset in assets to get the symbol
    const matchingAsset = assets?.assets?.find((asset: any) => asset.base === balance.denom);
    const symbol = matchingAsset?.symbol || formatDenom(balance.denom);
    
    // Format the amount (convert from micro units if needed)
    const amount = balance.amount ? 
      (parseInt(balance.amount) / 1_000_000).toLocaleString(undefined, {
        minimumFractionDigits: 6,
        maximumFractionDigits: 6
      }) : 
      '0';
    
    return { symbol, amount };
  };
  
  // Helper to format raw denom strings to more readable format
  const formatDenom = (denom: string) => {
    if (!denom) return 'Unknown';
    // Remove 'u' prefix if present (micro units)
    return denom.startsWith('u') ? denom.substring(1).toUpperCase() : denom.toUpperCase();
  };

  useEffect(() => {
    if (address && isWalletConnected) {
      fetchBalances();
    }
  }, [address, isWalletConnected]);

  return (
    <div className="container mx-auto py-12">
      <h1 className="text-4xl font-bold mb-8 text-center">Account Details</h1>
      
      <div className="max-w-md mx-auto">
        {!isWalletConnected && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Connect Your Wallet</CardTitle>
              <CardDescription>Connect your wallet to view your account details</CardDescription>
            </CardHeader>
            <CardFooter className="flex justify-center">
              <ConnectButton />
            </CardFooter>
          </Card>
        )}

        {isWalletConnected && address && (
          <>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Account Address</CardTitle>
                <CardDescription>Your connected wallet address</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-2 bg-secondary rounded-md overflow-auto">
                  <code className="text-sm break-all">{address}</code>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Account Balances</CardTitle>
                <CardDescription>Your current token balances</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                ) : balances && balances.filter(balance => balance).length > 0 ? (
                  <ul className="space-y-2">
                    {balances.map((balance, idx) => {
                      const { symbol, amount } = formatTokenInfo(balance);
                      return (
                        <li key={idx} className="p-2 bg-secondary rounded-md">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{symbol}</span>
                            <span>{amount}</span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">No balances available</p>
                )}
              </CardContent>
              <CardFooter>
                <Button onClick={fetchBalances} disabled={isLoading} className="w-full">
                  {isLoading ? 'Refreshing...' : 'Refresh Balances'}
                </Button>
              </CardFooter>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

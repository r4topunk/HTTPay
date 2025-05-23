"use client";

import { useChain, useChainWallet } from '@interchain-kit/react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConnectButton } from '@/components/wallet/connect-button';
import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { defaultChainName } from '@/config/chain-config';
import { getBalance } from 'interchainjs/cosmos/bank/v1beta1/query.rpc.func';

export default function AccountPage() {
  const { address, status, assetList } = useChain(defaultChainName);
  const { rpcEndpoint } = useChainWallet(defaultChainName, 'keplr-extension');
  const [balances, setBalances] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const isWalletConnected = status === 'Connected';

  const fetchBalances = async () => {
    if (!address || !isWalletConnected || !rpcEndpoint) return;
    
    try {
      setIsLoading(true);
      
      // Get available asset denoms from assetList or use default if not available
      const denomsToQuery = assetList?.assets?.map(asset => asset.base) || ['untrn'];
      const balancePromises = denomsToQuery.map(denom => 
        getBalance(rpcEndpoint as string, {
          address,
          denom,
        }).catch(err => {
          console.error(`Failed to fetch balance for ${denom}:`, err);
          return null;
        })
      );
      
      const results = await Promise.all(balancePromises);
      const validBalances = results
        .filter(result => result !== null)
        .map(result => result?.balance);
      
      console.log('Balance response:', validBalances);
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
    
    // Find the matching asset in assetList to get the symbol
    const matchingAsset = assetList?.assets?.find(asset => asset.base === balance.denom);
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

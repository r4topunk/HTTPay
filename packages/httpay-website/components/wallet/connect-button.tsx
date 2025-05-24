"use client";

import { defaultChainName } from '@/config/chain-config';
import { truncateAddress } from '@/lib/utils';
import { useChain } from '@cosmos-kit/react';
import { useEffect, useState } from 'react';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';

export function ConnectButton() {
  const { 
    connect, 
    disconnect, 
    address, 
    status,
    openView, // Added this to access the built-in wallet selection modal
  } = useChain(defaultChainName);
  const [showKeplrModal, setShowKeplrModal] = useState(false);

  useEffect(() => {
    console.log('Wallet status:', status);
    if (status === 'NotExist') {
      setShowKeplrModal(true);
    } else {
      setShowKeplrModal(false);
    }
  }, [status]);

  const handleConnect = async () => {
    try {
      // This will either connect with the last used wallet or 
      // if no wallet was used before, it will open the selection modal
      await connect();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      // Use the built-in modal instead of custom modal when direct connect fails
      openView();
    }
  };

  const handleDisconnect = async () => {
    try {
      disconnect();
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
    }
  };

  const handleOpenKeplrWebsite = () => {
    window.open('https://www.keplr.app/download', '_blank');
  };

  const isWalletConnected = status === 'Connected';

  if (isWalletConnected && address) {
    return (
      <div className="flex items-center gap-2">
        <Button 
          variant="outline"
          className="px-4 py-2 rounded-lg"
        >
          {truncateAddress(address)}
        </Button>
        <Button 
          variant="ghost" 
          onClick={handleDisconnect} 
          className="text-red-500 hover:text-red-700"
          size="sm"
        >
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <>
      <Button 
        onClick={handleConnect} 
        disabled={status === 'Connecting'} 
        className="px-4 py-2 rounded-lg"
      >
        {status === 'Connecting' ? 'Connecting...' : 'Connect Wallet'}
      </Button>

      <Dialog open={showKeplrModal} onOpenChange={setShowKeplrModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Wallet Required</DialogTitle>
            <DialogDescription>
              You need to install a compatible wallet extension to connect to this application.
            </DialogDescription>
          </DialogHeader>
          <div className="my-4">
            <p className="text-sm text-muted-foreground mb-4">
              You can use Keplr, Leap, or Cosmostation wallet to interact with this application.
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>1.</span>
              <p>Install a compatible wallet browser extension</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>2.</span>
              <p>Create a new account or import an existing one</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>3.</span>
              <p>Return to this page and connect your wallet</p>
            </div>
          </div>
          <DialogFooter>
            <Button 
              onClick={handleOpenKeplrWebsite}
              className="w-full sm:w-auto"
            >
              Download Keplr Wallet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

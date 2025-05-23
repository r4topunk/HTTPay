"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useToast } from "@/components/ui/use-toast"

// Define types for our wallet context
interface WalletContextType {
  address: string | null
  client: any | null
  isConnecting: boolean
  connect: () => Promise<void>
  disconnect: () => void
}

// Create the context with default values
const WalletContext = createContext<WalletContextType>({
  address: null,
  client: null,
  isConnecting: false,
  connect: async () => {},
  disconnect: () => {},
})

// Chain configuration
const CHAIN_ID = "pion-1" // Neutron testnet

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null)
  const [client, setClient] = useState<any | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const { toast } = useToast()

  // Check if wallet was previously connected
  useEffect(() => {
    const savedAddress = localStorage.getItem("walletAddress")
    if (savedAddress) {
      // For demo purposes, just restore the address without actual connection
      setAddress(savedAddress)
    }
  }, [])

  const connect = async () => {
    try {
      setIsConnecting(true)

      // Check if we're in a browser environment
      if (typeof window === "undefined") {
        throw new Error("Cannot connect wallet in server environment")
      }

      // For demo purposes, simulate a wallet connection
      // In a real implementation, this would use CosmJS and Keplr
      await new Promise((resolve) => setTimeout(resolve, 1500)) // Simulate connection delay

      // Generate a mock Neutron address for demo
      const mockAddress =
        "neutron1" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

      // Update state
      setAddress(mockAddress)
      setClient({
        // Mock client with basic methods for demo
        queryContractSmart: async () => ({ tools: [] }),
        execute: async () => ({ transactionHash: "mock_tx_hash_" + Date.now() }),
      })

      localStorage.setItem("walletAddress", mockAddress)

      toast({
        title: "Demo Wallet Connected",
        description: `Connected to demo wallet (${mockAddress.substring(0, 8)}...${mockAddress.substring(mockAddress.length - 4)})`,
      })
    } catch (error) {
      console.error("Error connecting wallet:", error)
      toast({
        title: "Connection failed",
        description: "Failed to connect to wallet. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnect = () => {
    setAddress(null)
    setClient(null)
    localStorage.removeItem("walletAddress")
    toast({
      title: "Wallet disconnected",
      description: "Your wallet has been disconnected",
    })
  }

  return (
    <WalletContext.Provider
      value={{
        address,
        client,
        isConnecting,
        connect,
        disconnect,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}

export const useWallet = () => useContext(WalletContext)

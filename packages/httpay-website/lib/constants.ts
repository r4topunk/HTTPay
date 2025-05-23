// App name
export const APP_NAME = "HTTPay"

// Chain configuration
export const CHAIN_ID = "pion-1" // Neutron testnet
export const RPC_ENDPOINT = "https://rpc-pion-1.neutron.org"
export const REST_ENDPOINT = "https://rest-pion-1.neutron.org"
export const DENOM = "untrn" // Neutron testnet token
export const DENOM_NAME = "NTRN" // Human-readable name
export const DENOM_DECIMALS = 6 // 1 NTRN = 1,000,000 untrn

// Contract addresses (these would be the actual deployed contract addresses)
export const REGISTRY_CONTRACT = "neutron1registry123456789abcdef0123456789abcdef0123456789abcdef"
export const ESCROW_CONTRACT = "neutron1escrow123456789abcdef0123456789abcdef0123456789abcdef"

// Format an amount from base units (e.g., untrn) to display units (e.g., NTRN)
export function formatAmount(amount: string | number): string {
  const amountNum = typeof amount === "string" ? Number.parseInt(amount) : amount
  return (amountNum / Math.pow(10, DENOM_DECIMALS)).toFixed(6)
}

// Format wallet address to a more readable form
export function formatAddress(address: string | null): string {
  if (!address) return "";
  if (address.length <= 12) return address;
  
  const start = address.substring(0, 8);
  const end = address.substring(address.length - 4);
  return `${start}...${end}`;
}

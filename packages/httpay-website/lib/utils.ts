import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Truncates a blockchain address to a readable format
 * Example: neutron1abc...xyz
 */
export function truncateAddress(
  address: string,
  startLength = 8,
  endLength = 4
): string {
  if (!address) return "";
  if (address.length <= startLength + endLength) return address;

  const start = address.slice(0, startLength);
  const end = address.slice(-endLength);

  return `${start}...${end}`;
}

/**
 * Formats an amount with its denomination
 */
export function formatAmount(amount: string | number, denom: string): string {
  const formattedAmount =
    typeof amount === "string" ? amount : amount.toString();
  return `${formattedAmount} ${denom}`;
}

/**
 * Formats a date to locale string
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString();
}

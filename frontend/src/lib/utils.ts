import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatOCT(amount: bigint | string | number): string {
  const num = typeof amount === 'bigint' ? Number(amount) : Number(amount);
  return (num / 1_000_000_000).toFixed(4);
}

export function formatTimeRemaining(endTime: number): string {
  const now = Date.now();
  const remaining = endTime - now;
  
  if (remaining <= 0) return 'Ended';
  
  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

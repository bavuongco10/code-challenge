import {
  formatUnits as viemFormatUnits,
  parseUnits as viemParseUnits,
} from "viem";

import {
  GAS_RESERVE,
  UNI_ADDRESS,
  USDC_ADDRESS,
  WETH_ADDRESS,
} from "../constants.ts";
import type { SepoliaToken } from "../types.ts";

export const SEPOLIA_TOKENS: readonly SepoliaToken[] = [
  { symbol: "ETH", address: "native", decimals: 18 },
  { symbol: "WETH", address: WETH_ADDRESS, decimals: 18 },
  { symbol: "USDC", address: USDC_ADDRESS, decimals: 6 },
  { symbol: "UNI", address: UNI_ADDRESS, decimals: 18 },
] as const;

export function findSepoliaToken(symbol: string): SepoliaToken | undefined {
  return SEPOLIA_TOKENS.find(
    (t) => t.symbol.toLowerCase() === symbol.toLowerCase(),
  );
}

export function isSepoliaToken(symbol: string): boolean {
  return findSepoliaToken(symbol) !== undefined;
}

export function toRawUnits(amount: string | number, decimals: number): bigint {
  const str = typeof amount === "number" ? amount.toFixed(decimals) : amount;
  const sanitized = str.trim() === "" || str === "." ? "0" : str;
  try {
    return viemParseUnits(sanitized, decimals);
  } catch {
    return 0n;
  }
}

export function fromRawUnits(amount: bigint, decimals: number): number {
  return Number(viemFormatUnits(amount, decimals));
}

export function toRawAmount(amount: string | number, symbol: string): bigint {
  const token = findSepoliaToken(symbol);
  if (!token) return 0n;
  return toRawUnits(amount, token.decimals);
}

export function fromRawAmount(raw: bigint, symbol: string): number {
  const token = findSepoliaToken(symbol);
  if (!token) return 0;
  return fromRawUnits(raw, token.decimals);
}

export function getMaxSellAmount(symbol: string, balance: number): number {
  if (symbol === "ETH") {
    return Math.max(0, balance - GAS_RESERVE);
  }
  return balance;
}

export function checkGasReserve(
  sellSymbol: string,
  sellAmount: number,
  ethBalance: number,
): { hasEnoughGas: boolean; isGasShort: boolean } {
  if (sellSymbol === "ETH") {
    const isGasShort = sellAmount > 0 && sellAmount + GAS_RESERVE > ethBalance;
    return { hasEnoughGas: !isGasShort, isGasShort };
  }
  const isGasShort = sellAmount > 0 && ethBalance < GAS_RESERVE;
  return { hasEnoughGas: !isGasShort, isGasShort };
}

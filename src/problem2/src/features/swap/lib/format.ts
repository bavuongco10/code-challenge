import type { Prices, Quote } from "../types.ts";

const plain = (n: number, maxFrac: number) =>
  n.toLocaleString("en-US", {
    useGrouping: false,
    maximumFractionDigits: maxFrac,
  });

export const formatAmount = (n: number) => plain(Number(n.toPrecision(6)), 20);

export const formatBalance = (n: number) => plain(n, 8);

export function formatUsd(n: number): string {
  if (n === 0) return "$0";
  if (n < 0.01) return "<$0.01";
  const compact = n >= 1e6;
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    notation: compact ? "compact" : "standard",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export const formatPercent = (n: number) => `${Number(n.toFixed(2))}%`;

export function formatRate(
  q: Quote,
  inverted: boolean,
  prices: Prices,
): string {
  const [from, to, rate] = inverted
    ? [q.buy, q.sell, 1 / q.rate]
    : [q.sell, q.buy, q.rate];
  return `1 ${from} = ${formatAmount(rate)} ${to} (${formatUsd(prices[from] ?? 0)})`;
}

export const shortAddress = (a: string) => `${a.slice(0, 6)}...${a.slice(-4)}`;

export type Side = "sell" | "buy";
export type Prices = Record<string, number>; // symbol → USD, latest date, finite > 0
export type WalletMode = "demo" | "sepolia";
export type Activity = {
  sell: string;
  sellAmount: string;
  buy: string;
  buyAmount: string;
  at: number; // ms epoch
  hash?: string;
};
export type Wallet = {
  connected: boolean;
  address: string;
  balances: Record<string, string>; // decimal strings, ≤ 8 decimals
  activity: Activity[]; // newest first
};
export type Quote = {
  sell: string;
  buy: string; // symbols
  sellAmount: number;
  buyAmount: number;
  rate: number; // buy per 1 sell
  sellRaw?: bigint;
  buyRaw?: bigint;
  fee?: number;
};
export type SubmitState =
  | "loading-prices"
  | "prices-error"
  | "select-token"
  | "enter-amount"
  | "connect"
  | "wrong-chain"
  | "quoting"
  | "no-route"
  | "insufficient"
  | "ready"; // DOM class = `is-${state}`
export type SlippageLevel = "high" | "very-high" | null;
export type Toast = {
  status: "pending" | "success" | "error";
  sell: string;
  sellAmount: string;
  buy: string;
  buyAmount: string; // formatted
  hash?: string;
  message?: string;
  title?: string;
} | null;
export type SepoliaToken = {
  symbol: string;
  address: `0x${string}` | "native";
  decimals: number;
};

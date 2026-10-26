export type Side = "sell" | "buy";
export type Prices = Record<string, number>; // symbol → USD, latest date, finite > 0
export type WalletMode = "demo" | "sepolia";
export type Activity = {
  sell: string;
  sellAmount: string;
  buy: string;
  buyAmount: string;
  at: number; // ms epoch
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
};
export type SubmitState =
  | "loading-prices"
  | "select-token"
  | "enter-amount"
  | "connect"
  | "insufficient"
  | "ready"; // DOM class = `is-${state}`
export type SlippageLevel = "high" | "very-high" | null;
export type Toast = {
  status: "pending" | "success" | "error";
  sell: string;
  sellAmount: string;
  buy: string;
  buyAmount: string; // formatted
} | null;

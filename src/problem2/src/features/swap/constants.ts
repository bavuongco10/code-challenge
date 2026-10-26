export const PRICES_URL = "https://interview.switcheo.com/prices.json";
export const ICON_URL = (s: string) =>
  `https://raw.githubusercontent.com/Switcheo/token-icons/main/tokens/${s}.svg`;
export const WALLET_KEY = "swap:wallet";
export const WALLET_MODE_KEY = "swap:walletMode";
export const DEMO_ADDRESS = "0x1234567890abcdef1234567890abcdef12345678";
export const DEMO_BALANCES = { ETH: "1.5", USDC: "1000", SWTH: "250000" };
export const DEFAULT_SELL = "ETH";
export const AUTO_SLIPPAGE = 0.5; // %
export const DEFAULT_DEADLINE = 30; // minutes
export const MAX_DEADLINE = 4320;
export const SIGN_MS = 1000; // confirm → signed
export const PENDING_MS = 2000; // pending → success
export const TOAST_MS = 10_000; // success auto-dismiss
export const MAX_ACTIVITY = 5; // shown in the menu

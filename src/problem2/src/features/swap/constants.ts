export const PRICES_URL = "https://interview.switcheo.com/prices.json";
export const ICON_URL = (s: string) =>
  `https://raw.githubusercontent.com/Switcheo/token-icons/main/tokens/${s}.svg`;
export const WALLET_KEY = "swap:wallet";
export const WALLET_MODE_KEY = "swap:walletMode";
export const DEMO_ADDRESS = "0x1234567890abcdef1234567890abcdef12345678";
export const DEMO_BALANCES = { ETH: "1.5", USDC: "1000", SWTH: "250000" };
export const DEFAULT_SELL = "ETH";
export const AUTO_SLIPPAGE = 0.5; // %
export const SLIPPAGE_HELP =
  "The most the price can move against you before the swap reverts. Auto uses 0.5%.";
export const MIN_RECEIVED_HELP =
  "The least you get after max slippage. Below this, the swap reverts.";
export const DEADLINE_HELP =
  "If the swap is still pending after this many minutes, it is cancelled.";
export const DEFAULT_DEADLINE = 30; // minutes
export const MAX_DEADLINE = 4320;
export const SIGN_MS = 1000; // confirm → signed
export const PENDING_MS = 2000; // pending → success
export const TOAST_MS = 10_000; // success auto-dismiss
export const MAX_ACTIVITY = 5; // shown in the menu
export const TOUR_KEY = "swap:tourDone";

// Sepolia testnet constants
export const SEPOLIA_CHAIN_ID = 11155111;
export const QUOTER_V2_ADDRESS =
  "0xEd1f6473345F45b75F8179591dd5bA1888cf2FB3" as const;
export const SWAP_ROUTER_02_ADDRESS =
  "0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E" as const;
export const UNISWAP_V3_FACTORY_ADDRESS =
  "0x0227628f3F023bb0B980b67D528571c95c6DaC1c" as const;
export const WETH_ADDRESS =
  "0xfff9976782d46cc05630d1f6ebab18b2324d6b14" as const;
export const USDC_ADDRESS =
  "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238" as const;
export const UNI_ADDRESS =
  "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984" as const;
export const GAS_RESERVE = 0.002; // ETH
export const SEPOLIA_ACTIVITY_PREFIX = "swap:sepoliaActivity:";
export const SEPOLIA_FAUCET_URL =
  "https://cloud.google.com/application/web3/faucet/ethereum/sepolia";
export const ETHERSCAN_TX_URL = (hash: string) =>
  `https://sepolia.etherscan.io/tx/${hash}`;

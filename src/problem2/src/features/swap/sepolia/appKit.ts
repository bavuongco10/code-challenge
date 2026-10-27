import { createAppKit } from "@reown/appkit";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { sepolia } from "@reown/appkit/networks";
import { http } from "viem";

const projectId =
  (import.meta.env?.VITE_REOWN_PROJECT_ID as string | undefined) ||
  "930b669c7c0fb237b19b16cd8d201f3a";

const rpcUrl = import.meta.env?.VITE_SEPOLIA_RPC_URL as string | undefined;

export const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks: [sepolia],
  transports: rpcUrl ? { [sepolia.id]: http(rpcUrl) } : undefined,
});

export const wagmiConfig = wagmiAdapter.wagmiConfig;

export const modal = createAppKit({
  adapters: [wagmiAdapter],
  networks: [sepolia],
  defaultNetwork: sepolia,
  projectId,
  metadata: {
    name: "Pixel Swap",
    description: "Retro pixel swap on Sepolia",
    url:
      typeof window !== "undefined"
        ? window.location.origin
        : "http://localhost:5173",
    icons: [
      "https://raw.githubusercontent.com/Switcheo/token-icons/main/tokens/ETH.svg",
    ],
  },
  allowUnsupportedChain: false,
  features: {
    email: false,
    socials: [],
    swaps: false,
    onramp: false,
    analytics: false,
  },
  themeMode: "dark",
  themeVariables: {
    "--w3m-font-family": '"Press Start 2P", monospace',
    "--w3m-accent": "#e05338",
    "--w3m-border-radius-master": "0px",
    "--w3m-z-index": 100,
  },
});

import { useAtomValue, useSetAtom } from "jotai";
import { useEffect, useState, type ReactNode } from "react";
import { WagmiProvider, type Config } from "wagmi";

import {
  ensureSepoliaLoadedAtom,
  loadAppKit,
} from "../features/swap/sepolia/sepoliaWalletAtoms.ts";
import { walletModeAtom } from "../features/swap/walletAtoms.ts";

export function WalletProviders({ children }: { children: ReactNode }) {
  const mode = useAtomValue(walletModeAtom);
  const ensureLoaded = useSetAtom(ensureSepoliaLoadedAtom);
  const [config, setConfig] = useState<Config | null>(null);

  useEffect(() => {
    if (mode === "sepolia") {
      void loadAppKit().then(({ wagmiConfig }) => {
        setConfig(wagmiConfig);
        void ensureLoaded();
      });
    }
  }, [mode, ensureLoaded]);

  if (mode === "sepolia" && config) {
    return <WagmiProvider config={config}>{children}</WagmiProvider>;
  }

  return <>{children}</>;
}

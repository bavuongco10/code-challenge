import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { getDefaultStore } from "jotai";
import { queryClientAtom } from "jotai-tanstack-query";

import {
  GuideTour,
  SwapCard,
  TradeLog,
  WalletHeader,
} from "../features/swap/index.ts";
import { WalletProviders } from "./WalletProviders.tsx";

const queryClient = new QueryClient();
getDefaultStore().set(queryClientAtom, queryClient);

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WalletProviders>
        <div className="flex h-dvh flex-col">
          <header className="flex flex-wrap items-center justify-between gap-2 border-b-4 border-ink bg-panel px-4 py-3">
            <div className="flex items-center gap-3">
              <span
                aria-hidden
                className="inline-block size-6 border-4 border-ink bg-accent"
              />
              <h1 className="font-pixel text-xs uppercase max-[479px]:sr-only">
                Pixel Swap
              </h1>
              <GuideTour />
            </div>
            <WalletHeader />
          </header>
          <main className="flex min-h-0 flex-1 flex-col px-4 py-4">
            <SwapCard />
            <TradeLog />
          </main>
        </div>
      </WalletProviders>
    </QueryClientProvider>
  );
}

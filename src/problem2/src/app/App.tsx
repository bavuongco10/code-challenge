import { SwapCard, WalletHeader } from "../features/swap/index.ts";

export default function App() {
  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-2 border-b-4 border-ink bg-panel px-4 py-3">
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className="inline-block size-6 border-4 border-ink bg-accent"
          />
          <h1 className="font-pixel text-xs uppercase">Pixel Swap</h1>
        </div>
        <WalletHeader />
      </header>
      <main className="px-4 py-8">
        <SwapCard />
      </main>
    </>
  );
}

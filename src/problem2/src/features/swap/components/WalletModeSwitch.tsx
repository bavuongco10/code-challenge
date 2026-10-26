import { useAtom } from "jotai";

import { walletModeAtom } from "../walletAtoms.ts";

const seg =
  "pixel-focus px-3 py-2 font-pixel text-[10px] uppercase disabled:cursor-not-allowed disabled:opacity-50";

export function WalletModeSwitch() {
  const [mode, setMode] = useAtom(walletModeAtom);
  const cls = (active: boolean) =>
    `${seg} ${active ? "is-active bg-primary text-on-fill" : "bg-panel text-ink"}`;
  return (
    <div
      id="wallet-mode"
      role="group"
      aria-label="Wallet mode"
      className="pixel-box flex bg-panel"
    >
      <button
        type="button"
        data-mode="demo"
        aria-pressed={mode === "demo"}
        className={cls(mode === "demo")}
        onClick={() => setMode("demo")}
      >
        Demo
      </button>
      {/* focusable wrapper: disabled buttons can't show the tooltip on focus */}
      <span className="group relative flex" tabIndex={0} title="Coming soon">
        <button
          type="button"
          data-mode="sepolia"
          aria-pressed={mode === "sepolia"}
          disabled
          tabIndex={-1}
          className={cls(mode === "sepolia")}
        >
          Sepolia
        </button>
        <span
          role="tooltip"
          className="pixel-box pointer-events-none absolute top-full right-0 z-30 mt-2 hidden bg-accent px-2 py-1 font-pixel text-[8px] whitespace-nowrap text-on-accent group-hover:block group-focus:block"
        >
          Coming soon
        </span>
      </span>
    </div>
  );
}

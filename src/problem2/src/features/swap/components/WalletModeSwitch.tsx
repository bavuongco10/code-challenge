import { useAtom } from "jotai";
import { memo } from "react";

import { walletModeAtom } from "../walletAtoms.ts";

const seg =
  "pixel-focus px-3 py-2 font-pixel text-[10px] uppercase disabled:cursor-not-allowed disabled:opacity-50";

export const WalletModeSwitch = memo(function WalletModeSwitch() {
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
      <button
        type="button"
        data-mode="sepolia"
        aria-pressed={mode === "sepolia"}
        className={cls(mode === "sepolia")}
        onClick={() => setMode("sepolia")}
      >
        Sepolia
      </button>
    </div>
  );
});

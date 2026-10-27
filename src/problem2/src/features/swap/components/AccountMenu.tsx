import { MAX_ACTIVITY } from "../constants.ts";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { useAtomValue, useSetAtom } from "jotai";

import { formatAmount, shortAddress } from "../lib/format.ts";
import { disconnectAtom, walletAtom } from "../walletAtoms.ts";
import { PixelIcon } from "./PixelIcon.tsx";

const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["day", 86_400],
  ["hour", 3_600],
  ["minute", 60],
];

function ago(at: number): string {
  const s = Math.round((at - Date.now()) / 1000);
  for (const [unit, sec] of UNITS)
    if (Math.abs(s) >= sec) return rtf.format(Math.round(s / sec), unit);
  return rtf.format(Math.min(s, 0), "second");
}

export function AccountMenu() {
  const wallet = useAtomValue(walletAtom);
  const disconnect = useSetAtom(disconnectAtom);
  if (!wallet?.connected) return null;
  const items = wallet.activity.slice(0, MAX_ACTIVITY);
  const held = Object.entries(wallet.balances).filter(([, b]) => Number(b) > 0);
  return (
    <Popover className="relative">
      <PopoverButton
        id="account-button"
        className="pixel-btn pixel-focus flex items-center gap-2 bg-accent px-3 py-2 font-pixel text-[10px] text-on-accent"
      >
        <PixelIcon name="wallet" />
        {shortAddress(wallet.address)}
      </PopoverButton>
      <PopoverPanel
        id="account-menu"
        className="pixel-box absolute right-0 z-30 mt-2 w-72 max-w-[calc(100vw-2rem)] bg-panel p-3"
      >
        {({ close }) => (
          <>
            <p className="font-mono text-sm break-all">{wallet.address}</p>
            <button
              id="disconnect"
              type="button"
              className="pixel-btn pixel-focus mt-2 w-full bg-danger px-3 py-2 font-pixel text-[10px] text-on-fill"
              onClick={() => {
                disconnect();
                close();
              }}
            >
              Disconnect
            </button>
            <h3 className="mt-3 font-pixel text-[10px] uppercase">Balances</h3>
            <ul id="wallet-balances" className="mt-2 space-y-1 bg-terminal p-2">
              {held.length === 0 ? (
                <li className="font-mono text-lg text-on-terminal">
                  &gt; No tokens
                </li>
              ) : (
                held.map(([sym, b]) => (
                  <li
                    key={sym}
                    className="wallet-balance flex justify-between font-mono text-lg text-on-terminal"
                  >
                    <span>{sym}</span>
                    <span>{formatAmount(Number(b))}</span>
                  </li>
                ))
              )}
            </ul>
            <h3 className="mt-3 font-pixel text-[10px] uppercase">
              Recent activity
            </h3>
            <ul id="activity" className="mt-2 space-y-2 bg-terminal p-2">
              {items.length === 0 ? (
                <li className="font-mono text-lg text-on-terminal">
                  &gt; No swaps yet
                </li>
              ) : (
                items.map((a) => (
                  <li
                    key={a.at}
                    className="activity-item font-mono text-lg text-on-terminal"
                  >
                    <span className="font-pixel text-[8px] uppercase">
                      Swapped
                    </span>{" "}
                    {a.sellAmount} {a.sell} → {a.buyAmount} {a.buy}
                    <span className="block text-base text-on-terminal-dim">
                      {ago(a.at)}
                    </span>
                  </li>
                ))
              )}
            </ul>
          </>
        )}
      </PopoverPanel>
    </Popover>
  );
}

import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { useAtomValue, useSetAtom } from "jotai";
import { memo, useMemo } from "react";

import {
  ETHERSCAN_TX_URL,
  MAX_ACTIVITY,
  SEPOLIA_FAUCET_URL,
} from "../constants.ts";
import { formatAmount, shortAddress } from "../lib/format.ts";
import { openAccountModalAtom } from "../sepolia/sepoliaWalletAtoms.ts";
import type { Wallet } from "../types.ts";
import { disconnectAtom, walletAtom, walletModeAtom } from "../walletAtoms.ts";
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

function AccountMenuContent({
  wallet,
  mode,
  close,
}: {
  wallet: Wallet;
  mode: string;
  close: () => void;
}) {
  const disconnect = useSetAtom(disconnectAtom);
  const openAccountModal = useSetAtom(openAccountModalAtom);

  const items = useMemo(
    () => wallet.activity.slice(0, MAX_ACTIVITY),
    [wallet.activity],
  );
  const held = useMemo(
    () => Object.entries(wallet.balances).filter(([, b]) => Number(b) > 0),
    [wallet.balances],
  );

  return (
    <>
      <p className="font-mono text-sm break-all">{wallet.address}</p>
      {mode === "sepolia" && (
        <div className="mt-2 border-l-2 border-warn bg-warn/10 p-2 font-mono text-xs text-ink">
          <p>You are in testnet mode</p>
          <a
            href={SEPOLIA_FAUCET_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-block text-primary underline"
          >
            Sepolia faucet
          </a>
        </div>
      )}
      {mode === "sepolia" && (
        <button
          id="manage-wallet"
          type="button"
          className="pixel-btn pixel-focus mt-2 w-full bg-accent px-3 py-2 font-pixel text-[10px] text-on-accent"
          onClick={() => {
            void openAccountModal();
            close();
          }}
        >
          Manage wallet
        </button>
      )}
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
          <li className="font-mono text-lg text-on-terminal">&gt; No tokens</li>
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
      <h3 className="mt-3 font-pixel text-[10px] uppercase">Recent activity</h3>
      <ul id="activity" className="mt-2 space-y-2 bg-terminal p-2">
        {items.length === 0 ? (
          <li className="font-mono text-lg text-on-terminal">
            &gt; No swaps yet
          </li>
        ) : (
          items.map((a) => (
            <li
              key={a.hash ? a.hash : a.at}
              className="activity-item font-mono text-lg text-on-terminal"
            >
              <span className="font-pixel text-[8px] uppercase">Swapped</span>{" "}
              {a.sellAmount} {a.sell} → {a.buyAmount} {a.buy}
              <div className="flex items-center justify-between text-base text-on-terminal-dim">
                <span>{ago(a.at)}</span>
                {a.hash && (
                  <a
                    href={ETHERSCAN_TX_URL(a.hash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Etherscan
                  </a>
                )}
              </div>
            </li>
          ))
        )}
      </ul>
    </>
  );
}

export const AccountMenu = memo(function AccountMenu() {
  const wallet = useAtomValue(walletAtom);
  const mode = useAtomValue(walletModeAtom);

  if (!wallet?.connected) return null;

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
          <AccountMenuContent wallet={wallet} mode={mode} close={close} />
        )}
      </PopoverPanel>
    </Popover>
  );
});

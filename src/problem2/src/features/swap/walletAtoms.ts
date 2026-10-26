import { atom } from "jotai";
import { atomWithStorage, createJSONStorage } from "jotai/utils";

import {
  DEMO_ADDRESS,
  DEMO_BALANCES,
  WALLET_KEY,
  WALLET_MODE_KEY,
} from "./constants.ts";
import { formatBalance } from "./lib/format.ts";
import type { Activity, Wallet, WalletMode } from "./types.ts";

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const isWallet = (v: unknown): v is Wallet =>
  isRecord(v) &&
  typeof v.connected === "boolean" &&
  typeof v.address === "string" &&
  isRecord(v.balances) &&
  Object.values(v.balances).every(
    (b) => typeof b === "string" && Number.isFinite(Number(b)),
  ) &&
  Array.isArray(v.activity);

const isMode = (v: unknown): v is WalletMode => v === "demo" || v === "sepolia";

// getItem never throws: missing storage, bad JSON or wrong shape -> default.
const guardedStorage = <T>(valid: (v: unknown) => v is T) => {
  const base = createJSONStorage<T>(() => localStorage);
  return {
    ...base,
    getItem: (key: string, initial: T): T => {
      try {
        const v: unknown = base.getItem(key, initial);
        return valid(v) ? v : initial;
      } catch {
        return initial;
      }
    },
  };
};

export const walletAtom = atomWithStorage<Wallet | null>(
  WALLET_KEY,
  null,
  guardedStorage((v): v is Wallet | null => v === null || isWallet(v)),
  { getOnInit: true },
);

const storedModeAtom = atomWithStorage<WalletMode>(
  WALLET_MODE_KEY,
  "demo",
  guardedStorage(isMode),
  { getOnInit: true },
);

export const connectedAtom = atom((get) => get(walletAtom)?.connected === true);

// Missing symbol = no balance: read with `balances[sym] ?? 0`.
export const balancesAtom = atom((get) => {
  const w = get(walletAtom);
  if (!w?.connected) return null;
  return Object.fromEntries(
    Object.entries(w.balances).map(([sym, b]) => [sym, Number(b)]),
  ) as Partial<Record<string, number>>;
});

export const connectAtom = atom(null, (get, set) => {
  const w = get(walletAtom);
  set(
    walletAtom,
    w
      ? { ...w, connected: true }
      : {
          connected: true,
          address: DEMO_ADDRESS,
          balances: { ...DEMO_BALANCES },
          activity: [],
        },
  );
});

export const disconnectAtom = atom(null, (get, set) => {
  const w = get(walletAtom);
  if (w) set(walletAtom, { ...w, connected: false });
});

// Changing the mode disconnects.
export const walletModeAtom = atom(
  (get) => get(storedModeAtom),
  (_get, set, mode: WalletMode) => {
    set(storedModeAtom, mode);
    set(disconnectAtom);
  },
);

export const applySwapAtom = atom(null, (get, set, a: Activity): boolean => {
  const w = get(walletAtom);
  if (!w?.connected) return false;
  const sell = Number(w.balances[a.sell] ?? 0);
  const amount = Number(a.sellAmount);
  if (!(amount > 0) || amount > sell) return false;
  set(walletAtom, {
    ...w,
    balances: {
      ...w.balances,
      [a.sell]: formatBalance(sell - amount),
      [a.buy]: formatBalance(
        Number(w.balances[a.buy] ?? 0) + Number(a.buyAmount),
      ),
    },
    activity: [a, ...w.activity],
  });
  return true;
});

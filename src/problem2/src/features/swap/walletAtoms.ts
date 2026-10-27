import { atom } from "jotai";
import { atomWithStorage, createJSONStorage } from "jotai/utils";

import {
  DEMO_ADDRESS,
  DEMO_BALANCES,
  WALLET_KEY,
  WALLET_MODE_KEY,
} from "./constants.ts";
import { formatBalance } from "./lib/format.ts";
import {
  addSepoliaActivityAtom,
  disconnectSepoliaAtom,
  openConnectModalAtom,
  sepoliaActivityAtom,
  sepoliaAddressAtom,
  sepoliaConnectedAtom,
  switchSepoliaChainAtom,
} from "./sepolia/sepoliaWalletAtoms.ts";
import {
  sepoliaBalancesQueryAtom,
  sepoliaInvalidateAtom,
} from "./sepolia/sepoliaQueryAtoms.ts";
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

export const demoWalletAtom = atomWithStorage<Wallet | null>(
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

type ModeChangeCallback = (mode: WalletMode) => void;
let modeChangeCallback: ModeChangeCallback | null = null;
export function registerModeChangeCallback(cb: ModeChangeCallback) {
  modeChangeCallback = cb;
}

// Mode switch updates mode and notifies
export const walletModeAtom = atom(
  (get) => get(storedModeAtom),
  (get, set, mode: WalletMode) => {
    const current = get(storedModeAtom);
    if (current === mode) return;
    set(storedModeAtom, mode);
    if (current === "demo") {
      const w = get(demoWalletAtom);
      if (w) set(demoWalletAtom, { ...w, connected: false });
    }
    modeChangeCallback?.(mode);
  },
);

export const connectedAtom = atom((get) => {
  const mode = get(walletModeAtom);
  if (mode === "demo") return get(demoWalletAtom)?.connected === true;
  return get(sepoliaConnectedAtom);
});

// Missing symbol = no balance: read with `balances[sym] ?? 0`.
export const balancesAtom = atom((get) => {
  const mode = get(walletModeAtom);
  if (mode === "demo") {
    const w = get(demoWalletAtom);
    if (!w?.connected) return null;
    return Object.fromEntries(
      Object.entries(w.balances).map(([sym, b]) => [sym, Number(b)]),
    ) as Partial<Record<string, number>>;
  }

  const connected = get(sepoliaConnectedAtom);
  const address = get(sepoliaAddressAtom);
  if (!connected || !address) return null;

  const query = get(sepoliaBalancesQueryAtom);
  return query.data ?? null;
});

export const walletActivityAtom = atom((get): Activity[] => {
  const mode = get(walletModeAtom);
  if (mode === "demo") {
    return get(demoWalletAtom)?.activity ?? [];
  }
  return get(sepoliaActivityAtom);
});

export const recentActivityAtom = atom((get) =>
  get(walletActivityAtom).slice(0, 5),
);

export const walletAtom = atom(
  (get): Wallet | null => {
    const mode = get(walletModeAtom);
    if (mode === "demo") {
      return get(demoWalletAtom);
    }

    const connected = get(sepoliaConnectedAtom);
    const address = get(sepoliaAddressAtom);
    if (!connected || !address) return null;

    const balances = get(balancesAtom) ?? {};
    const activity = get(sepoliaActivityAtom);

    return {
      connected,
      address,
      balances: Object.fromEntries(
        Object.entries(balances).map(([k, v]) => [k, String(v ?? 0)]),
      ),
      activity,
    };
  },
  (_get, set, update: Wallet | null) => {
    set(demoWalletAtom, update);
  },
);

export const connectAtom = atom(null, (get, set) => {
  const mode = get(walletModeAtom);
  if (mode === "demo") {
    const w = get(demoWalletAtom);
    set(
      demoWalletAtom,
      w
        ? { ...w, connected: true }
        : {
            connected: true,
            address: DEMO_ADDRESS,
            balances: { ...DEMO_BALANCES },
            activity: [],
          },
    );
  } else {
    void set(openConnectModalAtom);
  }
});

export const disconnectAtom = atom(null, (get, set) => {
  const mode = get(walletModeAtom);
  if (mode === "demo") {
    const w = get(demoWalletAtom);
    if (w) set(demoWalletAtom, { ...w, connected: false });
  } else {
    void set(disconnectSepoliaAtom);
  }
});

export const switchChainAtom = atom(null, async (get, set) => {
  const mode = get(walletModeAtom);
  if (mode === "sepolia") {
    return await set(switchSepoliaChainAtom);
  }
  return true;
});

export const applySwapAtom = atom(null, (get, set, a: Activity): boolean => {
  const mode = get(walletModeAtom);
  if (mode === "demo") {
    const w = get(demoWalletAtom);
    if (!w?.connected) return false;
    const sell = Number(w.balances[a.sell] ?? 0);
    const amount = Number(a.sellAmount);
    if (!(amount > 0) || amount > sell) return false;
    set(demoWalletAtom, {
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
  }

  // Sepolia mode: add activity and invalidate queries
  set(addSepoliaActivityAtom, a);
  set(sepoliaInvalidateAtom);
  return true;
});

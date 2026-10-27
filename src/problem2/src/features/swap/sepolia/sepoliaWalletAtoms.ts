import { atom, getDefaultStore } from "jotai";

import { SEPOLIA_ACTIVITY_PREFIX, SEPOLIA_CHAIN_ID } from "../constants.ts";
import type { Activity } from "../types.ts";

export type SepoliaAccount = {
  connected: boolean;
  address: `0x${string}` | null;
  chainId: number | null;
};

let appKitPromise: Promise<typeof import("./appKit.ts")> | null = null;
let listenersInitialized = false;

export function loadAppKit() {
  if (!appKitPromise) {
    appKitPromise = import("./appKit.ts");
  }
  return appKitPromise;
}

export const sepoliaAccountAtom = atom<SepoliaAccount>({
  connected: false,
  address: null,
  chainId: null,
});

export const sepoliaConnectedAtom = atom((get) => {
  const acc = get(sepoliaAccountAtom);
  return acc.connected && Boolean(acc.address);
});

export const sepoliaAddressAtom = atom(
  (get) => get(sepoliaAccountAtom).address,
);

export const sepoliaChainIdAtom = atom(
  (get) => get(sepoliaAccountAtom).chainId,
);

export const isWrongChainAtom = atom((get) => {
  const acc = get(sepoliaAccountAtom);
  return (
    acc.connected && Boolean(acc.address) && acc.chainId !== SEPOLIA_CHAIN_ID
  );
});

// Version atom to trigger reactivity for localStorage-backed sepolia activity
const activityVersionAtom = atom(0);

export const sepoliaActivityAtom = atom<Activity[]>((get) => {
  get(activityVersionAtom);
  const address = get(sepoliaAddressAtom);
  if (!address || typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(
      `${SEPOLIA_ACTIVITY_PREFIX}${address.toLowerCase()}`,
    );
    return raw ? (JSON.parse(raw) as Activity[]) : [];
  } catch {
    return [];
  }
});

export const addSepoliaActivityAtom = atom(
  null,
  (get, set, activity: Activity) => {
    const address = get(sepoliaAddressAtom);
    if (!address || typeof localStorage === "undefined") return;
    const key = `${SEPOLIA_ACTIVITY_PREFIX}${address.toLowerCase()}`;
    try {
      const prev = get(sepoliaActivityAtom);
      const next = [activity, ...prev];
      localStorage.setItem(key, JSON.stringify(next));
      set(activityVersionAtom, (v) => v + 1);
    } catch {
      // storage unavailable or quota exceeded
    }
  },
);

export async function syncSepoliaAccount() {
  const { wagmiConfig, modal } = await loadAppKit();
  const { getAccount } = await import("wagmi/actions");

  const wagmiAcc = getAccount(wagmiConfig);
  const modalAddress = modal.getAddress();
  const modalConnected = modal.getIsConnectedState();
  const modalNetwork = modal.getCaipNetwork();

  const address = (wagmiAcc.address || modalAddress || null) as
    `0x${string}` | null;
  const connected = Boolean(
    address &&
    ((wagmiAcc.isConnected && wagmiAcc.address) ||
      (modalConnected && modalAddress)),
  );
  const chainId =
    wagmiAcc.chainId ?? (modalNetwork?.id ? Number(modalNetwork.id) : null);

  getDefaultStore().set(sepoliaAccountAtom, {
    connected,
    address,
    chainId,
  });

  return { connected, address, chainId };
}

export const ensureSepoliaLoadedAtom = atom(null, async () => {
  const { wagmiConfig, modal } = await loadAppKit();
  const { reconnect, watchAccount, watchConnections } =
    await import("wagmi/actions");

  if (!listenersInitialized) {
    listenersInitialized = true;

    watchAccount(wagmiConfig, {
      onChange() {
        void syncSepoliaAccount();
      },
    });

    watchConnections(wagmiConfig, {
      onChange() {
        void syncSepoliaAccount();
      },
    });

    modal.subscribeAccount(() => {
      void syncSepoliaAccount();
    });

    modal.subscribeNetwork(() => {
      void syncSepoliaAccount();
    });

    modal.subscribeState((state) => {
      if (!state.open) {
        void syncSepoliaAccount();
      }
    });

    const eth =
      typeof window !== "undefined"
        ? (
            window as unknown as {
              ethereum?: { on?: (event: string, handler: () => void) => void };
            }
          ).ethereum
        : undefined;
    if (eth?.on) {
      eth.on("accountsChanged", () => {
        void syncSepoliaAccount();
      });
      eth.on("chainChanged", () => {
        void syncSepoliaAccount();
      });
    }

    try {
      await reconnect(wagmiConfig);
    } catch {
      // Ignore if no stored connectors to reconnect
    }
  }

  await syncSepoliaAccount();
  return { wagmiConfig, modal };
});

export const openConnectModalAtom = atom(null, async (_get, set) => {
  const { modal } = await set(ensureSepoliaLoadedAtom);
  await modal.open();
  await syncSepoliaAccount();
});

export const openAccountModalAtom = atom(null, async (_get, set) => {
  const { modal } = await set(ensureSepoliaLoadedAtom);
  await modal.open({ view: "Account" });
  await syncSepoliaAccount();
});

export const disconnectSepoliaAtom = atom(null, async (_get, set) => {
  const { wagmiConfig, modal } = await set(ensureSepoliaLoadedAtom);
  const { disconnect } = await import("wagmi/actions");
  try {
    await disconnect(wagmiConfig);
  } catch {
    // Already disconnected
  }
  try {
    await modal.disconnect();
  } catch {
    // Modal already disconnected
  }
  getDefaultStore().set(sepoliaAccountAtom, {
    connected: false,
    address: null,
    chainId: null,
  });
});

export const switchSepoliaChainAtom = atom(null, async (_get, set) => {
  const { wagmiConfig } = await set(ensureSepoliaLoadedAtom);
  const { switchChain } = await import("wagmi/actions");
  try {
    await switchChain(wagmiConfig, { chainId: SEPOLIA_CHAIN_ID });
    await syncSepoliaAccount();
    return true;
  } catch {
    return false;
  }
});

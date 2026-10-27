import { atom } from "jotai";

import { PENDING_MS, SIGN_MS, TOAST_MS } from "./constants.ts";
import {
  quoteAtom,
  resetAmountsAtom,
  reviewOpenAtom,
  toastAtom,
} from "./atoms.ts";
import { formatAmount } from "./lib/format.ts";
import {
  confirmingAtom as sepoliaConfirmingAtom,
  confirmingTextAtom as sepoliaConfirmingTextAtom,
  confirmSepoliaSwapAtom,
} from "./sepolia/sepoliaSwapFlow.ts";
import type { Toast } from "./types.ts";
import { applySwapAtom, walletModeAtom } from "./walletAtoms.ts";

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

const demoConfirmingAtom = atom(false);

export const confirmingAtom = atom(
  (get) =>
    get(walletModeAtom) === "sepolia"
      ? get(sepoliaConfirmingAtom)
      : get(demoConfirmingAtom),
  (_get, set, val: boolean) => {
    set(demoConfirmingAtom, val);
  },
);

export const confirmingTextAtom = atom((get) => {
  if (get(walletModeAtom) === "sepolia") {
    return get(sepoliaConfirmingTextAtom);
  }
  return null;
});

export const confirmSwapAtom = atom(null, async (get, set) => {
  const mode = get(walletModeAtom);
  if (mode === "sepolia") {
    await set(confirmSepoliaSwapAtom);
    return;
  }

  // Demo confirm flow
  const q = get(quoteAtom);
  if (!q || get(demoConfirmingAtom)) return;
  const sellAmount = formatAmount(q.sellAmount);
  const buyAmount = formatAmount(q.buyAmount);
  const base = { sell: q.sell, sellAmount, buy: q.buy, buyAmount };
  set(demoConfirmingAtom, true);
  await wait(SIGN_MS);
  set(demoConfirmingAtom, false);
  set(reviewOpenAtom, false);
  set(resetAmountsAtom);
  set(toastAtom, { ...base, status: "pending" });
  await wait(PENDING_MS);
  const ok = set(applySwapAtom, { ...base, at: Date.now() });
  const done: Toast = { ...base, status: ok ? "success" : "error" };
  set(toastAtom, done);
  await wait(TOAST_MS);
  if (get(toastAtom) === done) set(toastAtom, null);
});

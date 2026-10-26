import { atom } from "jotai";

import { PENDING_MS, SIGN_MS, TOAST_MS } from "./constants.ts";
import {
  quoteAtom,
  resetAmountsAtom,
  reviewOpenAtom,
  toastAtom,
} from "./atoms.ts";
import { formatAmount } from "./lib/format.ts";
import type { Toast } from "./types.ts";
import { applySwapAtom } from "./walletAtoms.ts";

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export const confirmingAtom = atom(false);

export const confirmSwapAtom = atom(null, async (get, set) => {
  const q = get(quoteAtom);
  if (!q || get(confirmingAtom)) return;
  const sellAmount = formatAmount(q.sellAmount);
  const buyAmount = formatAmount(q.buyAmount);
  const base = { sell: q.sell, sellAmount, buy: q.buy, buyAmount };
  set(confirmingAtom, true);
  await wait(SIGN_MS);
  set(confirmingAtom, false);
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

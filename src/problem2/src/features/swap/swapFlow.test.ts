import { QueryClient } from "@tanstack/react-query";
import { createStore } from "jotai";
import { queryClientAtom } from "jotai-tanstack-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  buyTokenAtom,
  pricesAtom,
  setAmountAtom,
  toastAtom,
  typedAmountAtom,
} from "./atoms.ts";
import { PENDING_MS, SIGN_MS, TOAST_MS } from "./constants.ts";
import { confirmingAtom, confirmSwapAtom } from "./swapFlow.ts";
import { balancesAtom, connectAtom, walletAtom } from "./walletAtoms.ts";

const PRICES = [
  { currency: "ETH", date: "2023-08-29T07:10:52.000Z", price: 2000 },
  { currency: "USDC", date: "2023-08-29T07:10:40.000Z", price: 1 },
];

beforeEach(() => {
  const mem = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => mem.get(k) ?? null,
    setItem: (k: string, v: string) => void mem.set(k, v),
    removeItem: (k: string) => void mem.delete(k),
  });
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(JSON.stringify(PRICES))),
  );
});
afterEach(() => vi.useRealTimers());

/** New store with its own QueryClient, so the prices cache doesn't leak between tests. */
function freshStore() {
  const s = createStore();
  s.set(queryClientAtom, new QueryClient());
  return s;
}

async function ready() {
  const s = freshStore();
  s.sub(pricesAtom, () => {});
  await vi.waitFor(() => expect(s.get(pricesAtom).state).toBe("ready"));
  s.set(buyTokenAtom, "USDC");
  s.set(connectAtom);
  s.set(setAmountAtom, "sell", "1");
  return s;
}

describe("confirmSwapAtom", () => {
  it("signs, goes pending, succeeds, then dismisses", async () => {
    const s = await ready();
    vi.useFakeTimers();
    const p = s.set(confirmSwapAtom);
    expect(s.get(confirmingAtom)).toBe(true);
    await vi.advanceTimersByTimeAsync(SIGN_MS);
    expect(s.get(toastAtom)?.status).toBe("pending");
    expect(s.get(toastAtom)?.buyAmount).toBe("2000");
    expect(s.get(typedAmountAtom)).toBe("");
    expect(s.get(balancesAtom)?.ETH).toBe(1.5);
    await vi.advanceTimersByTimeAsync(PENDING_MS);
    expect(s.get(toastAtom)?.status).toBe("success");
    expect(s.get(balancesAtom)).toMatchObject({ ETH: 0.5, USDC: 3000 });
    expect(s.get(walletAtom)?.activity).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(TOAST_MS);
    await p;
    expect(s.get(toastAtom)).toBeNull();
  });

  it("fails when the balance dropped meanwhile", async () => {
    const s = await ready();
    vi.useFakeTimers();
    const p = s.set(confirmSwapAtom);
    await vi.advanceTimersByTimeAsync(SIGN_MS);
    const w = s.get(walletAtom)!;
    s.set(walletAtom, { ...w, balances: { ...w.balances, ETH: "0.1" } });
    await vi.advanceTimersByTimeAsync(PENDING_MS);
    expect(s.get(toastAtom)?.status).toBe("error");
    expect(s.get(balancesAtom)?.ETH).toBe(0.1);
    await vi.advanceTimersByTimeAsync(TOAST_MS);
    await p;
  });
});

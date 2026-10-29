import { QueryClient } from "@tanstack/react-query";
import { createStore } from "jotai";
import { queryClientAtom } from "jotai-tanstack-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  amountsAtom,
  buyTokenAtom,
  debouncedTypedAmountAtom,
  flipAtom,
  insufficientAtom,
  minReceivedAtom,
  pickerSideAtom,
  pickTokenAtom,
  pricesAtom,
  quoteAtom,
  resetAmountsAtom,
  retryPricesAtom,
  sellTokenAtom,
  setAmountAtom,
  setPresetAtom,
  slippageAtom,
  slippageInputAtom,
  slippageLevelAtom,
  submitStateAtom,
  tokensAtom,
} from "./atoms.ts";
import { connectAtom } from "./walletAtoms.ts";

const PRICES = [
  { currency: "ETH", date: "2023-08-29T07:10:52.000Z", price: 2000 },
  { currency: "USDC", date: "2023-08-29T07:10:40.000Z", price: 1 },
  { currency: "SWTH", date: "2023-08-29T07:10:40.000Z", price: 0.004 },
  { currency: "NOPRICE", date: "2023-08-29T07:10:40.000Z" },
];
const ok = () => new Response(JSON.stringify(PRICES));

let fetchMock: ReturnType<typeof vi.fn>;
beforeEach(() => {
  const mem = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => mem.get(k) ?? null,
    setItem: (k: string, v: string) => void mem.set(k, v),
    removeItem: (k: string) => void mem.delete(k),
  });
  fetchMock = vi.fn(async () => ok());
  vi.stubGlobal("fetch", fetchMock);
});

/** New store with its own QueryClient, so the prices cache doesn't leak between tests. */
function freshStore() {
  const s = createStore();
  s.set(queryClientAtom, new QueryClient());
  return s;
}

type Store = ReturnType<typeof createStore>;
const waitFor = (s: Store, state: string) =>
  vi.waitFor(() => expect(s.get(pricesAtom).state).toBe(state));

/** Store with prices loaded, ETH → USDC. */
async function ready(connect = true) {
  const s = freshStore();
  s.sub(pricesAtom, () => {});
  await waitFor(s, "ready");
  s.set(pickTokenAtom, "buy", "USDC");
  if (connect) s.set(connectAtom);
  return s;
}

describe("prices", () => {
  it("loading → ready, tokens A→Z with only priced ones", async () => {
    const s = freshStore();
    s.sub(pricesAtom, () => {});
    expect(s.get(pricesAtom).state).toBe("loading");
    expect(s.get(submitStateAtom)).toBe("loading-prices");
    await waitFor(s, "ready");
    expect(s.get(tokensAtom)).toEqual(["ETH", "SWTH", "USDC"]);
  });

  it("error, then retry refetches via loading to ready", async () => {
    fetchMock.mockResolvedValueOnce(new Response("", { status: 500 }));
    const s = freshStore();
    s.sub(pricesAtom, () => {});
    await waitFor(s, "error");
    expect(s.get(submitStateAtom)).toBe("prices-error");
    // Hold the retry response so the loading state is observable (Query notifies async).
    let release = () => {};
    fetchMock.mockImplementationOnce(
      () => new Promise<Response>((r) => (release = () => r(ok()))),
    );
    s.set(retryPricesAtom);
    await waitFor(s, "loading");
    release();
    await waitFor(s, "ready");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe("amounts", () => {
  it("sell drives buy; buy drives sell; clearing clears both", async () => {
    const s = await ready();
    s.set(setAmountAtom, "sell", "1");
    expect(s.get(amountsAtom)).toEqual({ sell: "1", buy: "2000" });
    s.set(setAmountAtom, "buy", "1000");
    expect(s.get(amountsAtom)).toEqual({ sell: "0.5", buy: "1000" });
    s.set(setAmountAtom, "buy", "");
    expect(s.get(amountsAtom)).toEqual({ sell: "", buy: "" });
  });

  it("sanitises and keeps the typed text as typed", async () => {
    const s = await ready();
    s.set(setAmountAtom, "sell", "01,5x");
    expect(s.get(amountsAtom).sell).toBe("01.5");
  });

  it("no quote without a buy token or with amount 0", async () => {
    const s = await ready();
    s.set(setAmountAtom, "sell", "0");
    expect(s.get(quoteAtom)).toBeNull();
    s.set(buyTokenAtom, null);
    s.set(setAmountAtom, "sell", "1");
    expect(s.get(quoteAtom)).toBeNull();
    expect(s.get(amountsAtom).buy).toBe("");
  });

  it("reset clears amounts, keeps tokens", async () => {
    const s = await ready();
    s.set(setAmountAtom, "buy", "5");
    s.set(resetAmountsAtom);
    expect(s.get(amountsAtom)).toEqual({ sell: "", buy: "" });
    expect([s.get(sellTokenAtom), s.get(buyTokenAtom)]).toEqual([
      "ETH",
      "USDC",
    ]);
  });
});

describe("tokens", () => {
  it("flip swaps tokens and the typed amount moves with its token", async () => {
    const s = await ready();
    s.set(setAmountAtom, "sell", "1");
    s.set(flipAtom);
    expect([s.get(sellTokenAtom), s.get(buyTokenAtom)]).toEqual([
      "USDC",
      "ETH",
    ]);
    expect(s.get(amountsAtom)).toEqual({ sell: "2000", buy: "1" });
  });

  it("picking the other side's token swaps sides and closes the picker", async () => {
    const s = await ready();
    s.set(pickerSideAtom, "sell");
    s.set(pickTokenAtom, "sell", "USDC");
    expect([s.get(sellTokenAtom), s.get(buyTokenAtom)]).toEqual([
      "USDC",
      "ETH",
    ]);
    expect(s.get(pickerSideAtom)).toBeNull();
  });
});

describe("debounce", () => {
  afterEach(() => vi.useRealTimers());

  it("each store debounces on its own", () => {
    vi.useFakeTimers();
    const a = freshStore();
    const b = freshStore();
    a.set(setAmountAtom, "sell", "1");
    b.set(setAmountAtom, "sell", "2"); // must not cancel a's timer
    vi.advanceTimersByTime(300);
    expect(a.get(debouncedTypedAmountAtom)).toBe("1");
    expect(b.get(debouncedTypedAmountAtom)).toBe("2");
  });
});

describe("presets", () => {
  it.each([
    [25, "0.375"],
    [50, "0.75"],
    [75, "1.125"],
    [100, "1.5"],
  ])("%i%% fills %s, exact-in", async (p, expected) => {
    const s = await ready();
    s.set(setAmountAtom, "buy", "7");
    s.set(setPresetAtom, p);
    expect(s.get(amountsAtom)).toEqual({
      sell: expected,
      buy: String(Number(expected) * 2000),
    });
  });
});

describe("slippage", () => {
  it.each([
    ["", 0.5, null],
    ["0", 0.5, null],
    ["5.5", 5.5, null],
    ["5.51", 5.51, "high"],
    ["19.99", 19.99, "high"],
    ["20", 20, "very-high"],
  ])("input %j → %f, %s", (input, value, level) => {
    const s = freshStore();
    s.set(slippageInputAtom, input);
    expect(s.get(slippageAtom)).toBe(value);
    expect(s.get(slippageLevelAtom)).toBe(level);
  });

  it("min received 1990 on Auto, 1980 at 1%, also exact-out", async () => {
    const s = await ready();
    s.set(setAmountAtom, "sell", "1");
    expect(s.get(minReceivedAtom)).toBeCloseTo(1990);
    s.set(slippageInputAtom, "1");
    expect(s.get(minReceivedAtom)).toBeCloseTo(1980);
    s.set(setAmountAtom, "buy", "2000");
    expect(s.get(minReceivedAtom)).toBeCloseTo(1980);
  });
});

describe("submit state", () => {
  it("select-token → enter-amount (empty, 0, .) → connect → insufficient → ready", async () => {
    const s = await ready(false);
    s.set(buyTokenAtom, null);
    expect(s.get(submitStateAtom)).toBe("select-token");
    s.set(buyTokenAtom, "USDC");
    for (const v of ["", "0", "."]) {
      s.set(setAmountAtom, "sell", v);
      expect(s.get(submitStateAtom)).toBe("enter-amount");
    }
    s.set(setAmountAtom, "sell", "2");
    expect(s.get(submitStateAtom)).toBe("connect"); // connect wins over insufficient
    s.set(connectAtom);
    expect(s.get(submitStateAtom)).toBe("insufficient");
    expect(s.get(insufficientAtom)).toBe(true);
    s.set(setAmountAtom, "sell", "1.5"); // equal to balance is fine
    expect(s.get(submitStateAtom)).toBe("ready");
    expect(s.get(insufficientAtom)).toBe(false);
  });

  it("exact-out: buy amount needing more than the balance is insufficient", async () => {
    const s = await ready();
    s.set(setAmountAtom, "buy", "4000"); // needs 2 ETH
    expect(s.get(insufficientAtom)).toBe(true);
    expect(s.get(submitStateAtom)).toBe("insufficient");
  });

  it("exact-out compares the quoted sell amount, not the typed buy amount", async () => {
    const s = await ready();
    s.set(setAmountAtom, "buy", "100"); // needs 0.05 of 1.5 ETH
    expect(s.get(insufficientAtom)).toBe(false);
  });

  it("insufficient compares exactly at the balance edge", async () => {
    const s = await ready();
    s.set(setAmountAtom, "sell", "1.50000000");
    expect(s.get(insufficientAtom)).toBe(false);
    s.set(setAmountAtom, "sell", "1.50000001");
    expect(s.get(insufficientAtom)).toBe(true);
  });

  it("insufficient uses the sell token balance", async () => {
    const s = await ready();
    s.set(pickTokenAtom, "sell", "SWTH");
    s.set(pickTokenAtom, "buy", "ETH");
    s.set(setAmountAtom, "sell", "250001");
    expect(s.get(submitStateAtom)).toBe("insufficient");
  });
});

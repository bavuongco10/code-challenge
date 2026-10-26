import { atom } from "jotai";
import { atomWithQuery, queryClientAtom } from "jotai-tanstack-query";

import { fetchPrices } from "./api/fetchPrices.ts";
import { AUTO_SLIPPAGE, DEFAULT_DEADLINE, DEFAULT_SELL } from "./constants.ts";
import { sanitizeAmount, toNumber } from "./lib/amount.ts";
import { convert, minReceived } from "./lib/convert.ts";
import { formatAmount, formatBalance } from "./lib/format.ts";
import type {
  Prices,
  Quote,
  Side,
  SlippageLevel,
  SubmitState,
  Toast,
} from "./types.ts";
import { balancesAtom, connectedAtom } from "./walletAtoms.ts";

// ---- Prices ----

type PricesState =
  | { state: "loading" }
  | { state: "error" }
  | { state: "ready"; prices: Prices };

// TanStack Query owns fetching/caching; jotai-tanstack-query exposes it as an atom.
// No auto-retry: the UI shows an error with a manual Retry button instead.
const PRICES_KEY = ["prices"];
const pricesQueryAtom = atomWithQuery(() => ({
  queryKey: PRICES_KEY,
  queryFn: ({ signal }) => fetchPrices(signal),
  retry: false,
}));

// A refetch after an error shows "loading" again, not the stale error.
export const pricesAtom = atom((get): PricesState => {
  const q = get(pricesQueryAtom);
  if (q.data) return { state: "ready", prices: q.data };
  if (q.isError && !q.isFetching) return { state: "error" };
  return { state: "loading" };
});

// The query atom's own setter only re-reads the cache; refetch goes through the client.
export const retryPricesAtom = atom(null, (get) => {
  void get(queryClientAtom).refetchQueries({ queryKey: PRICES_KEY });
});

const readyPricesAtom = atom((get) => {
  const p = get(pricesAtom);
  return p.state === "ready" ? p.prices : null;
});

export const tokensAtom = atom((get) =>
  Object.keys(get(readyPricesAtom) ?? {}).sort(),
);

// ---- Tokens and amounts ----

export const sellTokenAtom = atom<string | null>(DEFAULT_SELL);
export const buyTokenAtom = atom<string | null>(null);
export const typedSideAtom = atom<Side>("sell");
export const typedAmountAtom = atom("");
export const pickerSideAtom = atom<Side | null>(null);

const other = (s: Side): Side => (s === "sell" ? "buy" : "sell");

export const quoteAtom = atom((get): Quote | null => {
  const prices = get(readyPricesAtom);
  const sell = get(sellTokenAtom);
  const buy = get(buyTokenAtom);
  const amount = toNumber(get(typedAmountAtom));
  if (!prices || !sell || !buy || amount <= 0) return null;
  const ps = prices[sell];
  const pb = prices[buy];
  if (!ps || !pb) return null;
  const exactIn = get(typedSideAtom) === "sell";
  return {
    sell,
    buy,
    sellAmount: exactIn ? amount : convert(amount, pb, ps),
    buyAmount: exactIn ? convert(amount, ps, pb) : amount,
    rate: ps / pb,
  };
});

export const amountsAtom = atom((get) => {
  const side = get(typedSideAtom);
  const quote = get(quoteAtom);
  const computed = quote
    ? formatAmount(side === "sell" ? quote.buyAmount : quote.sellAmount)
    : "";
  const typed = get(typedAmountAtom);
  return side === "sell"
    ? { sell: typed, buy: computed }
    : { sell: computed, buy: typed };
});

export const setAmountAtom = atom(
  null,
  (_get, set, side: Side, raw: string) => {
    set(typedSideAtom, side);
    set(typedAmountAtom, sanitizeAmount(raw));
  },
);

export const setPresetAtom = atom(null, (get, set, percent: number) => {
  const sell = get(sellTokenAtom);
  const balance = sell ? (get(balancesAtom)?.[sell] ?? 0) : 0;
  set(typedSideAtom, "sell");
  set(typedAmountAtom, formatBalance((balance * percent) / 100));
});

export const flipAtom = atom(null, (get, set) => {
  const sell = get(sellTokenAtom);
  set(sellTokenAtom, get(buyTokenAtom));
  set(buyTokenAtom, sell);
  set(typedSideAtom, other(get(typedSideAtom)));
});

export const pickTokenAtom = atom(
  null,
  (get, set, side: Side, symbol: string) => {
    const tokenAtom = side === "sell" ? sellTokenAtom : buyTokenAtom;
    const otherAtom = side === "sell" ? buyTokenAtom : sellTokenAtom;
    if (get(otherAtom) === symbol) set(flipAtom);
    else set(tokenAtom, symbol);
    set(pickerSideAtom, null);
  },
);

export const resetAmountsAtom = atom(null, (_get, set) => {
  set(typedSideAtom, "sell");
  set(typedAmountAtom, "");
});

// ---- Settings ----

export const slippageInputAtom = atom(""); // "" = Auto
export const slippageAtom = atom(
  (get) => toNumber(get(slippageInputAtom)) || AUTO_SLIPPAGE,
);
export const slippageLevelAtom = atom((get): SlippageLevel => {
  const s = get(slippageAtom);
  if (s >= 20) return "very-high";
  return s > 5.5 ? "high" : null;
});
export const deadlineInputAtom = atom(String(DEFAULT_DEADLINE));

export const minReceivedAtom = atom((get) => {
  const q = get(quoteAtom);
  return q ? minReceived(q.buyAmount, get(slippageAtom)) : null;
});

// ---- Validation ----

export const insufficientAtom = atom((get) => {
  const q = get(quoteAtom);
  const balances = get(balancesAtom);
  return !!q && !!balances && q.sellAmount > (balances[q.sell] ?? 0);
});

// Rows from plan.md → Validation, first match wins.
export const submitStateAtom = atom((get): SubmitState => {
  if (!get(readyPricesAtom)) return "loading-prices";
  if (!get(sellTokenAtom) || !get(buyTokenAtom)) return "select-token";
  if (!get(quoteAtom)) return "enter-amount";
  if (!get(connectedAtom)) return "connect";
  if (get(insufficientAtom)) return "insufficient";
  return "ready";
});

// ---- Review / toast ----

export const reviewOpenAtom = atom(false);
export const toastAtom = atom<Toast>(null);

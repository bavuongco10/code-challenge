import { atom, getDefaultStore } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { atomWithQuery, queryClientAtom } from "jotai-tanstack-query";
import { formatUnits } from "viem";

import { fetchPrices } from "./api/fetchPrices.ts";
import {
  AUTO_SLIPPAGE,
  DEFAULT_DEADLINE,
  DEFAULT_SELL,
  TOUR_KEY,
} from "./constants.ts";
import { sanitizeAmount, toNumber } from "./lib/amount.ts";
import { convert, minReceived } from "./lib/convert.ts";
import { formatAmount } from "./lib/format.ts";
import {
  fetchUniswapV3Quote,
  type SepoliaQuoteResult,
} from "./sepolia/sepoliaQueryAtoms.ts";
import { isWrongChainAtom } from "./sepolia/sepoliaWalletAtoms.ts";
import {
  checkGasReserve,
  GAS_RESERVE_WEI,
  isSepoliaToken,
  SEPOLIA_TOKENS,
  toRawUnits,
} from "./sepolia/tokens.ts";
import type {
  Prices,
  Quote,
  Side,
  SlippageLevel,
  SubmitState,
  Toast,
} from "./types.ts";
import {
  connectedAtom,
  exactBalancesAtom,
  registerModeChangeCallback,
  walletModeAtom,
} from "./walletAtoms.ts";

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

export const isPricesErrorAtom = atom(
  (get) => get(pricesAtom).state === "error",
);

// The query atom's own setter only re-reads the cache; refetch goes through the client.
export const retryPricesAtom = atom(null, (get) => {
  void get(queryClientAtom).refetchQueries({ queryKey: PRICES_KEY });
});

const readyPricesAtom = atom((get) => {
  const p = get(pricesAtom);
  return p.state === "ready" ? p.prices : null;
});

export const tokensAtom = atom((get) => {
  const mode = get(walletModeAtom);
  if (mode === "sepolia") {
    return SEPOLIA_TOKENS.map((t) => t.symbol);
  }
  return Object.keys(get(readyPricesAtom) ?? {}).sort();
});

// ---- Tokens and amounts ----

export const sellTokenAtom = atom<string | null>(DEFAULT_SELL);
export const buyTokenAtom = atom<string | null>(null);
export const typedSideAtom = atom<Side>("sell");
export const typedAmountAtom = atom("");
export const debouncedTypedAmountAtom = atom("");
export const pickerSideAtom = atom<Side | null>(null);

// Timer lives in an atom, so each store has its own debounce.
const debounceTimerAtom = atom<ReturnType<typeof setTimeout> | undefined>();
const cancelDebounceAtom = atom(null, (get, set) => {
  clearTimeout(get(debounceTimerAtom));
  set(debounceTimerAtom, undefined);
});

// Register mode switch reset callback
registerModeChangeCallback((mode) => {
  try {
    const store = getDefaultStore();
    const sell = store.get(sellTokenAtom);
    const buy = store.get(buyTokenAtom);
    if (mode === "sepolia") {
      if (!sell || !isSepoliaToken(sell)) store.set(sellTokenAtom, "ETH");
      if (buy && !isSepoliaToken(buy)) store.set(buyTokenAtom, null);
    }
  } catch {
    // In test stores where getDefaultStore isn't the active store
  }
});

const other = (s: Side): Side => (s === "sell" ? "buy" : "sell");

// ---- Sepolia On-Chain Quotes Query ----
const sepoliaQuoteQueryAtom = atomWithQuery((get) => {
  const mode = get(walletModeAtom);
  const sell = get(sellTokenAtom);
  const buy = get(buyTokenAtom);
  const side = get(typedSideAtom);
  const amount = toNumber(get(debouncedTypedAmountAtom));
  const reviewOpen = get(reviewOpenAtom);

  const enabled =
    mode === "sepolia" &&
    Boolean(sell) &&
    Boolean(buy) &&
    amount > 0 &&
    sell !== buy;

  return {
    queryKey: ["sepolia-quote", sell ?? "none", buy ?? "none", side, amount],
    queryFn: async (): Promise<SepoliaQuoteResult> => {
      if (!sell || !buy || amount <= 0) return { state: "idle" };
      const res = await fetchUniswapV3Quote(sell, buy, side === "sell", amount);
      if ("noRoute" in res) {
        return { state: "no-route" };
      }
      return { state: "ready", quote: res.quote };
    },
    enabled,
    staleTime: 10_000,
    refetchInterval: reviewOpen ? 15_000 : false,
  };
});

export const quoteAtom = atom((get): Quote | null => {
  const mode = get(walletModeAtom);
  const sell = get(sellTokenAtom);
  const buy = get(buyTokenAtom);
  const amount = toNumber(get(typedAmountAtom));
  if (!sell || !buy || amount <= 0) return null;

  if (mode === "sepolia") {
    // For ETH <-> WETH 1:1 conversion, return immediately
    if (
      (sell === "ETH" && buy === "WETH") ||
      (sell === "WETH" && buy === "ETH")
    ) {
      return {
        sell,
        buy,
        sellAmount: amount,
        buyAmount: amount,
        rate: 1,
      };
    }
    const q = get(sepoliaQuoteQueryAtom);
    if (q.data && q.data.state === "ready") {
      return q.data.quote;
    }
    return null;
  }

  // Demo mode
  const prices = get(readyPricesAtom);
  if (!prices) return null;
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

export const sellAmountAtom = atom((get) => get(amountsAtom).sell);
export const buyAmountAtom = atom((get) => get(amountsAtom).buy);
export const sideAmountAtom = (side: Side) =>
  side === "sell" ? sellAmountAtom : buyAmountAtom;

export const setAmountAtom = atom(
  null,
  (_get, set, side: Side, raw: string) => {
    set(typedSideAtom, side);
    const sanitized = sanitizeAmount(raw);
    set(typedAmountAtom, sanitized);

    set(cancelDebounceAtom);
    if (sanitized === "" || toNumber(sanitized) <= 0) {
      set(debouncedTypedAmountAtom, sanitized);
    } else {
      set(
        debounceTimerAtom,
        setTimeout(() => set(debouncedTypedAmountAtom, sanitized), 300),
      );
    }
  },
);

export const setPresetAtom = atom(null, (get, set, percent: number) => {
  set(cancelDebounceAtom);
  const sell = get(sellTokenAtom);
  const balance = toRawUnits(
    (sell && get(exactBalancesAtom)?.[sell]) || "0",
    18,
  );
  set(typedSideAtom, "sell");

  let amount = (balance * BigInt(percent)) / 100n;
  if (get(walletModeAtom) === "sepolia" && percent === 100 && sell === "ETH") {
    amount -= GAS_RESERVE_WEI;
  }

  // Floor to the 8-decimal input cap, so Max never exceeds the balance.
  const formatted = amount > 0n ? formatUnits(amount / 10n ** 10n, 8) : "0";
  set(typedAmountAtom, formatted);
  set(debouncedTypedAmountAtom, formatted);
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
  set(cancelDebounceAtom);
  set(typedSideAtom, "sell");
  set(typedAmountAtom, "");
  set(debouncedTypedAmountAtom, "");
});

// ---- Settings ----

export const slippageInputAtom = atom(""); // "" = Auto
export const isCustomSlippageAtom = atom(
  (get) => get(slippageInputAtom) !== "",
);
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

// Exact compare in 18-decimal units: the sell amount shown (typed, or quoted in
// exact-out) against the balance string. No floats.
const units = (s = "0") => toRawUnits(s, 18);

export const gasShortAtom = atom((get) => {
  if (get(walletModeAtom) !== "sepolia") return false;
  const sell = get(sellTokenAtom);
  const balances = get(exactBalancesAtom);
  if (!sell || !balances) return false;
  const amount = units(get(sellAmountAtom));
  return checkGasReserve(sell, amount, units(balances.ETH)).isGasShort;
});

export const insufficientAtom = atom((get) => {
  const sell = get(sellTokenAtom);
  const balances = get(exactBalancesAtom);
  const amount = units(get(sellAmountAtom));
  if (!sell || !balances || amount <= 0n) return false;
  return amount > units(balances[sell]) || get(gasShortAtom);
});

const falseAtom = atom(false);
export const sideInsufficientAtom = (side: Side) =>
  side === "sell" ? insufficientAtom : falseAtom;

// Rows from plan.md → Validation, first match wins.
export const submitStateAtom = atom((get): SubmitState => {
  const prices = get(pricesAtom).state;
  if (prices === "error") return "prices-error";
  if (prices === "loading") return "loading-prices";
  if (!get(sellTokenAtom) || !get(buyTokenAtom)) return "select-token";
  const amount = toNumber(get(typedAmountAtom));
  if (amount <= 0) return "enter-amount";
  if (!get(connectedAtom)) return "connect";

  const mode = get(walletModeAtom);
  if (mode === "sepolia") {
    if (get(isWrongChainAtom)) return "wrong-chain";

    const isWrap =
      (get(sellTokenAtom) === "ETH" && get(buyTokenAtom) === "WETH") ||
      (get(sellTokenAtom) === "WETH" && get(buyTokenAtom) === "ETH");

    if (!isWrap) {
      const q = get(sepoliaQuoteQueryAtom);
      if (q.isFetching || q.isLoading) return "quoting";
      if (q.isError || (q.data && q.data.state === "no-route")) {
        return "no-route";
      }
    }
  }

  if (get(insufficientAtom)) return "insufficient";
  if (!get(quoteAtom)) return "enter-amount";
  return "ready";
});

// ---- Review / toast ----

export const reviewOpenAtom = atom(false);
export const toastAtom = atom<Toast>(null);

// ---- Guided tour ----

// Auto-runs on first visit; the header "?" button replays it.
export const tourDoneAtom = atomWithStorage(TOUR_KEY, false, undefined, {
  getOnInit: true,
});

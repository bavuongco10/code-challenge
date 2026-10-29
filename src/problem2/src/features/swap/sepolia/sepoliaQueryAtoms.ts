import { atom } from "jotai";
import { atomWithQuery, queryClientAtom } from "jotai-tanstack-query";
import { formatUnits, type Address } from "viem";

import {
  QUOTER_V2_ADDRESS,
  SWAP_ROUTER_02_ADDRESS,
  UNI_ADDRESS,
  USDC_ADDRESS,
  WETH_ADDRESS,
} from "../constants.ts";
import { formatAmount } from "../lib/format.ts";
import type { Quote } from "../types.ts";
import { erc20Abi, quoterV2Abi } from "./abis.ts";
import { loadAppKit, sepoliaAddressAtom } from "./sepoliaWalletAtoms.ts";
import { findSepoliaToken, fromRawUnits, toRawUnits } from "./tokens.ts";

export const FEE_TIERS = [500, 3000, 10000] as const;

// Trigger for invalidating queries
export const sepoliaInvalidateAtom = atom(null, (get) => {
  const qc = get(queryClientAtom);
  void qc.invalidateQueries({ queryKey: ["sepolia-balances"] });
  void qc.invalidateQueries({ queryKey: ["sepolia-quote"] });
  void qc.invalidateQueries({ queryKey: ["sepolia-allowance"] });
});

// ---- Balances Query ----
export const sepoliaBalancesQueryAtom = atomWithQuery((get) => {
  const address = get(sepoliaAddressAtom);
  return {
    queryKey: ["sepolia-balances", address?.toLowerCase() ?? "none"],
    queryFn: async (): Promise<Record<string, string>> => {
      if (!address) return {};
      const { wagmiConfig } = await loadAppKit();
      const { getBalance, readContracts } = await import("wagmi/actions");

      const ethPromise = getBalance(wagmiConfig, {
        address: address as Address,
      }).catch(() => null);

      const contracts = [
        {
          address: WETH_ADDRESS as Address,
          abi: erc20Abi,
          functionName: "balanceOf",
          args: [address as Address],
        },
        {
          address: USDC_ADDRESS as Address,
          abi: erc20Abi,
          functionName: "balanceOf",
          args: [address as Address],
        },
        {
          address: UNI_ADDRESS as Address,
          abi: erc20Abi,
          functionName: "balanceOf",
          args: [address as Address],
        },
      ] as const;

      const [ethBal, erc20Results] = await Promise.all([
        ethPromise,
        readContracts(wagmiConfig, { contracts }).catch(() => null),
      ]);

      // Exact decimal strings, no float rounding
      const result: Record<string, string> = {
        ETH: ethBal ? formatUnits(ethBal.value, 18) : "0",
        WETH: "0",
        USDC: "0",
        UNI: "0",
      };

      if (erc20Results && Array.isArray(erc20Results)) {
        if (erc20Results[0]?.status === "success") {
          result.WETH = formatUnits(erc20Results[0].result as bigint, 18);
        }
        if (erc20Results[1]?.status === "success") {
          result.USDC = formatUnits(erc20Results[1].result as bigint, 6);
        }
        if (erc20Results[2]?.status === "success") {
          result.UNI = formatUnits(erc20Results[2].result as bigint, 18);
        }
      }

      return result;
    },
    enabled: Boolean(address),
    staleTime: 10_000,
  };
});

// ---- Allowance Query ----
export const sepoliaAllowanceQueryAtom = (
  tokenSymbol: string | null,
  ownerAddress: string | null,
) =>
  atomWithQuery(() => ({
    queryKey: [
      "sepolia-allowance",
      tokenSymbol ?? "none",
      ownerAddress?.toLowerCase() ?? "none",
    ],
    queryFn: async (): Promise<bigint> => {
      if (!tokenSymbol || !ownerAddress) return 0n;
      const token = findSepoliaToken(tokenSymbol);
      if (!token || token.address === "native") {
        return 2n ** 256n - 1n; // Native ETH doesn't need ERC20 allowance
      }
      const { wagmiConfig } = await loadAppKit();
      const { readContract } = await import("wagmi/actions");

      try {
        const allowance = await readContract(wagmiConfig, {
          address: token.address,
          abi: erc20Abi,
          functionName: "allowance",
          args: [ownerAddress as Address, SWAP_ROUTER_02_ADDRESS as Address],
        });
        return allowance as bigint;
      } catch {
        return 0n;
      }
    },
    enabled: Boolean(tokenSymbol && ownerAddress && tokenSymbol !== "ETH"),
    staleTime: 5_000,
  }));

// Helper to resolve ERC20 address for quote (native ETH wraps to WETH)
export function getUniswapTokenAddress(symbol: string): Address | null {
  if (symbol === "ETH") return WETH_ADDRESS as Address;
  const t = findSepoliaToken(symbol);
  return t && t.address !== "native" ? t.address : null;
}

export type SepoliaQuoteResult =
  | { state: "ready"; quote: Quote }
  | { state: "no-route" }
  | { state: "loading" }
  | { state: "idle" };

export async function fetchUniswapV3Quote(
  sellSymbol: string,
  buySymbol: string,
  exactIn: boolean,
  amount: number,
): Promise<{ quote: Quote } | { noRoute: true }> {
  // Wrap / unwrap between ETH and WETH
  if (
    (sellSymbol === "ETH" && buySymbol === "WETH") ||
    (sellSymbol === "WETH" && buySymbol === "ETH")
  ) {
    const raw = toRawUnits(amount, 18);
    return {
      quote: {
        sell: sellSymbol,
        buy: buySymbol,
        sellAmount: amount,
        buyAmount: amount,
        rate: 1,
        sellRaw: raw,
        buyRaw: raw,
      },
    };
  }

  const sellToken = findSepoliaToken(sellSymbol);
  const buyToken = findSepoliaToken(buySymbol);
  const tokenIn = getUniswapTokenAddress(sellSymbol);
  const tokenOut = getUniswapTokenAddress(buySymbol);

  if (!sellToken || !buyToken || !tokenIn || !tokenOut) {
    return { noRoute: true };
  }

  const { wagmiConfig } = await loadAppKit();
  const { readContract } = await import("wagmi/actions");

  if (exactIn) {
    const amountInRaw = toRawUnits(amount, sellToken.decimals);
    if (amountInRaw <= 0n) return { noRoute: true };

    const quotes = await Promise.allSettled(
      FEE_TIERS.map(async (fee) => {
        const res = (await readContract(wagmiConfig, {
          address: QUOTER_V2_ADDRESS as Address,
          abi: quoterV2Abi,
          functionName: "quoteExactInputSingle",
          args: [
            {
              tokenIn,
              tokenOut,
              amountIn: amountInRaw,
              fee,
              sqrtPriceLimitX96: 0n,
            },
          ],
        })) as [bigint, bigint, number, bigint];
        return { fee, amountOutRaw: res[0] };
      }),
    );

    let best: { fee: number; amountOutRaw: bigint } | null = null;
    for (const q of quotes) {
      if (q.status === "fulfilled" && q.value.amountOutRaw > 0n) {
        if (!best || q.value.amountOutRaw > best.amountOutRaw) {
          best = q.value;
        }
      }
    }

    if (!best) return { noRoute: true };

    const buyAmount = fromRawUnits(best.amountOutRaw, buyToken.decimals);
    const rate = amount > 0 ? buyAmount / amount : 0;

    return {
      quote: {
        sell: sellSymbol,
        buy: buySymbol,
        sellAmount: amount,
        buyAmount,
        rate,
        sellRaw: amountInRaw,
        buyRaw: best.amountOutRaw,
        fee: best.fee,
      },
    };
  } else {
    // Exact output
    const amountOutRaw = toRawUnits(amount, buyToken.decimals);
    if (amountOutRaw <= 0n) return { noRoute: true };

    const quotes = await Promise.allSettled(
      FEE_TIERS.map(async (fee) => {
        const res = (await readContract(wagmiConfig, {
          address: QUOTER_V2_ADDRESS as Address,
          abi: quoterV2Abi,
          functionName: "quoteExactOutputSingle",
          args: [
            {
              tokenIn,
              tokenOut,
              amount: amountOutRaw,
              fee,
              sqrtPriceLimitX96: 0n,
            },
          ],
        })) as [bigint, bigint, number, bigint];
        return { fee, amountInRaw: res[0] };
      }),
    );

    let best: { fee: number; amountInRaw: bigint } | null = null;
    for (const q of quotes) {
      if (q.status === "fulfilled" && q.value.amountInRaw > 0n) {
        if (!best || q.value.amountInRaw < best.amountInRaw) {
          best = q.value;
        }
      }
    }

    if (!best) return { noRoute: true };

    const sellAmount = fromRawUnits(best.amountInRaw, sellToken.decimals);
    const rate = sellAmount > 0 ? amount / sellAmount : 0;

    return {
      quote: {
        sell: sellSymbol,
        buy: buySymbol,
        sellAmount,
        buyAmount: amount,
        rate,
        sellRaw: best.amountInRaw,
        buyRaw: amountOutRaw,
        fee: best.fee,
      },
    };
  }
}

// Gas cost calculation: estimateGas × maxFeePerGas
export async function fetchNetworkCost(): Promise<string> {
  try {
    const { wagmiConfig } = await loadAppKit();
    const { estimateFeesPerGas } = await import("wagmi/actions");
    const fees = await estimateFeesPerGas(wagmiConfig);
    const gasPrice = fees.maxFeePerGas ?? fees.gasPrice ?? 20_000_000_000n; // fallback 20 gwei
    // Standard Uniswap swap takes ~150k gas, approval takes ~45k gas
    const estimatedGas = 180_000n;
    const costWei = estimatedGas * gasPrice;
    const costEth = fromRawUnits(costWei, 18);
    if (costEth < 0.001) return "<0.001 ETH";
    return `${formatAmount(costEth)} ETH`;
  } catch {
    return "<0.001 ETH";
  }
}

import { encodeFunctionData, type Address, type Hex } from "viem";

import { SWAP_ROUTER_02_ADDRESS, WETH_ADDRESS } from "../constants.ts";
import type { Quote } from "../types.ts";
import { swapRouter02Abi, wethAbi } from "./abis.ts";
import { getUniswapTokenAddress } from "./sepoliaQueryAtoms.ts";

export type BuildSwapParams = {
  quote: Quote;
  slippagePct: number;
  deadlineMinutes: number;
  userAddress: Address;
};

export type BuiltSwap = {
  to: Address;
  data: Hex;
  value: bigint;
};

export function calculateSlippageLimits(
  _exactIn: boolean,
  sellRaw: bigint,
  buyRaw: bigint,
  slippagePct: number,
): { amountOutMinimum: bigint; amountInMaximum: bigint } {
  // slippage in basis points: 0.5% = 50 bps, 100% = 10000 bps
  const bps = BigInt(Math.max(0, Math.round(slippagePct * 100)));
  const outMin = (buyRaw * (10000n - bps)) / 10000n;
  const inMax = (sellRaw * (10000n + bps)) / 10000n;
  return {
    amountOutMinimum: outMin > 0n ? outMin : 0n,
    amountInMaximum: inMax,
  };
}

export function buildSwap({
  quote,
  slippagePct,
  deadlineMinutes,
  userAddress,
}: BuildSwapParams): BuiltSwap {
  const { sell, buy, fee = 3000 } = quote;
  const sellRaw = quote.sellRaw ?? 0n;
  const buyRaw = quote.buyRaw ?? 0n;

  // 1. ETH -> WETH Wrap
  if (sell === "ETH" && buy === "WETH") {
    const data = encodeFunctionData({
      abi: wethAbi,
      functionName: "deposit",
    });
    return {
      to: WETH_ADDRESS as Address,
      data,
      value: sellRaw,
    };
  }

  // 2. WETH -> ETH Unwrap
  if (sell === "WETH" && buy === "ETH") {
    const data = encodeFunctionData({
      abi: wethAbi,
      functionName: "withdraw",
      args: [sellRaw],
    });
    return {
      to: WETH_ADDRESS as Address,
      data,
      value: 0n,
    };
  }

  const tokenIn = getUniswapTokenAddress(sell);
  const tokenOut = getUniswapTokenAddress(buy);

  if (!tokenIn || !tokenOut) {
    throw new Error(`Cannot build swap for pair ${sell} -> ${buy}`);
  }

  const exactIn = quote.fee !== undefined ? true : true; // default exactIn if fee exists
  const { amountOutMinimum } = calculateSlippageLimits(
    exactIn,
    sellRaw,
    buyRaw,
    slippagePct,
  );

  const deadline = BigInt(
    Math.floor(Date.now() / 1000) + Math.max(1, deadlineMinutes) * 60,
  );

  const calls: Hex[] = [];
  let value = 0n;

  if (sell === "ETH") {
    // ETH -> Token
    calls.push(
      encodeFunctionData({
        abi: swapRouter02Abi,
        functionName: "exactInputSingle",
        args: [
          {
            tokenIn: WETH_ADDRESS as Address,
            tokenOut,
            fee,
            recipient: userAddress,
            amountIn: sellRaw,
            amountOutMinimum,
            sqrtPriceLimitX96: 0n,
          },
        ],
      }),
    );
    value = sellRaw;
  } else if (buy === "ETH") {
    // Token -> ETH: recipient of router, unwrap to user
    calls.push(
      encodeFunctionData({
        abi: swapRouter02Abi,
        functionName: "exactInputSingle",
        args: [
          {
            tokenIn,
            tokenOut: WETH_ADDRESS as Address,
            fee,
            recipient: SWAP_ROUTER_02_ADDRESS as Address,
            amountIn: sellRaw,
            amountOutMinimum,
            sqrtPriceLimitX96: 0n,
          },
        ],
      }),
    );
    calls.push(
      encodeFunctionData({
        abi: swapRouter02Abi,
        functionName: "unwrapWETH9",
        args: [amountOutMinimum, userAddress],
      }),
    );
  } else {
    // Token -> Token
    calls.push(
      encodeFunctionData({
        abi: swapRouter02Abi,
        functionName: "exactInputSingle",
        args: [
          {
            tokenIn,
            tokenOut,
            fee,
            recipient: userAddress,
            amountIn: sellRaw,
            amountOutMinimum,
            sqrtPriceLimitX96: 0n,
          },
        ],
      }),
    );
  }

  const data = encodeFunctionData({
    abi: swapRouter02Abi,
    functionName: "multicall",
    args: [deadline, calls],
  });

  return {
    to: SWAP_ROUTER_02_ADDRESS as Address,
    data,
    value,
  };
}

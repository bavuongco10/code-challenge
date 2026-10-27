import { decodeFunctionData, type Hex } from "viem";
import { describe, expect, it } from "vitest";

import {
  SWAP_ROUTER_02_ADDRESS,
  USDC_ADDRESS,
  WETH_ADDRESS,
} from "../constants.ts";
import { swapRouter02Abi, wethAbi } from "./abis.ts";
import { buildSwap, calculateSlippageLimits } from "./buildSwap.ts";

const USER_ADDR = "0x1111111111111111111111111111111111111111" as const;

describe("buildSwap", () => {
  it("calculates slippage limits correctly", () => {
    // 0.5% slippage on 1000 buyRaw -> min 995
    const limits = calculateSlippageLimits(true, 100n, 1000n, 0.5);
    expect(limits.amountOutMinimum).toBe(995n);
    expect(limits.amountInMaximum).toBe(100n);
  });

  it("builds ETH -> WETH wrap transaction", () => {
    const swap = buildSwap({
      quote: {
        sell: "ETH",
        buy: "WETH",
        sellAmount: 1,
        buyAmount: 1,
        rate: 1,
        sellRaw: 1000000000000000000n,
        buyRaw: 1000000000000000000n,
      },
      slippagePct: 0.5,
      deadlineMinutes: 30,
      userAddress: USER_ADDR,
    });

    expect(swap.to.toLowerCase()).toBe(WETH_ADDRESS.toLowerCase());
    expect(swap.value).toBe(1000000000000000000n);

    const decoded = decodeFunctionData({
      abi: wethAbi,
      data: swap.data,
    });
    expect(decoded.functionName).toBe("deposit");
  });

  it("builds WETH -> ETH unwrap transaction", () => {
    const swap = buildSwap({
      quote: {
        sell: "WETH",
        buy: "ETH",
        sellAmount: 1,
        buyAmount: 1,
        rate: 1,
        sellRaw: 1000000000000000000n,
        buyRaw: 1000000000000000000n,
      },
      slippagePct: 0.5,
      deadlineMinutes: 30,
      userAddress: USER_ADDR,
    });

    expect(swap.to.toLowerCase()).toBe(WETH_ADDRESS.toLowerCase());
    expect(swap.value).toBe(0n);

    const decoded = decodeFunctionData({
      abi: wethAbi,
      data: swap.data,
    });
    expect(decoded.functionName).toBe("withdraw");
    expect(decoded.args).toEqual([1000000000000000000n]);
  });

  it("builds ETH -> USDC swap multicall with exactInputSingle", () => {
    const swap = buildSwap({
      quote: {
        sell: "ETH",
        buy: "USDC",
        sellAmount: 1,
        buyAmount: 2000,
        rate: 2000,
        sellRaw: 1000000000000000000n,
        buyRaw: 2000000000n,
        fee: 3000,
      },
      slippagePct: 0.5,
      deadlineMinutes: 30,
      userAddress: USER_ADDR,
    });

    expect(swap.to.toLowerCase()).toBe(SWAP_ROUTER_02_ADDRESS.toLowerCase());
    expect(swap.value).toBe(1000000000000000000n);

    const decoded = decodeFunctionData({
      abi: swapRouter02Abi,
      data: swap.data,
    });
    expect(decoded.functionName).toBe("multicall");
    const multicallArgs = decoded.args as [bigint, readonly Hex[]];
    expect(multicallArgs[1].length).toBe(1);

    const innerCall = decodeFunctionData({
      abi: swapRouter02Abi,
      data: multicallArgs[1][0],
    });
    expect(innerCall.functionName).toBe("exactInputSingle");
    if (innerCall.functionName === "exactInputSingle") {
      const params = innerCall.args[0];
      expect(params.tokenIn.toLowerCase()).toBe(WETH_ADDRESS.toLowerCase());
      expect(params.tokenOut.toLowerCase()).toBe(USDC_ADDRESS.toLowerCase());
      expect(params.recipient.toLowerCase()).toBe(USER_ADDR.toLowerCase());
    }
  });

  it("builds USDC -> ETH swap multicall with unwrapWETH9", () => {
    const swap = buildSwap({
      quote: {
        sell: "USDC",
        buy: "ETH",
        sellAmount: 2000,
        buyAmount: 1,
        rate: 0.0005,
        sellRaw: 2000000000n,
        buyRaw: 1000000000000000000n,
        fee: 500,
      },
      slippagePct: 0.5,
      deadlineMinutes: 20,
      userAddress: USER_ADDR,
    });

    expect(swap.to.toLowerCase()).toBe(SWAP_ROUTER_02_ADDRESS.toLowerCase());
    expect(swap.value).toBe(0n);

    const decoded = decodeFunctionData({
      abi: swapRouter02Abi,
      data: swap.data,
    });
    expect(decoded.functionName).toBe("multicall");
    const multicallArgs = decoded.args as [bigint, readonly Hex[]];
    expect(multicallArgs[1].length).toBe(2);

    const firstCall = decodeFunctionData({
      abi: swapRouter02Abi,
      data: multicallArgs[1][0],
    });
    expect(firstCall.functionName).toBe("exactInputSingle");
    if (firstCall.functionName === "exactInputSingle") {
      expect(firstCall.args[0].recipient.toLowerCase()).toBe(
        SWAP_ROUTER_02_ADDRESS.toLowerCase(),
      );
    }

    const secondCall = decodeFunctionData({
      abi: swapRouter02Abi,
      data: multicallArgs[1][1],
    });
    expect(secondCall.functionName).toBe("unwrapWETH9");
    if (secondCall.functionName === "unwrapWETH9") {
      expect(secondCall.args[1].toLowerCase()).toBe(USER_ADDR.toLowerCase());
    }
  });
});

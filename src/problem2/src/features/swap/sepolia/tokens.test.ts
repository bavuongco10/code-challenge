import { describe, expect, it } from "vitest";

import {
  checkGasReserve,
  findSepoliaToken,
  fromRawAmount,
  fromRawUnits,
  isSepoliaToken,
  SEPOLIA_TOKENS,
  toRawAmount,
  toRawUnits,
} from "./tokens.ts";

describe("sepolia tokens and units", () => {
  it("defines the expected Sepolia tokens", () => {
    expect(SEPOLIA_TOKENS.map((t) => t.symbol)).toEqual([
      "ETH",
      "WETH",
      "USDC",
      "UNI",
    ]);
    expect(findSepoliaToken("usdc")?.decimals).toBe(6);
    expect(findSepoliaToken("eth")?.decimals).toBe(18);
    expect(isSepoliaToken("ETH")).toBe(true);
    expect(isSepoliaToken("BTC")).toBe(false);
  });

  it("converts units to and from raw bigint accurately", () => {
    expect(toRawUnits("1.5", 18)).toBe(1500000000000000000n);
    expect(toRawUnits("100.25", 6)).toBe(100250000n);
    expect(fromRawUnits(1500000000000000000n, 18)).toBe(1.5);
    expect(fromRawUnits(100250000n, 6)).toBe(100.25);
  });

  it("converts amounts by token symbol", () => {
    expect(toRawAmount("2", "ETH")).toBe(2000000000000000000n);
    expect(toRawAmount("50", "USDC")).toBe(50000000n);
    expect(fromRawAmount(2000000000000000000n, "ETH")).toBe(2);
    expect(fromRawAmount(50000000n, "USDC")).toBe(50);
  });

  it("validates gas reserve correctly for ETH and ERC20 sells", () => {
    // Selling ETH
    // If balance is 1 ETH, sell 0.998 ETH -> sell + 0.002 = 1.0 -> ok
    expect(
      checkGasReserve("ETH", toRawUnits("0.998", 18), toRawUnits("1.0", 18))
        .hasEnoughGas,
    ).toBe(true);
    // If balance is 1 ETH, sell 0.999 ETH -> sell + 0.002 = 1.001 > 1.0 -> gas short
    expect(
      checkGasReserve("ETH", toRawUnits("0.999", 18), toRawUnits("1.0", 18))
        .hasEnoughGas,
    ).toBe(false);
    expect(
      checkGasReserve("ETH", toRawUnits("0.999", 18), toRawUnits("1.0", 18))
        .isGasShort,
    ).toBe(true);

    // Selling ERC20 (e.g. USDC)
    // If eth balance >= 0.002 -> ok
    expect(
      checkGasReserve("USDC", toRawUnits("100", 18), toRawUnits("0.005", 18))
        .hasEnoughGas,
    ).toBe(true);
    // If eth balance < 0.002 -> gas short
    expect(
      checkGasReserve("USDC", toRawUnits("100", 18), toRawUnits("0.001", 18))
        .hasEnoughGas,
    ).toBe(false);
    expect(
      checkGasReserve("USDC", toRawUnits("100", 18), toRawUnits("0.001", 18))
        .isGasShort,
    ).toBe(true);
    // Exact: float 0.007 + 0.002 > 0.009 was wrongly "short"
    expect(
      checkGasReserve("ETH", toRawUnits("0.007", 18), toRawUnits("0.009", 18))
        .isGasShort,
    ).toBe(false);
  });
});

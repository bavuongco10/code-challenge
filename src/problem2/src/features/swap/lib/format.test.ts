import { describe, expect, it } from "vitest";
import type { Quote } from "../types.ts";
import {
  formatAmount,
  formatPercent,
  formatRate,
  formatUsd,
  shortAddress,
} from "./format.ts";

it("formatAmount", () => {
  expect(formatAmount(0.00000016)).toBe("0.00000016");
  expect(formatAmount(2e9)).toBe("2000000000");
  expect(formatAmount(1 / 1.62)).toBe("0.617284");
  expect(formatAmount(2000)).toBe("2000");
  expect(formatAmount(0.0005)).toBe("0.0005");
  expect(formatAmount(0)).toBe("0");
  expect(formatAmount(1234567.89)).toBe("1234570");
});

describe("formatUsd", () => {
  it.each([
    [0, "$0"],
    [0.001, "<$0.01"],
    [0.01, "$0.01"],
    [1, "$1.00"],
    [2000, "$2,000.00"],
    [1234.56, "$1,234.56"],
    [2e9, "$2.00B"],
    [76270000, "$76.27M"],
  ])("%j -> %j", (n, s) => expect(formatUsd(n)).toBe(s));
});

it("formatPercent", () => {
  expect(formatPercent(0.5)).toBe("0.5%");
  expect(formatPercent(1)).toBe("1%");
  expect(formatPercent(5.51)).toBe("5.51%");
});

it("formatRate", () => {
  const q: Quote = {
    sell: "ETH",
    buy: "USDC",
    sellAmount: 1,
    buyAmount: 2000,
    rate: 2000,
  };
  const prices = { ETH: 2000, USDC: 1 };
  expect(formatRate(q, false, prices)).toBe("1 ETH = 2000 USDC ($2,000.00)");
  expect(formatRate(q, true, prices)).toBe("1 USDC = 0.0005 ETH ($1.00)");
});

it("shortAddress", () => {
  expect(shortAddress("0x1234567890abcdef1234567890abcdef12345678")).toBe(
    "0x1234...5678",
  );
});

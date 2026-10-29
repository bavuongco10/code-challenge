import { expect, it } from "vitest";
import { convert, minReceived } from "./convert.ts";

const E8 = 10n ** 8n;

it("converts via USD prices", () => {
  expect(convert(E8, 2000, 1)).toBe(2000n * E8);
  expect(convert(E8, 1, 2000)).toBe(50_000n); // 0.0005
});

it("is exact where floats are not", () => {
  // 0.1 * 0.2 / 0.3 = 0.0666…: floor 6666666, ceil 6666667 (8 decimals)
  expect(convert(10_000_000n, 0.2, 0.3)).toBe(6_666_666n);
  expect(convert(10_000_000n, 0.2, 0.3, true)).toBe(6_666_667n);
  // 1 / 1.62 = 0.61728395… (float path rounded this to 0.617284)
  expect(convert(E8, 1, 1.62)).toBe(61_728_395n);
  // tiny and huge prices survive the decimal round-trip
  expect(convert(E8, 1.5e-7, 3e-7)).toBe(E8 / 2n);
  expect(convert(E8, 2e21, 1)).toBe(2n * 10n ** 21n * E8);
});

it("applies slippage", () => {
  expect(minReceived(2000, 0.5)).toBe(1990);
  expect(minReceived(2000, 1)).toBe(1980);
});

import { expect, it } from "vitest";
import { convert, minReceived } from "./convert.ts";

it("converts via USD prices", () => {
  expect(convert(1, 2000, 1)).toBe(2000);
  expect(convert(1, 1, 2000)).toBe(0.0005);
});

it("applies slippage", () => {
  expect(minReceived(2000, 0.5)).toBe(1990);
  expect(minReceived(2000, 1)).toBe(1980);
});

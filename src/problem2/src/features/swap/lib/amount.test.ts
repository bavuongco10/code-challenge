import { describe, expect, it } from "vitest";
import {
  sanitizeAmount,
  sanitizeDeadline,
  sanitizeSlippage,
  toNumber,
} from "./amount.ts";

describe("sanitizeAmount", () => {
  it.each([
    ["abc1-e2", "12"],
    ["1.2.3", "1.23"],
    ["1,5", "1.5"],
    [".5", ".5"],
    ["007", "007"],
    ["0.123456789", "0.12345678"],
    ["", ""],
  ])("%j -> %j", (i, o) => expect(sanitizeAmount(i)).toBe(o));
});

describe("sanitizeSlippage", () => {
  it.each([
    ["15", "150", "15"],
    ["", "a1b", "1"],
    ["", "1.234", "1.23"],
    ["10", "100", "100"],
    ["100", "100.5", "100"],
  ])("(%j,%j) -> %j", (p, r, o) => expect(sanitizeSlippage(p, r)).toBe(o));
});

describe("sanitizeDeadline", () => {
  it.each([
    ["99999", "4320"],
    ["1.5", "15"],
    ["", ""],
    ["abc", ""],
    ["30", "30"],
  ])("%j -> %j", (i, o) => expect(sanitizeDeadline(i)).toBe(o));
});

describe("toNumber", () => {
  it.each([
    ["", 0],
    [".", 0],
    [".5", 0.5],
    ["1.", 1],
    ["2000", 2000],
  ])("%j -> %j", (i, o) => expect(toNumber(i)).toBe(o));
});

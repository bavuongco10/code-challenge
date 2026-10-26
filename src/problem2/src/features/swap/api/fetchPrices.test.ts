import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchPrices, parsePrices } from "./fetchPrices.ts";

const FIXTURE = [
  { currency: "ETH", date: "2023-08-29T07:10:52.000Z", price: 2000 },
  { currency: "USDC", date: "2023-08-29T07:10:30.000Z", price: 0.5 },
  { currency: "USDC", date: "2023-08-29T07:10:40.000Z", price: 1 },
  { currency: "USD", date: "2023-08-29T07:10:30.000Z", price: 1 },
  { currency: "SWTH", date: "2023-08-29T07:10:40.000Z", price: 0.004 },
  { currency: "WBTC", date: "2023-08-29T07:10:40.000Z", price: 25000 },
  { currency: "NOPRICE", date: "2023-08-29T07:10:40.000Z" },
];

afterEach(() => vi.unstubAllGlobals());

describe("parsePrices", () => {
  it("handles the e2e fixture", () => {
    expect(parsePrices(FIXTURE)).toEqual({
      ETH: 2000,
      USDC: 1,
      USD: 1,
      SWTH: 0.004,
      WBTC: 25000,
    });
  });
  it("latest date wins regardless of order", () => {
    expect(parsePrices([...FIXTURE].reverse()).USDC).toBe(1);
  });
  it("drops missing, non-finite, <= 0 and malformed", () => {
    const bad = [0, -1, null, "3", { currency: 5, price: 1 }, null].map(
      (price) => ({ currency: "X", date: "2023-01-01", price }),
    );
    expect(parsePrices([...bad, 7, null])).toEqual({});
  });
  it("throws on non-array", () => {
    expect(() => parsePrices({})).toThrow();
  });
});

describe("fetchPrices", () => {
  it("returns cleaned prices", async () => {
    const f = vi.fn(async () => new Response(JSON.stringify(FIXTURE)));
    vi.stubGlobal("fetch", f);
    expect((await fetchPrices()).ETH).toBe(2000);
  });
  it("throws on !ok", async () => {
    vi.stubGlobal("fetch", async () => new Response("", { status: 500 }));
    await expect(fetchPrices()).rejects.toThrow("500");
  });
});

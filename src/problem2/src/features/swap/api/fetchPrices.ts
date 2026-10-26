import { PRICES_URL } from "../constants.ts";
import type { Prices } from "../types.ts";

/** Validate raw JSON into symbol → latest USD price. Throws if not an array. */
export function parsePrices(json: unknown): Prices {
  if (!Array.isArray(json)) throw new Error("Prices: expected an array");
  const latest: Record<string, number> = {};
  const prices: Prices = {};
  for (const item of json as unknown[]) {
    if (typeof item !== "object" || item === null) continue;
    const { currency, date, price } = item as Record<string, unknown>;
    if (typeof currency !== "string" || !currency) continue;
    if (typeof price !== "number" || !Number.isFinite(price) || price <= 0)
      continue;
    const t = typeof date === "string" ? Date.parse(date) : NaN;
    const time = Number.isNaN(t) ? -Infinity : t;
    if (currency in latest && latest[currency] >= time) continue;
    latest[currency] = time;
    prices[currency] = price;
  }
  return prices;
}

export async function fetchPrices(signal?: AbortSignal): Promise<Prices> {
  const res = await fetch(PRICES_URL, { signal });
  if (!res.ok) throw new Error(`Prices: HTTP ${res.status}`);
  return parsePrices(await res.json());
}

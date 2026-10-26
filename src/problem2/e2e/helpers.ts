import { expect, type Page } from "@playwright/test";

// Deterministic prices. Tests never hit the real prices URL.
export const PRICES = [
  { currency: "ETH", date: "2023-08-29T07:10:52.000Z", price: 2000 },
  { currency: "USDC", date: "2023-08-29T07:10:30.000Z", price: 0.5 }, // older duplicate: ignored
  { currency: "USDC", date: "2023-08-29T07:10:40.000Z", price: 1 },
  { currency: "USD", date: "2023-08-29T07:10:30.000Z", price: 1 },
  { currency: "SWTH", date: "2023-08-29T07:10:40.000Z", price: 0.004 },
  { currency: "WBTC", date: "2023-08-29T07:10:40.000Z", price: 25000 },
  { currency: "NOPRICE", date: "2023-08-29T07:10:40.000Z" },
];

export const mockPrices = (page: Page, delayMs = 0) =>
  page.route("**/prices.json", async (route) => {
    if (delayMs) await new Promise((r) => setTimeout(r, delayMs));
    await route.fulfill({ json: PRICES });
  });

export const $ = (page: Page, selector: string) => page.locator(selector);

export async function pickToken(
  page: Page,
  side: "sell" | "buy",
  symbol: string,
) {
  await $(page, `#${side}-token`).click();
  await $(page, "#token-search").fill(symbol);
  await $(page, `#token-option-${symbol}`).click();
  await expect($(page, "#token-picker")).toBeHidden();
}

export async function setup(page: Page) {
  await mockPrices(page);
  await page.goto("/");
  await pickToken(page, "buy", "USDC");
}

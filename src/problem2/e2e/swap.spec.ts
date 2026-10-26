import { expect, test } from "@playwright/test";
import { $, mockPrices, pickToken, PRICES, setup } from "./helpers.ts";

// Locators use ids, states are asserted with classes (see "UI contract" in
// docs/features/swap/plan.md). Text is asserted only where formatting is the thing under test.

test.beforeEach(async ({ page }) => {
  await page.route("https://raw.githubusercontent.com/**", (r) => r.abort());
});

test.describe("defaults and submit-button validation", () => {
  test.beforeEach(async ({ page }) => {
    await mockPrices(page);
    await page.goto("/");
  });

  test("starts with ETH to sell, no buy token, empty amounts", async ({
    page,
  }) => {
    await expect($(page, "#sell-token .token-symbol")).toHaveText("ETH");
    await expect($(page, "#buy-token")).toContainClass("is-empty");
    await expect($(page, "#sell-amount")).toHaveValue("");
    await expect($(page, "#sell-usd")).toHaveText("$0");
    await expect($(page, "#swap-submit")).toContainClass("is-select-token");
    await expect($(page, "#swap-submit")).toBeDisabled();
    await expect($(page, "#swap-details")).toHaveCount(0);
  });

  test("asks for an amount once both tokens are set, including for 0", async ({
    page,
  }) => {
    await pickToken(page, "buy", "USDC");
    await expect($(page, "#swap-submit")).toContainClass("is-enter-amount");
    await expect($(page, "#swap-submit")).toBeDisabled();
    await $(page, "#sell-amount").fill("0");
    await expect($(page, "#swap-submit")).toContainClass("is-enter-amount");
    await $(page, "#sell-amount").fill("1");
    // valid form, no wallet: the button connects (wallet states are in wallet.spec.ts)
    await expect($(page, "#swap-submit")).toContainClass("is-connect");
    await expect($(page, "#swap-submit")).toBeEnabled();
  });
});

test.describe("conversion and number formatting", () => {
  test.beforeEach(async ({ page }) => setup(page));

  test("sell side drives buy side, USD values and rate are shown", async ({
    page,
  }) => {
    await $(page, "#sell-amount").fill("1");
    await expect($(page, "#buy-amount")).toHaveValue("2000"); // latest USDC price (1) wins over older duplicate
    await expect($(page, "#sell-usd")).toHaveText("$2,000.00");
    await expect($(page, "#buy-usd")).toHaveText("$2,000.00");
    await expect($(page, "#rate")).toHaveText("1 ETH = 2000 USDC ($2,000.00)");
  });

  test("clicking the rate inverts it", async ({ page }) => {
    await $(page, "#sell-amount").fill("1");
    await $(page, "#rate").click();
    await expect($(page, "#rate")).toContainClass("is-inverted");
    await expect($(page, "#rate")).toHaveText("1 USDC = 0.0005 ETH ($1.00)");
  });

  test("buy side drives sell side", async ({ page }) => {
    await $(page, "#buy-amount").fill("1000");
    await expect($(page, "#sell-amount")).toHaveValue("0.5");
  });

  test("clearing the amount clears the other side", async ({ page }) => {
    await $(page, "#sell-amount").fill("1");
    await $(page, "#sell-amount").fill("");
    await expect($(page, "#buy-amount")).toHaveValue("");
    await expect($(page, "#buy-usd")).toHaveText("$0");
  });

  test("tiny results: plain decimals, max 6 significant digits, <$0.01", async ({
    page,
  }) => {
    await pickToken(page, "sell", "SWTH");
    await pickToken(page, "buy", "WBTC");
    await $(page, "#sell-amount").fill("1");
    await expect($(page, "#buy-amount")).toHaveValue("0.00000016");
    await expect($(page, "#sell-usd")).toHaveText("<$0.01");
  });

  test("results are rounded to 6 significant digits", async ({ page }) => {
    await pickToken(page, "sell", "USDC");
    await pickToken(page, "buy", "ETH");
    await $(page, "#sell-amount").fill("1234.5678");
    await expect($(page, "#buy-amount")).toHaveValue("0.617284");
  });

  test("large USD values use compact notation", async ({ page }) => {
    await $(page, "#sell-amount").fill("1000000");
    await expect($(page, "#buy-amount")).toHaveValue("2000000000");
    await expect($(page, "#sell-usd")).toHaveText("$2.00B");
  });
});

test.describe("amount input sanitising", () => {
  test.beforeEach(async ({ page }) => setup(page));

  for (const [typed, expected] of [
    ["abc1-e2", "12"], // non-numeric characters are dropped
    ["1.2.3", "1.23"], // only the first decimal point is kept
    ["1,5", "1.5"], // comma is treated as a decimal point
    [".5", ".5"], // leading decimal point is allowed
    ["0.123456789", "0.12345678"], // max 8 decimals
  ] as const) {
    test(`typing "${typed}" gives "${expected}"`, async ({ page }) => {
      await $(page, "#sell-amount").pressSequentially(typed);
      await expect($(page, "#sell-amount")).toHaveValue(expected);
    });
  }

  test("amount input uses the decimal keypad on mobile", async ({ page }) => {
    await expect($(page, "#sell-amount")).toHaveAttribute(
      "inputmode",
      "decimal",
    );
  });
});

test.describe("token switching", () => {
  test.beforeEach(async ({ page }) => setup(page));

  test("flip swaps tokens and keeps the typed amount with its token", async ({
    page,
  }) => {
    await $(page, "#sell-amount").fill("1");
    await $(page, "#switch-tokens").click();
    await expect($(page, "#sell-token .token-symbol")).toHaveText("USDC");
    await expect($(page, "#buy-token .token-symbol")).toHaveText("ETH");
    await expect($(page, "#buy-amount")).toHaveValue("1");
    await expect($(page, "#sell-amount")).toHaveValue("2000");
  });

  test("picking the token already on the other side swaps the sides", async ({
    page,
  }) => {
    await pickToken(page, "sell", "USDC");
    await expect($(page, "#sell-token .token-symbol")).toHaveText("USDC");
    await expect($(page, "#buy-token .token-symbol")).toHaveText("ETH");
  });
});

test.describe("token picker", () => {
  test.beforeEach(async ({ page }) => {
    await mockPrices(page);
    await page.goto("/");
    await $(page, "#buy-token").click();
  });

  test("lists only priced tokens and filters case-insensitively", async ({
    page,
  }) => {
    await expect($(page, "#token-option-NOPRICE")).toHaveCount(0);
    await $(page, "#token-search").fill("us");
    await expect($(page, "#token-picker .token-option")).toHaveCount(2); // USD, USDC
  });

  test("shows an empty state for no matches", async ({ page }) => {
    await $(page, "#token-search").fill("zzz");
    await expect($(page, "#token-picker .token-option")).toHaveCount(0);
    await expect($(page, "#token-empty")).toBeVisible();
  });

  test("Escape closes without changing the token", async ({ page }) => {
    await page.keyboard.press("Escape");
    await expect($(page, "#token-picker")).toBeHidden();
    await expect($(page, "#buy-token")).toContainClass("is-empty");
  });
});

test.describe("expandable details", () => {
  test.beforeEach(async ({ page }) => {
    await setup(page);
    await $(page, "#sell-amount").fill("1");
  });

  test("collapsed by default, toggles open and closed", async ({ page }) => {
    await expect($(page, "#details-toggle")).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    await expect($(page, "#swap-details")).toBeHidden();
    await $(page, "#details-toggle").click();
    await expect($(page, "#details-toggle")).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    await expect($(page, "#swap-details")).toBeVisible();
    await $(page, "#details-toggle").click();
    await expect($(page, "#swap-details")).toBeHidden();
  });

  test("shows fee, auto slippage and minimum received", async ({ page }) => {
    await $(page, "#details-toggle").click();
    await expect($(page, "#detail-fee")).toContainClass("is-free");
    await expect($(page, "#detail-slippage .slippage-auto")).toBeVisible();
    await expect($(page, "#detail-slippage .slippage-value")).toHaveText(
      "0.5%",
    );
    await expect($(page, "#detail-min-received")).toHaveText("1990 USDC"); // 2000 × (1 − 0.5%)
  });

  test("follows a custom slippage", async ({ page }) => {
    await $(page, "#settings-toggle").click();
    await $(page, "#slippage-input").fill("1");
    await page.keyboard.press("Escape");
    await $(page, "#details-toggle").click();
    await expect($(page, "#detail-slippage .slippage-auto")).toHaveCount(0);
    await expect($(page, "#detail-slippage .slippage-value")).toHaveText("1%");
    await expect($(page, "#detail-min-received")).toHaveText("1980 USDC");
  });

  test("disappears when there is no quote", async ({ page }) => {
    await $(page, "#sell-amount").fill("");
    await expect($(page, "#rate")).toHaveCount(0);
    await expect($(page, "#details-toggle")).toHaveCount(0);
  });
});

test.describe("settings: max slippage", () => {
  test.beforeEach(async ({ page }) => {
    await setup(page);
    await $(page, "#settings-toggle").click();
  });

  test("defaults to Auto 0.5% with no warning", async ({ page }) => {
    await expect($(page, "#slippage-auto")).toContainClass("is-active");
    await expect($(page, "#slippage-input")).toHaveValue("");
    await expect($(page, "#slippage-input")).toHaveAttribute(
      "placeholder",
      "0.5",
    );
    await expect($(page, "#slippage-warning")).toHaveCount(0);
    await expect($(page, "#settings-toggle .slippage-badge")).toHaveCount(0);
  });

  test("a custom value turns Auto off and shows on the gear", async ({
    page,
  }) => {
    await $(page, "#slippage-input").fill("1");
    await expect($(page, "#slippage-auto")).not.toContainClass("is-active");
    await expect($(page, "#settings-toggle .slippage-badge")).toHaveText("1%");
  });

  for (const [value, level] of [
    ["5.5", null],
    ["5.51", "is-high"],
    ["19.99", "is-high"],
    ["20", "is-very-high"],
    ["100", "is-very-high"],
  ] as const) {
    test(`${value}% → ${level ?? "no warning"}`, async ({ page }) => {
      await $(page, "#slippage-input").fill(value);
      if (level) {
        await expect($(page, "#slippage-warning")).toContainClass(level);
        await expect($(page, "#slippage-input")).toHaveAttribute(
          "aria-describedby",
          "slippage-warning",
        );
        await expect($(page, "#settings-toggle")).toContainClass(level);
      } else {
        await expect($(page, "#slippage-warning")).toHaveCount(0);
      }
    });
  }

  for (const [typed, expected] of [
    ["150", "15"], // a keystroke that would exceed 100 is ignored
    ["1.234", "1.23"], // max 2 decimals
    ["a1b", "1"], // non-numeric characters are dropped
  ] as const) {
    test(`typing "${typed}" gives "${expected}"`, async ({ page }) => {
      await $(page, "#slippage-input").pressSequentially(typed);
      await expect($(page, "#slippage-input")).toHaveValue(expected);
    });
  }

  for (const value of ["", "0"]) {
    test(`"${value}" falls back to Auto on blur`, async ({ page }) => {
      await $(page, "#slippage-input").fill("3");
      await $(page, "#slippage-input").fill(value);
      await $(page, "#slippage-input").blur();
      await expect($(page, "#slippage-auto")).toContainClass("is-active");
      await expect($(page, "#slippage-input")).toHaveValue("");
    });
  }

  test("clicking Auto resets a custom value", async ({ page }) => {
    await $(page, "#slippage-input").fill("3");
    await $(page, "#slippage-auto").click();
    await expect($(page, "#slippage-auto")).toContainClass("is-active");
    await expect($(page, "#slippage-input")).toHaveValue("");
  });
});

test.describe("settings: swap deadline", () => {
  test.beforeEach(async ({ page }) => {
    await setup(page);
    await $(page, "#settings-toggle").click();
  });

  test("defaults to 30 minutes with no warning", async ({ page }) => {
    await expect($(page, "#deadline-input")).toHaveValue("30");
    await expect($(page, "#deadline-warning")).toHaveCount(0);
  });

  for (const [value, warns] of [
    ["59", false],
    ["60", true],
    ["4320", true],
  ] as const) {
    test(`${value} minutes → ${warns ? "high deadline warning" : "no warning"}`, async ({
      page,
    }) => {
      await $(page, "#deadline-input").fill(value);
      await expect($(page, "#deadline-warning")).toHaveCount(warns ? 1 : 0);
    });
  }

  for (const [typed, expected] of [
    ["99999", "4320"], // clamped to 3 days
    ["1.5", "15"], // whole minutes only
  ] as const) {
    test(`typing "${typed}" gives "${expected}"`, async ({ page }) => {
      await $(page, "#deadline-input").fill("");
      await $(page, "#deadline-input").pressSequentially(typed);
      await expect($(page, "#deadline-input")).toHaveValue(expected);
    });
  }

  for (const value of ["", "0"]) {
    test(`"${value}" falls back to 30 on blur`, async ({ page }) => {
      await $(page, "#deadline-input").fill(value);
      await $(page, "#deadline-input").blur();
      await expect($(page, "#deadline-input")).toHaveValue("30");
    });
  }

  test("Escape and outside click close the panel", async ({ page }) => {
    await page.keyboard.press("Escape");
    await expect($(page, "#settings-panel")).toBeHidden();
    await $(page, "#settings-toggle").click();
    await page.mouse.click(5, 5);
    await expect($(page, "#settings-panel")).toBeHidden();
  });
});

test.describe("price loading", () => {
  test("submit is disabled while prices load", async ({ page }) => {
    await mockPrices(page, 1500);
    await page.goto("/");
    await expect($(page, "#swap-submit")).toContainClass("is-loading-prices");
    await expect($(page, "#swap-submit")).toBeDisabled();
  });

  test("failed load shows an error with a working retry", async ({ page }) => {
    let calls = 0;
    await page.route("**/prices.json", (route) =>
      ++calls === 1
        ? route.fulfill({ status: 500 })
        : route.fulfill({ json: PRICES }),
    );
    await page.goto("/");
    await expect($(page, "#prices-error")).toHaveAttribute("role", "alert");
    await $(page, "#prices-retry").click();
    await expect($(page, "#prices-error")).toHaveCount(0);
    await pickToken(page, "buy", "USDC");
  });
});

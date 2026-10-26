import { expect, test, type Page } from "@playwright/test";
import { $, setup } from "./helpers.ts";

// Phase 1 demo wallet (docs/features/swap/plan.md → Wallet).
// Defaults on first connect: ETH 1.5, USDC 1000, SWTH 250000. Prices: ETH 2000, USDC 1.

type StoredWallet = {
  connected: boolean;
  address: string;
  balances: Record<string, string>;
  activity: unknown[];
};

const ADDRESS = "0x1234567890abcdef1234567890abcdef12345678";

const seedWallet = (page: Page, wallet: Partial<StoredWallet>) =>
  page.addInitScript((w) => {
    // only seed the first load, so reload tests see what the app saved
    if (!sessionStorage.getItem("seeded")) {
      localStorage.setItem("swap:wallet", JSON.stringify(w));
      sessionStorage.setItem("seeded", "1");
    }
  }, wallet);

const storedWallet = (page: Page) =>
  page.evaluate(
    () =>
      JSON.parse(localStorage.getItem("swap:wallet") ?? "null") as StoredWallet,
  );

async function connect(page: Page) {
  await $(page, "#connect-wallet").click();
  await expect($(page, "#account-button")).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await page.route("https://raw.githubusercontent.com/**", (r) => r.abort());
});

test.describe("wallet mode switch", () => {
  test.beforeEach(async ({ page }) => setup(page));

  test("defaults to Demo; Sepolia is disabled in phase 1", async ({ page }) => {
    await expect($(page, "#wallet-mode [data-mode=demo]")).toContainClass(
      "is-active",
    );
    await expect($(page, "#wallet-mode [data-mode=sepolia]")).toBeDisabled();
    expect(
      await page.evaluate(() => localStorage.getItem("swap:walletMode")),
    ).toBeNull(); // nothing stored until changed; default is demo
  });
});

test.describe("connect / disconnect", () => {
  test.beforeEach(async ({ page }) => setup(page));

  test("submit says Connect wallet when the form is valid and no wallet", async ({
    page,
  }) => {
    await $(page, "#sell-amount").fill("1");
    await expect($(page, "#swap-submit")).toContainClass("is-connect");
    await $(page, "#swap-submit").click();
    await expect($(page, "#account-button")).toBeVisible();
    await expect($(page, "#swap-submit")).toContainClass("is-ready");
  });

  test("first connect creates the default demo wallet", async ({ page }) => {
    await connect(page);
    await expect($(page, "#connect-wallet")).toHaveCount(0);
    await expect($(page, "#account-button")).toHaveText("0x1234...5678");
    await expect($(page, "#sell-balance")).toHaveText("1.5 ETH");
    await expect($(page, "#buy-balance")).toHaveText("1000 USDC");
    const w = await storedWallet(page);
    expect(w).toMatchObject({
      connected: true,
      address: ADDRESS,
      balances: { ETH: "1.5", USDC: "1000", SWTH: "250000" },
    });
  });

  test("account menu shows the full address and disconnects", async ({
    page,
  }) => {
    await connect(page);
    await $(page, "#account-button").click();
    await expect($(page, "#account-menu")).toContainText(ADDRESS);
    await $(page, "#disconnect").click();
    await expect($(page, "#connect-wallet")).toBeVisible();
    await expect($(page, "#sell-balance")).toHaveCount(0);
    expect((await storedWallet(page)).connected).toBe(false);
  });

  test("connection survives a reload", async ({ page }) => {
    await connect(page);
    await page.reload();
    await expect($(page, "#account-button")).toBeVisible();
  });

  test("corrupt storage falls back to defaults instead of crashing", async ({
    page,
  }) => {
    await page.addInitScript(() =>
      localStorage.setItem("swap:wallet", "{not json"),
    );
    await page.reload();
    await connect(page);
    await expect($(page, "#sell-balance")).toHaveText("1.5 ETH");
  });
});

test.describe("balances, presets, insufficient balance", () => {
  test.beforeEach(async ({ page }) => {
    await setup(page);
    await connect(page);
  });

  for (const [percent, expected] of [
    ["25", "0.375"],
    ["50", "0.75"],
    ["75", "1.125"],
    ["100", "1.5"], // Max: no gas reserve in the demo
  ] as const) {
    test(`preset ${percent}% fills ${expected}`, async ({ page }) => {
      await $(page, "#sell-amount").hover();
      await $(page, `.amount-preset[data-percent="${percent}"]`).click();
      await expect($(page, "#sell-amount")).toHaveValue(expected);
      await expect($(page, "#buy-amount")).toHaveValue(
        String(Number(expected) * 2000),
      );
    });
  }

  test("presets are hidden for a zero balance", async ({ page }) => {
    await $(page, "#sell-token").click();
    await $(page, "#token-search").fill("WBTC");
    await $(page, "#token-option-WBTC").click();
    await $(page, "#sell-amount").hover();
    await expect($(page, ".amount-preset")).toHaveCount(0);
  });

  test("amount above balance: red amount + balance, Not enough ETH", async ({
    page,
  }) => {
    await $(page, "#sell-amount").fill("2");
    await expect($(page, "#swap-submit")).toContainClass("is-insufficient");
    await expect($(page, "#swap-submit")).toHaveText("Not enough ETH");
    await expect($(page, "#swap-submit")).toBeDisabled();
    await expect($(page, "#sell-amount")).toContainClass("is-error");
    await expect($(page, "#sell-balance")).toContainClass("is-error");
  });

  test("amount equal to balance is allowed", async ({ page }) => {
    await $(page, "#sell-amount").fill("1.5");
    await expect($(page, "#swap-submit")).toContainClass("is-ready");
    await expect($(page, "#sell-amount")).not.toContainClass("is-error");
  });

  test("exact-out: a buy amount needing more than the balance is insufficient", async ({
    page,
  }) => {
    await $(page, "#buy-amount").fill("4000"); // needs 2 ETH
    await expect($(page, "#swap-submit")).toContainClass("is-insufficient");
  });

  test("picker lists Your tokens with balances", async ({ page }) => {
    await $(page, "#buy-token").click();
    await expect($(page, "#token-option-SWTH .token-balance")).toHaveText(
      "250000",
    );
    await expect($(page, "#token-option-WBTC .token-balance")).toHaveCount(0);
  });
});

test.describe("swap flow", () => {
  test.beforeEach(async ({ page }) => {
    await setup(page);
    await connect(page);
    await $(page, "#sell-amount").fill("1");
    await $(page, "#swap-submit").click();
  });

  test("review dialog shows the trade and closes without changes", async ({
    page,
  }) => {
    await expect($(page, "#review-dialog")).toBeVisible();
    await expect($(page, "#review-sell")).toContainText("1 ETH");
    await expect($(page, "#review-buy")).toContainText("2000 USDC");
    await expect($(page, "#review-details")).toBeHidden();
    await $(page, "#review-more").click();
    await expect($(page, "#review-details")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect($(page, "#review-dialog")).toBeHidden();
    await expect($(page, "#sell-amount")).toHaveValue("1");
  });

  test("confirm → pending toast → success toast, balances and activity update", async ({
    page,
  }) => {
    await $(page, "#confirm-swap").click();
    await expect($(page, "#confirm-swap")).toContainClass("is-confirming");
    await expect($(page, "#confirm-swap")).toBeDisabled();

    await expect($(page, "#review-dialog")).toBeHidden();
    await expect($(page, "#sell-amount")).toHaveValue("");
    await expect($(page, "#buy-token .token-symbol")).toHaveText("USDC"); // tokens kept
    await expect($(page, "#swap-toast")).toHaveAttribute("role", "status");
    await expect($(page, "#swap-toast")).toContainClass("is-pending");
    await expect($(page, "#swap-toast .toast-body")).toHaveText(
      "1 ETH for 2000 USDC",
    );
    await expect($(page, "#swap-toast-close")).toHaveCount(0);
    await expect($(page, "#sell-balance")).toHaveText("1.5 ETH"); // not yet

    await expect($(page, "#swap-toast")).toContainClass("is-success");
    await expect($(page, "#sell-balance")).toHaveText("0.5 ETH");
    await expect($(page, "#buy-balance")).toHaveText("3000 USDC");

    await $(page, "#account-button").click();
    await expect($(page, "#activity .activity-item")).toHaveCount(1);
    await expect($(page, "#activity .activity-item").first()).toContainText(
      "1 ETH → 2000 USDC",
    );

    const w = await storedWallet(page);
    expect(w.balances).toMatchObject({ ETH: "0.5", USDC: "3000" });
  });

  test("success toast can be closed", async ({ page }) => {
    await $(page, "#confirm-swap").click();
    await expect($(page, "#swap-toast")).toContainClass("is-success");
    await $(page, "#swap-toast-close").click();
    await expect($(page, "#swap-toast")).toHaveCount(0);
  });

  test("success toast auto-dismisses after 10 s", async ({ page }) => {
    await page.clock.install();
    await $(page, "#confirm-swap").click();
    await page.clock.runFor(4000); // sign + pending
    await expect($(page, "#swap-toast")).toContainClass("is-success");
    await page.clock.runFor(10_000);
    await expect($(page, "#swap-toast")).toHaveCount(0);
  });
});

test("balances persist across reloads after a swap", async ({ page }) => {
  await seedWallet(page, {
    connected: true,
    address: ADDRESS,
    balances: { ETH: "1", USDC: "0" },
    activity: [],
  });
  await setup(page);
  await expect($(page, "#sell-balance")).toHaveText("1 ETH");
  await $(page, "#sell-amount").fill("0.25");
  await $(page, "#swap-submit").click();
  await $(page, "#confirm-swap").click();
  await expect($(page, "#swap-toast")).toContainClass("is-success");
  await page.reload();
  await expect($(page, "#sell-balance")).toHaveText("0.75 ETH");
});

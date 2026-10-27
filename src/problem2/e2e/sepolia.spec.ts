import { expect, test } from "@playwright/test";

import { $, mockPrices, pickToken } from "./helpers.ts";
import {
  FAKE_PROVIDER_NAME,
  injectFakeProviderScript,
  MAINNET_CHAIN_ID_HEX,
  SEPOLIA_CHAIN_ID_HEX,
} from "./fakeProvider.ts";

test.beforeEach(async ({ page }) => {
  await mockPrices(page);

  // Mock Reown API calls to keep tests fully offline
  await page.route(/api\.web3modal\.(org|com)/, (r) => r.fulfill({ json: {} }));
  await page.route(/pulse\.walletconnect\.(org|com)/, (r) =>
    r.fulfill({ json: {} }),
  );
  await page.route(/relay\.walletconnect\.(org|com)/, (r) =>
    r.fulfill({ json: {} }),
  );

  // Mock Sepolia RPC
  await page.route(/sepolia|rpc|infura|alchemy|ethereum/, async (route) => {
    try {
      const body = route.request().postDataJSON();
      const method = body?.method;

      if (method === "eth_chainId") {
        await route.fulfill({
          json: { jsonrpc: "2.0", id: body.id, result: SEPOLIA_CHAIN_ID_HEX },
        });
        return;
      }

      if (method === "eth_getBalance") {
        // Return 1.0 ETH (10^18 wei = 0xde0b6b3a7640000)
        await route.fulfill({
          json: {
            jsonrpc: "2.0",
            id: body.id,
            result: "0x0de0b6b3a7640000",
          },
        });
        return;
      }

      if (method === "eth_blockNumber") {
        await route.fulfill({
          json: { jsonrpc: "2.0", id: body.id, result: "0x1" },
        });
        return;
      }

      if (method === "eth_gasPrice" || method === "eth_maxPriorityFeePerGas") {
        await route.fulfill({
          json: { jsonrpc: "2.0", id: body.id, result: "0x3b9aca00" }, // 1 gwei
        });
        return;
      }

      if (method === "eth_estimateGas") {
        await route.fulfill({
          json: { jsonrpc: "2.0", id: body.id, result: "0x30000" },
        });
        return;
      }

      if (method === "eth_call") {
        // Return 1000 USDC / 1000 WETH / 1000 UNI
        await route.fulfill({
          json: {
            jsonrpc: "2.0",
            id: body.id,
            result:
              "0x000000000000000000000000000000000000000000000000000000003b9aca00",
          },
        });
        return;
      }

      if (method === "eth_getTransactionReceipt") {
        await route.fulfill({
          json: {
            jsonrpc: "2.0",
            id: body.id,
            result: {
              status: "0x1",
              transactionHash:
                "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
              blockNumber: "0x10",
            },
          },
        });
        return;
      }

      await route.fulfill({
        json: { jsonrpc: "2.0", id: body.id, result: null },
      });
    } catch {
      await route.fulfill({ status: 200, json: {} });
    }
  });
});

test.describe("Sepolia wallet (phase 2)", () => {
  test("mode switch enables Sepolia and displays TESTNET badge", async ({
    page,
  }) => {
    await page.goto("/");
    const sepoliaBtn = $(page, "#wallet-mode [data-mode=sepolia]");

    // Button is enabled
    await expect(sepoliaBtn).toBeEnabled();

    // Switch to Sepolia
    await sepoliaBtn.click();
    await expect(sepoliaBtn).toHaveClass(/is-active/);
    await expect($(page, "#testnet-badge")).toBeVisible();
    await expect($(page, "#testnet-badge")).toHaveText("TESTNET");
  });

  test("connects using the injected fake wallet", async ({ page }) => {
    await page.addInitScript(injectFakeProviderScript());
    await page.goto("/");

    // Switch to Sepolia
    await $(page, "#wallet-mode [data-mode=sepolia]").click();

    // Click connect wallet
    await $(page, "#connect-wallet").click();

    // Look for fake provider in the modal
    const mockWallet = page.getByText(FAKE_PROVIDER_NAME).first();
    await expect(mockWallet).toBeVisible({ timeout: 5000 });
    await mockWallet.click();

    // Account button should now be visible with short address
    await expect($(page, "#account-button")).toBeVisible();
    await expect($(page, "#account-button")).toContainText("0x7099...79C8");

    // Open account menu
    await $(page, "#account-button").click();
    await expect($(page, "#account-menu")).toBeVisible();
    await expect($(page, "#account-menu")).toContainText(
      "You are in testnet mode",
    );
    await expect($(page, "#manage-wallet")).toBeVisible();
  });

  test("refused chain switch displays error toast", async ({ page }) => {
    await page.addInitScript(
      injectFakeProviderScript({
        initialChainId: MAINNET_CHAIN_ID_HEX,
        rejectSwitchChain: true,
      }),
    );
    await page.goto("/");

    // Switch to Sepolia
    await $(page, "#wallet-mode [data-mode=sepolia]").click();

    // Connect wallet
    await $(page, "#connect-wallet").click();
    await page.getByText(FAKE_PROVIDER_NAME).first().click();

    // Enter amount and token to trigger wrong-chain state
    await pickToken(page, "buy", "USDC");
    await $(page, "#input-amount").fill("0.1");

    // Submit button shows Switch to Sepolia
    const submit = $(page, "#swap-submit");
    await expect(submit).toHaveClass(/is-wrong-chain/);
    await expect(submit).toHaveText("Switch to Sepolia");

    // Click Switch to Sepolia (will be rejected by fake provider)
    await submit.click();

    // Error toast appears
    const toast = $(page, "#swap-toast");
    await expect(toast).toBeVisible();
    await expect(toast).toHaveClass(/is-error/);
    await expect(toast).toContainText("Failed to switch networks");
  });

  test("gas reserve validation shows gas banner and Not enough ETH", async ({
    page,
  }) => {
    await page.addInitScript(injectFakeProviderScript());
    await page.goto("/");

    await $(page, "#wallet-mode [data-mode=sepolia]").click();
    await $(page, "#connect-wallet").click();
    await page.getByText(FAKE_PROVIDER_NAME).first().click();

    await pickToken(page, "buy", "USDC");

    // Enter amount that exceeds balance - 0.002 gas reserve (balance is 1.0 ETH)
    // 0.999 ETH + 0.002 = 1.001 ETH > 1.0 ETH
    await $(page, "#input-amount").fill("0.999");

    // Gas banner should be visible
    await expect($(page, "#gas-banner")).toBeVisible();
    await expect($(page, "#gas-banner")).toHaveText(
      "Not enough ETH on Sepolia to swap",
    );

    // Submit button shows Not enough ETH
    const submit = $(page, "#swap-submit");
    await expect(submit).toHaveClass(/is-insufficient/);
    await expect(submit).toHaveText("Not enough ETH");
  });
});

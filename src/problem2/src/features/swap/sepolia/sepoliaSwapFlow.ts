import { atom } from "jotai";
import type { Address } from "viem";

import {
  quoteAtom,
  resetAmountsAtom,
  reviewOpenAtom,
  slippageAtom,
  deadlineInputAtom,
  toastAtom,
} from "../atoms.ts";
import {
  SEPOLIA_CHAIN_ID,
  SWAP_ROUTER_02_ADDRESS,
  TOAST_MS,
} from "../constants.ts";
import { formatAmount } from "../lib/format.ts";
import { erc20Abi } from "./abis.ts";
import { buildSwap } from "./buildSwap.ts";
import { loadAppKit, sepoliaAddressAtom } from "./sepoliaWalletAtoms.ts";
import { findSepoliaToken } from "./tokens.ts";
import type { Toast } from "../types.ts";
import { applySwapAtom } from "../walletAtoms.ts";

export const confirmingAtom = atom(false);
export const confirmingTextAtom = atom<string | null>(null);

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export const confirmSepoliaSwapAtom = atom(null, async (get, set) => {
  const q = get(quoteAtom);
  if (!q || get(confirmingAtom)) return;

  const userAddress = get(sepoliaAddressAtom);
  if (!userAddress) return;

  const { wagmiConfig } = await loadAppKit();
  const {
    getAccount,
    switchChain,
    readContract,
    writeContract,
    sendTransaction,
    waitForTransactionReceipt,
  } = await import("wagmi/actions");

  const sellAmount = formatAmount(q.sellAmount);
  const buyAmount = formatAmount(q.buyAmount);
  const base = { sell: q.sell, sellAmount, buy: q.buy, buyAmount };

  // 1. Chain check
  const current = getAccount(wagmiConfig);
  if (current.chainId !== SEPOLIA_CHAIN_ID) {
    try {
      await switchChain(wagmiConfig, { chainId: SEPOLIA_CHAIN_ID });
    } catch {
      // User refused to switch network: error toast, review dialog stays open
      const errToast: Toast = {
        ...base,
        status: "error",
      };
      // We can trigger an error toast
      set(toastAtom, errToast);
      return;
    }
  }

  set(confirmingAtom, true);

  try {
    // 2. Allowance check for ERC-20 tokens
    if (q.sell !== "ETH" && q.sellRaw && q.sellRaw > 0n) {
      const sellToken = findSepoliaToken(q.sell);
      if (sellToken && sellToken.address !== "native") {
        const allowance = (await readContract(wagmiConfig, {
          address: sellToken.address,
          abi: erc20Abi,
          functionName: "allowance",
          args: [userAddress as Address, SWAP_ROUTER_02_ADDRESS as Address],
        })) as bigint;

        if (allowance < q.sellRaw) {
          set(confirmingTextAtom, `Approve ${q.sell} in wallet`);
          try {
            const approveHash = await writeContract(wagmiConfig, {
              address: sellToken.address,
              abi: erc20Abi,
              functionName: "approve",
              args: [SWAP_ROUTER_02_ADDRESS as Address, q.sellRaw],
            });

            const approveReceipt = await waitForTransactionReceipt(
              wagmiConfig,
              { hash: approveHash },
            );
            if (approveReceipt.status === "reverted") {
              set(toastAtom, { ...base, status: "error" });
              return;
            }
          } catch {
            // User rejected signature in wallet: dialog stays open, no toast
            return;
          }
        }
      }
    }

    // 3. Swap transaction
    set(confirmingTextAtom, "Confirm in wallet");
    const slippagePct = get(slippageAtom);
    const deadlineMinutes = Number(get(deadlineInputAtom)) || 30;

    const swapCall = buildSwap({
      quote: q,
      slippagePct,
      deadlineMinutes,
      userAddress: userAddress as Address,
    });

    let txHash: `0x${string}`;
    try {
      txHash = await sendTransaction(wagmiConfig, {
        to: swapCall.to,
        data: swapCall.data,
        value: swapCall.value,
      });
    } catch {
      // User rejected swap signature: dialog stays open, no toast
      return;
    }

    // Signed successfully: close dialog, reset amounts, show pending toast
    set(reviewOpenAtom, false);
    set(resetAmountsAtom);
    const pendingToast: Toast = {
      ...base,
      status: "pending",
      hash: txHash,
    };
    set(toastAtom, pendingToast);

    // 4. Wait for transaction receipt
    const receipt = await waitForTransactionReceipt(wagmiConfig, {
      hash: txHash,
    });

    if (receipt.status === "success") {
      set(applySwapAtom, { ...base, hash: txHash, at: Date.now() });
      const successToast: Toast = {
        ...base,
        status: "success",
        hash: txHash,
      };
      set(toastAtom, successToast);
      await wait(TOAST_MS);
      if (get(toastAtom) === successToast) {
        set(toastAtom, null);
      }
    } else {
      const errorToast: Toast = {
        ...base,
        status: "error",
        hash: txHash,
      };
      set(toastAtom, errorToast);
      await wait(TOAST_MS);
      if (get(toastAtom) === errorToast) {
        set(toastAtom, null);
      }
    }
  } finally {
    set(confirmingAtom, false);
    set(confirmingTextAtom, null);
  }
});

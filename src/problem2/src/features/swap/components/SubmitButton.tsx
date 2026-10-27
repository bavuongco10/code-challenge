import { useAtomValue, useSetAtom } from "jotai";
import { memo } from "react";

import {
  gasShortAtom,
  reviewOpenAtom,
  sellTokenAtom,
  submitStateAtom,
  toastAtom,
} from "../atoms.ts";
import type { SubmitState } from "../types.ts";
import { connectAtom, switchChainAtom } from "../walletAtoms.ts";
import { Spinner } from "./Spinner.tsx";

const STYLE = {
  "loading-prices": "bg-raised text-muted cursor-not-allowed",
  "prices-error": "bg-raised text-muted cursor-not-allowed",
  "select-token": "bg-raised text-muted cursor-not-allowed",
  "enter-amount": "bg-raised text-muted cursor-not-allowed",
  connect: "bg-primary text-on-fill cursor-pointer",
  "wrong-chain": "bg-primary text-on-fill cursor-pointer",
  quoting: "bg-raised text-muted cursor-not-allowed",
  "no-route": "bg-raised text-muted cursor-not-allowed",
  insufficient: "bg-danger text-on-fill cursor-not-allowed",
  ready: "bg-primary text-on-fill cursor-pointer",
} as const;

const STATIC_LABELS = {
  "loading-prices": "Loading prices…",
  "prices-error": "Prices unavailable",
  "select-token": "Select a token",
  "enter-amount": "Enter an amount",
  connect: "Connect wallet",
  "wrong-chain": "Switch to Sepolia",
  quoting: "Fetching quote…",
  "no-route": "No liquidity for this pair",
  ready: "Review",
} as const;

function getSubmitLabel(
  state: SubmitState,
  sell: string | null,
  isGasShort: boolean,
): string {
  if (state === "insufficient") {
    return isGasShort ? "Not enough ETH" : `Not enough ${sell ?? ""}`;
  }
  return STATIC_LABELS[state];
}

export const SubmitButton = memo(function SubmitButton() {
  const state = useAtomValue(submitStateAtom);
  const sell = useAtomValue(sellTokenAtom);
  const isGasShort = useAtomValue(gasShortAtom);
  const connect = useSetAtom(connectAtom);
  const switchChain = useSetAtom(switchChainAtom);
  const setReview = useSetAtom(reviewOpenAtom);
  const setToast = useSetAtom(toastAtom);

  const buttonText = getSubmitLabel(state, sell, isGasShort);
  const enabled =
    state === "ready" || state === "connect" || state === "wrong-chain";

  const handleClick = async () => {
    if (state === "connect") {
      connect();
    } else if (state === "wrong-chain") {
      const ok = await switchChain();
      if (!ok) {
        setToast({
          status: "error",
          sell: "",
          sellAmount: "",
          buy: "",
          buyAmount: "",
          message:
            "Failed to switch networks — switch to Sepolia in your wallet's settings.",
        });
      }
    } else if (state === "ready") {
      setReview(true);
    }
  };

  return (
    <>
      <button
        id="swap-submit"
        type="button"
        disabled={!enabled}
        onClick={() => void handleClick()}
        className={`pixel-btn pixel-focus mt-4 flex h-14 w-full items-center justify-center gap-2 font-pixel text-sm is-${state} ${STYLE[state]}`}
      >
        {(state === "loading-prices" || state === "quoting") && <Spinner />}
        {buttonText}
      </button>
      <span aria-live="polite" className="sr-only">
        {buttonText}
      </span>
    </>
  );
});

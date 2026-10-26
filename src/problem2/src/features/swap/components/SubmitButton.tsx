import { useAtomValue, useSetAtom } from "jotai";

import { reviewOpenAtom, sellTokenAtom, submitStateAtom } from "../atoms.ts";
import { connectAtom } from "../walletAtoms.ts";
import { Spinner } from "./Spinner.tsx";

const STYLE = {
  "loading-prices": "bg-raised text-muted cursor-not-allowed",
  "select-token": "bg-raised text-muted cursor-not-allowed",
  "enter-amount": "bg-raised text-muted cursor-not-allowed",
  connect: "bg-primary text-on-fill cursor-pointer",
  insufficient: "bg-danger text-on-fill cursor-not-allowed",
  ready: "bg-primary text-on-fill cursor-pointer",
} as const;

export function SubmitButton() {
  const state = useAtomValue(submitStateAtom);
  const sell = useAtomValue(sellTokenAtom);
  const connect = useSetAtom(connectAtom);
  const setReview = useSetAtom(reviewOpenAtom);

  const label = {
    "loading-prices": "Loading prices…",
    "select-token": "Select a token",
    "enter-amount": "Enter an amount",
    connect: "Connect wallet",
    insufficient: `Not enough ${sell ?? ""}`,
    ready: "Review",
  }[state];
  const enabled = state === "ready" || state === "connect";

  return (
    <>
      <button
        id="swap-submit"
        type="button"
        disabled={!enabled}
        onClick={() => (state === "connect" ? connect() : setReview(true))}
        className={`pixel-btn pixel-focus mt-4 flex h-14 w-full items-center justify-center gap-2 font-pixel text-sm is-${state} ${STYLE[state]}`}
      >
        {state === "loading-prices" && <Spinner />}
        {label}
      </button>
      <span aria-live="polite" className="sr-only">
        {label}
      </span>
    </>
  );
}

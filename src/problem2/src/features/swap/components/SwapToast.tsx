import { useAtom } from "jotai";
import { memo } from "react";

import { toastAtom } from "../atoms.ts";
import { ETHERSCAN_TX_URL } from "../constants.ts";
import { PixelIcon } from "./PixelIcon.tsx";
import { Spinner } from "./Spinner.tsx";

const TITLE = {
  pending: "Swapping",
  success: "Swapped",
  error: "Swap failed",
};
const TONE = {
  pending: "is-pending",
  success: "is-success",
  error: "is-error",
};

export const SwapToast = memo(function SwapToast() {
  const [toast, setToast] = useAtom(toastAtom);
  if (!toast) return null;
  const { status } = toast;
  return (
    <div
      id="swap-toast"
      role="status"
      className={`pixel-box fixed right-4 bottom-4 z-50 flex max-w-[320px] items-start gap-3 bg-panel p-3 text-ink ${TONE[status]}`}
    >
      <span
        className={
          status === "error"
            ? "text-danger"
            : status === "success"
              ? "text-success"
              : "text-warn"
        }
      >
        {status === "pending" ? (
          <Spinner />
        ) : (
          <PixelIcon name={status === "success" ? "check" : "cross"} />
        )}
      </span>
      <div className="min-w-0 flex-1 font-mono">
        <div className="toast-title font-pixel text-sm">
          {toast.title ?? TITLE[status]}
        </div>
        <div className="toast-body text-sm text-muted">
          {toast.message ??
            `${toast.sellAmount} ${toast.sell} for ${toast.buyAmount} ${toast.buy}`}
          {toast.hash && status !== "pending" && (
            <a
              id="swap-toast-tx"
              href={ETHERSCAN_TX_URL(toast.hash)}
              target="_blank"
              rel="noopener noreferrer"
              className="pixel-focus mt-1 block text-xs text-primary underline"
            >
              View on Etherscan
            </a>
          )}
        </div>
      </div>
      {status !== "pending" && (
        <button
          id="swap-toast-close"
          type="button"
          aria-label="Dismiss"
          onClick={() => setToast(null)}
          className="pixel-focus"
        >
          <PixelIcon name="close" />
        </button>
      )}
    </div>
  );
});

import { useAtom } from "jotai";

import { toastAtom } from "../atoms.ts";
import { PixelIcon } from "./PixelIcon.tsx";
import { Spinner } from "./Spinner.tsx";

const TITLE = { pending: "Swapping", success: "Swapped", error: "Swap failed" };
const TONE = {
  pending: "is-pending",
  success: "is-success",
  error: "is-error",
};

export function SwapToast() {
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
        <div className="toast-title font-pixel text-sm">{TITLE[status]}</div>
        <div className="toast-body text-sm text-muted">
          {toast.sellAmount} {toast.sell} for {toast.buyAmount} {toast.buy}
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
}

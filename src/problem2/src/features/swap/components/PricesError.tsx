import { useAtomValue, useSetAtom } from "jotai";

import { pricesAtom, retryPricesAtom } from "../atoms.ts";

export function PricesError() {
  const prices = useAtomValue(pricesAtom);
  const retry = useSetAtom(retryPricesAtom);
  if (prices.state !== "error") return null;
  return (
    <div
      id="prices-error"
      role="alert"
      className="pixel-inset mt-4 flex items-center justify-between gap-2 bg-well p-3 text-danger"
    >
      <span>Couldn't load prices</span>
      <button
        id="prices-retry"
        type="button"
        onClick={() => retry()}
        className="pixel-btn pixel-focus bg-primary px-3 py-1 text-on-fill"
      >
        Retry
      </button>
    </div>
  );
}

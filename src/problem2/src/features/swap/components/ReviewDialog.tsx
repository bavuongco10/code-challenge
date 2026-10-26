import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@headlessui/react";
import { useAtomValue, useSetAtom } from "jotai";

import {
  minReceivedAtom,
  pricesAtom,
  quoteAtom,
  reviewOpenAtom,
  slippageAtom,
} from "../atoms.ts";
import {
  formatAmount,
  formatPercent,
  formatRate,
  formatUsd,
} from "../lib/format.ts";
import { confirmingAtom, confirmSwapAtom } from "../swapFlow.ts";
import { PixelIcon } from "./PixelIcon.tsx";
import { Spinner } from "./Spinner.tsx";
import { TokenIcon } from "./TokenIcon.tsx";

function Row({
  id,
  symbol,
  amount,
  usd,
}: {
  id: string;
  symbol: string;
  amount: number;
  usd: number;
}) {
  return (
    <div id={id} className="pixel-inset flex items-center gap-3 bg-well p-3">
      <TokenIcon symbol={symbol} size={32} />
      <div className="min-w-0 flex-1 font-mono">
        <div className="truncate text-lg">
          {formatAmount(amount)} {symbol}
        </div>
        <div className="text-sm text-muted">{formatUsd(usd)}</div>
      </div>
    </div>
  );
}

export function ReviewDialog() {
  const open = useAtomValue(reviewOpenAtom);
  const setOpen = useSetAtom(reviewOpenAtom);
  const quote = useAtomValue(quoteAtom);
  const prices = useAtomValue(pricesAtom);
  const slippage = useAtomValue(slippageAtom);
  const min = useAtomValue(minReceivedAtom);
  const confirming = useAtomValue(confirmingAtom);
  const confirm = useSetAtom(confirmSwapAtom);
  if (prices.state !== "ready" || !quote || min === null) return null;
  const p = prices.prices;

  return (
    <Dialog
      open={open}
      onClose={() => !confirming && setOpen(false)}
      className="relative z-50"
    >
      <DialogBackdrop className="fixed inset-0 bg-shadow/70" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel
          id="review-dialog"
          className="pixel-box w-full max-w-[420px] space-y-3 bg-panel p-4 text-ink"
        >
          <div className="flex items-center justify-between">
            <DialogTitle className="font-pixel text-base">
              You're swapping
            </DialogTitle>
            <button
              type="button"
              aria-label="Close"
              disabled={confirming}
              onClick={() => setOpen(false)}
              className="pixel-focus pixel-btn p-1"
            >
              <PixelIcon name="close" />
            </button>
          </div>
          <Row
            id="review-sell"
            symbol={quote.sell}
            amount={quote.sellAmount}
            usd={quote.sellAmount * (p[quote.sell] ?? 0)}
          />
          <Row
            id="review-buy"
            symbol={quote.buy}
            amount={quote.buyAmount}
            usd={quote.buyAmount * (p[quote.buy] ?? 0)}
          />
          <Disclosure as="div" className="text-sm">
            {({ open: more }) => (
              <>
                <DisclosureButton
                  id="review-more"
                  className="pixel-focus font-pixel text-primary"
                >
                  {more ? "Show less" : "Show more"}
                </DisclosureButton>
                <DisclosurePanel
                  id="review-details"
                  as="dl"
                  className="mt-2 space-y-1 font-mono"
                >
                  <div className="flex justify-between">
                    <dt className="text-muted">Rate</dt>
                    <dd>{formatRate(quote, false, p)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted">Fee</dt>
                    <dd className="text-success">Free</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted">Max slippage</dt>
                    <dd>{formatPercent(slippage)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted">Min received</dt>
                    <dd>
                      {formatAmount(min)} {quote.buy}
                    </dd>
                  </div>
                </DisclosurePanel>
              </>
            )}
          </Disclosure>
          <button
            id="confirm-swap"
            type="button"
            disabled={confirming}
            onClick={() => void confirm()}
            className={`pixel-focus pixel-btn flex w-full items-center justify-center gap-2 bg-primary p-3 font-pixel text-on-fill ${confirming ? "is-confirming" : ""}`}
          >
            {confirming ? (
              <>
                <Spinner /> Confirm in wallet
              </>
            ) : (
              "Confirm swap"
            )}
          </button>
        </DialogPanel>
      </div>
    </Dialog>
  );
}

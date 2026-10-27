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
import { memo, useEffect, useState } from "react";

import {
  minReceivedAtom,
  pricesAtom,
  quoteAtom,
  reviewOpenAtom,
  slippageAtom,
} from "../atoms.ts";
import { MIN_RECEIVED_HELP, SLIPPAGE_HELP } from "../constants.ts";
import {
  formatAmount,
  formatPercent,
  formatRate,
  formatUsd,
} from "../lib/format.ts";
import { fetchNetworkCost } from "../sepolia/sepoliaQueryAtoms.ts";
import {
  confirmingAtom,
  confirmingTextAtom,
  confirmSwapAtom,
} from "../swapFlow.ts";
import { walletModeAtom } from "../walletAtoms.ts";
import { InfoTip } from "./InfoTip.tsx";
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

function ReviewDialogContent({ onClose }: { onClose: () => void }) {
  const quote = useAtomValue(quoteAtom);
  const prices = useAtomValue(pricesAtom);
  const slippage = useAtomValue(slippageAtom);
  const min = useAtomValue(minReceivedAtom);
  const confirming = useAtomValue(confirmingAtom);
  const confirmingText = useAtomValue(confirmingTextAtom);
  const confirm = useSetAtom(confirmSwapAtom);
  const mode = useAtomValue(walletModeAtom);

  const [networkCost, setNetworkCost] = useState("<0.001 ETH");

  useEffect(() => {
    if (mode === "sepolia") {
      void fetchNetworkCost().then(setNetworkCost);
    }
  }, [mode]);

  if (prices.state !== "ready" || !quote || min === null) return null;
  const p = prices.prices;

  return (
    <>
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
              onClick={onClose}
              className="pixel-btn pixel-focus p-1"
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
                    <dt className="text-muted">
                      Max slippage
                      <InfoTip label="max slippage" text={SLIPPAGE_HELP} />
                    </dt>
                    <dd>{formatPercent(slippage)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted">
                      Min received
                      <InfoTip label="min received" text={MIN_RECEIVED_HELP} />
                    </dt>
                    <dd>
                      {formatAmount(min)} {quote.buy}
                    </dd>
                  </div>
                  {mode === "sepolia" && (
                    <div className="flex justify-between">
                      <dt className="text-muted">Network cost</dt>
                      <dd id="review-network-cost">{networkCost}</dd>
                    </div>
                  )}
                </DisclosurePanel>
              </>
            )}
          </Disclosure>
          <button
            id="confirm-swap"
            type="button"
            disabled={confirming}
            onClick={() => void confirm()}
            className={`pixel-btn pixel-focus flex w-full items-center justify-center gap-2 bg-primary p-3 font-pixel text-on-fill ${confirming ? "is-confirming" : ""}`}
          >
            {confirming ? (
              <>
                <Spinner /> {confirmingText ?? "Confirm in wallet"}
              </>
            ) : (
              "Confirm swap"
            )}
          </button>
        </DialogPanel>
      </div>
    </>
  );
}

export const ReviewDialog = memo(function ReviewDialog() {
  const open = useAtomValue(reviewOpenAtom);
  const setOpen = useSetAtom(reviewOpenAtom);
  const confirming = useAtomValue(confirmingAtom);

  return (
    <Dialog
      open={open}
      onClose={() => !confirming && setOpen(false)}
      className="relative z-50"
    >
      {open && <ReviewDialogContent onClose={() => setOpen(false)} />}
    </Dialog>
  );
});

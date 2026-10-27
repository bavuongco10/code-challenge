import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@headlessui/react";
import { useAtomValue } from "jotai";
import { useState } from "react";

import { InfoTip } from "./InfoTip.tsx";
import { PixelIcon } from "./PixelIcon.tsx";

import {
  isCustomSlippageAtom,
  minReceivedAtom,
  pricesAtom,
  quoteAtom,
  slippageAtom,
} from "../atoms.ts";
import { MIN_RECEIVED_HELP, SLIPPAGE_HELP } from "../constants.ts";
import { formatAmount, formatPercent, formatRate } from "../lib/format.ts";

export function RateDetails() {
  const quote = useAtomValue(quoteAtom);
  const prices = useAtomValue(pricesAtom);
  const slippage = useAtomValue(slippageAtom);
  const custom = useAtomValue(isCustomSlippageAtom);
  const min = useAtomValue(minReceivedAtom);
  const [inverted, setInverted] = useState(false);
  if (!quote || prices.state !== "ready" || min === null) return null;

  return (
    <Disclosure as="div" className="mt-3 text-sm">
      {({ open }) => (
        <>
          <div className="flex items-center justify-between gap-2">
            <button
              id="rate"
              type="button"
              className={`pixel-focus font-mono text-muted ${inverted ? "is-inverted" : ""}`}
              onClick={() => setInverted((v) => !v)}
            >
              {formatRate(quote, inverted, prices.prices)}
            </button>
            <DisclosureButton
              id="details-toggle"
              aria-controls="swap-details"
              aria-label="Show details"
              className="pixel-focus pixel-btn px-2 font-pixel"
            >
              <PixelIcon
                name="chevron-down"
                className={`size-4 ${open ? "rotate-180" : ""}`}
              />
            </DisclosureButton>
          </div>
          <DisclosurePanel
            id="swap-details"
            as="dl"
            className="pixel-inset mt-2 space-y-1 bg-well p-2 font-mono"
          >
            <div className="flex justify-between">
              <dt className="text-muted">Fee</dt>
              <dd id="detail-fee" className="is-free text-success">
                Free
              </dd>
            </div>
            <div id="detail-slippage" className="flex justify-between">
              <dt className="text-muted">
                Max slippage
                <InfoTip label="max slippage" text={SLIPPAGE_HELP} />
              </dt>
              <dd>
                {!custom && (
                  <span className="slippage-auto mr-1 bg-accent px-1 text-on-accent">
                    Auto
                  </span>
                )}
                <span className="slippage-value">
                  {formatPercent(slippage)}
                </span>
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">
                Min received
                <InfoTip label="min received" text={MIN_RECEIVED_HELP} />
              </dt>
              <dd id="detail-min-received">
                {formatAmount(min)} {quote.buy}
              </dd>
            </div>
          </DisclosurePanel>
        </>
      )}
    </Disclosure>
  );
}

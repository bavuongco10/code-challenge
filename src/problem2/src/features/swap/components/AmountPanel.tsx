import { Field, Input, Label } from "@headlessui/react";
import { useAtomValue, useSetAtom } from "jotai";
import { useState } from "react";

import {
  amountsAtom,
  buyTokenAtom,
  insufficientAtom,
  pricesAtom,
  quoteAtom,
  sellTokenAtom,
  setAmountAtom,
} from "../atoms.ts";
import { formatAmount, formatUsd } from "../lib/format.ts";
import type { Side } from "../types.ts";
import { balancesAtom, connectedAtom } from "../walletAtoms.ts";
import { AmountPresets } from "./AmountPresets.tsx";
import { TokenButton } from "./TokenButton.tsx";

export function AmountPanel({ side }: { side: Side }) {
  const value = useAtomValue(amountsAtom)[side];
  const setAmount = useSetAtom(setAmountAtom);
  const token = useAtomValue(side === "sell" ? sellTokenAtom : buyTokenAtom);
  const quote = useAtomValue(quoteAtom);
  const prices = useAtomValue(pricesAtom);
  const connected = useAtomValue(connectedAtom);
  const balances = useAtomValue(balancesAtom);
  const insufficient = useAtomValue(insufficientAtom) && side === "sell";
  const [active, setActive] = useState(false);

  const amount = quote ? quote[`${side}Amount`] : 0;
  const price = token && prices.state === "ready" ? prices.prices[token] : 0;
  const balance = token ? (balances?.[token] ?? 0) : 0;
  const label = side === "sell" ? "Amount to send" : "Amount to receive";
  // ids/labels from the original brief (.problem/index.html)
  const id = side === "sell" ? "input-amount" : "output-amount";

  return (
    <Field
      className="pixel-inset flex flex-col gap-1 bg-well p-3 focus-within:[--frame:var(--frame-primary)]"
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      onFocus={() => setActive(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setActive(false);
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-1">
        <Label
          htmlFor={id}
          className="font-pixel text-[12px] whitespace-nowrap text-muted py-2"
        >
          {label}
        </Label>
        {side === "sell" && active && connected && balance > 0 && (
          <AmountPresets />
        )}
      </div>
      <div className="flex items-center gap-2">
        <Input
          id={id}
          inputMode="decimal"
          autoComplete="off"
          placeholder="0"
          value={value}
          onChange={(e) => setAmount(side, e.target.value)}
          aria-invalid={insufficient || undefined}
          aria-describedby={insufficient ? "sell-balance" : undefined}
          className={`min-w-0 flex-1 bg-transparent font-mono text-3xl outline-none placeholder:text-dim ${
            insufficient ? "is-error text-danger" : "text-ink"
          }`}
        />
        <TokenButton side={side} />
      </div>
      <div className="flex justify-between font-mono text-lg text-muted">
        <span id={`${side}-usd`}>{formatUsd(amount * price)}</span>
        {connected && token && (
          <span
            id={`${side}-balance`}
            className={insufficient ? "is-error text-danger" : undefined}
          >
            {formatAmount(balance)} {token}
          </span>
        )}
      </div>
    </Field>
  );
}

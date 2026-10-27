import { ComboboxOption } from "@headlessui/react";
import { memo } from "react";
import { formatAmount } from "../lib/format.ts";
import { TokenIcon } from "./TokenIcon.tsx";

export const TokenOption = memo(function TokenOption({
  symbol,
  balance,
}: {
  symbol: string;
  balance: number;
}) {
  return (
    <ComboboxOption
      value={symbol}
      id={`token-option-${symbol}`}
      className="token-option flex cursor-pointer items-center gap-3 px-3 py-2 data-[focus]:bg-well data-[selected]:bg-well"
    >
      <TokenIcon symbol={symbol} size={28} />
      <span className="token-symbol font-pixel text-xs">{symbol}</span>
      {balance > 0 && (
        <span className="token-balance ml-auto font-mono text-xl text-muted">
          {formatAmount(balance)}
        </span>
      )}
    </ComboboxOption>
  );
});

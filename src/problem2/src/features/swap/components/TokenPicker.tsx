import {
  Combobox,
  ComboboxInput,
  ComboboxOptions,
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
  Label,
} from "@headlessui/react";
import { useAtomValue, useSetAtom } from "jotai";
import { useMemo, useState } from "react";
import { pickerSideAtom, pickTokenAtom, tokensAtom } from "../atoms.ts";
import type { Side } from "../types.ts";
import { balancesAtom, connectedAtom } from "../walletAtoms.ts";
import { PixelIcon } from "./PixelIcon.tsx";
import { TokenOption } from "./TokenOption.tsx";

function Heading({ children }: { children: string }) {
  return (
    <li className="px-3 pt-2 font-pixel text-[10px] text-muted uppercase">
      {children}
    </li>
  );
}

function TokenPickerContent({
  side,
  onClose,
}: {
  side: Side;
  onClose: () => void;
}) {
  const pick = useSetAtom(pickTokenAtom);
  const tokens = useAtomValue(tokensAtom);
  const balances = useAtomValue(balancesAtom);
  const connected = useAtomValue(connectedAtom);
  const [query, setQuery] = useState("");

  const { mine, rest, isEmpty } = useMemo(() => {
    const q = query.trim().toLowerCase();
    const mineList: { symbol: string; balance: number }[] = [];
    const restList: { symbol: string; balance: number }[] = [];

    for (const symbol of tokens) {
      if (q && !symbol.toLowerCase().includes(q)) continue;
      const balance = balances?.[symbol] ?? 0;
      if (connected && balance > 0) {
        mineList.push({ symbol, balance });
      } else {
        restList.push({ symbol, balance });
      }
    }
    return {
      mine: mineList,
      rest: restList,
      isEmpty: mineList.length === 0 && restList.length === 0,
    };
  }, [tokens, query, balances, connected]);

  return (
    <>
      <DialogBackdrop className="fixed inset-0 bg-shadow/70" />
      <div className="fixed inset-0 flex items-end justify-center min-[480px]:items-center min-[480px]:p-4">
        <DialogPanel className="pixel-box flex max-h-[80dvh] w-full flex-col bg-panel text-ink min-[480px]:max-w-[420px]">
          <div className="flex items-center justify-between p-3">
            <DialogTitle className="font-pixel text-sm">
              Select token
            </DialogTitle>
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="pixel-focus p-1"
            >
              <PixelIcon name="close" />
            </button>
          </div>
          <Combobox
            value={null}
            onChange={(s: string | null) => {
              if (s) {
                pick(side, s);
                setQuery("");
              }
            }}
          >
            <Label className="sr-only">Search tokens</Label>
            <div className="px-3 pb-2">
              <ComboboxInput
                id="token-search"
                autoFocus
                placeholder="Search tokens"
                autoComplete="off"
                onChange={(e) => setQuery(e.target.value)}
                className="pixel-inset pixel-focus w-full bg-well px-3 py-2 font-mono text-xl"
              />
            </div>
            <ComboboxOptions
              static
              className="min-h-0 flex-1 overflow-y-auto pb-2"
            >
              {mine.length > 0 && <Heading>Your tokens</Heading>}
              {mine.map(({ symbol, balance }) => (
                <TokenOption key={symbol} symbol={symbol} balance={balance} />
              ))}
              {mine.length > 0 && rest.length > 0 && (
                <Heading>All tokens</Heading>
              )}
              {rest.map(({ symbol, balance }) => (
                <TokenOption key={symbol} symbol={symbol} balance={balance} />
              ))}
            </ComboboxOptions>
          </Combobox>
          {isEmpty && (
            <p
              id="token-empty"
              role="status"
              className="px-3 pb-4 font-mono text-xl text-muted"
            >
              No results found for {query}
            </p>
          )}
        </DialogPanel>
      </div>
    </>
  );
}

export function TokenPicker() {
  const side = useAtomValue(pickerSideAtom);
  const setSide = useSetAtom(pickerSideAtom);

  return (
    <Dialog
      open={side !== null}
      onClose={() => setSide(null)}
      id="token-picker"
      className="relative z-50"
    >
      {side !== null && (
        <TokenPickerContent side={side} onClose={() => setSide(null)} />
      )}
    </Dialog>
  );
}

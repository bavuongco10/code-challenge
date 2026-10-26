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
import { useState } from "react";
import { pickerSideAtom, pickTokenAtom, tokensAtom } from "../atoms.ts";
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

export function TokenPicker() {
  const side = useAtomValue(pickerSideAtom);
  const setSide = useSetAtom(pickerSideAtom);
  const pick = useSetAtom(pickTokenAtom);
  const tokens = useAtomValue(tokensAtom);
  const balances = useAtomValue(balancesAtom);
  const connected = useAtomValue(connectedAtom);
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const shown = tokens.filter((t) => t.toLowerCase().includes(q));
  const bal = (t: string) => balances?.[t] ?? 0;
  const mine = connected ? shown.filter((t) => bal(t) > 0) : [];
  const rest = connected ? shown.filter((t) => bal(t) <= 0) : shown;
  const close = () => {
    setSide(null);
    setQuery("");
  };

  return (
    <Dialog
      open={side !== null}
      onClose={close}
      id="token-picker"
      className="relative z-50"
    >
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
              onClick={close}
              className="pixel-focus p-1"
            >
              <PixelIcon name="close" />
            </button>
          </div>
          <Combobox
            value={null}
            onChange={(s: string | null) => {
              if (s && side) {
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
              {mine.map((t) => (
                <TokenOption key={t} symbol={t} balance={bal(t)} />
              ))}
              {mine.length > 0 && rest.length > 0 && (
                <Heading>All tokens</Heading>
              )}
              {rest.map((t) => (
                <TokenOption key={t} symbol={t} balance={bal(t)} />
              ))}
            </ComboboxOptions>
          </Combobox>
          {shown.length === 0 && (
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
    </Dialog>
  );
}

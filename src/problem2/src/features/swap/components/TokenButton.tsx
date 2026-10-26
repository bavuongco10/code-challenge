import { useAtomValue, useSetAtom } from "jotai";

import { buyTokenAtom, pickerSideAtom, sellTokenAtom } from "../atoms.ts";
import type { Side } from "../types.ts";
import { PixelIcon } from "./PixelIcon.tsx";
import { TokenIcon } from "./TokenIcon.tsx";

export function TokenButton({ side }: { side: Side }) {
  const token = useAtomValue(side === "sell" ? sellTokenAtom : buyTokenAtom);
  const openPicker = useSetAtom(pickerSideAtom);
  return (
    <button
      type="button"
      id={`${side}-token`}
      aria-haspopup="dialog"
      onClick={() => openPicker(side)}
      className={`pixel-btn pixel-focus flex shrink-0 items-center gap-2 px-3 py-2 font-pixel text-xs ${
        token ? "bg-well text-ink" : "is-empty bg-primary text-on-fill"
      }`}
    >
      {token ? (
        <>
          <TokenIcon symbol={token} />
          <span className="token-symbol">{token}</span>
        </>
      ) : (
        <span>Select token</span>
      )}
      <PixelIcon name="chevron-down" className="size-4" />
    </button>
  );
}

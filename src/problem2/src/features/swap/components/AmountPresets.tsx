import { useSetAtom } from "jotai";

import { setPresetAtom } from "../atoms.ts";

const PRESETS = [25, 50, 75, 100];

export function AmountPresets() {
  const setPreset = useSetAtom(setPresetAtom);
  return (
    <div className="flex gap-1">
      {PRESETS.map((p) => (
        <button
          key={p}
          type="button"
          data-percent={p}
          onClick={() => setPreset(p)}
          className="amount-preset pixel-focus border-2 border-ink bg-well px-1.5 font-mono text-base text-ink hover:bg-accent hover:text-on-accent"
        >
          {p === 100 ? "Max" : `${p}%`}
        </button>
      ))}
    </div>
  );
}

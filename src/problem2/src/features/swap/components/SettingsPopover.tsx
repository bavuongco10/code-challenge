import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { useAtom, useAtomValue } from "jotai";

import {
  deadlineInputAtom,
  slippageInputAtom,
  slippageLevelAtom,
} from "../atoms.ts";
import { DEFAULT_DEADLINE } from "../constants.ts";
import { sanitizeDeadline, sanitizeSlippage, toNumber } from "../lib/amount.ts";
import { formatPercent } from "../lib/format.ts";
import { PixelIcon } from "./PixelIcon.tsx";

const LEVEL = {
  high: "is-high text-warn",
  "very-high": "is-very-high text-danger",
};

export function SettingsPopover() {
  const [slippage, setSlippage] = useAtom(slippageInputAtom);
  const [deadline, setDeadline] = useAtom(deadlineInputAtom);
  const level = useAtomValue(slippageLevelAtom);
  const custom = slippage !== "";
  const deadlineHigh = toNumber(deadline) >= 60;

  return (
    <Popover className="relative">
      <PopoverButton
        id="settings-toggle"
        aria-label="Settings"
        className={`pixel-focus pixel-btn flex items-center gap-1 p-1 ${level ? LEVEL[level] : ""}`}
      >
        <PixelIcon name="gear" className="size-5" />
        {custom && (
          <span className="slippage-badge font-mono text-xs">
            {formatPercent(toNumber(slippage))}
          </span>
        )}
      </PopoverButton>
      <PopoverPanel
        id="settings-panel"
        className="pixel-box absolute right-0 z-30 mt-3 w-72 space-y-4 bg-panel p-3 text-sm"
      >
        <div>
          <label htmlFor="slippage-input" className="font-pixel">
            Max slippage
          </label>
          <div className="mt-1 flex items-center gap-2">
            <button
              id="slippage-auto"
              type="button"
              className={`pixel-focus pixel-btn px-2 ${custom ? "" : "is-active bg-primary text-on-fill"}`}
              onClick={() => setSlippage("")}
            >
              Auto
            </button>
            <input
              id="slippage-input"
              inputMode="decimal"
              placeholder="0.5"
              autoComplete="off"
              value={slippage}
              aria-describedby={level ? "slippage-warning" : undefined}
              className="pixel-inset pixel-focus min-w-0 flex-1 bg-well px-2 font-mono text-ink placeholder:text-dim"
              onChange={(e) =>
                setSlippage((p) => sanitizeSlippage(p, e.target.value))
              }
              onBlur={() => toNumber(slippage) === 0 && setSlippage("")}
            />
            <span aria-hidden="true">%</span>
          </div>
          {level && (
            <p
              id="slippage-warning"
              aria-live="polite"
              className={`mt-1 ${LEVEL[level]}`}
            >
              {level === "high" ? "High slippage" : "Very high slippage"}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="deadline-input" className="font-pixel">
            Swap deadline
          </label>
          <div className="mt-1 flex items-center gap-2">
            <input
              id="deadline-input"
              inputMode="numeric"
              autoComplete="off"
              value={deadline}
              aria-describedby={deadlineHigh ? "deadline-warning" : undefined}
              className="pixel-inset pixel-focus min-w-0 flex-1 bg-well px-2 font-mono text-ink placeholder:text-dim"
              onChange={(e) => setDeadline(sanitizeDeadline(e.target.value))}
              onBlur={() =>
                toNumber(deadline) === 0 &&
                setDeadline(String(DEFAULT_DEADLINE))
              }
            />
            <span>minutes</span>
          </div>
          {deadlineHigh && (
            <p
              id="deadline-warning"
              aria-live="polite"
              className="is-high mt-1 text-warn"
            >
              High deadline
            </p>
          )}
        </div>
      </PopoverPanel>
    </Popover>
  );
}

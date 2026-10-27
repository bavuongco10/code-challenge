import { useState } from "react";
import { ICON_URL } from "../constants.ts";

const FAILED_ICONS = new Set<string>();

export function TokenIcon({
  symbol,
  size = 24,
}: {
  symbol: string;
  size?: number;
}) {
  const [failed, setFailed] = useState(() => FAILED_ICONS.has(symbol));
  const box = { width: size, height: size };
  if (failed || FAILED_ICONS.has(symbol))
    return (
      <span
        aria-hidden="true"
        style={{ ...box, fontSize: Math.max(8, size / 2) }}
        className="inline-flex shrink-0 items-center justify-center bg-accent font-pixel text-on-accent"
      >
        {symbol.charAt(0).toUpperCase()}
      </span>
    );
  return (
    <img
      src={ICON_URL(symbol)}
      alt=""
      style={{ ...box, imageRendering: "pixelated" }}
      className="shrink-0"
      onError={() => {
        FAILED_ICONS.add(symbol);
        setFailed(true);
      }}
    />
  );
}

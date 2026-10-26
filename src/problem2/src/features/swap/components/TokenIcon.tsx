import { useState } from "react";
import { ICON_URL } from "../constants.ts";

export function TokenIcon({
  symbol,
  size = 24,
}: {
  symbol: string;
  size?: number;
}) {
  const [failed, setFailed] = useState<string | null>(null);
  const box = { width: size, height: size };
  if (failed === symbol)
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
      onError={() => setFailed(symbol)}
    />
  );
}

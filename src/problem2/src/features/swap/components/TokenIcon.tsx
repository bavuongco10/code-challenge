import { memo, useState } from "react";
import { ICON_URL } from "../constants.ts";

const FAILED_ICONS = new Set<string>();

export const TokenIcon = memo(function TokenIcon({
  symbol,
  size = 24,
}: {
  symbol: string;
  size?: number;
}) {
  const [, setFailedVersion] = useState(0);
  const isFailed = FAILED_ICONS.has(symbol);

  if (isFailed) {
    return (
      <span
        aria-hidden="true"
        style={{ width: size, height: size, fontSize: Math.max(8, size / 2) }}
        className="inline-flex shrink-0 items-center justify-center bg-accent font-pixel text-on-accent"
      >
        {symbol.charAt(0).toUpperCase()}
      </span>
    );
  }

  return (
    <img
      src={ICON_URL(symbol)}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      style={{ width: size, height: size, imageRendering: "pixelated" }}
      className="shrink-0"
      onError={() => {
        FAILED_ICONS.add(symbol);
        setFailedVersion((v) => v + 1);
      }}
    />
  );
});

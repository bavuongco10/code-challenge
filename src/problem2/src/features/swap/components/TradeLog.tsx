import { useAtomValue } from "jotai";

import { walletAtom } from "../walletAtoms.ts";

const MAX_LINES = 5; // more are clipped when the viewport is short

const time = (at: number) =>
  new Date(at).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });

export function TradeLog() {
  const items = useAtomValue(walletAtom)?.activity.slice(0, MAX_LINES) ?? [];
  return (
    <section
      id="trade-log"
      aria-labelledby="trade-log-title"
      className="pixel-box mx-auto mt-4 flex min-h-0 w-full [@media(max-height:759px)]:hidden max-w-[480px] flex-col bg-terminal p-3 font-mono text-base text-on-terminal"
    >
      <h2 id="trade-log-title" className="font-pixel text-[10px] uppercase">
        &gt; Trade log
      </h2>
      {/* column wrap pushes lines that don't fit into a clipped 2nd column: no half-cut lines */}
      <ul className="mt-1 flex min-h-0 shrink flex-col flex-wrap overflow-hidden">
        {items.length === 0 ? (
          <li className="w-full">No swaps yet</li>
        ) : (
          items.map((a) => (
            <li key={a.at} className="trade-log-item w-full truncate">
              <time
                dateTime={new Date(a.at).toISOString()}
                className="text-on-terminal-dim"
              >
                {time(a.at)}
              </time>{" "}
              SWAPPED {a.sellAmount} {a.sell} → {a.buyAmount} {a.buy}
            </li>
          ))
        )}
      </ul>
      <p aria-hidden>
        &gt;{" "}
        <span className="inline-block h-4 w-2.5 animate-blink bg-on-terminal align-middle" />
      </p>
    </section>
  );
}

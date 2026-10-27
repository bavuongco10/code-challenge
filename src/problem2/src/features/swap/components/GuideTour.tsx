import { useAtom } from "jotai";
import { memo, useState } from "react";
import { ACTIONS, EVENTS, Joyride, type Step } from "react-joyride";

import { tourDoneAtom } from "../atoms.ts";
import { TourTooltip } from "./TourTooltip.tsx";

const STEPS: Step[] = [
  {
    target: "#wallet-mode",
    title: "Wallet mode",
    content:
      "Demo uses a fake wallet with play money. Sepolia testnet is coming soon.",
  },
  {
    target: "#connect-wallet, #account-button",
    title: "Wallet",
    content: "Connect the demo wallet to see balances and swap.",
  },
  {
    target: "#input-amount",
    title: "You send",
    content: "Type how much to sell. The buy side updates live.",
  },
  {
    target: "#sell-token",
    title: "Pick tokens",
    content: "Choose the token to sell here, and the one to buy below.",
  },
  {
    target: "#buy-token",
    title: "You receive",
    content:
      "Pick what you want back. The arrow button between them flips the pair.",
  },
  {
    target: "#settings-toggle",
    title: "Settings",
    content: "Set slippage tolerance and the transaction deadline.",
  },
  {
    target: "#swap-submit",
    title: "Swap",
    content:
      "Review the quote, then confirm. It tells you what's missing first.",
  },
  {
    target: "#trade-log",
    title: "Trade log",
    content: "Your recent swaps show up here.",
  },
];

export const GuideTour = memo(function GuideTour() {
  const [done, setDone] = useAtom(tourDoneAtom);
  // `done` persists only after Next or Skip; `run` is this visit only
  const [run, setRun] = useState(!done);
  return (
    <>
      <button
        id="tour-start"
        type="button"
        aria-label="Start guided tour"
        title="Guided tour"
        onClick={() => setRun(true)}
        className="pixel-btn pixel-focus bg-raised px-2 py-1 font-pixel text-[10px]"
      >
        ?
      </button>
      {/* mount = fresh tour from step 1; unmount on end */}
      {run && (
        <Joyride
          run
          continuous
          steps={STEPS}
          tooltipComponent={TourTooltip}
          options={{
            skipBeacon: true,
            overlayColor: "#050820cc",
            spotlightRadius: 0,
            arrowColor: "#f4f4f8",
            zIndex: 50,
            // only Next / Skip end or advance it
            overlayClickAction: false,
            dismissKeyAction: false,
          }}
          onEvent={(e) => {
            if (e.action === ACTIONS.NEXT || e.action === ACTIONS.SKIP)
              setDone(true);
            if (e.type === EVENTS.TOUR_END) setRun(false);
          }}
        />
      )}
    </>
  );
});

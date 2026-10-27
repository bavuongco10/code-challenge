import { useAtom, useAtomValue } from "jotai";
import { memo, useMemo, useState } from "react";
import { ACTIONS, EVENTS, Joyride, type Step } from "react-joyride";

import { tourDoneAtom } from "../atoms.ts";
import type { WalletMode } from "../types.ts";
import { walletModeAtom } from "../walletAtoms.ts";
import { TourTooltip } from "./TourTooltip.tsx";

const getSteps = (mode: WalletMode): Step[] => [
  {
    target: "#wallet-mode",
    title: "Wallet mode",
    content:
      mode === "sepolia"
        ? "You are on Sepolia testnet. Toggle between live testnet swaps and simulated Demo mode."
        : "Switch between Demo (simulated play money) and live Sepolia testnet.",
  },
  ...(mode === "sepolia"
    ? [
        {
          target: "#testnet-badge",
          title: "Testnet badge",
          content:
            "Indicates you are trading on Ethereum Sepolia testnet using real Uniswap V3 pools.",
        },
      ]
    : []),
  {
    target: "#connect-wallet, #account-button",
    title: "Wallet",
    content:
      mode === "sepolia"
        ? "Connect your Web3 wallet (MetaMask, Coinbase, etc.) to view balances and sign swaps."
        : "Connect the demo wallet to see balances and swap.",
  },
  {
    target: "#input-amount",
    title: "You send",
    content:
      mode === "sepolia"
        ? "Type how much to sell. Quotes and gas estimates fetch live from Sepolia."
        : "Type how much to sell. The buy side updates live.",
  },
  {
    target: "#sell-token",
    title: "Pick tokens",
    content:
      mode === "sepolia"
        ? "Choose between ETH, WETH, USDC, and UNI on Sepolia."
        : "Choose the token to sell here, and the one to buy below.",
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
      mode === "sepolia"
        ? "Review the on-chain quote, network fee, and token approvals, then confirm."
        : "Review the quote, then confirm. It tells you what's missing first.",
  },
  {
    target: "#trade-log",
    title: "Trade log",
    content:
      mode === "sepolia"
        ? "Your on-chain transactions appear here with direct links to Sepolia Etherscan."
        : "Your recent swaps show up here.",
  },
];

export const GuideTour = memo(function GuideTour() {
  const [done, setDone] = useAtom(tourDoneAtom);
  const mode = useAtomValue(walletModeAtom);
  // `done` persists only after Next or Skip; `run` is this visit only
  const [run, setRun] = useState(!done);
  const steps = useMemo(() => getSteps(mode), [mode]);

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
          key={mode}
          run
          continuous
          steps={steps}
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

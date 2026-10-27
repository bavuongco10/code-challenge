import { useAtomValue } from "jotai";

import { gasShortAtom } from "../atoms.ts";
import { AmountPanel } from "./AmountPanel.tsx";
import { FlipButton } from "./FlipButton.tsx";
import { PricesError } from "./PricesError.tsx";
import { RateDetails } from "./RateDetails.tsx";
import { ReviewDialog } from "./ReviewDialog.tsx";
import { SettingsPopover } from "./SettingsPopover.tsx";
import { SubmitButton } from "./SubmitButton.tsx";
import { SwapToast } from "./SwapToast.tsx";
import { TokenPicker } from "./TokenPicker.tsx";

function GasBanner() {
  const isGasShort = useAtomValue(gasShortAtom);
  if (!isGasShort) return null;
  return (
    <div
      id="gas-banner"
      role="alert"
      className="pixel-box mt-3 border-danger bg-danger/10 p-2 text-center font-mono text-xs text-danger"
    >
      Not enough ETH on Sepolia to swap
    </div>
  );
}

export function SwapCard() {
  return (
    <section className="pixel-box mx-auto w-full max-w-[480px] bg-panel p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-pixel text-base">Swap</h2>
        <SettingsPopover />
      </div>
      <AmountPanel side="sell" />
      <FlipButton />
      <AmountPanel side="buy" />
      <RateDetails />
      <PricesError />
      <GasBanner />
      <SubmitButton />
      <TokenPicker />
      <ReviewDialog />
      <SwapToast />
    </section>
  );
}

import { ReviewDialog } from "./ReviewDialog.tsx";
import { SwapToast } from "./SwapToast.tsx";
import { RateDetails } from "./RateDetails.tsx";
import { SettingsPopover } from "./SettingsPopover.tsx";
import { AmountPanel } from "./AmountPanel.tsx";
import { FlipButton } from "./FlipButton.tsx";
import { PricesError } from "./PricesError.tsx";
import { SubmitButton } from "./SubmitButton.tsx";
import { TokenPicker } from "./TokenPicker.tsx";
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
      <SubmitButton />
      <TokenPicker />
      <ReviewDialog />
      <SwapToast />
    </section>
  );
}

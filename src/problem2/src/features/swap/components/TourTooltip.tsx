import type { TooltipRenderProps } from "react-joyride";

const BTN = "pixel-btn pixel-focus px-2 py-1 font-pixel text-[8px]";

export function TourTooltip({
  step,
  index,
  size,
  isLastStep,
  backProps,
  primaryProps,
  skipProps,
  tooltipProps,
}: TooltipRenderProps) {
  return (
    <div
      {...tooltipProps}
      id="tour-tooltip"
      className="pixel-box w-72 max-w-[calc(100vw-2rem)] bg-panel p-3 text-ink"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-pixel text-[10px] text-accent">{step.title}</h2>
        <span className="font-mono text-sm text-dim">
          {index + 1}/{size}
        </span>
      </div>
      <div className="mt-2 font-mono text-lg leading-tight">{step.content}</div>
      <div className="mt-3 flex items-center gap-2">
        {!isLastStep && (
          <button {...skipProps} className={`${BTN} bg-well text-muted`}>
            Skip
          </button>
        )}
        <span className="flex-1" />
        {index > 0 && (
          <button {...backProps} className={`${BTN} bg-raised`}>
            Back
          </button>
        )}
        <button {...primaryProps} className={`${BTN} bg-primary text-on-fill`}>
          {isLastStep ? "Done" : "Next"}
        </button>
      </div>
    </div>
  );
}

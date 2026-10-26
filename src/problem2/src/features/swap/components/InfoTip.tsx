import { useId } from "react";

// CSS-only hover/focus tooltip, same pattern as WalletModeSwitch's "Coming soon".
export function InfoTip({ label, text }: { label: string; text: string }) {
  const id = useId();
  return (
    <span className="group relative ml-1 inline-flex align-middle">
      <span
        tabIndex={0}
        role="button"
        aria-label={`About ${label}`}
        aria-describedby={id}
        className="pixel-focus inline-flex size-4 cursor-help items-center justify-center bg-well font-mono text-[10px] text-muted"
      >
        ?
      </span>
      <span
        id={id}
        role="tooltip"
        className="pixel-box pointer-events-none absolute top-full left-0 z-40 mt-2 hidden w-56 bg-accent px-2 py-1 font-mono text-xs font-normal whitespace-normal text-on-accent group-focus-within:block group-hover:block"
      >
        {text}
      </span>
    </span>
  );
}

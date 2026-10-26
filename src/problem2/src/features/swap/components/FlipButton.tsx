import { useSetAtom } from "jotai";
import { useState } from "react";

import { flipAtom } from "../atoms.ts";
import { PixelIcon } from "./PixelIcon.tsx";

export function FlipButton() {
  const flip = useSetAtom(flipAtom);
  const [turns, setTurns] = useState(0);
  return (
    <div className="relative z-10 -my-3 flex justify-center">
      <button
        type="button"
        id="switch-tokens"
        aria-label="Switch tokens"
        onClick={() => {
          flip();
          setTurns((t) => t + 1);
        }}
        className="pixel-btn pixel-focus bg-accent p-2 text-on-accent"
      >
        <span
          className="pixel-steps block transition-transform duration-300"
          style={{ transform: `rotate(${turns * 180}deg)` }}
        >
          <PixelIcon name="flip" className="size-5" />
        </span>
      </button>
    </div>
  );
}

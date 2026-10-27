import { memo } from "react";

// 8 dots on a ring with a fading tail; rotating 45deg per step keeps it on the grid.
const DOTS: [number, number][] = [
  [7, 1],
  [11, 3],
  [13, 7],
  [11, 11],
  [7, 13],
  [3, 11],
  [1, 7],
  [3, 3],
];

const SPINNER_RECTS = DOTS.map(([x, y], i) => (
  <rect key={i} x={x} y={y} width="2" height="2" opacity={1 - i * 0.125} />
));

export const Spinner = memo(function Spinner({
  className,
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="currentColor"
      shapeRendering="crispEdges"
      aria-hidden="true"
      className={`${className ?? "size-4"} animate-[spin_800ms_steps(8)_infinite]`}
    >
      {SPINNER_RECTS}
    </svg>
  );
});

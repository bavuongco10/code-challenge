import { memo, type ReactNode } from "react";

// 8x8 bitmaps drawn as 2x2 rects on a 16x16 grid.
const ICONS = {
  gear: [
    "...##...",
    ".#.##.#.",
    "..####..",
    "###..###",
    "###..###",
    "..####..",
    ".#.##.#.",
    "...##...",
  ],
  "chevron-down": [
    "........",
    "##....##",
    ".##..##.",
    "..####..",
    "...##...",
    "........",
    "........",
    "........",
  ],
  flip: [
    "..#.....",
    ".###....",
    "#.#.....",
    "..#..#..",
    "..#..#..",
    ".....#.#",
    "....###.",
    ".....#..",
  ],
  close: [
    "##....##",
    ".##..##.",
    "..####..",
    "...##...",
    "...##...",
    "..####..",
    ".##..##.",
    "##....##",
  ],
  wallet: [
    ".######.",
    "########",
    "#......#",
    "#....###",
    "#....###",
    "#......#",
    "########",
    "........",
  ],
  check: [
    "........",
    "......##",
    ".....##.",
    "#...##..",
    "##.##...",
    ".###....",
    "..#.....",
    "........",
  ],
  cross: [
    "........",
    ".#....#.",
    "..#..#..",
    "...##...",
    "...##...",
    "..#..#..",
    ".#....#.",
    "........",
  ],
  coin: [
    "..####..",
    ".######.",
    "###..###",
    "###..###",
    "###..###",
    "###..###",
    ".######.",
    "..####..",
  ],
  search: [
    ".####...",
    "#....#..",
    "#....#..",
    "#....#..",
    ".####...",
    "....##..",
    ".....##.",
    "......##",
  ],
  warn: [
    "...##...",
    "..####..",
    "..#..#..",
    ".#.##.#.",
    ".#.##.#.",
    "#......#",
    "########",
    "........",
  ],
};

export type IconName = keyof typeof ICONS;

const ICON_ELEMENTS: Record<IconName, ReactNode[]> = Object.fromEntries(
  (Object.keys(ICONS) as IconName[]).map((name) => [
    name,
    ICONS[name].flatMap((row, y) =>
      [...row].map((c, x) =>
        c === "#" ? (
          <rect key={`${x}-${y}`} x={x * 2} y={y * 2} width="2" height="2" />
        ) : null,
      ),
    ),
  ]),
) as Record<IconName, ReactNode[]>;

export const PixelIcon = memo(function PixelIcon({
  name,
  className,
}: {
  name: IconName;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="currentColor"
      shapeRendering="crispEdges"
      aria-hidden="true"
      className={className ?? "size-4"}
    >
      {ICON_ELEMENTS[name]}
    </svg>
  );
});

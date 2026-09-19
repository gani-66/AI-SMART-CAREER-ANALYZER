import { useMemo } from "react";
import { FlipPanel } from "./flip-panel";
import { useFlipClock } from "./use-flip-clock";

const SIZES = {
  sm: { w: 64, h: 92, font: 56, gap: 8 },
  md: { w: 96, h: 136, font: 84, gap: 12 },
  lg: { w: 132, h: 188, font: 116, gap: 16 },
  xl: { w: 176, h: 248, font: 152, gap: 20 },
};

function toCells(value, minLength) {
  const str = typeof value === "number" ? String(Math.round(value)) : value;
  const padded =
    typeof value === "number" ? str.padStart(minLength, "0") : str.padEnd(minLength, " ");
  return padded.split("");
}

// Public Flip Clock component. Displays numeric outcomes (scores, percentages,
// rankings) as a premium mechanical split-flap board. Self-contained: owns its
// state via useFlipClock, its rendering via FlipPanel, and its animation via
// flip-animation. Does not depend on any other feature.
export function FlipClock({
  value,
  animate = true,
  anticipation = true,
  size = "lg",
  duration = 300,
  theme = "dark",
  minLength = 2,
}) {
  const dims = SIZES[size];
  const display = useFlipClock({ value, animate, anticipation });
  const cells = useMemo(() => toCells(display, minLength), [display, minLength]);

  return (
    <div
      data-theme={theme}
      className="flip-clock"
      style={{
        "--cell-w": `${dims.w}px`,
        "--cell-h": `${dims.h}px`,
        "--cell-font": `${dims.font}px`,
        "--cell-gap": `${dims.gap}px`,
      }}
      role="timer"
      aria-live="polite"
      aria-label={`Value ${display}`}
    >
      {cells.map((char, i) => (
        <FlipPanel key={i} value={char} duration={duration} />
      ))}
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { generateAnticipationSequence, stepDelay } from "./flip-animation";

// Orchestrates the displayed value for the Flip Clock. For numeric values with
// anticipation enabled it walks an unpredictable convergence sequence toward
// the target; otherwise it snaps to the value. This hook is private to the
// Flip Clock feature.
export function useFlipClock({ value, animate, anticipation }) {
  const isNumeric = typeof value === "number";

  const [display, setDisplay] = useState(() =>
    isNumeric ? (animate && anticipation ? 0 : value) : value,
  );

  const timers = useRef([]);

  useEffect(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];

    if (!animate) {
      setDisplay(value);
      return;
    }

    // Anticipation reveal only applies to numeric values.
    if (anticipation && isNumeric) {
      const seq = generateAnticipationSequence(value, { start: 0, steps: 7 });
      let elapsed = 0;
      seq.forEach((step, i) => {
        elapsed += stepDelay(i, seq.length, 90);
        const t = setTimeout(() => setDisplay(step), elapsed);
        timers.current.push(t);
      });
    } else {
      setDisplay(value);
    }

    return () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, animate, anticipation]);

  return display;
}

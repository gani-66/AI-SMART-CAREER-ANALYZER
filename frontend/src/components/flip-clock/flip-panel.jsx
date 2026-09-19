import { useEffect, useRef, useState } from "react";

// A single split-flap panel. Renders two static halves (the result) and two
// animated flaps that perform the mechanical fold from the previous value to
// the next one in real 3D space. Private to the Flip Clock feature.
export function FlipPanel({ value, duration = 300 }) {
  const [current, setCurrent] = useState(value);
  const [previous, setPrevious] = useState(value);
  const [flipping, setFlipping] = useState(false);
  const timeout = useRef(null);

  useEffect(() => {
    if (value === current) return;
    setPrevious(current);
    setCurrent(value);
    setFlipping(true);

    if (timeout.current) clearTimeout(timeout.current);
    timeout.current = setTimeout(() => setFlipping(false), duration);

    return () => {
      if (timeout.current) clearTimeout(timeout.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const flipMs = Math.round(duration * 0.73);

  return (
    <div
      className="flip-card"
      style={{
        "--flip-duration": `${flipMs}ms`,
      }}
    >
      {/* Static top — shows the NEW value, revealed as the old top folds away */}
      <div className="flip-half flip-half--top">
        <span className="flip-glyph">{current}</span>
      </div>

      {/* Static bottom — shows the OLD value until the new bottom flap lands */}
      <div className="flip-half flip-half--bottom">
        <span className="flip-glyph">{flipping ? previous : current}</span>
      </div>

      {flipping && (
        <>
          {/* Folding top flap: old value, rotates down and darkens */}
          <div className="flip-flap flip-flap--top" key={`t-${previous}-${current}`}>
            <span className="flip-glyph">{previous}</span>
            <div className="flip-shade flip-shade--top" />
          </div>

          {/* Rising bottom flap: new value, rotates up and brightens */}
          <div className="flip-flap flip-flap--bottom" key={`b-${previous}-${current}`}>
            <span className="flip-glyph">{current}</span>
            <div className="flip-shade flip-shade--bottom" />
          </div>
        </>
      )}

      {/* Center hinge */}
      <div className="flip-hinge" />
    </div>
  );
}

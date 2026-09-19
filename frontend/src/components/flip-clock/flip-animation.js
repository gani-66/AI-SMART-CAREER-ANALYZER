// Animation engine for the Flip Clock (split-flap) system.
// Owned exclusively by the Flip Clock feature. Generates a semi-random
// "anticipation" convergence sequence toward a numeric target: the motion can
// move up and down, briefly overshoot or undershoot, and then lock onto the
// final value — so the viewer can never predict the next flip.

export function generateAnticipationSequence(
  target,
  { start = 0, steps = 7 } = {},
) {
  const seq = [start];
  const range = target - start;
  const span = Math.max(Math.abs(range), Math.abs(target), 1);

  for (let i = 1; i < steps; i++) {
    const progress = i / steps;
    // Eased convergence — fast early exploration, slow late approach.
    const eased = 1 - Math.pow(1 - progress, 2.4);
    let next = start + range * eased;

    // Jitter shrinks as we converge so motion feels like it's "finding" the answer.
    const jitter = span * (1 - progress) * 0.2;
    next += (Math.random() - 0.5) * 2 * jitter;

    // Subtle, believable overshoot/undershoot once we're close (within ~1-3%).
    if (progress > 0.6) {
      const overshoot = span * 0.025 * (Math.random() - 0.5) * 2;
      next += overshoot;
    }

    seq.push(Math.round(next));
  }

  seq.push(target);

  // Remove consecutive duplicates so every step is a visible flip.
  return seq.filter((v, i) => i === 0 || v !== seq[i - 1]);
}

// Per-step delay that lengthens as the sequence approaches its end,
// increasing anticipation and focus right before the final lock-in.
export function stepDelay(index, total, base) {
  const progress = total <= 1 ? 1 : index / (total - 1);
  const slowdown = 1 + Math.pow(progress, 2.2) * 2.4;
  return Math.round(base * slowdown);
}

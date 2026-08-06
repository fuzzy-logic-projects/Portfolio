import { useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

interface TypewriterHeadlineProps {
  text: string;
  className?: string;
}

/** Typing plays out over roughly this long, regardless of text length. */
const TARGET_DURATION_MS = 1500;
/** Clamp the per-character speed so very short/long text doesn't feel off. */
const MIN_MS_PER_CHAR = 32;
const MAX_MS_PER_CHAR = 80;

/**
 * Types the headline out one character at a time when it first mounts, then
 * stops for good — this never repeats or loops. Falls back to showing the
 * full text instantly under prefers-reduced-motion. The full text is always
 * present for screen readers, even mid-animation.
 *
 * The full text is also rendered in normal flow at `visibility: hidden`,
 * underneath the typed characters, so the heading's box (including however
 * many lines it eventually wraps to) is reserved from the very first frame.
 * Without this, a headline that wraps onto a second line partway through
 * typing grows taller mid-animation — and since the hero centers its content
 * vertically, that height change visibly shifts the already-typed text
 * upward as it happens.
 */
export function TypewriterHeadline({ text, className }: TypewriterHeadlineProps) {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(reduce ? text.length : 0);

  useEffect(() => {
    if (reduce || text.length === 0) {
      setShown(text.length);
      return;
    }

    setShown(0);
    const perChar = Math.min(MAX_MS_PER_CHAR, Math.max(MIN_MS_PER_CHAR, TARGET_DURATION_MS / text.length));

    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setShown(i);
      if (i >= text.length) {
        window.clearInterval(id);
      }
    }, perChar);

    return () => window.clearInterval(id);
  }, [text, reduce]);

  const done = shown >= text.length;

  return (
    <h1 className={className} style={{ position: 'relative' }}>
      <span aria-hidden="true" style={{ visibility: 'hidden' }}>
        {text}
      </span>
      <span aria-hidden="true" style={{ position: 'absolute', inset: 0 }}>
        {text.slice(0, shown)}
        {!done && <span className="typewriter-cursor" />}
      </span>
      <span className="sr-only">{text}</span>
    </h1>
  );
}

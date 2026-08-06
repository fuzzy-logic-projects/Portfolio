import { useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

interface TypewriterHeadlineProps {
  text: string;
  className?: string;
}

/** Typing plays out over roughly this long, regardless of text length. */
const TARGET_DURATION_MS = 900;
/** Clamp the per-character speed so very short/long text doesn't feel off. */
const MIN_MS_PER_CHAR = 18;
const MAX_MS_PER_CHAR = 55;

/**
 * Types the headline out one character at a time when it first mounts, then
 * stops for good — this never repeats or loops. Falls back to showing the
 * full text instantly under prefers-reduced-motion. The full text is always
 * present for screen readers, even mid-animation.
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
    <h1 className={className}>
      <span aria-hidden="true">
        {text.slice(0, shown)}
        {!done && <span className="typewriter-cursor" />}
      </span>
      <span className="sr-only">{text}</span>
    </h1>
  );
}

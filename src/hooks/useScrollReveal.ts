import { useCallback, useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

/**
 * Reveals registered elements, one at a time, as the visitor scrolls them
 * into view. Uses the browser's completely normal scrolling the whole
 * time — nothing here ever intercepts wheel, touch, or keyboard input, and
 * nothing ever moves the scroll position programmatically. That means:
 *   - scrolling feels exactly as fast/slow as the visitor's own trackpad,
 *     mouse wheel, or momentum scroll (no forced snap-per-section speed)
 *   - scrolling back up always works, since nothing is blocking it
 *   - once a section has been revealed it stays revealed, so scrolling up
 *     past it doesn't hide it again
 *
 * Respects prefers-reduced-motion: reveals everything immediately.
 */
export function useScrollReveal(stepCount: number) {
  const reduce = useReducedMotion();
  const [revealed, setRevealed] = useState<Set<number>>(() => new Set());
  const revealedRef = useRef<Set<number>>(new Set());
  const stepRefs = useRef<Array<HTMLElement | null>>([]);
  const refCallbacks = useRef<Map<number, (el: HTMLElement | null) => void>>(new Map());

  const setStepRef = useCallback((index: number) => {
    let cb = refCallbacks.current.get(index);
    if (!cb) {
      cb = (el: HTMLElement | null) => {
        stepRefs.current[index] = el;
      };
      refCallbacks.current.set(index, cb);
    }
    return cb;
  }, []);

  useEffect(() => {
    if (reduce || stepCount === 0) {
      const all = new Set<number>(Array.from({ length: stepCount }, (_, i) => i));
      revealedRef.current = all;
      setRevealed(all);
      return;
    }

    revealedRef.current = new Set();
    setRevealed(new Set());

    const observer = new IntersectionObserver(
      (entries) => {
        let changed = false;
        const next = new Set(revealedRef.current);
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = stepRefs.current.indexOf(entry.target as HTMLElement);
          if (index !== -1 && !next.has(index)) {
            next.add(index);
            changed = true;
          }
          // Once revealed, this element never needs to be watched again —
          // it stays visible even if scrolled back past.
          observer.unobserve(entry.target);
        }
        if (changed) {
          revealedRef.current = next;
          setRevealed(next);
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -10% 0px' },
    );

    stepRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce, stepCount]);

  const isRevealed = useCallback((index: number) => revealed.has(index), [revealed]);

  return { isRevealed, setStepRef };
}

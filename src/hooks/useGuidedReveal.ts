import { useCallback, useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

/** How long each guided step's scroll animation takes. */
const STEP_DURATION_MS = 900;
/** Clears the sticky header (72px) plus a little breathing room. */
const HEADER_OFFSET = 88;
/** Minimum touch swipe distance (px) before it counts as an advance. */
const TOUCH_THRESHOLD = 12;

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Drives a "guided" first pass through a page: only the elements registered
 * via `setStepRef` are revealed, one at a time, as the visitor scrolls, wheel-
 * or touch-scrolling them slowly into view. Once the last step has been
 * reached, scrolling reverts to completely normal browser behaviour and
 * nothing here intercepts input again for the lifetime of this mount.
 *
 * Respects prefers-reduced-motion: reveals everything immediately and never
 * takes over scrolling.
 */
export function useGuidedReveal(stepCount: number) {
  const reduce = useReducedMotion();
  const [revealed, setRevealed] = useState(0);
  const [introOn, setIntroOn] = useState(stepCount > 0);

  const revealedRef = useRef(0);
  const introActiveRef = useRef(stepCount > 0);
  const lockedRef = useRef(false);
  const stepRefs = useRef<Array<HTMLElement | null>>([]);
  const refCallbacks = useRef<Map<number, (el: HTMLElement | null) => void>>(new Map());

  useEffect(() => {
    revealedRef.current = revealed;
  }, [revealed]);

  useEffect(() => {
    introActiveRef.current = introOn;
  }, [introOn]);

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
      setRevealed(stepCount);
      setIntroOn(false);
      return;
    }

    setRevealed(0);
    revealedRef.current = 0;
    setIntroOn(true);
    introActiveRef.current = true;
    lockedRef.current = false;

    function smoothScrollTo(targetY: number, onDone: () => void) {
      const startY = window.scrollY;
      const delta = targetY - startY;
      if (Math.abs(delta) < 2) {
        onDone();
        return;
      }
      const startTime = performance.now();
      function frame(now: number) {
        const t = Math.min((now - startTime) / STEP_DURATION_MS, 1);
        window.scrollTo(0, startY + delta * easeOutCubic(t));
        if (t < 1) {
          requestAnimationFrame(frame);
        } else {
          onDone();
        }
      }
      requestAnimationFrame(frame);
    }

    function advance() {
      if (lockedRef.current) return;
      const current = revealedRef.current;
      if (current >= stepCount) return;

      lockedRef.current = true;
      const next = current + 1;
      const targetEl = stepRefs.current[current];
      const targetY = targetEl
        ? Math.max(0, targetEl.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET)
        : window.scrollY + window.innerHeight * 0.6;

      setRevealed(next);
      revealedRef.current = next;

      smoothScrollTo(targetY, () => {
        lockedRef.current = false;
        if (next >= stepCount) {
          introActiveRef.current = false;
          setIntroOn(false);
        }
      });
    }

    function onWheel(e: WheelEvent) {
      if (!introActiveRef.current) return;
      if (e.deltaY > 0) {
        e.preventDefault();
        advance();
      } else if (e.deltaY < 0) {
        // Block backward scroll during the guided intro rather than letting
        // it fight the programmatic scroll.
        e.preventDefault();
      }
    }

    let touchStartY = 0;
    function onTouchStart(e: TouchEvent) {
      touchStartY = e.touches[0]?.clientY ?? 0;
    }
    function onTouchMove(e: TouchEvent) {
      if (!introActiveRef.current) return;
      const y = e.touches[0]?.clientY ?? touchStartY;
      const dy = touchStartY - y;
      if (Math.abs(dy) > TOUCH_THRESHOLD) {
        e.preventDefault();
        if (dy > 0) advance();
        touchStartY = y;
      }
    }

    function onKeyDown(e: KeyboardEvent) {
      if (!introActiveRef.current) return;
      if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        advance();
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
      }
    }

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('keydown', onKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce, stepCount]);

  const isRevealed = useCallback((index: number) => index < revealed, [revealed]);

  return { isRevealed, setStepRef, introActive: introOn };
}

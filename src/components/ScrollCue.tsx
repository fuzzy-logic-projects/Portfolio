import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import './ScrollCue.css';

/** Wait this long after the page loads before showing the cue. */
const SHOW_DELAY_MS = 3000;

interface ScrollCueProps {
  /** Set to false to drop the "Scroll" text label but keep the animated
   * chevron — used on pages where the label reads as redundant. */
  showLabel?: boolean;
}

/**
 * A "Scroll" hint that appears under the headline — but only after the
 * visitor has been sitting on the page for a few seconds. It disappears for
 * good the moment they scroll at all, and it never comes back on its own
 * (it only reappears if they leave and land on the page fresh).
 */
export function ScrollCue({ showLabel = true }: ScrollCueProps) {
  const reduce = useReducedMotion();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setShow(true), SHOW_DELAY_MS);

    function onScroll() {
      setShow(false);
      window.clearTimeout(timer);
      window.removeEventListener('scroll', onScroll);
    }
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="scroll-cue"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          {showLabel && <span>Scroll</span>}
          <motion.span
            className="scroll-cue__chevron"
            animate={reduce ? undefined : { y: [0, 6, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          >
            ↓
          </motion.span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

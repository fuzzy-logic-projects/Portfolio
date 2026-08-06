import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import './ScrollCue.css';

export function ScrollCue({ show }: { show: boolean }) {
  const reduce = useReducedMotion();

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
          <span>Scroll</span>
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

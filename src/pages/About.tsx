import { motion, useReducedMotion } from 'framer-motion';
import { useContent } from '../context/ContentContext';
import { Loading, ErrorState } from '../components/Loading';
import { Markdown } from '../components/Markdown';
import { ScrollCue } from '../components/ScrollCue';
import { TypewriterHeadline } from '../components/TypewriterHeadline';
import { useScrollReveal } from '../hooks/useScrollReveal';
import './About.css';

const sectionTransition = { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const };
const hiddenSection = { opacity: 0, y: 24 };

// Split on blank lines — the same boundary Markdown itself uses between
// blocks — so each heading/paragraph/list reveals as its own step.
function splitIntoBlocks(markdown: string): string[] {
  return markdown
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);
}

export default function About() {
  const { content, loading, error } = useContent();
  const reduce = useReducedMotion();

  const about = content?.home.about ?? '';
  const blocks = splitIntoBlocks(about);
  const { isRevealed, setStepRef } = useScrollReveal(content ? blocks.length : 0);

  if (loading) return <Loading />;
  if (error || !content) return <ErrorState message={error ?? 'Something went wrong.'} />;

  return (
    <div className="container about-page">
      <div className="about-page__inner">
        <TypewriterHeadline text="About" className="about-page__headline" />

        <ScrollCue />

        {blocks.length === 0 ? (
          <p className="about-page__empty">Add About content from the admin dashboard.</p>
        ) : (
          <div className="about-page__body">
            {blocks.map((block, i) => (
              <motion.div
                key={i}
                ref={setStepRef(i)}
                initial={reduce ? undefined : hiddenSection}
                animate={isRevealed(i) ? { opacity: 1, y: 0 } : hiddenSection}
                transition={sectionTransition}
                style={isRevealed(i) ? undefined : { pointerEvents: 'none' }}
              >
                <Markdown content={block} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

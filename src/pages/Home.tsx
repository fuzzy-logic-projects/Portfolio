import { motion, useReducedMotion } from 'framer-motion';
import { useContent } from '../context/ContentContext';
import { CategoryCard } from '../components/CategoryCard';
import { Loading, ErrorState } from '../components/Loading';
import { Markdown } from '../components/Markdown';
import { ScrollCue } from '../components/ScrollCue';
import { TypewriterHeadline } from '../components/TypewriterHeadline';
import { useScrollReveal } from '../hooks/useScrollReveal';
import './Home.css';

const sectionTransition = { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const };
const hiddenSection = { opacity: 0, y: 24 };

export default function Home() {
  const { content, loading, error } = useContent();
  const reduce = useReducedMotion();

  // Ordered list of the reveal steps present on this particular page — the
  // headline itself isn't a step, it lives alone in the full-height hero and
  // is always visible on load. Computed even before content arrives so the
  // hook below is always called with a stable (if temporarily zero) step
  // count, keeping hook order consistent.
  const home = content?.home;
  const hasEducation = (home?.education.length ?? 0) > 0;
  const hasContact = Boolean(home?.email);
  const steps: string[] = ['intro', 'categories'];
  if (hasEducation) steps.push('education');
  if (hasContact) steps.push('contact');
  const stepIndex = (key: string) => steps.indexOf(key);

  const { isRevealed, setStepRef } = useScrollReveal(content ? steps.length : 0);

  if (loading) return <Loading />;
  if (error || !content || !home) return <ErrorState message={error ?? 'Something went wrong.'} />;

  const { categories, projects } = content;

  const revealProps = (index: number) => ({
    initial: reduce ? undefined : hiddenSection,
    animate: isRevealed(index) ? { opacity: 1, y: 0 } : hiddenSection,
    transition: sectionTransition,
    style: isRevealed(index) ? undefined : { pointerEvents: 'none' as const },
  });

  return (
    <div>
      <section className="hero container">
        <TypewriterHeadline text={home.tagline} className="hero__headline" />
        <ScrollCue />
      </section>

      <motion.section
        className="container intro-section"
        ref={setStepRef(stepIndex('intro'))}
        {...revealProps(stepIndex('intro'))}
      >
        <div className="hero__intro">
          <div className="hero__bio">
            <Markdown content={home.bio} compact />
          </div>
          {home.role && <span className="hero__role">{home.role}</span>}
        </div>
      </motion.section>

      <motion.section
        className="container categories-section"
        ref={setStepRef(stepIndex('categories'))}
        {...revealProps(stepIndex('categories'))}
      >
        <span className="eyebrow eyebrow--light">Projects</span>
        <div className="categories-grid">
          {categories.map((cat, i) => (
            <CategoryCard
              key={cat.id}
              category={cat}
              count={projects.filter((p) => p.categoryId === cat.id).length}
              index={i}
            />
          ))}
        </div>
      </motion.section>

      {hasEducation && (
        <motion.section
          className="container education-section"
          ref={setStepRef(stepIndex('education'))}
          {...revealProps(stepIndex('education'))}
        >
          <span className="eyebrow">Education</span>
          <ul className="education-list">
            {home.education.map((entry) => (
              <li key={entry.id} className="education-list__item">
                <span className="catalog-code">{entry.years}</span>
                <div>
                  <p className="education-list__qualification">{entry.qualification}</p>
                  <p className="education-list__institution">{entry.institution}</p>
                </div>
              </li>
            ))}
          </ul>
        </motion.section>
      )}

      {hasContact && (
        <motion.section
          className="container contact-section"
          ref={setStepRef(stepIndex('contact'))}
          {...revealProps(stepIndex('contact'))}
        >
          <a className="btn btn-primary" href={`mailto:${home.email}`}>
            Get in touch ↗
          </a>
        </motion.section>
      )}
    </div>
  );
}

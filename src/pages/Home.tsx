import { motion, useReducedMotion } from 'framer-motion';
import { useContent } from '../context/ContentContext';
import { CategoryCard } from '../components/CategoryCard';
import { Loading, ErrorState } from '../components/Loading';
import './Home.css';

export default function Home() {
  const { content, loading, error } = useContent();
  const reduce = useReducedMotion();

  if (loading) return <Loading />;
  if (error || !content) return <ErrorState message={error ?? 'Something went wrong.'} />;

  const { home, categories, projects } = content;

  const fadeUp = (delay: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 24 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] as const },
        };

  return (
    <div>
      <section className="hero container">
        <motion.span className="eyebrow" {...fadeUp(0)}>
          Portfolio — Index No. 01
        </motion.span>
        <motion.h1 className="hero__headline" {...fadeUp(0.08)}>
          {home.tagline}
        </motion.h1>
        <motion.p className="hero__bio" {...fadeUp(0.16)}>
          {home.bio}
        </motion.p>
        {home.role && (
          <motion.span className="hero__role" {...fadeUp(0.22)}>
            {home.role}
          </motion.span>
        )}
      </section>

      <section className="container categories-section">
        <span className="eyebrow">Browse by category</span>
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
      </section>

      {home.education.length > 0 && (
        <motion.section
          className="container education-section"
          initial={reduce ? undefined : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
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

      {home.email && (
        <section className="container contact-section">
          <a className="btn btn-primary" href={`mailto:${home.email}`}>
            Get in touch ↗
          </a>
        </section>
      )}
    </div>
  );
}

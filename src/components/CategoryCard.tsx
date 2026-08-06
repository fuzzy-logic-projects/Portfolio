import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import type { Category } from '../types';
import './CategoryCard.css';

interface CategoryCardProps {
  category: Category;
  count: number;
  index: number;
}

export function CategoryCard({ category, count, index }: CategoryCardProps) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      initial={reduce ? undefined : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link to={`/projects/${category.slug}`} className="category-card">
        <span className="category-card__corner" aria-hidden="true" />
        <span className="catalog-code">{category.code}</span>
        <h3 className="category-card__name">{category.name}</h3>
        <span className="category-card__count">
          {count} {count === 1 ? 'Project' : 'Projects'}
        </span>
        <span className="category-card__arrow" aria-hidden="true">
          →
        </span>
      </Link>
    </motion.div>
  );
}

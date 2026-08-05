import { Link, useParams } from 'react-router-dom';
import { useContent } from '../context/ContentContext';
import { ProjectCard } from '../components/ProjectCard';
import { Loading, ErrorState } from '../components/Loading';
import './CategoryPage.css';

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const { content, loading, error } = useContent();

  if (loading) return <Loading />;
  if (error || !content) return <ErrorState message={error ?? 'Something went wrong.'} />;

  const category = content.categories.find((c) => c.slug === slug);

  if (!category) {
    return (
      <ErrorState message="That category doesn't exist. It may have been renamed." />
    );
  }

  const projects = content.projects.filter((p) => p.categoryId === category.id);

  return (
    <div className="container category-page">
      <Link to="/" className="category-page__back">
        ← Back to index
      </Link>

      <div className="category-page__header">
        <span className="catalog-code">{category.code}</span>
        <h1 className="category-page__title">{category.name}</h1>
        <span className="eyebrow">
          {projects.length} {projects.length === 1 ? 'entry' : 'entries'}
        </span>
      </div>

      {projects.length === 0 ? (
        <p className="category-page__empty">Nothing filed under this category yet.</p>
      ) : (
        <div className="category-page__list">
          {projects.map((project, i) => (
            <ProjectCard key={project.id} project={project} code={category.code} entryNumber={i + 1} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

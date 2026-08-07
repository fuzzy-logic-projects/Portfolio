import { lazy, Suspense, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { Project, ProjectFile } from '../types';
import './ProjectCard.css';

// Lazy-loaded: mammoth (docx → HTML) is the bulk of this bundle, so it should
// only be fetched when someone actually opens a document, not on every page load.
const DocxReader = lazy(() => import('./DocxReader').then((m) => ({ default: m.DocxReader })));

interface ProjectCardProps {
  project: Project;
  code: string;
  entryNumber: number;
  index: number;
}

function isDocx(file: ProjectFile) {
  return file.name.toLowerCase().endsWith('.docx');
}

export function ProjectCard({ project, code, entryNumber, index }: ProjectCardProps) {
  const [open, setOpen] = useState(false);
  const [readingFile, setReadingFile] = useState<ProjectFile | null>(null);
  const reduce = useReducedMotion();
  const entryId = `${code}-${String(entryNumber).padStart(2, '0')}`;

  return (
    <>
      <motion.article
        className="project-card"
        initial={reduce ? undefined : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
        whileHover={reduce ? undefined : { scale: 1.015, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } }}
      >
        <button type="button" className="project-card__header" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
          <div>
            <span className="catalog-code">{entryId}</span>
            <h3 className="project-card__title">{project.title}</h3>
            <p className="project-card__summary">{project.summary}</p>
          </div>
          <span className={`project-card__chevron ${open ? 'is-open' : ''}`} aria-hidden="true">
            ⌄
          </span>
        </button>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              className="project-card__body"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="project-card__body-inner">
                <p className="project-card__description">{project.description}</p>

                {project.files.length > 0 && (
                  <ul className="project-card__files">
                    {project.files.map((file) =>
                      isDocx(file) ? (
                        <li key={file.url}>
                          <button type="button" onClick={() => setReadingFile(file)}>
                            Read
                          </button>
                        </li>
                      ) : (
                        <li key={file.url}>
                          <a href={file.url} target="_blank" rel="noreferrer">
                            {file.name}
                          </a>
                        </li>
                      ),
                    )}
                  </ul>
                )}

                {project.link && (
                  <a className="project-card__link" href={project.link} target="_blank" rel="noreferrer">
                    Visit project ↗
                  </a>
                )}

                {project.date && <span className="project-card__date">{project.date}</span>}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.article>

      {readingFile && (
        <Suspense fallback={null}>
          <DocxReader file={readingFile} onClose={() => setReadingFile(null)} />
        </Suspense>
      )}
    </>
  );
}

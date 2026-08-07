import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import mammoth from 'mammoth/mammoth.browser.min.js';
import type { ProjectFile } from '../types';
import './DocxReader.css';

interface DocxReaderProps {
  file: ProjectFile;
  onClose: () => void;
}

type Status = 'loading' | 'ready' | 'error';

/** The R2 public URL is cross-origin, so route through our own /api/file instead
 *  of fetching it directly — see functions/api/file.ts for why. */
function readUrlFor(fileUrl: string): string {
  try {
    const key = new URL(fileUrl).pathname.replace(/^\//, '');
    return `/api/file?key=${encodeURIComponent(key)}`;
  } catch {
    return fileUrl;
  }
}

export function DocxReader({ file, onClose }: DocxReaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [html, setHtml] = useState('');
  const [status, setStatus] = useState<Status>('loading');

  // Fetch + convert the document once on mount.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(readUrlFor(file.url));
        if (!res.ok) throw new Error('Request failed');
        const arrayBuffer = await res.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        if (!cancelled) {
          setHtml(result.value);
          setStatus('ready');
        }
      } catch {
        if (!cancelled) setStatus('error');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [file.url]);

  // Lock background scroll while the reader is open.
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  // Esc closes the reader.
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return createPortal(
    <div className="docx-reader" ref={containerRef}>
      <div className="docx-reader__header">
        <span className="docx-reader__title">{file.name}</span>
        <button type="button" className="btn docx-reader__btn" onClick={onClose}>
          ✕ Close
        </button>
      </div>

      <div className="docx-reader__content">
        {status === 'loading' && <p className="docx-reader__status">Loading document…</p>}
        {status === 'error' && (
          <p className="docx-reader__status">
            Couldn't load this document here.{' '}
            <a href={file.url} target="_blank" rel="noreferrer">
              Open it directly instead ↗
            </a>
          </p>
        )}
        {status === 'ready' && (
          <div className="docx-reader__body" dangerouslySetInnerHTML={{ __html: html }} />
        )}
      </div>
    </div>,
    document.body,
  );
}

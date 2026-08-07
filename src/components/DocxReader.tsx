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
  const [isFullscreen, setIsFullscreen] = useState(false);

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

  // Enter fullscreen on open, lock background scroll, track fullscreen state.
  useEffect(() => {
    const el = containerRef.current;
    el?.requestFullscreen?.().catch(() => {
      /* Fullscreen API unavailable/blocked (e.g. iOS Safari) — the overlay
         itself already fills the viewport via CSS, so reading still works. */
    });

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function handleFullscreenChange() {
      setIsFullscreen(document.fullscreenElement === el);
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      if (document.fullscreenElement === el) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, []);

  // Esc closes the reader once native fullscreen has already been exited
  // (the first Esc only exits native fullscreen — that's the browser's own
  // behavior and can't be intercepted — so a second Esc closes the overlay).
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && !document.fullscreenElement) {
        onClose();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  async function toggleFullscreen() {
    if (document.fullscreenElement) {
      await document.exitFullscreen().catch(() => {});
    } else {
      await containerRef.current?.requestFullscreen?.().catch(() => {});
    }
  }

  async function handleClose() {
    if (document.fullscreenElement) {
      await document.exitFullscreen().catch(() => {});
    }
    onClose();
  }

  return createPortal(
    <div className="docx-reader" ref={containerRef}>
      <div className="docx-reader__header">
        <span className="docx-reader__title">{file.name}</span>
        <div className="docx-reader__actions">
          <button type="button" className="btn docx-reader__btn" onClick={toggleFullscreen}>
            {isFullscreen ? '⤡ Exit fullscreen' : '⛶ Fullscreen'}
          </button>
          <button type="button" className="btn docx-reader__btn" onClick={handleClose}>
            ✕ Close
          </button>
        </div>
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

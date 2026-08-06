import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import './Markdown.css';

interface MarkdownProps {
  content: string;
  /** Shrinks heading sizes for use in tight spaces like the hero bio. */
  compact?: boolean;
}

export function Markdown({ content, compact }: MarkdownProps) {
  if (!content) return null;

  return (
    <div className={compact ? 'markdown-content markdown-content--compact' : 'markdown-content'}>
      <ReactMarkdown remarkPlugins={[remarkBreaks]}>{content}</ReactMarkdown>
    </div>
  );
}

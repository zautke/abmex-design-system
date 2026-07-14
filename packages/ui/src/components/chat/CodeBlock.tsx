import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import vscDarkPlus from 'react-syntax-highlighter/dist/esm/styles/prism/vsc-dark-plus.js';
import { CopyButton } from '../../primitives/CopyButton';
import { cn } from '../../utils/cn';

export interface CodeBlockProps {
  language: string;
  value: string;
  className?: string;
}

/** Fenced code block: language header, copy affordance, highlighted body. */
export function CodeBlock({ language, value, className }: CodeBlockProps) {
  return (
    <div
      className={cn(
        'group relative my-4 min-w-0 max-w-full overflow-hidden rounded-lg border border-md-code-block-border bg-md-code-block-bg shadow-sm',
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-md-code-header-border bg-md-code-header-bg px-4 py-1.5 text-xs text-md-code-header-text">
        <span className="font-mono">{language || 'text'}</span>
        <CopyButton
          value={value}
          label="Copy"
          className="opacity-0 transition-opacity focus:opacity-100 group-hover:opacity-100"
        />
      </div>
      <div className="min-w-0 max-w-full overflow-x-auto p-4 text-[13px] leading-relaxed">
        <SyntaxHighlighter
          language={language || 'text'}
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            padding: 0,
            background: 'transparent',
            fontFamily: 'var(--font-code)',
            whiteSpace: 'pre-wrap',
            overflowWrap: 'anywhere',
            wordBreak: 'break-word',
            maxWidth: '100%',
          }}
          wrapLines
          wrapLongLines
          PreTag="div"
        >
          {value}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}

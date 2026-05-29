import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import vscDarkPlus from 'react-syntax-highlighter/dist/esm/styles/prism/vsc-dark-plus.js';
import { Check, Copy } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function MarkdownRenderer({ content }: { content: string }) {
  return (
    <div className="markdown-body prose prose-sm min-w-0 max-w-full break-words overflow-x-hidden dark:prose-invert">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          pre: ({ children }) => <>{children}</>,
          code(props: any) {
            const { children, className, node, ...rest } = props;
            const match = /language-(\w+)/.exec(className || '');
            
            const isBlock = match || String(children).includes('\n');
            
            if (!isBlock) {
              return (
                <code
                  className={cn(
                    'rounded bg-md-code-inline-bg px-1.5 py-0.5 text-[0.85em] font-mono text-md-code-inline-text',
                    className
                  )}
                  {...rest}
                >
                  {children}
                </code>
              );
            }

            const language = match ? match[1] : 'text';
            return <CodeBlock language={language} value={String(children).replace(/\n$/, '')} {...rest} />;
          },
          a: ({ node, ...props }) => <a className="text-md-link hover:underline" target="_blank" rel="noreferrer" {...props} />,
          ul: ({ node, ...props }) => <ul className="list-inside list-disc space-y-1 my-2" {...props} />,
          ol: ({ node, ...props }) => <ol className="list-inside list-decimal space-y-1 my-2" {...props} />,
          li: ({ node, ...props }) => <li className="leading-relaxed" {...props} />,
          p: ({ node, ...props }) => <p className="leading-relaxed my-2 first:mt-0 last:mb-0 whitespace-pre-wrap" {...props} />,
          h1: ({ node, ...props }) => <h1 className="text-lg font-semibold my-3" {...props} />,
          h2: ({ node, ...props }) => <h2 className="text-base font-semibold my-2" {...props} />,
          h3: ({ node, ...props }) => <h3 className="text-sm font-semibold my-2" {...props} />,
          table: ({ node, ...props }) => <div className="max-w-full overflow-x-auto"><table className="w-full text-left border-collapse my-2" {...props} /></div>,
          th: ({ node, ...props }) => <th className="border-b-2 border-md-th-border px-3 py-2 font-semibold" {...props} />,
          td: ({ node, ...props }) => <td className="border-b border-md-td-border px-3 py-2" {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

function CodeBlock({ language, value, ...props }: { language: string; value: string }) {
  const [isCopied, setIsCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text', err);
    }
  };

  return (
    <div className="relative my-4 min-w-0 max-w-full overflow-hidden rounded-lg border border-md-code-block-border bg-md-code-block-bg shadow-sm group">
      <div className="flex items-center justify-between bg-md-code-header-bg px-4 py-1.5 text-xs text-md-code-header-text border-b border-md-code-header-border">
        <span className="font-mono">{language || 'text'}</span>
        <button
          onClick={copyToClipboard}
          className="flex items-center gap-1.5 rounded p-1 hover:bg-md-code-copy-bg-hover hover:text-md-code-copy-text-hover transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
          aria-label="Copy code"
        >
          {isCopied ? (
            <>
              <Check className="h-3.5 w-3.5 text-md-code-copied-icon" />
              <span className="text-md-code-copied-icon">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
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
          wrapLines={true}
          wrapLongLines={true}
          PreTag="div"
          {...props}
        >
          {value}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}

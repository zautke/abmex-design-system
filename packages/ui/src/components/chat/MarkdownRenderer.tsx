import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CodeBlock } from './CodeBlock';
import { cn } from '../../utils/cn';

export interface MarkdownRendererProps {
  content: string;
  className?: string;
}

/** GitHub-flavored markdown with prose overrides tuned for the chat bubble width. */
export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div
      className={cn(
        'markdown-body prose prose-sm min-w-0 max-w-full break-words overflow-x-hidden dark:prose-invert',
        className,
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // `pre` is unwrapped because CodeBlock supplies its own container;
          // leaving react-markdown's <pre> in place would double-wrap it.
          pre: ({ children }) => <>{children}</>,
          code({ children, className: codeClassName, node: _node, ...rest }) {
            const match = /language-(\w+)/.exec(codeClassName || '');
            const isBlock = Boolean(match) || String(children).includes('\n');

            if (!isBlock) {
              return (
                <code
                  className={cn(
                    'rounded bg-md-code-inline-bg px-1.5 py-0.5 font-mono text-[0.85em] text-md-code-inline-text',
                    codeClassName,
                  )}
                  {...rest}
                >
                  {children}
                </code>
              );
            }

            return (
              <CodeBlock
                language={match?.[1] ?? 'text'}
                value={String(children).replace(/\n$/, '')}
              />
            );
          },
          a: ({ node: _node, ...props }) => (
            <a
              className="text-md-link hover:underline"
              target="_blank"
              rel="noreferrer"
              {...props}
            />
          ),
          ul: ({ node: _node, ...props }) => (
            <ul className="my-2 list-inside list-disc space-y-1" {...props} />
          ),
          ol: ({ node: _node, ...props }) => (
            <ol className="my-2 list-inside list-decimal space-y-1" {...props} />
          ),
          li: ({ node: _node, ...props }) => <li className="leading-relaxed" {...props} />,
          p: ({ node: _node, ...props }) => (
            <p
              className="my-2 whitespace-pre-wrap leading-relaxed first:mt-0 last:mb-0"
              {...props}
            />
          ),
          h1: ({ node: _node, ...props }) => (
            <h1 className="my-3 text-lg font-semibold" {...props} />
          ),
          h2: ({ node: _node, ...props }) => (
            <h2 className="my-2 text-base font-semibold" {...props} />
          ),
          h3: ({ node: _node, ...props }) => (
            <h3 className="my-2 text-sm font-semibold" {...props} />
          ),
          table: ({ node: _node, ...props }) => (
            <div className="max-w-full overflow-x-auto">
              <table className="my-2 w-full border-collapse text-left" {...props} />
            </div>
          ),
          th: ({ node: _node, ...props }) => (
            <th className="border-b-2 border-md-th-border px-3 py-2 font-semibold" {...props} />
          ),
          td: ({ node: _node, ...props }) => (
            <td className="border-b border-md-td-border px-3 py-2" {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

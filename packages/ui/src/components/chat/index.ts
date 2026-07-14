// Chat family — presentation only. Every component here takes primitives and
// children; none of them touch persistence, transports, or the browser.

export { ChatBubble } from './ChatBubble';
export type { ChatBubbleProps } from './ChatBubble';

export { ChatEmptyState } from './ChatEmptyState';
export type { ChatEmptyStateProps } from './ChatEmptyState';

export { CodeBlock } from './CodeBlock';
export type { CodeBlockProps } from './CodeBlock';

export { JsonInspectorRow } from './JsonInspectorRow';
export type { JsonInspectorRowProps } from './JsonInspectorRow';

export { MarkdownRenderer } from './MarkdownRenderer';
export type { MarkdownRendererProps } from './MarkdownRenderer';

export { MessageList } from './MessageList';
export type { MessageListProps, MessageListScrollState } from './MessageList';

export { MessageViewToggle } from './MessageViewToggle';
export type { MessageViewToggleProps, MessageViewMode } from './MessageViewToggle';

export { ModelBadgeRow } from './ModelBadgeRow';
export type { ModelBadgeRowProps } from './ModelBadgeRow';

export { ScrollResumeButton } from './ScrollResumeButton';
export type { ScrollResumeButtonProps } from './ScrollResumeButton';

export { StreamingCursor } from './StreamingCursor';
export type { StreamingCursorProps } from './StreamingCursor';

export { StreamingRate } from './StreamingRate';
export type { StreamingRateProps } from './StreamingRate';

export { SystemNoticeRow } from './SystemNoticeRow';
export type { SystemNoticeRowProps } from './SystemNoticeRow';

export { TransportLogPanel } from './TransportLogPanel';
export type { TransportLogPanelProps, TransportLogEntry } from './TransportLogPanel';

export { useStreamingRate } from '../../hooks/useStreamingRate';
export type {
  UseStreamingRateInput,
  StreamingRateReading,
  StreamingRateUsage,
} from '../../hooks/useStreamingRate';

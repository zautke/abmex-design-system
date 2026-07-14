// SettingsModal — the shell, and only the shell.
//
// It owns: the overlay, the dialog chrome, the heading, the close affordance,
// and the tab strip. It owns nothing else. It does not know what a provider is,
// what a tool is, or that MCP exists — the consumer passes tab descriptors and
// renders the active panel as `children`.

import type { ReactNode } from 'react';
import { Modal } from '@heroui/react';
import { cn } from '../../utils/cn';
import { ScrollableTabStrip, type ScrollableTabItem } from './ScrollableTabStrip';

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tabs: ScrollableTabItem[];
  activeTab: string;
  onTabChange: (id: string) => void;
  /**
   * The active panel. The shell does not switch panels for you — it reports the
   * active tab and renders whatever you hand it.
   *
   * WIRING: the consumer maps `activeTab` to a panel. Mount-all-and-hide (the
   * app's current approach, which preserves each panel's draft state across tab
   * switches) and render-one-at-a-time both work; the shell is indifferent.
   */
  children: ReactNode;
  title?: string;
  /** Accessible name for the tab strip. */
  tabsAriaLabel?: string;
  className?: string;
}

export function SettingsModal({
  isOpen,
  onClose,
  tabs,
  activeTab,
  onTabChange,
  children,
  title = 'Settings',
  tabsAriaLabel,
  className,
}: SettingsModalProps) {
  return (
    <Modal>
      <Modal.Backdrop
        isOpen={isOpen}
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
      >
        <Modal.Container>
          <Modal.Dialog className={cn('flex max-h-[85vh] flex-col overflow-hidden', className)}>
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>{title}</Modal.Heading>
            </Modal.Header>

            <ScrollableTabStrip
              tabs={tabs}
              activeTab={activeTab}
              onTabChange={onTabChange}
              ariaLabel={tabsAriaLabel ?? `${title} sections`}
            />

            <Modal.Body className="flex-1 overflow-y-auto p-4">{children}</Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

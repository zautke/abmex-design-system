// Opt-in drag reorder for the tabs family. Import from
// '@abmex/ui/components/tabs/Sortable'; requires the optional @dnd-kit peers.
// The root '@abmex/ui' entry never imports this file.
import { createContext, useContext, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type UniqueIdentifier,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { prefersReducedMotion } from '../../utils/motion';
import { Rail, SheetList, Tab, TabGhostContext, type TabsRailProps, type TabsSheetListProps, type TabsTabProps } from './Tabs';

interface SortableProps {
  /** Tab values in display order. */
  items: string[];
  onReorder: (items: string[]) => void;
  /** Spoken name of a tab in drag announcements. Default: the value. */
  getLabel?: (id: string) => string;
  /** Drag ghost for the active tab. Default: a static clone of its SortableTab. */
  renderOverlay?: (id: string) => ReactNode;
}

/** SortableTab props by value, so the overlay can re-render the active tab without the caller's help. */
const TabRegistry = createContext<Map<string, TabsTabProps> | null>(null);

const instructions = {
  draggable:
    'To reorder a tab, press Space or Enter to pick it up. Use the arrow keys to move it, Space or Enter to drop it, or Escape to cancel.',
};

function SortableArea({
  items,
  onReorder,
  getLabel = (id) => id,
  renderOverlay,
  vertical,
  children,
}: SortableProps & { vertical: boolean; children: ReactNode }) {
  const sensors = useSensors(
    // Mouse + Touch rather than Pointer so a touch scroll of the strip is not taken as a drag.
    // 6px threshold keeps click-to-select and double-click rename working.
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const [registry] = useState(() => new Map<string, TabsTabProps>());
  const [activeId, setActiveId] = useState<string | null>(null);

  // A tab added or closed mid-drag invalidates the indices: drop the drag, never commit it.
  const dragCount = useRef<number | null>(null);
  useEffect(() => {
    if (dragCount.current !== null && dragCount.current !== items.length) {
      dragCount.current = null;
      setActiveId(null);
    }
  }, [items.length]);

  const label = (id: UniqueIdentifier) => getLabel(String(id));
  const position = (id: UniqueIdentifier) => `position ${items.indexOf(String(id)) + 1} of ${items.length}`;
  const announcements: Announcements = {
    onDragStart: ({ active }) => `Picked up tab ${label(active.id)}. Tab is in ${position(active.id)}.`,
    onDragOver: ({ active, over }) =>
      over
        ? `Tab ${label(active.id)} was moved to ${position(over.id)}.`
        : `Tab ${label(active.id)} is no longer over a drop target.`,
    onDragEnd: ({ active, over }) =>
      over ? `Tab ${label(active.id)} was dropped at ${position(over.id)}.` : `Tab ${label(active.id)} was dropped.`,
    onDragCancel: ({ active }) => `Reorder cancelled. Tab ${label(active.id)} was returned to ${position(active.id)}.`,
  };

  const end = () => {
    dragCount.current = null;
    setActiveId(null);
  };
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    const valid = dragCount.current === items.length;
    end();
    if (!valid || !over || active.id === over.id) return;
    onReorder(arrayMove(items, items.indexOf(String(active.id)), items.indexOf(String(over.id))));
  };

  const ghost = activeId && registry.get(activeId);
  const dndId = useId();
  return (
    <TabRegistry.Provider value={registry}>
      <DndContext
        // Stable id: dnd-kit's global counter otherwise differs between SSR and hydration.
        id={dndId}
        sensors={sensors}
        collisionDetection={closestCenter}
        accessibility={{ announcements, screenReaderInstructions: instructions }}
        onDragStart={({ active }) => {
          dragCount.current = items.length;
          setActiveId(String(active.id));
        }}
        onDragEnd={onDragEnd}
        onDragCancel={end}
      >
        <SortableContext items={items} strategy={vertical ? verticalListSortingStrategy : horizontalListSortingStrategy}>
          {children}
        </SortableContext>
        {/* Fixed-position ghost: escapes the strip's overflow clip. No drop animation (motion-safe by default). */}
        <DragOverlay dropAnimation={null}>
          {activeId && (
            <div
              aria-hidden
              inert
              className="pointer-events-none scale-[1.03] opacity-95 shadow-[var(--shadow-overlay)] rounded-[var(--radius)]"
            >
              <TabGhostContext.Provider value>
                {renderOverlay ? renderOverlay(activeId) : ghost && <Tab {...ghost} id={undefined} />}
              </TabGhostContext.Provider>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </TabRegistry.Provider>
  );
}

export type SortableSheetListProps = TabsSheetListProps & SortableProps;

export function SortableSheetList({ items, onReorder, getLabel, renderOverlay, ...rest }: SortableSheetListProps) {
  return (
    <SortableArea items={items} onReorder={onReorder} getLabel={getLabel} renderOverlay={renderOverlay} vertical={false}>
      <SheetList {...rest} />
    </SortableArea>
  );
}

export type SortableRailProps = TabsRailProps & SortableProps;

export function SortableRail({ items, onReorder, getLabel, renderOverlay, ...rest }: SortableRailProps) {
  return (
    <SortableArea items={items} onReorder={onReorder} getLabel={getLabel} renderOverlay={renderOverlay} vertical>
      <Rail {...rest} />
    </SortableArea>
  );
}

export type SortableTabProps = TabsTabProps;

/** Tabs.Tab with a drag handle on the whole tab. Use inside SortableSheetList / SortableRail. */
export function SortableTab({ style, ...props }: SortableTabProps) {
  const registry = useContext(TabRegistry);
  // ponytail: written during render so the overlay always clones the latest props; cheap Map set.
  const { ref: _ref, ...clone } = props;
  registry?.set(props.value, { ...clone, style });
  useEffect(() => () => void registry?.delete(props.value), [registry, props.value]);

  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: props.value,
    transition: prefersReducedMotion() ? null : { duration: 180, easing: 'cubic-bezier(0.2,0.8,0.2,1)' },
  });
  // Tab owns role / tabIndex / aria-selected; take only dnd-kit's describedby + handlers.
  const { 'aria-describedby': describedBy } = attributes;
  const { onKeyDown: dragKeyDown, ...pointerListeners } = listeners ?? {};
  return (
    <Tab
      {...props}
      {...pointerListeners}
      // Capture phase: Tab's own Space/Enter handler preventDefaults, which dnd-kit treats as
      // "already handled" and refuses to pick up. While dragging, mark arrows/Home/End handled
      // so a defaultPrevented-aware tablist leaves focus and selection alone (dnd-kit's
      // document listener still moves the tab).
      onKeyDownCapture={(e) => {
        props.onKeyDownCapture?.(e);
        // Typing in the rename field (Enter/Space) must never pick the tab up.
        if ((e.target as HTMLElement).closest('input, textarea, [contenteditable="true"]')) return;
        dragKeyDown?.(e);
        if (isDragging && /^(Arrow|Home$|End$)/.test(e.key)) e.preventDefault();
      }}
      ref={setNodeRef}
      aria-describedby={describedBy}
      aria-roledescription="draggable tab"
      data-dragging={isDragging || undefined}
      style={{
        ...style,
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : style?.opacity,
        zIndex: isDragging ? 1 : style?.zIndex,
      }}
    />
  );
}

SortableTab.Label = Tab.Label;
SortableTab.Close = Tab.Close;
SortableTab.Chip = Tab.Chip;
SortableTab.Meta = Tab.Meta;

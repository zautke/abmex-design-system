// Opt-in drag reorder for the tabs family. Import from
// '@abmex/ui/components/tabs/Sortable'; requires the optional @dnd-kit peers.
// The root '@abmex/ui' entry never imports this file.
import type { ReactNode } from 'react';
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Rail, SheetList, Tab, type TabsRailProps, type TabsSheetListProps, type TabsTabProps } from './Tabs';

interface SortableProps {
  /** Tab values in display order. */
  items: string[];
  onReorder: (items: string[]) => void;
}

function SortableArea({ items, onReorder, vertical, children }: SortableProps & { vertical: boolean; children: ReactNode }) {
  const sensors = useSensors(
    // 6px threshold keeps click-to-select and double-click rename working.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    onReorder(arrayMove(items, items.indexOf(String(active.id)), items.indexOf(String(over.id))));
  };
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={items} strategy={vertical ? verticalListSortingStrategy : horizontalListSortingStrategy}>
        {children}
      </SortableContext>
    </DndContext>
  );
}

export type SortableSheetListProps = TabsSheetListProps & SortableProps;

export function SortableSheetList({ items, onReorder, ...rest }: SortableSheetListProps) {
  return (
    <SortableArea items={items} onReorder={onReorder} vertical={false}>
      <SheetList {...rest} />
    </SortableArea>
  );
}

export type SortableRailProps = TabsRailProps & SortableProps;

export function SortableRail({ items, onReorder, ...rest }: SortableRailProps) {
  return (
    <SortableArea items={items} onReorder={onReorder} vertical>
      <Rail {...rest} />
    </SortableArea>
  );
}

export type SortableTabProps = TabsTabProps;

/** Tabs.Tab with a drag handle on the whole tab. Use inside SortableSheetList / SortableRail. */
export function SortableTab({ style, ...props }: SortableTabProps) {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({ id: props.value });
  // Tab owns role / tabIndex / aria-selected; take only dnd-kit's describedby + handlers.
  const { 'aria-describedby': describedBy } = attributes;
  return (
    <Tab
      {...props}
      {...listeners}
      ref={setNodeRef}
      aria-describedby={describedBy}
      data-dragging={isDragging || undefined}
      style={{ ...style, transform: CSS.Translate.toString(transform), transition, zIndex: isDragging ? 1 : undefined }}
    />
  );
}

SortableTab.Label = Tab.Label;
SortableTab.Close = Tab.Close;
SortableTab.Chip = Tab.Chip;
SortableTab.Meta = Tab.Meta;

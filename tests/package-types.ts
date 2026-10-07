// Consumer declarations only: never import source or rely on skipLibCheck.
import type { ComponentProps } from 'react';
import { ApprovalRequest, FileList, ImageTile, TaskList, ToolResult } from '../packages/ui/dist/index.js';
import { Tabs } from '../packages/ui/dist/components/tabs/index.js';
import { SortableTab } from '../packages/ui/dist/components/tabs/Sortable.js';

const approval: ComponentProps<typeof ApprovalRequest> = { heading: 'Approve?', onApprove() {}, onReject() {} };
const files: ComponentProps<typeof FileList> = { entries: [] };
const image: ComponentProps<typeof ImageTile> = { alt: 'Preview' };
const tasks: ComponentProps<typeof TaskList> = { items: [] };
const result: ComponentProps<typeof ToolResult> = { summary: 'Result' };
const tabs: ComponentProps<typeof Tabs> = { defaultValue: 'one' };
const sortable: ComponentProps<typeof SortableTab> = { value: 'one' };
void [approval, files, image, tasks, result, tabs, sortable];

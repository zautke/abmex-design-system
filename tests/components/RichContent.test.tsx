// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { ApprovalRequest, FileList, ImageGallery, ImageTile, TaskList, ToolResult } from '@abmex/ui';

afterEach(cleanup);

it('delegates downloads and prevents duplicate activation while busy', () => {
  const download = vi.fn();
  const entries = [{ id: '/one', name: 'One' }, { id: '/two', name: 'Two' }];
  const view = render(<FileList entries={entries} onDownload={download} />);
  fireEvent.click(view.getByRole('button', { name: 'One' }));
  expect(download).toHaveBeenCalledWith('/one');
  view.rerender(<FileList entries={entries} onDownload={download} busyId="/one" />);
  fireEvent.click(view.getByRole('button', { name: 'Two' }));
  expect(download).toHaveBeenCalledTimes(1);
});

it('renders task status accessibly and accepts custom content', () => {
  const view = render(<TaskList aria-label="Work" items={[{ id: 'a', text: 'Build', status: 'done' }]} renderItem={item => <strong>{item.text}</strong>} />);
  expect(view.getByRole('list', { name: 'Work' })).toBeTruthy();
  expect(view.getByText('done')).toBeTruthy();
  expect(view.getByText('Build').tagName).toBe('STRONG');
});

it('keeps tool details controlled through native details props', () => {
  const view = render(<ToolResult summary="Task result" open><span>Result content</span></ToolResult>);
  expect(view.getByText('Task result').closest('details')?.open).toBe(true);
});

it('uses injected image URLs and slots without persistence', () => {
  const view = render(<ImageGallery><ImageTile src="/image.png" alt="Preview" muted badge="Excluded" actions={<button>Restore</button>} /></ImageGallery>);
  expect(view.getByRole('img').getAttribute('src')).toBe('/image.png');
  expect(view.getByRole('button', { name: 'Restore' })).toBeTruthy();
  expect(view.getByText('Excluded')).toBeTruthy();
});

it('allows consumer handlers to cancel approval and forwards the root ref', () => {
  const approve = vi.fn();
  const ref = vi.fn();
  const view = render(<ApprovalRequest ref={ref} heading="Run command?" onApprove={approve} onReject={() => {}} approveProps={{ onClick: e => e.preventDefault() }}><code>command</code></ApprovalRequest>);
  fireEvent.click(view.getByRole('button', { name: 'Allow' }));
  expect(approve).not.toHaveBeenCalled();
  expect(ref).toHaveBeenCalled();
});

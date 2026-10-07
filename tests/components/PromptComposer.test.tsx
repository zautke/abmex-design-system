// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { PromptComposer, imageFilesFromDataTransfer, type ComposerAttachment } from '@abmex/ui';

afterEach(cleanup);

function png(name = 'image.png'): File {
  return new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47]) as unknown as BlobPart], name, { type: 'image/png' });
}

/** Minimal DataTransfer stand-in — jsdom has no constructor for it. */
function dt(opts: { files?: File[]; items?: Array<{ kind: string; type: string; file?: File | null }>; types?: string[] }) {
  const files = opts.files ?? [];
  const items = (opts.items ?? []).map((i) => ({ kind: i.kind, type: i.type, getAsFile: () => i.file ?? null }));
  return {
    files,
    items,
    types: opts.types ?? (files.length > 0 ? ['Files'] : items.map((i) => i.type)),
    dropEffect: 'none',
    getData: () => '',
  } as unknown as DataTransfer;
}

/**
 * jsdom has no AnimationEvent: fireEvent.animationEnd cannot carry a name, and
 * React falls back to the `webkitAnimationEnd` listener when the constructor
 * is missing — so dispatch that name with the property defined by hand.
 */
function animationEnd(el: Element, animationName: string) {
  const ev = new Event('webkitAnimationEnd', { bubbles: true });
  Object.defineProperty(ev, 'animationName', { value: animationName });
  fireEvent(el, ev);
}

function renderComposer(props: Partial<React.ComponentProps<typeof PromptComposer>> = {}) {
  const onSend = vi.fn();
  const onFiles = vi.fn();
  const utils = render(
    <PromptComposer
      value=""
      onChange={vi.fn()}
      onSend={onSend}
      onStop={vi.fn()}
      streaming={false}
      disabled={false}
      onFiles={onFiles}
      {...props}
    />,
  );
  return { ...utils, onSend, onFiles, textarea: screen.getByLabelText('Chat input') };
}

describe('imageFilesFromDataTransfer', () => {
  it('prefers files, ignores non-images, and never merges files with items', () => {
    const a = png('a.png');
    const txt = new File(['x'], 'notes.txt', { type: 'text/plain' });
    expect(imageFilesFromDataTransfer(dt({ files: [a, txt], items: [{ kind: 'file', type: 'image/png', file: png('dup.png') }] }))).toEqual([a]);
  });

  it('falls back to image items (screenshot / html+png paste) and skips text/html', () => {
    const shot = png();
    const files = imageFilesFromDataTransfer(
      dt({ items: [{ kind: 'string', type: 'text/html' }, { kind: 'file', type: 'image/png', file: shot }] }),
    );
    expect(files).toEqual([shot]);
  });

  it('keeps untyped files that look like images by name (HEIC from Explorer)', () => {
    const heic = new File(['x'], 'IMG_1.heic', { type: '' });
    expect(imageFilesFromDataTransfer(dt({ files: [heic] }))).toEqual([heic]);
  });
});

describe('PromptComposer paste and drop', () => {
  it('hands pasted image files to onFiles and claims the event', () => {
    const { textarea, onFiles } = renderComposer();
    const shot = png();
    const event = fireEvent.paste(textarea, { clipboardData: dt({ items: [{ kind: 'file', type: 'image/png', file: shot }] }) });
    expect(onFiles).toHaveBeenCalledWith([shot]);
    // fireEvent returns false when preventDefault was called.
    expect(event).toBe(false);
  });

  it('leaves a text-only paste to the browser', () => {
    const { textarea, onFiles } = renderComposer();
    const event = fireEvent.paste(textarea, { clipboardData: dt({ items: [{ kind: 'string', type: 'text/plain' }] }) });
    expect(onFiles).not.toHaveBeenCalled();
    expect(event).toBe(true);
  });

  it('does nothing on paste when onFiles is not wired', () => {
    const { textarea } = renderComposer({ onFiles: undefined });
    const event = fireEvent.paste(textarea, { clipboardData: dt({ items: [{ kind: 'file', type: 'image/png', file: png() }] }) });
    expect(event).toBe(true);
  });

  it('accepts dropped image files and prevents navigation', () => {
    const { textarea, onFiles } = renderComposer();
    const zone = textarea.closest('[class*="border-t"]')!;
    const shot = png('drop.png');
    const over = fireEvent.dragOver(zone, { dataTransfer: dt({ files: [shot] }) });
    expect(over).toBe(false);
    const drop = fireEvent.drop(zone, { dataTransfer: dt({ files: [shot] }) });
    expect(drop).toBe(false);
    expect(onFiles).toHaveBeenCalledWith([shot]);
  });
});

describe('PromptComposer send enablement with attachments', () => {
  const ready: ComposerAttachment = { id: '1', name: 'a.png', status: 'ready', previewUrl: 'blob:x' };
  const pending: ComposerAttachment = { id: '2', name: 'b.png', status: 'pending' };

  it('enables an image-only send once attachments are ready', () => {
    const { onSend } = renderComposer({ attachments: [ready] });
    const button = screen.getByRole('button', { name: 'Send message' });
    expect(button.hasAttribute("disabled") || button.getAttribute("aria-disabled") === "true").toBe(false);
    fireEvent.click(button);
    expect(onSend).toHaveBeenCalledWith('');
  });

  it('blocks send while a chip is still pending, even with text', () => {
    renderComposer({ value: 'look', attachments: [pending] });
    const btn = screen.getByRole("button", { name: "Send message" }); expect(btn.hasAttribute("disabled") || btn.getAttribute("aria-disabled") === "true").toBe(true);
  });

  it('renders chips with a remove control', () => {
    const onRemoveAttachment = vi.fn();
    renderComposer({ attachments: [ready], onRemoveAttachment });
    const btn = screen.getByRole('button', { name: 'Remove a.png' });
    fireEvent.click(btn);
    expect(onRemoveAttachment).toHaveBeenCalledWith('1');
  });

  it('shows the remove control only on tile hover or keyboard focus', () => {
    renderComposer({ attachments: [ready], onRemoveAttachment: vi.fn() });
    const btn = screen.getByRole('button', { name: 'Remove a.png' });
    expect(btn.className).toMatch(/\bopacity-0\b/);
    expect(btn.className).toMatch(/\bgroup-hover:opacity-100\b/);
    expect(btn.className).toMatch(/\bfocus-visible:opacity-100\b/);
    expect(btn.closest('li')?.className).toMatch(/\bgroup\b/);
  });
});

describe('AttachmentStrip enter / exit motion (kit pop tokens)', () => {
  const ready: ComposerAttachment = { id: '1', name: 'a.png', status: 'ready', previewUrl: 'blob:x' };
  const removing: ComposerAttachment = { ...ready, status: 'removing' };

  it('mounts a chip with the pop-in token', () => {
    renderComposer({ attachments: [ready], onRemoveAttachment: vi.fn() });
    const li = screen.getByRole('button', { name: 'Remove a.png' }).closest('li')!;
    expect(li.className).toMatch(/\bmotion-safe:animate-pop-in\b/);
  });

  it('reports the × synchronously, so a send in the exit window cannot carry the chip', () => {
    const onRemoveAttachment = vi.fn();
    renderComposer({ attachments: [ready], onRemoveAttachment });
    fireEvent.click(screen.getByRole('button', { name: 'Remove a.png' }));
    expect(onRemoveAttachment).toHaveBeenCalledTimes(1);
    expect(onRemoveAttachment).toHaveBeenCalledWith('1');
  });

  it('a removing chip plays pop-out, does not enable send, and reports again only when pop-out ends', () => {
    const onRemoveAttachment = vi.fn();
    renderComposer({ attachments: [removing], onRemoveAttachment });
    const li = screen.getByRole('button', { name: 'Remove a.png' }).closest('li')!;
    expect(li.className).toMatch(/\bmotion-safe:animate-pop-out\b/);
    const send = screen.getByRole('button', { name: 'Send message' });
    expect(send.hasAttribute('disabled') || send.getAttribute('aria-disabled') === 'true').toBe(true);
    animationEnd(li, 'pop-in');
    expect(onRemoveAttachment).not.toHaveBeenCalled();
    animationEnd(li, 'pop-out');
    expect(onRemoveAttachment).toHaveBeenCalledWith('1');
  });
});

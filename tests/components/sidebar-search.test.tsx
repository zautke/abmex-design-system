// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { RecipeSearchSidebarDemo } from '../../packages/ui/src/components/sidebar-search';
afterEach(cleanup);
describe('donor search composition', () => {
  it('submits local recipes and navigates to useful utility content', async () => {
    render(<RecipeSearchSidebarDemo />);
    fireEvent.click(screen.getByRole('button', { name: 'Search', exact: true }));
    await waitFor(() => expect(screen.getByText('Roasted tomato pasta')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: 'Analytics' }));
    expect(screen.getByText(/Current result count: 1/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
    expect(screen.getByRole('spinbutton', { name: 'Result limit' })).toBeTruthy();
  });
  it('uses a replaceable adapter and renders a failure without losing the query', async () => {
    render(<RecipeSearchSidebarDemo search={async () => { throw new Error('Fixture adapter failed'); }} />);
    fireEvent.click(screen.getByRole('button', { name: 'Search', exact: true }));
    await waitFor(() => expect(screen.getByRole('alert').textContent).toBe('Fixture adapter failed'));
    expect((screen.getByRole('textbox', { name: 'Search recipes' }) as HTMLInputElement).value).toBe('tomato');
  });
});

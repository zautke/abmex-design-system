// @vitest-environment jsdom
// AppFooter is a pure presentational component — its only contract is
// rendering the injected `version` prop (S3 replaced browser.runtime).

import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { AppFooter } from '@abmex/ui';

afterEach(cleanup);

describe('AppFooter', () => {
  it('renders the version prop wrapped in parentheses', () => {
    const { getByText } = render(<AppFooter version="0.2.6.40" />);
    expect(getByText('(0.2.6.40)')).toBeTruthy();
  });

  it('renders inside a <footer> landmark', () => {
    const { container } = render(<AppFooter version="1.0.0" />);
    expect(container.querySelector('footer')).not.toBeNull();
  });

  it('reflects a changed version on rerender', () => {
    const { getByText, rerender } = render(<AppFooter version="1.0.0" />);
    expect(getByText('(1.0.0)')).toBeTruthy();
    rerender(<AppFooter version="2.0.0" />);
    expect(getByText('(2.0.0)')).toBeTruthy();
  });

  it('renders an empty version string without throwing', () => {
    const { getByText } = render(<AppFooter version="" />);
    expect(getByText('()')).toBeTruthy();
  });
});

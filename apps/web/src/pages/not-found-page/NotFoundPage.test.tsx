import { screen } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';

import { renderWithProviders } from '@/test/test-utils';

import NotFoundPage from './NotFoundPage';
import { UI_IDS, UI_TITLES } from './NotFoundPage.consts';

const NotFoundPageElements = [UI_IDS.HEADER, UI_IDS.ERROR_MESSAGE, UI_IDS.HOME_LINK];
describe('NotFoundPage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render not found page elements', () => {
    renderWithProviders(<NotFoundPage />);
    NotFoundPageElements.forEach((id) => {
      expect(screen.getByTestId(id)).toBeInTheDocument();
    });
  });

  it('should navigate to home page on link click', () => {
    renderWithProviders(<NotFoundPage />);
    const homeLink = screen.getByTestId(UI_IDS.HOME_LINK);
    expect(homeLink).toHaveTextContent(UI_TITLES.HOME_LINK);
    homeLink.click();

    expect(window.location.pathname).toBe('/');
  });
});

import { screen } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';

import { renderWithProviders } from '@/test/test-utils';

import HomePage from './HomePage';
import { UI_IDS, UI_TITLES } from './HomePage.consts';

const HomePageElements = [UI_IDS.HEADER, UI_IDS.DESCRIPTION, UI_IDS.NAV_LINK];

describe('HomePage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render home page elements', () => {
    renderWithProviders(<HomePage />);
    HomePageElements.forEach((id) => {
      expect(screen.getByTestId(id)).toBeInTheDocument();
    });
  });

  it('should navigate to boards page on link click', async () => {
    renderWithProviders(<HomePage />);
    const navLink = screen.getByTestId(UI_IDS.NAV_LINK);
    expect(navLink).toHaveTextContent(UI_TITLES.NAV_LINK_TEXT);
    navLink.click();

    expect(window.location.pathname).toBe('/boards');
  });
});

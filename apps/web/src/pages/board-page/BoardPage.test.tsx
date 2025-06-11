/* eslint-disable jest/no-conditional-expect */
import { screen } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';

import * as authService from '@/features/auth/services/auth.service';
import * as boardService from '@/features/board/services/board.service';
import { mockBoards } from '@/mocks/board.mock';
import { mockUsers } from '@/mocks/user.mock';
import { createAuthenticatedStore, renderWithProviders } from '@/test/test-utils';

import { BoardPage } from './BoardPage';
import { UI_IDS, UI_TITLES } from './BoardPage.consts';

const BoardPageEmptyStateElements = [
  UI_IDS.EMPTY_BOARD_HEADER,
  UI_IDS.EMPTY_BOARD_MESSAGE,
  UI_IDS.EMPTY_BOARD_CREATE_BTN
];

const BoardPageSidebarElements = [
  UI_IDS.BOARD_SIDEBAR,
  UI_IDS.HOME_BTN,
  UI_IDS.MY_WORK_BTN,
  UI_IDS.BOARD_HEADER,
  UI_IDS.SELECT_BOARD_BTN,
  UI_IDS.BOARD_DROPDOWN_MENU_OPEN_BTN
];

const BoardPageSideBarDropdownElements = [
  UI_IDS.OPEN_IN_NEW_TAB_BTN,
  UI_IDS.RENAME_BOARD_BTN,
  UI_IDS.DELETE_BOARD_BTN
];

const BoardPageAlertDeleteBoardElements = [
  UI_IDS.ALERT_DELETE_BOARD_TITLE,
  UI_IDS.ALERT_DELETE_BOARD_DESCRIPTION,
  UI_IDS.ALERT_DELETE_BOARD_CANCEL_BTN,
  UI_IDS.ALERT_DELETE_BOARD_BTN_CONFIRMATION
];

let mockDeleteBoardTriggerFn: ReturnType<typeof vi.fn>;
let mockDeleteBoardUnwrapFn: ReturnType<typeof vi.fn>;
let mockCreateBoardTriggerFn: ReturnType<typeof vi.fn>;
let mockCreateBoardUnwrapFn: ReturnType<typeof vi.fn>;
let mockUpdateBoardTriggerFn: ReturnType<typeof vi.fn>;
let mockUpdateBoardUnwrapFn: ReturnType<typeof vi.fn>;

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ boardId: mockBoards.length > 0 ? mockBoards[0].id : undefined })
  };
});

describe('BoardPage', () => {
  beforeEach(() => {
    mockNavigate.mockClear();

    mockDeleteBoardUnwrapFn = vi.fn().mockResolvedValue({});
    mockDeleteBoardTriggerFn = vi
      .fn()
      .mockReturnValue({ unwrap: mockDeleteBoardUnwrapFn });

    mockCreateBoardUnwrapFn = vi
      .fn()
      .mockResolvedValue({ id: 'new-board-id', name: 'New Board' });
    mockCreateBoardTriggerFn = vi
      .fn()
      .mockReturnValue({ unwrap: mockCreateBoardUnwrapFn });

    mockUpdateBoardUnwrapFn = vi.fn().mockResolvedValue({});
    mockUpdateBoardTriggerFn = vi
      .fn()
      .mockReturnValue({ unwrap: mockUpdateBoardUnwrapFn });

    vi.spyOn(boardService, 'useGetBoardsQuery').mockReturnValue({
      data: [...mockBoards],
      isLoading: false,
      isFetching: false,
      refetch: vi.fn()
    });

    vi.spyOn(boardService, 'useDeleteBoardMutation').mockReturnValue([
      mockDeleteBoardTriggerFn,
      { isLoading: false, reset: vi.fn() }
    ]);

    vi.spyOn(boardService, 'useCreateBoardMutation').mockReturnValue([
      mockCreateBoardTriggerFn,
      { isLoading: false, reset: vi.fn() }
    ]);

    vi.spyOn(boardService, 'useUpdateBoardMutation').mockReturnValue([
      mockUpdateBoardTriggerFn,
      { isLoading: false, reset: vi.fn() }
    ]);

    vi.spyOn(authService, 'useGetUsersQuery').mockReturnValue({
      data: mockUsers,
      isLoading: false,
      isFetching: false,
      refetch: vi.fn()
    });
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render empty board page elements', () => {
    vi.spyOn(boardService, 'useGetBoardsQuery').mockReturnValue({
      data: [], // Empty data for this test
      isLoading: false,
      isFetching: false,
      refetch: vi.fn()
    });
    const store = createAuthenticatedStore();

    renderWithProviders(<BoardPage />, { store });
    BoardPageEmptyStateElements.forEach((id) => {
      expect(screen.getByTestId(id)).toBeInTheDocument();
    });
    expect(screen.getByTestId(UI_IDS.EMPTY_BOARD_HEADER)).toHaveTextContent(
      UI_TITLES.EMPTY_BOARD_HEADER
    );
    expect(screen.getByTestId(UI_IDS.EMPTY_BOARD_MESSAGE)).toHaveTextContent(
      UI_TITLES.EMPTY_BOARD_MESSAGE
    );
    expect(screen.getByTestId(UI_IDS.EMPTY_BOARD_CREATE_BTN)).toHaveTextContent(
      UI_TITLES.EMPTY_BOARD_CREATE_BTN
    );
  });

  it('should render board sidebar with boards', () => {
    const store = createAuthenticatedStore();

    renderWithProviders(<BoardPage />, { store });

    BoardPageSidebarElements.forEach((id) => {
      if (id === UI_IDS.SELECT_BOARD_BTN || id === UI_IDS.BOARD_DROPDOWN_MENU_OPEN_BTN) {
        const elements = screen.getAllByTestId(id);
        expect(elements).toHaveLength(mockBoards.length);
        elements.forEach((element) => expect(element).toBeInTheDocument());
      } else {
        expect(screen.getByTestId(id)).toBeInTheDocument();
      }
    });
  });

  it('should render drop down menu', async () => {
    const store = createAuthenticatedStore();

    const { user } = renderWithProviders(<BoardPage />, { store });

    const dropdownTriggers = await screen.findAllByTestId(
      UI_IDS.BOARD_DROPDOWN_MENU_OPEN_BTN
    );
    expect(dropdownTriggers.length).toBeGreaterThan(0);
    const firstDropdownTrigger = dropdownTriggers[0];

    await user.click(firstDropdownTrigger);

    BoardPageSideBarDropdownElements.forEach((id) => {
      expect(screen.getByTestId(id)).toBeInTheDocument();
    });
  });

  it('should render alert dialog when clicking on remove', async () => {
    const store = createAuthenticatedStore();

    const { user } = renderWithProviders(<BoardPage />, { store });

    const dropdownTriggers = await screen.findAllByTestId(
      UI_IDS.BOARD_DROPDOWN_MENU_OPEN_BTN
    );
    expect(dropdownTriggers.length).toBeGreaterThan(0);
    const firstDropdownTrigger = dropdownTriggers[0];

    await user.click(firstDropdownTrigger);

    const deleteButton = screen.getByTestId(UI_IDS.DELETE_BOARD_BTN);
    await user.click(deleteButton);

    BoardPageAlertDeleteBoardElements.forEach((id) => {
      expect(screen.getByTestId(id)).toBeInTheDocument();
    });
  });

  it('should removed the board when delete is confirmed', async () => {
    const store = createAuthenticatedStore();

    const { user } = renderWithProviders(<BoardPage />, { store });
    const dropdownTriggers = await screen.findAllByTestId(
      UI_IDS.BOARD_DROPDOWN_MENU_OPEN_BTN
    );
    expect(dropdownTriggers.length).toBeGreaterThan(0);

    const firstDropdownTrigger = dropdownTriggers[0];
    await user.click(firstDropdownTrigger);
    const deleteButton = screen.getByTestId(UI_IDS.DELETE_BOARD_BTN);
    await user.click(deleteButton);
    const confirmButton = screen.getByTestId(UI_IDS.ALERT_DELETE_BOARD_BTN_CONFIRMATION);
    await user.click(confirmButton);

    expect(mockDeleteBoardTriggerFn).toHaveBeenCalledWith(mockBoards[0].id);
    expect(mockDeleteBoardUnwrapFn).toHaveBeenCalled();
  });
});

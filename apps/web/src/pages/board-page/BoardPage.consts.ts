const COMP_NAME = 'BoardPage';

export const UI_IDS = {
  EMPTY_BOARD_HEADER: `${COMP_NAME}-empty-board-header`,
  EMPTY_BOARD_MESSAGE: `${COMP_NAME}-empty-board-message`,
  EMPTY_BOARD_CREATE_BTN: `${COMP_NAME}-empty-board-create-btn`,

  // Sidebar
  BOARD_SIDEBAR: `${COMP_NAME}-board-sidebar`,
  LOADING_BOARDS: `${COMP_NAME}-loading-boards`,
  HOME_BTN: `${COMP_NAME}-home-link`,
  MY_WORK_BTN: `${COMP_NAME}-my-work-btn`,

  // Siderbar board list
  BOARD_HEADER: `${COMP_NAME}-board-header`,
  BOARD_EDIT_NAME_INPUT: `${COMP_NAME}-board-edit-name-input`,
  SELECT_BOARD_BTN: `${COMP_NAME}-select-board-btn`,
  BOARD_DROPDOWN_MENU_OPEN_BTN: `${COMP_NAME}-board-dropdown-menu-open-btn`,
  OPEN_IN_NEW_TAB_BTN: `${COMP_NAME}-open-in-new-tab-btn`,
  RENAME_BOARD_BTN: `${COMP_NAME}-rename-board-btn`,
  DUPLICATE_BOARD_BTN: `${COMP_NAME}-duplicate-board-btn`,
  DELETE_BOARD_BTN: `${COMP_NAME}-delete-board-btn`,
  DELETE_BOARD_TITLE: `${COMP_NAME}-delete-board-title`,
  DELETE_BOARD_DESCRIPTION: `${COMP_NAME}-delete-board-description`,
  DELETE_BOARD_CANCEL_BTN: `${COMP_NAME}-delete-board-cancel-btn`,
  DELETE_BOARD_BTN_CONFIRMATION: `${COMP_NAME}-delete-board-btn-confirmation`,
  CREATE_BOARD_BTN: `${COMP_NAME}-create-board-btn`,

  // Create board dialog
  CREATE_BOARD_DIALOG_TITLE: `${COMP_NAME}-create-board-dialog-title`,
  CREATE_BOARD_NAME_LABEL: `${COMP_NAME}-create-board-name-label`,
  CREATE_BOARD_NAME_INPUT: `${COMP_NAME}-create-board-name-input`,
  CREATE_BOARD_DESCRIPTION_LABEL: `${COMP_NAME}-create-board-description-label`,
  CREATE_BOARD_DESCRIPTION_INPUT: `${COMP_NAME}-create-board-description-input`,
  CREATE_BOARD_CANCEL_BTN: `${COMP_NAME}-create-board-cancel-btn`,
  CREATE_BOARD_CREATE_BTN: `${COMP_NAME}-create-board-create-btn`
};

export const UI_TITLES = {
  EMPTY_BOARD_HEADER: 'Welcome!',
  EMPTY_BOARD_MESSAGE:
    // eslint-disable-next-line quotes
    "You don't have any boards yet. Create your first board to get started.",
  EMPTY_BOARD_CREATE_BTN: 'Create your first board',

  // Sidebar
  HOME_BTN: 'Home',
  MY_WORK_BTN: 'My Work',
  LOADING_BOARDS: 'Loading boards…',

  // Sidebar board list
  BOARD_HEADER: 'Boards',
  OPEN_IN_NEW_TAB_BTN: 'Open in new tab',
  RENAME_BOARD_BTN: 'Rename board',
  DUPLICATE_BOARD_BTN: 'Duplicate board',
  DELETE_BOARD_BTN: 'Delete',
  DELETE_BOARD_TITLE: 'Delete board',
  DELETE_BOARD_CANCEL_BTN: 'Cancel',
  DELETE_BOARD_CONFIRM_BTN: 'Delete',
  CREATE_BOARD_BTN: 'Create board',

  // Create board dialog
  CREATE_BOARD_DIALOG_TITLE: 'Create board',
  CREATE_BOARD_NAME_LABEL: 'Board name',
  CREATE_BOARD_NAME_INPUT: 'Enter board name',
  CREATE_BOARD_DESCRIPTION_LABEL: 'Description (optional)',
  CREATE_BOARD_DESCRIPTION_PLACEHOLDER: 'Describe what this board is for...',
  CREATE_BOARD_CANCEL_BTN: 'Cancel',
  CREATE_BOARD_CREATE_BTN: 'Create board',
  CREATE_BOARD_CREATING: 'Creating...'
};

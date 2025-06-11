import React, { ReactElement } from 'react';
import { Link } from 'react-router-dom';

import { UI_IDS, UI_TITLES } from './HomePage.consts';

export const HomePage: React.FC = (): ReactElement => {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <h1 className="text-4xl font-bold mb-4" data-testid={UI_IDS.HEADER}>
        {UI_TITLES.HEADER}
      </h1>
      <p className="text-lg text-gray-700" data-testid={UI_IDS.DESCRIPTION}>
        {UI_TITLES.DESCRIPTION}
      </p>
      <Link
        to="/boards"
        data-testid={UI_IDS.NAV_LINK}
        className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
      >
        {UI_TITLES.NAV_LINK_TEXT}
      </Link>
    </div>
  );
};

import React, { ReactElement } from 'react';
import { Link } from 'react-router-dom';

import { UI_IDS, UI_TITLES } from './NotFoundPage.consts';

const NotFoundPage: React.FC = (): ReactElement => {
  return (
    <div className="flex h-screen flex-col items-center justify-center">
      <div
        className="text-6xl font-bold text-sky-500 md:text-8xl lg:text-9xl"
        data-testid={UI_IDS.HEADER}
      >
        {UI_TITLES.HEADER}
      </div>
      <p
        className="mt-5 text-base font-bold text-sky-500 md:text-xl lg:text-2xl"
        data-testid={UI_IDS.ERROR_MESSAGE}
      >
        {UI_TITLES.ERROR_MESSAGE}
      </p>
      <Link
        to="/"
        className="mt-5 rounded bg-sky-500 px-6 py-3 text-center text-sm font-bold text-white hover:bg-sky-400 focus:outline-none md:px-4 md:py-2 md:text-base"
        data-testid={UI_IDS.HOME_LINK}
      >
        {UI_TITLES.HOME_LINK}
      </Link>
    </div>
  );
};

export default NotFoundPage;

import React, { ReactElement } from 'react';
import { Link } from 'react-router-dom';

import { Button } from '@/components';

import { UI_IDS, UI_TITLES } from './HomePage.consts';

const HomePage: React.FC = (): ReactElement => {
  return (
    <main className="h-screen w-screen">
      <section className="home-page-hero h-full">
        <div className="flex flex-col items-center h-full gap-10 pt-24 lg:pt-44 px-4 lg:px-32 text-center">
          <div className="border border-white rounded-full whitespace-nowrap px-3 lg:px-4 lg:py-1 font-semibold text-primary-foreground lg:text-xl ">
            Free forever. No credit card needed.
          </div>

          <h1
            className="text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-bold"
            data-testid={UI_IDS.HEADER}
          >
            Not just another tool. <br />A Unicorn.
          </h1>
          <p
            className="px-2 text-center text-xl lg:text-[1.6rem]"
            data-testid={UI_IDS.DESCRIPTION}
          >
            {UI_TITLES.DESCRIPTION}
          </p>
          <Button
            size={'lg'}
            variant={'secondary'}
            className="primary-shadow mt-6 text-lg lg:text-xl h-12 lg:h-15 w-28 lg:w-48 rounded-lg hover:scale-105 transition-all duration-200"
          >
            <Link to="/boards" data-testid={UI_IDS.NAV_LINK}>
              {UI_TITLES.NAV_LINK_TEXT}
            </Link>
          </Button>
        </div>
      </section>
    </main>
  );
};

export default HomePage;

import React, { ReactElement } from 'react';
import { Link } from 'react-router-dom';

import { Button } from '@/components';

import { UI_IDS, UI_TITLES } from './HomePage.consts';

const HomePage: React.FC = (): ReactElement => {
  return (
    <main className="h-screen w-screen">
      <section className="home-page-hero h-full">
        <nav className="absolute top-0 left-0 right-0 flex items-center justify-between max-w-7xl px-6 lg:px-12 py-6 lg:py-10 z-10 mx-auto">
          <div className="uppercase font-bold text-2xl lg:text-4xl text-white font-mono tracking-wide">
            unicorn
          </div>
        </nav>
        <div className="flex flex-col items-center h-full gap-10 pt-24 lg:pt-44 px-4 lg:px-32 text-center">
          <div className="border border-white rounded-full whitespace-nowrap px-3 lg:px-4 lg:py-1 font-semibold text-primary-foreground lg:text-xl ">
            Free forever. No credit card needed.
          </div>

          <h1
            className="text-4xl lg:text-6xl xl:text-7xl 2xl:text-8xl font-bold"
            data-testid={UI_IDS.HEADER}
          >
            Not just another tool. <br />A Unicorn.
          </h1>
          <p
            className="px-2 text-center text-xl lg:text-[1.8rem]"
            data-testid={UI_IDS.DESCRIPTION}
          >
            {UI_TITLES.DESCRIPTION}
          </p>
          <Button
            size={'lg'}
            variant={'secondary'}
            className="primary-shadow mt-6 text-lg lg:text-2xl h-14 lg:h-16 w-36 lg:w-60 rounded-lg hover:scale-105 transition-all duration-200"
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

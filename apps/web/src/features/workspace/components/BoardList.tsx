import { FC, ReactElement } from 'react';

export type BoardListProps = {};

const BoardList: FC<BoardListProps> = (): ReactElement => {
  return <div className="bg-board-list-bg w-1/3 h-full">Board List</div>;
};

export default BoardList;

import BoardList from '@/features/workspace/components/BoardList';
import WorkSpace from '@/features/workspace/components/Workspace';
import { FC, ReactElement } from 'react';

export interface WorkspacePageProps {}

const WorkSpacePage: FC<WorkspacePageProps> = (): ReactElement => {
  return (
    <div className="workspace flex w-screen h-screen justify-between">
      <BoardList />
      <WorkSpace />
    </div>
  );
};

export default WorkSpacePage;

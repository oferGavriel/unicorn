import { FC, ReactElement } from 'react';

export interface WorkspaceProps {}

const WorkSpace: FC<WorkspaceProps> = (): ReactElement => {
  return <div className="w-[70%] h-full">Work space !</div>;
};

export default WorkSpace;

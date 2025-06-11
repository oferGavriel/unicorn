import { IBoardList } from '@/features/board';

export const mockBoard: IBoardList[] = [
  {
    id: '1',
    name: 'Test Board',
    description: 'This is a test board',
    ownerId: 'test-user-1',
    members: ['test-user-1'],
    createdAt: '2025-06-06T11:11:02.901852',
    updatedAt: '2025-06-06T15:51:48.421868'
  }
];

export const mockBoards: IBoardList[] = [
  {
    id: '1',
    name: 'New board YES!',
    description: 'The best board ever',
    ownerId: 'test-user-1',
    members: ['test-user-1'],
    createdAt: '2025-06-06T11:11:02.901852',
    updatedAt: '2025-06-06T15:51:48.421868'
  },
  {
    id: '2',
    name: 'Second board',
    description: 'This is the second board',
    ownerId: 'test-user-1',
    members: ['test-user-1'],
    createdAt: '2025-06-07T11:11:02.901852',
    updatedAt: '2025-06-07T15:51:48.421868'
  },
  {
    id: '3',
    name: 'Third board',
    description: 'This is the third board',
    ownerId: 'test-user-1',
    members: ['test-user-1'],
    createdAt: '2025-06-08T11:11:02.901852',
    updatedAt: '2025-06-08T15:51:48.421868'
  }
];

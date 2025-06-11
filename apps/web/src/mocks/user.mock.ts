import { IAuthUser } from '@/features/auth';

export const mockUser: IAuthUser = {
  id: 'test-user-1',
  email: 'test@example.com',
  name: 'Test User'
};

export const mockUsers: IAuthUser[] = [
  {
    id: 'test-user-1',
    email: 'test@example.com',
    name: 'Test User'
  },
  {
    id: 'test-user-2',
    email: 'test2@example.com',
    name: 'Test User 2'
  },
  {
    id: 'test-user-3',
    email: 'test3@example.com',
    name: 'Test User 3'
  }
];

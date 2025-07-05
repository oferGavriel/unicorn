import { IAuthUser } from '@/features/auth';

export const mockUser: IAuthUser = {
  id: 'test-user-1',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  avatarUrl: 'https://example.com/avatar.jpg'
};

export const mockUsers: IAuthUser[] = [
  {
    id: 'test-user-1',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    avatarUrl: 'https://example.com/avatar.jpg'
  },
  {
    id: 'test-user-2',
    email: 'test2@example.com',
    firstName: 'Test',
    lastName: 'User 2',
    avatarUrl: 'https://example.com/avatar2.jpg'
  },
  {
    id: 'test-user-3',
    email: 'test3@example.com',
    firstName: 'Test',
    lastName: 'User 3',
    avatarUrl: 'https://example.com/avatar3.jpg'
  }
];

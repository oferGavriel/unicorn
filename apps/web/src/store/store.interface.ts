import type { IAuthUser } from '@/features/auth/types/auth.interface';

export interface IReduxState {
  authUser: IAuthUser;
}

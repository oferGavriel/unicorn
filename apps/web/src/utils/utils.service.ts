import { IAuthUser } from '@/features/auth/types/auth.interface';

export const saveToSessionStorage = (data: string, username: string) => {
  window.sessionStorage.setItem('isLoggedIn', data);
  window.sessionStorage.setItem('loggedInUser', username);
};

export const getDataFromSessionStorage = (key: string) => {
  const data = window.sessionStorage.getItem(key) as string;
  return JSON.parse(data);
};

export const getUserFromLocalStorage = (key: string): IAuthUser | null => {
  const persistRoot = localStorage.getItem(key);
  if (!persistRoot) {
    return null;
  }

  const rootObj = JSON.parse(persistRoot);
  const authObj = JSON.parse(rootObj?.auth);

  return authObj.authUser;
};

export const clearLoggedInUser = (): void => {
  localStorage.removeItem('persist:root');
};

export const isEmptyObject = (obj: object): boolean => {
  return !(obj && Object.keys(obj).length);
};

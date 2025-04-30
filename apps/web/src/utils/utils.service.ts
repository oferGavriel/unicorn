import { NavigateFunction } from 'react-router-dom';
import { IAuthUser } from '@/features/auth/interfaces/auth.interface';

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
  if (!persistRoot) return null;

  const rootObj = JSON.parse(persistRoot);
  const authObj = JSON.parse(rootObj?.auth);

  return authObj.authUser;
};

export const applicationLogout = (navigation: NavigateFunction): void => {
  localStorage.removeItem('persist:root');
  navigation('/');
};

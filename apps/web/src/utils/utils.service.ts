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

export const formatDate = (date: Date): string => {
  const now = Date.now();
  let diff = now - date.getTime();
  if (diff < 0) {
    diff = 0;
  }

  const sec = Math.floor(diff / 1000);
  if (sec < 60) {
    return 'Just now';
  }

  const min = Math.floor(sec / 60);
  if (min < 60) {
    return `${min}m ago`;
  }

  const hrs = Math.floor(min / 60);
  if (hrs < 24) {
    return `${hrs}h ago`;
  }

  const days = Math.floor(hrs / 24);
  if (days < 7) {
    return `${days}d ago`;
  }

  return new Intl.DateTimeFormat(undefined, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
};

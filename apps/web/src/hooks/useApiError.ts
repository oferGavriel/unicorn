import { useCallback } from 'react';

import { getErrorMessage, isApiError } from '@/store/api';

export function useApiError(setMessage: (msg: string) => void) {
  return useCallback(
    (error: unknown) => {
      if (isApiError(error)) {
        const message = getErrorMessage(error);
        setMessage(message);
      } else {
        setMessage('An unexpected error occurred.');
      }
    },
    [setMessage]
  );
}

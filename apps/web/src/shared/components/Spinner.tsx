import type React from 'react';

export const Spinner: React.FC = (): React.ReactElement => (
  <div
    className="flex items-center justify-center h-screen"
    aria-live="polite"
    aria-busy="true"
  >
    <div
      className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent"
      aria-hidden="true"
    />
    <span className="sr-only">Loading...</span>
  </div>
);

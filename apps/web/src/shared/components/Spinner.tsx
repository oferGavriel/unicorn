import type React from 'react';

interface SpinnerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fullScreen?: boolean;
  text?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({
  className = '',
  size = 'md',
  fullScreen = false,
  text = 'Loading...'
}) => {
  // Size configurations
  const sizeConfig = {
    sm: { spinner: 'h-6 w-6 border-2', text: 'text-xs' },
    md: { spinner: 'h-12 w-12 border-2', text: 'text-sm' },
    lg: { spinner: 'h-16 w-16 border-2', text: 'text-lg' },
    xl: { spinner: 'h-24 w-24 border-4', text: 'text-xl' }
  };

  const config = sizeConfig[size];

  // Container classes based on usage
  const containerClasses = fullScreen
    ? `fixed inset-0 flex items-center justify-center bg-black/20 z-50 ${className}`
    : `flex items-center justify-center w-full h-full ${className}`;

  return (
    <div className={containerClasses} aria-live="polite" aria-busy="true">
      <div className="flex flex-col items-center gap-2">
        <div
          className={`animate-spin rounded-full border-blue-600 border-t-transparent ${config.spinner}`}
          aria-hidden="true"
        />
        {text && <span className={`text-gray-400 ${config.text}`}>{text}</span>}
      </div>
    </div>
  );
};

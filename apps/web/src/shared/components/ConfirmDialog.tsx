import React, { useCallback, useEffect } from 'react';

import { Button } from '@/components';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  confirmBtnDataTestId: string;
  cancelBtnDataTestId: string;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText,
  cancelText,
  isLoading = false,
  onConfirm,
  onCancel,
  confirmBtnDataTestId,
  cancelBtnDataTestId
}): React.ReactElement | null => {
  const handleKeydown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) {
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        onConfirm();
      }
    },
    [isOpen, onConfirm, onCancel]
  );

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) {
        onCancel();
      }
    },
    [onCancel]
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }, [isOpen, handleKeydown]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div className="dialog " onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
          {title}
        </h3>

        <div
          className="text-gray-600 dark:text-gray-300 mb-6 whitespace-pre-line"
          dangerouslySetInnerHTML={{ __html: message }}
        />

        <div className="flex gap-2 justify-end">
          <Button
            variant="ghost"
            onClick={onCancel}
            disabled={isLoading}
            className="min-w-16"
            data-testid={cancelBtnDataTestId}
          >
            {cancelText}
          </Button>

          <Button
            variant="primary"
            onClick={onConfirm}
            disabled={isLoading}
            className="min-w-16"
            data-testid={confirmBtnDataTestId}
          >
            {isLoading ? 'Loading...' : confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};

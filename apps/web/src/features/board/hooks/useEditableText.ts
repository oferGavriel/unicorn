import { useCallback, useEffect, useRef, useState } from 'react';

interface UseEditableTextOptions {
  initialValue: string;
  onSave: (newValue: string) => Promise<void>;
  maxLength?: number;
  validateEmpty?: boolean;
  autoEdit?: boolean;
  onCancel?: () => void;
}

interface UseEditableTextReturn {
  isEditing: boolean;
  editedValue: string;
  isUpdating: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  startEditing: () => void;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  handleInputBlur: () => void;
  cancelEditing: () => void;
  maxLength: number;
}

export const useEditableText = ({
  initialValue,
  onSave,
  maxLength = 50,
  validateEmpty = true,
  autoEdit = false,
  onCancel
}: UseEditableTextOptions): UseEditableTextReturn => {
  const [isEditing, setIsEditing] = useState<boolean>(autoEdit);
  const [editedValue, setEditedValue] = useState<string>(initialValue);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isEditing && !autoEdit) {
      setEditedValue(initialValue);
    }
  }, [initialValue, isEditing, autoEdit]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const startEditing = useCallback(() => {
    setIsEditing(true);
    setEditedValue(initialValue);
  }, [initialValue]);

  const cancelEditing = useCallback(() => {
    if (autoEdit) {
      onCancel?.();
    } else {
      setIsEditing(false);
      setEditedValue(initialValue);
    }
  }, [initialValue, onCancel, autoEdit]);

  const submitEdit = useCallback(async () => {
    const trimmedValue = editedValue.trim();

    if (autoEdit && trimmedValue === '') {
      cancelEditing();
      return;
    }

    // Validate input
    if (!autoEdit && validateEmpty && trimmedValue === '') {
      cancelEditing();
      return;
    }

    if (!autoEdit && trimmedValue === initialValue) {
      setIsEditing(false);
      return;
    }

    setIsUpdating(true);

    try {
      await onSave(trimmedValue);
      if (autoEdit) {
        onCancel?.();
      } else {
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Failed to save edited text:', error);
      setEditedValue(initialValue);
    } finally {
      setIsUpdating(false);
    }
  }, [
    editedValue,
    initialValue,
    onSave,
    validateEmpty,
    cancelEditing,
    autoEdit,
    onCancel
  ]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEditedValue(e.target.value);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        submitEdit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancelEditing();
      }
    },
    [submitEdit, cancelEditing]
  );

  const handleInputBlur = useCallback(() => {
    if (!isUpdating) {
      submitEdit();
    }
  }, [submitEdit, isUpdating]);

  return {
    isEditing,
    editedValue,
    isUpdating,
    inputRef,
    startEditing,
    handleInputChange,
    handleKeyDown,
    handleInputBlur,
    cancelEditing,
    maxLength
  };
};

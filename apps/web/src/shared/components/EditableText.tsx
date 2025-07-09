import React from 'react';

import { useEditableText } from '@/features/board/hooks/useEditableText';

interface EditableTextProps {
  value: string;
  onSave: (newValue: string) => Promise<void>;
  className?: string;
  inputClassName?: string;
  style?: React.CSSProperties;
  maxLength?: number;
  validateEmpty?: boolean;
  placeholder?: string;
  title?: string;
  autoEdit?: boolean;
  onCancel?: () => void;
}

export const EditableText: React.FC<EditableTextProps> = ({
  value,
  onSave,
  className = '',
  inputClassName = '',
  style,
  maxLength = 50,
  validateEmpty = true,
  placeholder,
  title = 'Click to edit',
  autoEdit = false,
  onCancel
}) => {
  const {
    isEditing,
    editedValue,
    isUpdating,
    inputRef,
    startEditing,
    handleInputChange,
    handleKeyDown,
    handleInputBlur,
    maxLength: hookMaxLength
  } = useEditableText({
    initialValue: value,
    onSave,
    maxLength,
    validateEmpty,
    autoEdit,
    onCancel
  });

  if (isEditing || autoEdit) {
    return (
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={editedValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleInputBlur}
          disabled={isUpdating}
          className={`bg-transparent border rounded w-[500px] px-2 border-blue-500 outline-none min-w-0 ${inputClassName}`}
          style={style}
          maxLength={hookMaxLength}
          placeholder={placeholder}
        />
      </div>
    );
  }

  return (
    <span
      className={`min-w-5 w-max min-h-4 leading-5 cursor-pointer outline-gray-400 rounded px-2 outline-1 hover:outline transition-opacity ${className}`}
      style={style}
      onClick={startEditing}
      title={title}
    >
      {value}
    </span>
  );
};

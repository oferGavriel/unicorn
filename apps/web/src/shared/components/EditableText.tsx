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
  disabled?: boolean;
  multiline?: boolean;
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
  disabled = false,
  multiline = false,
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


  const baseInputClassName = `bg-transparent border rounded px-2 border-blue-500 outline-none min-w-0 ${inputClassName}`;

  if (isEditing || autoEdit) {
    return (
      <div className={className} data-editable-text>
        {multiline ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={editedValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onBlur={handleInputBlur}
            disabled={isUpdating}
            className={`${baseInputClassName} w-full resize-none`}
            style={style}
            maxLength={hookMaxLength}
            placeholder={placeholder}
            rows={3}
            aria-disabled={disabled}
          />
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            value={editedValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onBlur={handleInputBlur}
            disabled={isUpdating}
            className={`${baseInputClassName} w-[500px]`}
            style={style}
            maxLength={hookMaxLength}
            placeholder={placeholder}
            aria-disabled={disabled}
            title={title}
          />
        )}
      </div>
    );
  }

  return (
    <div
      className={`min-w-5 w-full leading-5 cursor-pointer outline-gray-400 rounded p-[3px] outline-1 hover:outline transition-all duration-200 ${className}`}
      style={{
        ...style,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }}
      onClick={startEditing}
      title={title}
      data-editable-text
    >
      {value || <span className="text-gray-500 italic">{placeholder}</span>}
    </div>
  );
};

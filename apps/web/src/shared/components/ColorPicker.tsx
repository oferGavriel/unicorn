import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

import { TABLE_COLORS, TableColor } from '../../features/board/types/table.interface';

interface ColorPickerProps {
  selectedColor: TableColor;
  onColorChange: (color: TableColor) => void;
  className?: string;
  disabled?: boolean;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
  selectedColor,
  onColorChange,
  className = '',
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleColorSelect = (color: TableColor) => {
    onColorChange(color);
    setIsOpen(false);
  };

  return (
    <div className={className}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="flex size-5 p-0 rounded-full transition-all"
            style={{ backgroundColor: selectedColor }}
            title="Click to change color"
            disabled={disabled}
          />
        </PopoverTrigger>

        <PopoverContent
          className="w-auto p-3 bg-[#333333] border-gray-600"
          align="start"
          side="bottom"
        >
          <div className="grid grid-cols-5 gap-2">
            {TABLE_COLORS.map((color) => (
              <Button
                key={color}
                variant="ghost"
                size="sm"
                className={`
                  size-8 p-0 rounded-full transition-all hover:scale-110
                  ${selectedColor === color ? 'shadow-lg ring-4 ring-blue-500' : 'border-gray-500 hover:border-gray-300'}
                `}
                style={{ backgroundColor: color }}
                onClick={() => handleColorSelect(color)}
                title={`Select color: ${color}`}
              />
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

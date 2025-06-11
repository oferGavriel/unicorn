import React from 'react';

interface IndicatorCellProps {
  tableColor: string;
  position?: 'header' | 'body' | 'add-row';
}

export const IndicatorCell: React.FC<IndicatorCellProps> = ({
  tableColor,
  position = 'body'
}) => {
  const getBorderRadius = () => {
    switch (position) {
      case 'header':
        return { borderTopLeftRadius: '8px', opacity: 0.9 };
      case 'add-row':
        return { borderBottomLeftRadius: '8px', opacity: 0.5 };
      case 'body':
        return { opacity: 0.9 };
      default:
        return {};
    }
  };

  return (
    <div
      className="h-full min-h-[36px] border-none"
      style={{
        backgroundColor: tableColor,
        ...getBorderRadius()
      }}
    />
  );
};

import React, { useState, useRef, useEffect } from 'react';

interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownCellProps {
  value: string;
  options: DropdownOption[];
  onChange: (newValue: string) => void;
  displayText?: string;
  className?: string;
  disabled?: boolean;
}

/**
 * テーブルセル内ドロップダウンコンポーネント
 * セルをクリックするとドロップダウンを表示し、選択するとすぐに保存
 */
const DropdownCell: React.FC<DropdownCellProps> = ({
  value,
  options,
  onChange,
  displayText,
  className = '',
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 外側クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (newValue: string) => {
    if (newValue !== value) {
      onChange(newValue);
    }
    setIsOpen(false);
  };

  const handleCellClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  return (
    <td
      className={`data-cell staff-input ${disabled ? '' : 'editable'} ${className}`}
      onClick={handleCellClick}
      style={{ 
        position: 'relative', 
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1
      }}
    >
      {/* 表示テキスト */}
      <div className="flex items-center justify-center">
        {displayText || (value ? options.find(opt => opt.value === value)?.label : '未入力')}
        <svg className="w-3 h-3 ml-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* ドロップダウンメニュー */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute left-0 top-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-50 min-w-[120px]"
          style={{ maxHeight: '200px', overflowY: 'auto' }}
        >
          {options.map((option) => (
            <div
              key={option.value}
              onClick={(e) => {
                e.stopPropagation();
                handleSelect(option.value);
              }}
              className={`px-3 py-2 cursor-pointer hover:bg-blue-50 text-sm ${
                value === option.value ? 'bg-blue-100 font-medium' : ''
              }`}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </td>
  );
};

export default DropdownCell;

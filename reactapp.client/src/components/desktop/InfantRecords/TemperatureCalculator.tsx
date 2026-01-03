import React, { useState } from 'react';

interface TemperatureCalculatorProps {
  initialValue?: number;
  onValueChange: (value: number) => void;
  measurementLabel?: string;
}

/**
 * スマホ風電卓UI - 体温入力用
 * 35.0〜42.0の範囲で0.1℃単位で入力
 */
const TemperatureCalculator: React.FC<TemperatureCalculatorProps> = ({
  initialValue,
  onValueChange,
  measurementLabel
}) => {
  const [display, setDisplay] = useState<string>(
    initialValue && initialValue > 0 ? initialValue.toFixed(1) : '-'
  );

  const handleNumberClick = (num: string) => {
    if (display === '0' || display === '36.5' || display === '-') {
      setDisplay(num);
    } else if (display.length < 4) { // 最大4文字 (例: 37.5)
      setDisplay(display + num);
    }
  };

  const handleDotClick = () => {
    if (display === '-') {
      setDisplay('0.');
    } else if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  };

  const handleClear = () => {
    setDisplay('-');
  };

  const handleBackspace = () => {
    if (display === '-') {
      return;
    }
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('-');
    }
  };

  const handleQuickInput = (temp: number) => {
    // 整数部分のみ表示して、小数点を付ける (例: "36.")
    setDisplay(`${temp}.`);
  };

  // displayが変更されたときのみ更新（onValueChangeは依存配列に含めない）
  React.useEffect(() => {
    if (display === '-') {
      // 未入力状態では何もしない
      return;
    }
    const value = parseFloat(display);
    if (!isNaN(value) && value >= 35.0 && value <= 42.0) {
      onValueChange(value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [display]);

  const buttonClass = "h-10 bg-white hover:bg-blue-100 hover:border-blue-500 active:bg-blue-200 border-2 border-gray-600 text-gray-800 rounded-md font-semibold text-base transition-all flex items-center justify-center shadow-sm hover:shadow-md";
  const operatorClass = "h-10 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white rounded-md font-semibold text-base transition flex items-center justify-center shadow-sm";
  const quickButtonClass = "h-9 bg-white hover:bg-blue-100 hover:border-blue-500 active:bg-blue-200 border-2 border-gray-600 text-blue-600 rounded-md font-semibold text-lg transition-all shadow-sm hover:shadow-md";

  return (
    <div className="w-full max-w-sm mx-auto">
      {/* タイトル */}
      {measurementLabel && (
        <div className="text-center mb-2 text-sm font-medium text-gray-700">
          {measurementLabel}の体温
        </div>
      )}

      {/* ディスプレイ */}
      <div className="bg-gray-700 text-white text-center px-4 py-4 rounded-lg mb-3 shadow-lg">
        <div className="text-4xl font-bold">{display} ℃</div>
      </div>

      {/* クイック入力ボタン */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        <button
          type="button"
          onClick={() => handleQuickInput(35.0)}
          className={quickButtonClass}
        >
          35.
        </button>
        <button
          type="button"
          onClick={() => handleQuickInput(36.0)}
          className={quickButtonClass}
        >
          36.
        </button>
        <button
          type="button"
          onClick={() => handleQuickInput(37.0)}
          className={quickButtonClass}
        >
          37.
        </button>
        <button
          type="button"
          onClick={() => handleQuickInput(38.0)}
          className={quickButtonClass}
        >
          38.
        </button>
      </div>

      {/* ボタングリッド */}
      <div className="grid grid-cols-4 gap-2">
        {/* 1行目: 7, 8, 9, ← */}
        <button type="button" onClick={() => handleNumberClick('7')} className={buttonClass}>7</button>
        <button type="button" onClick={() => handleNumberClick('8')} className={buttonClass}>8</button>
        <button type="button" onClick={() => handleNumberClick('9')} className={buttonClass}>9</button>
        <button type="button" onClick={handleBackspace} className={operatorClass}>←</button>

        {/* 2行目: 4, 5, 6, C */}
        <button type="button" onClick={() => handleNumberClick('4')} className={buttonClass}>4</button>
        <button type="button" onClick={() => handleNumberClick('5')} className={buttonClass}>5</button>
        <button type="button" onClick={() => handleNumberClick('6')} className={buttonClass}>6</button>
        <button type="button" onClick={handleClear} className="h-10 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white rounded-md font-semibold text-base transition">C</button>

        {/* 3行目: 1, 2, 3 */}
        <button type="button" onClick={() => handleNumberClick('1')} className={buttonClass}>1</button>
        <button type="button" onClick={() => handleNumberClick('2')} className={buttonClass}>2</button>
        <button type="button" onClick={() => handleNumberClick('3')} className={buttonClass}>3</button>
        <div></div>

        {/* 4行目: 0 (2列), . */}
        <button type="button" onClick={() => handleNumberClick('0')} className={`${buttonClass} col-span-2`}>0</button>
        <button type="button" onClick={handleDotClick} className={buttonClass}>.</button>
        <div></div>
      </div>

      {/* 説明テキスト */}
      <div className="mt-3 text-center text-xs text-gray-500">
        ※ 登録時の時間が自動的に記録されます
      </div>
    </div>
  );
};

export default TemperatureCalculator;

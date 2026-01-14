import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

interface BarcodeProps {
  value: string | number;
  width?: number;
  height?: number;
  displayValue?: boolean;
  fontSize?: number;
  margin?: number;
  background?: string;
  lineColor?: string;
}

/**
 * Barcodeコンポーネント
 * JsBarcodeを使用してCode128形式のバーコードを表示
 * 保護者IDをバーコードとして表示し、タブレットのバーコードスキャナーで読み取り可能にする
 */
const Barcode: React.FC<BarcodeProps> = ({
  value,
  width = 2,
  height = 100,
  displayValue = true,
  fontSize = 20,
  margin = 10,
  background = '#ffffff',
  lineColor = '#000000',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      try {
        JsBarcode(canvasRef.current, String(value), {
          format: 'CODE128',
          width,
          height,
          displayValue,
          fontSize,
          margin,
          background,
          lineColor,
        });
      } catch (error) {
        console.error('バーコード生成エラー:', error);
      }
    }
  }, [value, width, height, displayValue, fontSize, margin, background, lineColor]);

  return (
    <div className="flex justify-center items-center">
      <canvas ref={canvasRef} />
    </div>
  );
};

export default Barcode;

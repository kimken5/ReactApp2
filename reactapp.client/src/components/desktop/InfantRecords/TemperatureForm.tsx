import React, { useState, useEffect } from 'react';
import type { TemperatureRecord, MeasurementType } from '../../../types/infantRecords';
import TemperatureCalculator from './TemperatureCalculator';

interface TemperatureFormProps {
  value: TemperatureRecord;
  onChange: (value: TemperatureRecord) => void;
  measurementType?: MeasurementType;
}

const TemperatureForm: React.FC<TemperatureFormProps> = ({
  value,
  onChange,
  measurementType
}) => {
  const [temp, setTemp] = useState<string>(value?.value?.toString() || '');
  const [time, setTime] = useState<string>(value?.time || '');

  useEffect(() => {
    setTemp(value?.value?.toString() || '');
    setTime(value?.time || '');
  }, [value]);

  const handleTempChange = (numVal: number) => {
    setTemp(numVal.toString());

    // 現在時刻を自動設定
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    onChange({
      ...value,
      value: numVal,
      time: currentTime
    });
  };

  const getMeasurementLabel = (): string => {
    const labels: Record<MeasurementType, string> = {
      home: '家庭',
      morning: '午前',
      afternoon: '午後'
    };
    return measurementType ? labels[measurementType] : '';
  };

  return (
    <div>
      <TemperatureCalculator
        initialValue={temp ? parseFloat(temp) : undefined}
        onValueChange={handleTempChange}
        measurementLabel={getMeasurementLabel()}
      />
    </div>
  );
};

export default TemperatureForm;

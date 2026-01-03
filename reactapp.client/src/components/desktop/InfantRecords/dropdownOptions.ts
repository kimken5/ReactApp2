/**
 * 生活記録のドロップダウン選択肢定義
 */

// おやつ・昼食の量
export const MEAL_AMOUNT_OPTIONS = [
  { value: '', label: '未入力' },
  { value: 'All', label: '完食' },
  { value: 'Most', label: 'ほぼ完食' },
  { value: 'Half', label: '半分' },
  { value: 'Little', label: '少量' },
  { value: 'None', label: '食べず' }
];

// 機嫌
export const MOOD_OPTIONS = [
  { value: '', label: '未入力' },
  { value: 'Good', label: '良い' },
  { value: 'Normal', label: '普通' },
  { value: 'Bad', label: '悪い' },
  { value: 'Crying', label: '泣いている' }
];

// おしっこの量
export const URINE_AMOUNT_OPTIONS = [
  { value: '', label: '未入力' },
  { value: 'Little', label: '少量' },
  { value: 'Normal', label: '普通' },
  { value: 'Lot', label: '多量' }
];

// おむつ交換の回数
export const DIAPER_CHANGE_OPTIONS = [
  { value: '', label: '未入力' },
  { value: '0', label: '0回' },
  { value: '1', label: '1回' },
  { value: '2', label: '2回' },
  { value: '3', label: '3回' },
  { value: '4', label: '4回' },
  { value: '5', label: '5回' },
  { value: '6', label: '6回' },
  { value: '7', label: '7回' },
  { value: '8', label: '8回' },
  { value: '9', label: '9回' },
  { value: '10+', label: '10回以上' }
];

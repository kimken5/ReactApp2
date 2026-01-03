# デスクトップアプリ 乳児生活記録機能 UI設計書

## 1. 概要

### 1.1 目的
デスクトップアプリの乳児生活記録機能における画面設計、コンポーネント構成、インタラクション仕様を定義する。

### 1.2 対象画面
- 週次マトリックスビュー (`/desktop/infant-records/weekly`)
- 編集モーダル

---

## 2. 週次マトリックスビュー

### 2.1 画面レイアウト

```
┌────────────────────────────────────────────────────────────────┐
│  乳児生活記録 (0～2歳児)                                       │
│                                                                │
│  [< 前週]  2026年1月4日～1月10日  [次週 >]                    │
│                                                                │
│  クラス: つくし組 (0歳児) [▼]                                 │
├────────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ 項目 │ 1/4(日) │ 1/5(月) │ 1/6(火) │ ... │ 1/10(土) │ │ │
│ ├──────┼─────────┼─────────┼─────────┼─────┼──────────┤ │ │
│ │【花子】│         │         │         │     │          │ │ │
│ ├──────┼─────────┼─────────┼─────────┼─────┼──────────┤ │ │
│ │〈家庭〉│         │         │         │     │          │ │ │
│ ├──────┼─────────┼─────────┼─────────┼─────┼──────────┤ │ │
│ │体温  │36.5(8:30)│36.6(8:15)│        │     │          │ │ │
│ │      │  🔒     │  🔒     │         │     │          │ │ │
│ ├──────┼─────────┼─────────┼─────────┼─────┼──────────┤ │ │
│ │様子  │元気です │よく寝た │         │     │          │ │ │
│ │      │  🔒     │  🔒     │         │     │          │ │ │
│ ├──────┼─────────┼─────────┼─────────┼─────┼──────────┤ │ │
│ │〈午前〉│         │         │         │     │          │ │ │
│ ├──────┼─────────┼─────────┼─────────┼─────┼──────────┤ │ │
│ │体温  │36.8(10:00)│37.0(9:45)│       │     │          │ │ │
│ ├──────┼─────────┼─────────┼─────────┼─────┼──────────┤ │ │
│ │...   │...      │...      │...      │     │...       │ │ │
│ └──────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
```

### 2.2 ヘッダー部コンポーネント

#### 2.2.1 週選択コントロール

```tsx
interface WeekSelectorProps {
  weekStartDate: Date;
  onWeekChange: (newStartDate: Date) => void;
}

<div className="week-selector">
  <button
    className="week-nav-button"
    onClick={() => onWeekChange(addDays(weekStartDate, -7))}
  >
    <ChevronLeft /> 前週
  </button>

  <span className="week-range">
    {formatWeekRange(weekStartDate)}
  </span>

  <button
    className="week-nav-button"
    onClick={() => onWeekChange(addDays(weekStartDate, 7))}
  >
    次週 <ChevronRight />
  </button>
</div>
```

**スタイル**:
```css
.week-selector {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.week-nav-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background-color: #3B82F6;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.week-nav-button:hover {
  background-color: #2563EB;
}

.week-range {
  font-size: 18px;
  font-weight: 700;
  color: #1F2937;
  min-width: 240px;
  text-align: center;
}
```

#### 2.2.2 クラス選択ドロップダウン

```tsx
interface ClassSelectorProps {
  classes: ClassInfo[];
  selectedClassId: number;
  onClassChange: (classId: number) => void;
}

<div className="class-selector">
  <label htmlFor="class-select">クラス:</label>
  <select
    id="class-select"
    value={selectedClassId}
    onChange={(e) => onClassChange(Number(e.target.value))}
  >
    {classes.map(cls => (
      <option key={cls.classId} value={cls.classId}>
        {cls.className} ({cls.ageGroup})
      </option>
    ))}
  </select>
</div>
```

**スタイル**:
```css
.class-selector {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.class-selector label {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

.class-selector select {
  padding: 8px 32px 8px 12px;
  font-size: 14px;
  border: 1px solid #D1D5DB;
  border-radius: 6px;
  background-color: white;
  cursor: pointer;
}

.class-selector select:focus {
  outline: none;
  border-color: #3B82F6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
```

### 2.3 テーブルコンポーネント

#### 2.3.1 テーブル構造

```tsx
interface WeeklyMatrixTableProps {
  weekStartDate: Date;
  children: ChildWeeklyRecord[];
  onCellClick: (childId: number, date: string, recordType: string) => void;
}

<table className="infant-weekly-matrix">
  <thead>
    <tr>
      <th className="col-item">項目</th>
      {dateRange.map(date => (
        <th key={date} className="col-date">
          {formatDateHeader(date)}
        </th>
      ))}
    </tr>
  </thead>
  <tbody>
    {children.map(child => (
      <ChildRecordRows
        key={child.childId}
        child={child}
        dateRange={dateRange}
        onCellClick={onCellClick}
      />
    ))}
  </tbody>
</table>
```

#### 2.3.2 園児記録行コンポーネント

```tsx
const ChildRecordRows: React.FC<ChildRecordRowsProps> = ({
  child,
  dateRange,
  onCellClick
}) => {
  return (
    <>
      {/* 大項目: 園児名 */}
      <tr className="row-child-name">
        <td className="child-name-header">【{child.firstName}】</td>
        {dateRange.map(date => (
          <td key={date} className="empty-cell"></td>
        ))}
      </tr>

      {/* 中項目: 家庭 */}
      <tr className="row-category">
        <td className="category-header parent-category">〈家庭〉</td>
        {dateRange.map(date => (
          <td key={date} className="empty-cell"></td>
        ))}
      </tr>

      {/* 小項目: 体温 (家庭) */}
      <tr className="row-data">
        <td className="item-label">体温</td>
        {dateRange.map(date => (
          <td
            key={date}
            className="data-cell parent-input readonly"
          >
            {formatTemperature(child.dailyRecords[date]?.home?.temperature)}
          </td>
        ))}
      </tr>

      {/* 小項目: 様子 (家庭) */}
      <tr className="row-data">
        <td className="item-label">様子</td>
        {dateRange.map(date => (
          <td
            key={date}
            className="data-cell parent-input readonly"
          >
            {child.dailyRecords[date]?.home?.parentNote?.text}
          </td>
        ))}
      </tr>

      {/* 以下、午前・午後・排泄のセクションも同様... */}
    </>
  );
};
```

#### 2.3.3 セルのスタイリング

```css
/* テーブル全体 */
.infant-weekly-matrix {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

/* ヘッダー */
.infant-weekly-matrix thead th {
  background-color: #3B82F6;
  color: white;
  padding: 12px 8px;
  font-weight: 600;
  text-align: center;
  border: 1px solid #2563EB;
  position: sticky;
  top: 0;
  z-index: 10;
}

.col-item {
  width: 120px;
  min-width: 120px;
  position: sticky;
  left: 0;
  z-index: 11;
  background-color: #3B82F6;
}

.col-date {
  width: 140px;
  min-width: 140px;
}

/* 大項目: 園児名 */
.row-child-name {
  background-color: #1F2937;
}

.child-name-header {
  background-color: #1F2937;
  color: white;
  font-weight: 700;
  font-size: 15px;
  padding: 10px;
  text-align: center;
  border: 1px solid #111827;
  position: sticky;
  left: 0;
  z-index: 5;
}

/* 中項目: カテゴリ */
.category-header {
  font-weight: 600;
  font-size: 14px;
  padding: 8px 10px;
  text-align: center;
  border: 1px solid #D1D5DB;
  position: sticky;
  left: 0;
  z-index: 5;
}

.category-header.parent-category {
  background-color: #FEF3C7; /* 薄い黄色 */
  color: #92400E;
}

.category-header.staff-category {
  background-color: #DBEAFE; /* 薄い青 */
  color: #1E40AF;
}

/* 小項目ラベル */
.item-label {
  background-color: #F9FAFB;
  padding: 8px 10px;
  font-weight: 500;
  font-size: 13px;
  border: 1px solid #E5E7EB;
  text-align: left;
  position: sticky;
  left: 0;
  z-index: 5;
}

/* データセル */
.data-cell {
  padding: 8px;
  border: 1px solid #E5E7EB;
  vertical-align: top;
  min-height: 40px;
  font-size: 12px;
  line-height: 1.5;
}

.empty-cell {
  background-color: #F9FAFB;
  border: 1px solid #E5E7EB;
}

/* 保護者入力 (読取専用) */
.data-cell.parent-input.readonly {
  background-color: #FFFBEB;
  color: #92400E;
  cursor: not-allowed;
}

.data-cell.parent-input.readonly:not(:empty)::before {
  content: '🔒 ';
  font-size: 10px;
}

/* スタッフ入力 (編集可能) */
.data-cell.staff-input.editable {
  background-color: #FFFFFF;
  cursor: pointer;
  transition: all 0.2s;
}

.data-cell.staff-input.editable:hover {
  background-color: #EFF6FF;
  box-shadow: inset 0 0 0 2px #3B82F6;
}

.data-cell.staff-input.editable:empty::after {
  content: '未入力';
  color: #9CA3AF;
  font-style: italic;
  font-size: 11px;
}
```

### 2.4 データ表示フォーマット

#### 2.4.1 体温表示

```typescript
function formatTemperature(temp?: TemperatureRecord): string {
  if (!temp) return '';
  return `${temp.value}℃ (${temp.time})`;
}

// 例: "36.5℃ (8:30)"
```

#### 2.4.2 昼寝表示

```typescript
function formatSleep(sleep?: SleepRecord): string {
  if (!sleep) return '';
  const lines = [
    `${sleep.start}-${sleep.end}`,
    `(${sleep.duration}分)`
  ];
  return lines.join('\n');
}

// 例: "12:30-14:00\n(90分)"
```

#### 2.4.3 排泄表示

```typescript
function formatUrineAmount(amount?: string): string {
  const map: Record<string, string> = {
    'Little': '少量',
    'Normal': '普通',
    'Lot': '多量'
  };
  return amount ? (map[amount] || amount) : '';
}

function formatBowelCondition(condition?: string, color?: string): string {
  if (!condition) return '';

  const conditionMap: Record<string, string> = {
    'Normal': '普通',
    'Hard': '硬め',
    'Soft': '軟便',
    'Diarrhea': '下痢'
  };

  const colorMap: Record<string, string> = {
    'Normal': '普通',
    'Green': '緑色',
    'White': '白色',
    'Black': '黒色',
    'Bloody': '血便'
  };

  // 状態/色 の形式で表示 (例: 軟便/普通、普通/黒色)
  const conditionText = conditionMap[condition] || condition;
  const colorText = colorMap[color || 'Normal'] || color || '普通';

  return `${conditionText}/${colorText}`;
}

function formatDiaperChangeCount(count?: number): string {
  return count ? `${count}回` : '';
}

function formatMealAmount(amount?: string): string {
  const map: Record<string, string> = {
    'All': '完食',
    'Most': 'ほとんど',
    'Half': '半分',
    'Little': '少し',
    'None': 'なし'
  };
  return amount ? (map[amount] || amount) : '';
}
```

---

## 3. 編集モーダル

### 3.1 モーダル構造

```tsx
interface EditModalProps {
  isOpen: boolean;
  childName: string;
  date: string;
  recordType: RecordType;
  currentValue: any;
  onSave: (newValue: any) => Promise<void>;
  onClose: () => void;
}

const EditModal: React.FC<EditModalProps> = ({
  isOpen,
  childName,
  date,
  recordType,
  currentValue,
  onSave,
  onClose
}) => {
  const [value, setValue] = useState(currentValue);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(value);
      onClose();
    } catch (error) {
      alert('保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="modal-header">
        <h2>編集: {childName}さん - {formatDate(date)}</h2>
        <button className="close-button" onClick={onClose}>×</button>
      </div>

      <div className="modal-body">
        {renderFormByRecordType(recordType, value, setValue)}
      </div>

      <div className="modal-footer">
        <button
          className="btn-cancel"
          onClick={onClose}
          disabled={isSaving}
        >
          キャンセル
        </button>
        <button
          className="btn-save"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? '保存中...' : '保存'}
        </button>
      </div>
    </Modal>
  );
};
```

### 3.2 記録タイプ別フォーム

#### 3.2.1 体温編集フォーム

**デスクトップ版**: 数値を直接入力する方式（モバイルの電卓UIとは異なる）

```tsx
const TemperatureForm: React.FC<FormProps> = ({ value, onChange }) => {
  const [temp, setTemp] = useState(value?.temperature || '');
  const [time, setTime] = useState(value?.time || '');

  const handleTempChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // 数値と小数点のみ許可、35.0～40.0の範囲を想定
    if (/^\d*\.?\d*$/.test(val)) {
      setTemp(val);
      onChange({ temperature: parseFloat(val) || 0, time });
    }
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTime(e.target.value);
    onChange({ temperature: parseFloat(temp) || 0, time: e.target.value });
  };

  return (
    <div className="temperature-form">
      <div className="form-group">
        <label htmlFor="temp-input">体温 (℃)</label>
        <input
          id="temp-input"
          type="number"
          step="0.1"
          min="35.0"
          max="40.0"
          value={temp}
          onChange={handleTempChange}
          placeholder="例: 36.5"
          className="temp-input"
        />
        <span className="input-hint">35.0～40.0の範囲で入力してください</span>
      </div>

      <div className="form-group">
        <label htmlFor="time-input">測定時刻</label>
        <input
          id="time-input"
          type="time"
          value={time}
          onChange={handleTimeChange}
        />
      </div>
    </div>
  );
};
```

**スタイル**:
```css
.temp-input {
  width: 100%;
  padding: 10px 12px;
  font-size: 16px;
  border: 1px solid #D1D5DB;
  border-radius: 6px;
}

.input-hint {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: #6B7280;
}
```

#### 3.2.2 食事編集フォーム

```tsx
const MealForm: React.FC<FormProps> = ({ value, onChange }) => {
  const options = [
    { value: 'All', label: '完食' },
    { value: 'Most', label: 'ほとんど' },
    { value: 'Half', label: '半分' },
    { value: 'Little', label: '少し' },
    { value: 'None', label: 'なし' }
  ];

  return (
    <div className="meal-form">
      <div className="form-group">
        <label>摂取量</label>
        <div className="radio-group">
          {options.map(opt => (
            <label key={opt.value} className="radio-label">
              <input
                type="radio"
                name="meal-amount"
                value={opt.value}
                checked={value === opt.value}
                onChange={(e) => onChange(e.target.value)}
              />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};
```

#### 3.2.3 昼寝編集フォーム

**デスクトップ版**: 時と分を分けたドロップダウン方式、分は10分刻み（0, 10, 20, 30, 40, 50）

```tsx
const SleepForm: React.FC<FormProps> = ({ value, onChange }) => {
  // 初期値の解析: "12:30" → hour: 12, minute: 30
  const parseTime = (timeStr: string) => {
    if (!timeStr) return { hour: '', minute: '' };
    const [h, m] = timeStr.split(':');
    return { hour: h, minute: m };
  };

  const [startHour, setStartHour] = useState(parseTime(value?.start || '').hour);
  const [startMinute, setStartMinute] = useState(parseTime(value?.start || '').minute);
  const [endHour, setEndHour] = useState(parseTime(value?.end || '').hour);
  const [endMinute, setEndMinute] = useState(parseTime(value?.end || '').minute);

  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minutes = ['00', '10', '20', '30', '40', '50'];

  const formatTime = (hour: string, minute: string) => {
    if (!hour || !minute) return '';
    return `${hour}:${minute}`;
  };

  const duration = useMemo(() => {
    const startTime = formatTime(startHour, startMinute);
    const endTime = formatTime(endHour, endMinute);

    if (!startTime || !endTime) return 0;

    const start = new Date(`2000-01-01 ${startTime}`);
    const end = new Date(`2000-01-01 ${endTime}`);
    return Math.round((end.getTime() - start.getTime()) / 60000);
  }, [startHour, startMinute, endHour, endMinute]);

  const handleChange = (type: 'start' | 'end', part: 'hour' | 'minute', value: string) => {
    if (type === 'start') {
      if (part === 'hour') setStartHour(value);
      else setStartMinute(value);
    } else {
      if (part === 'hour') setEndHour(value);
      else setEndMinute(value);
    }

    // 親コンポーネントに通知
    const newStart = type === 'start'
      ? formatTime(part === 'hour' ? value : startHour, part === 'minute' ? value : startMinute)
      : formatTime(startHour, startMinute);
    const newEnd = type === 'end'
      ? formatTime(part === 'hour' ? value : endHour, part === 'minute' ? value : endMinute)
      : formatTime(endHour, endMinute);

    onChange({ start: newStart, end: newEnd, duration });
  };

  return (
    <div className="sleep-form">
      <div className="form-group">
        <label>開始時刻</label>
        <div className="time-picker-group">
          <select
            value={startHour}
            onChange={(e) => handleChange('start', 'hour', e.target.value)}
            className="time-select"
          >
            <option value="">--</option>
            {hours.map(h => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>
          <span className="time-separator">:</span>
          <select
            value={startMinute}
            onChange={(e) => handleChange('start', 'minute', e.target.value)}
            className="time-select"
          >
            <option value="">--</option>
            {minutes.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-group">
        <label>終了時刻</label>
        <div className="time-picker-group">
          <select
            value={endHour}
            onChange={(e) => handleChange('end', 'hour', e.target.value)}
            className="time-select"
          >
            <option value="">--</option>
            {hours.map(h => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>
          <span className="time-separator">:</span>
          <select
            value={endMinute}
            onChange={(e) => handleChange('end', 'minute', e.target.value)}
            className="time-select"
          >
            <option value="">--</option>
            {minutes.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="duration-display">
        睡眠時間: <strong>{duration > 0 ? `${duration}分` : '--'}</strong>
      </div>
    </div>
  );
};
```

**スタイル**:
```css
.time-picker-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.time-select {
  width: 80px;
  padding: 8px 12px;
  font-size: 14px;
  border: 1px solid #D1D5DB;
  border-radius: 6px;
  background-color: white;
}

.time-separator {
  font-size: 18px;
  font-weight: 600;
  color: #374151;
}

.duration-display {
  margin-top: 16px;
  padding: 12px;
  background-color: #F3F4F6;
  border-radius: 6px;
  font-size: 14px;
  text-align: center;
}

.duration-display strong {
  color: #3B82F6;
  font-size: 16px;
}
```

#### 3.2.4 排泄編集フォーム

```tsx
const ToiletingForm: React.FC<FormProps> = ({ value, onChange, subType }) => {
  if (subType === 'urine') {
    return (
      <div className="urine-form">
        <div className="form-group">
          <label>おしっこの量</label>
          <div className="radio-group">
            <label className="radio-label">
              <input type="radio" value="Little" />
              <span>少なめ</span>
            </label>
            <label className="radio-label">
              <input type="radio" value="Normal" />
              <span>普通</span>
            </label>
            <label className="radio-label">
              <input type="radio" value="Lot" />
              <span>多め</span>
            </label>
          </div>
        </div>
      </div>
    );
  }

  if (subType === 'bowel') {
    return (
      <div className="bowel-form">
        <div className="form-group">
          <label>便の状態</label>
          <select>
            <option value="Normal">普通</option>
            <option value="Soft">軟便</option>
            <option value="Diarrhea">下痢</option>
            <option value="Hard">硬い</option>
          </select>
        </div>

        <div className="form-group">
          <label>便の色</label>
          <select>
            <option value="Normal">通常</option>
            <option value="Green">緑色</option>
            <option value="White">白色</option>
            <option value="Black">黒色</option>
            <option value="Bloody">血便</option>
          </select>
        </div>
      </div>
    );
  }

  if (subType === 'diaper') {
    return (
      <div className="diaper-form">
        <div className="form-group">
          <label htmlFor="diaper-count">オムツ交換回数</label>
          <select
            id="diaper-count"
            value={value || 0}
            onChange={(e) => onChange(Number(e.target.value))}
            className="diaper-select"
          >
            {Array.from({ length: 11 }, (_, i) => i).map(count => (
              <option key={count} value={count}>
                {count}回
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  }
};
```

### 3.3 モーダルスタイル

```css
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-container {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #E5E7EB;
}

.modal-header h2 {
  font-size: 18px;
  font-weight: 700;
  color: #1F2937;
  margin: 0;
}

.close-button {
  background: none;
  border: none;
  font-size: 24px;
  color: #6B7280;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.close-button:hover {
  background-color: #F3F4F6;
}

.modal-body {
  padding: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
}

.form-group input[type="time"],
.form-group input[type="number"],
.form-group select {
  width: 100%;
  padding: 10px 12px;
  font-size: 14px;
  border: 1px solid #D1D5DB;
  border-radius: 6px;
}

.radio-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 10px;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.radio-label:hover {
  background-color: #F3F4F6;
}

.radio-label input[type="radio"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #E5E7EB;
}

.btn-cancel,
.btn-save {
  padding: 10px 24px;
  font-size: 14px;
  font-weight: 600;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel {
  background-color: white;
  color: #6B7280;
  border: 1px solid #D1D5DB;
}

.btn-cancel:hover {
  background-color: #F9FAFB;
}

.btn-save {
  background-color: #3B82F6;
  color: white;
  border: none;
}

.btn-save:hover {
  background-color: #2563EB;
}

.btn-save:disabled {
  background-color: #9CA3AF;
  cursor: not-allowed;
}
```

---

## 4. レスポンシブ対応

### 4.1 ブレークポイント

```css
/* デスクトップ (1920px以上) */
@media screen and (min-width: 1920px) {
  .col-date {
    width: 160px;
  }
}

/* タブレット (1280px - 1600px) */
@media screen and (max-width: 1600px) {
  .infant-weekly-matrix {
    font-size: 12px;
  }

  .col-date {
    width: 120px;
    min-width: 120px;
  }

  .col-item {
    width: 100px;
    min-width: 100px;
  }
}

/* 小型デスクトップ (1024px - 1280px) */
@media screen and (max-width: 1280px) {
  .infant-weekly-matrix {
    font-size: 11px;
  }

  .col-date {
    width: 100px;
    min-width: 100px;
  }
}
```

---

## 5. アクセシビリティ

### 5.1 キーボード操作

- **Tab**: 次のセルに移動
- **Shift + Tab**: 前のセルに移動
- **Enter**: 編集可能セルでモーダルを開く
- **Escape**: モーダルを閉じる

### 5.2 ARIA属性

```tsx
<td
  className="data-cell staff-input editable"
  role="button"
  tabIndex={0}
  aria-label={`${childName}さんの${formatDate(date)}の${recordLabel}を編集`}
  onClick={() => handleCellClick()}
  onKeyPress={(e) => e.key === 'Enter' && handleCellClick()}
>
  {displayValue}
</td>
```

### 5.3 スクリーンリーダー対応

```tsx
<table
  className="infant-weekly-matrix"
  role="table"
  aria-label="週次生活記録マトリックス"
>
  <caption className="sr-only">
    {weekStartDate}から{weekEndDate}までの週次生活記録
  </caption>
  {/* ... */}
</table>
```

---

## 6. パフォーマンス最適化

### 6.1 仮想スクロール

園児数が20人を超える場合、仮想スクロールを実装:

```tsx
import { useVirtualizer } from '@tanstack/react-virtual';

const VirtualizedTable: React.FC = ({ children }) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: children.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 600, // 1園児あたり約14行 × 40px
    overscan: 2
  });

  return (
    <div ref={parentRef} style={{ height: '800px', overflow: 'auto' }}>
      <table>
        {/* ヘッダー */}
        <tbody>
          {rowVirtualizer.getVirtualItems().map(virtualRow => (
            <ChildRecordRows
              key={virtualRow.index}
              child={children[virtualRow.index]}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`
              }}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};
```

### 6.2 メモ化

```tsx
const ChildRecordRows = React.memo<ChildRecordRowsProps>(({
  child,
  dateRange,
  onCellClick
}) => {
  // コンポーネント実装...
}, (prevProps, nextProps) => {
  return prevProps.child.childId === nextProps.child.childId &&
         JSON.stringify(prevProps.child.dailyRecords) ===
         JSON.stringify(nextProps.child.dailyRecords);
});
```

---

## 7. エラーハンドリングUI

### 7.1 ローディング状態

```tsx
{isLoading && (
  <div className="loading-overlay">
    <div className="spinner"></div>
    <p>データを読み込んでいます...</p>
  </div>
)}
```

### 7.2 エラー表示

```tsx
{error && (
  <div className="error-banner">
    <AlertCircle />
    <span>{error.message}</span>
    <button onClick={retry}>再試行</button>
  </div>
)}
```

---

## 8. コンポーネント構成図

```
WeeklyRecordsPage
├── Header
│   ├── WeekSelector
│   └── ClassSelector
├── WeeklyMatrixTable
│   ├── TableHeader
│   └── TableBody
│       └── ChildRecordRows (複数)
│           ├── ChildNameRow
│           ├── CategoryRow (家庭/午前/午後/排泄)
│           └── DataRow (複数)
│               └── DataCell (クリック可能)
└── EditModal
    ├── ModalHeader
    ├── ModalBody
    │   └── RecordForm (記録タイプに応じて動的)
    └── ModalFooter
        ├── CancelButton
        └── SaveButton
```

---

## 9. 状態管理

### 9.1 ローカル状態

```typescript
const [weekStartDate, setWeekStartDate] = useState<Date>(getWeekStart(new Date()));
const [selectedClassId, setSelectedClassId] = useState<number>(0);
const [weeklyData, setWeeklyData] = useState<WeeklyRecordsData | null>(null);
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<Error | null>(null);
const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
```

### 9.2 データフェッチング

```typescript
const fetchWeeklyData = async () => {
  setIsLoading(true);
  setError(null);

  try {
    const response = await api.get('/desktop/infant-records/weekly', {
      params: {
        nurseryId,
        classId: selectedClassId,
        weekStartDate: formatDate(weekStartDate)
      }
    });

    setWeeklyData(response.data.data);
  } catch (err) {
    setError(err as Error);
  } finally {
    setIsLoading(false);
  }
};

useEffect(() => {
  if (selectedClassId) {
    fetchWeeklyData();
  }
}, [weekStartDate, selectedClassId]);
```

---

## 10. 関連ドキュメント

- [要件定義書](infant-records-requirements.md)
- [データベース仕様書](infant-records-database-spec.md)
- [API仕様書](infant-records-api-spec.md)

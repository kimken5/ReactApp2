# 休園日・休日保育管理機能 実装完了

## 実装概要

カレンダー管理システムに休園日（ClosedDay）と休日保育（HolidayCare）を管理する機能を追加しました。

## 実装内容

### 1. データベース層

**テーブル**: `NurseryDayTypes`
- `Id` (INT, IDENTITY, PK)
- `NurseryId` (NVARCHAR(50), NOT NULL)
- `Date` (DATE, NOT NULL)
- `DayType` (NVARCHAR(20), NOT NULL) - 'ClosedDay' または 'HolidayCare'
- `CreatedBy` (INT, NOT NULL)
- `CreatedAt` (DATETIME2, NOT NULL)
- `UpdatedAt` (DATETIME2, NOT NULL)
- **制約**: UNIQUE (NurseryId, Date) - 同じ日に重複登録不可

**スクリプト**: `ReactApp.Server/scripts/create_nursery_day_types_table.sql`

### 2. バックエンド実装

#### Models
- **NurseryDayType.cs**: エンティティモデル

#### DTOs
- **NurseryDayTypeDto**: レスポンスDTO
- **CreateNurseryDayTypeRequestDto**: 作成リクエストDTO (date, dayType)
- **UpdateNurseryDayTypeRequestDto**: 更新リクエストDTO (dayType のみ)

#### Services
- **INurseryDayTypeService.cs**: サービスインターフェース
- **NurseryDayTypeService.cs**: サービス実装
  - `GetNurseryDayTypesAsync()`: 期間指定で一覧取得
  - `GetNurseryDayTypeByDateAsync()`: 特定日付のデータ取得
  - `CreateNurseryDayTypeAsync()`: 新規作成（重複チェックあり）
  - `UpdateNurseryDayTypeAsync()`: 種別更新
  - `DeleteNurseryDayTypeAsync()`: 削除

#### Controllers
- **NurseryDayTypeController.cs**: REST API エンドポイント
  - `GET /api/desktop/nursery-day-types?startDate={date}&endDate={date}`: 一覧取得
  - `GET /api/desktop/nursery-day-types/{date}`: 特定日付取得
  - `POST /api/desktop/nursery-day-types`: 新規作成
  - `PUT /api/desktop/nursery-day-types/{id}`: 更新
  - `DELETE /api/desktop/nursery-day-types/{id}`: 削除

#### DI登録
- `Program.cs` に `INurseryDayTypeService` の登録を追加

### 3. フロントエンド実装

#### 型定義 (types/calendar.ts)
```typescript
export type NurseryDayType = 'ClosedDay' | 'HolidayCare';

export const nurseryDayTypeInfo: Record<NurseryDayType, { name: string; color: string; bgColor: string }> = {
  ClosedDay: {
    name: '休園日',
    color: '#ef4444',      // 赤
    bgColor: '#fee2e2',
  },
  HolidayCare: {
    name: '休日保育',
    color: '#3b82f6',      // 青
    bgColor: '#dbeafe',
  },
};
```

#### サービス層 (services/nurseryDayTypeService.ts)
- API呼び出しをラップしたサービスクラス
- エラーハンドリングとレスポンス処理を実装

#### UIコンポーネント (components/NurseryDayTypeDialog.tsx)
**機能**:
- 種別選択をトップに配置（休園日/休日保育）
- 選択した種別に対応する日付を追加
- 選択した種別の日付一覧を降順表示
- 日付は「YYYY年MM月DD日（曜日）」形式で表示
- 一覧の各行に削除ボタン配置
- バリデーションとエラー表示

**デザイン**:
- モーダルダイアログ形式（EventFormModalと統一デザイン）
- 種別選択ボタン：選択中は色ベタ塗り + オレンジリング
- 日付一覧：最大高さ300px、スクロール可能
- 追加ボタン：オレンジ→黄色グラデーション
- 休園日: 赤系、休日保育: 青系

#### カレンダーページ統合 (pages/CalendarPage.tsx)

**状態管理**:
```typescript
const [nurseryDayTypes, setNurseryDayTypes] = useState<NurseryDayTypeDto[]>([]);
const [showNurseryDayTypeDialog, setShowNurseryDayTypeDialog] = useState(false);
const [selectedNurseryDayTypeDate, setSelectedNurseryDayTypeDate] = useState<string | undefined>();
const [selectedNurseryDayType, setSelectedNurseryDayType] = useState<NurseryDayTypeDto | null>(null);
```

**主要機能**:
1. `loadNurseryDayTypes()`: 表示期間の休園日・休日保育データを取得
2. `getNurseryDayTypeForDate()`: 指定日付の休園日・休日保育を取得
3. `handleOpenNurseryDayTypeDialog()`: ダイアログを開く
4. `handleSaveNurseryDayType()`: 作成・更新処理
5. `handleDeleteNurseryDayType()`: 削除処理

**カレンダー表示統合**:
- **月表示**: 各日付セルの日付部分をクリックで新規作成ダイアログ表示
- **週表示**: 全日行に休園日・休日保育を表示
- 既存の休園日・休日保育バッジをクリックで編集ダイアログ表示
- 色分け表示で視覚的に区別

**デモモード対応**:
- URLに `?demo=true` を追加でデモデータを表示
- API呼び出しなしで動作確認可能

### 4. ドキュメント更新

#### database-design.md
- セクション2.5: NurseryDayTypesテーブル追加
- マイグレーション順序にPhase 5追加
- テーブル数を7に更新

#### requirements.md
- FR-EM-002: イベントカテゴリから「園休日」削除
- FR-EM-008~010: 休園日・休日保育管理機能要件追加
- UI-EM-007~008: ダイアログとカレンダー表示のUI要件追加
- BR-EM-004~007: ビジネスルール追加

## 使用方法

### 新規登録
1. カレンダー画面で対象日付の日付部分をクリック
2. ダイアログで「休園日」または「休日保育」を選択
3. 「保存」ボタンをクリック

### 編集
1. カレンダー上の休園日・休日保育バッジをクリック
2. ダイアログで種別を変更（日付は変更不可）
3. 「保存」ボタンをクリック

### 削除
1. カレンダー上の休園日・休日保育バッジをクリック
2. ダイアログで「削除」ボタンをクリック
3. 確認ダイアログで「OK」をクリック

## 技術仕様

### バリデーション
- 日付必須
- 同一日付への重複登録不可（データベース制約）
- 種別は 'ClosedDay' または 'HolidayCare' のみ

### セキュリティ
- JWT認証必須（[Authorize]属性）
- NurseryId によるデータ分離
- 作成者情報の記録（CreatedBy）

### パフォーマンス
- 期間指定による効率的なクエリ
- インデックス: (NurseryId, Date), Date, DayType

## 既存機能への影響

### 削除された機能
- CalendarEventsの「園休日」イベントカテゴリ（nursery_holiday）
- `eventCategoriesDesktop` から nursery_holiday を削除

### 分離された機能
- 休園日・休日保育は NurseryDayTypes テーブルで独立管理
- CalendarEvents は通常のイベント管理のみに専念

## 完了項目

✅ データベーススキーマ作成
✅ バックエンドAPI実装
✅ フロントエンド型定義
✅ サービス層実装
✅ UIコンポーネント実装
✅ カレンダーページ統合
✅ ドキュメント更新
✅ デモモード対応

## 今後の拡張可能性

1. **一括登録機能**: 複数日の一括登録・削除
2. **テンプレート機能**: 年間休園日テンプレート（祝日など）
3. **通知機能**: 休園日や休日保育のリマインダー
4. **レポート機能**: 年間休園日・休日保育日数の集計

## 関連ファイル

### バックエンド
- `ReactApp.Server/scripts/create_nursery_day_types_table.sql`
- `ReactApp.Server/Models/NurseryDayType.cs`
- `ReactApp.Server/DTOs/Desktop/NurseryDayTypeDto.cs`
- `ReactApp.Server/Services/INurseryDayTypeService.cs`
- `ReactApp.Server/Services/NurseryDayTypeService.cs`
- `ReactApp.Server/Controllers/NurseryDayTypeController.cs`
- `ReactApp.Server/Data/KindergartenDbContext.cs` (更新)
- `ReactApp.Server/Program.cs` (更新)

### フロントエンド
- `reactapp.client/src/desktop/types/calendar.ts` (更新)
- `reactapp.client/src/desktop/services/nurseryDayTypeService.ts`
- `reactapp.client/src/desktop/components/NurseryDayTypeDialog.tsx`
- `reactapp.client/src/desktop/pages/CalendarPage.tsx` (更新)

### ドキュメント
- `docs/desktop/database-design.md` (更新)
- `docs/desktop/requirements.md` (更新)
- `docs/desktop/nursery-day-types-implementation.md` (新規)

# ReactApp2プロジェクト完全開発履歴（2025年9月～11月）

## プロジェクト概要
保育園・幼稚園向け総合管理システム（デスクトップ版 + モバイル版PWA）

**技術スタック**:
- Frontend: React 19.1 + TypeScript + Vite + Tailwind CSS
- Backend: ASP.NET Core 8 Web API + Entity Framework Core 8
- Database: Azure SQL Database (開発環境: SQL Server LocalDB)
- Auth: JWT + SMS認証（Media4U API）
- Storage: Azure Blob Storage（写真・添付ファイル）

---

## 2025年11月3日の作業

### 1. お知らせ管理機能の仕様変更対応

**変更概要**: 優先度削除、対象範囲変更（全体/クラス別/個別）、要約フィールド削除

**実施内容**:
- 型定義修正: `TargetAudienceType = 'all' | 'class' | 'individual'`
- フォーム修正: クラス選択ドロップダウン追加、要約フィールド削除
- 一覧画面修正: アイコンボタン+ツールチップデザイン統一
- 園児選択UI改善: オートコンプリート機能実装（名前・ふりがなで検索）

**技術的実装**:
```typescript
// オートコンプリート検索
const handleChildSearchChange = (e) => {
  const query = e.target.value.toLowerCase();
  const filtered = children.filter(child =>
    child.name.toLowerCase().includes(query) ||
    child.furigana?.toLowerCase().includes(query)
  );
  setFilteredChildren(filtered);
};
```

### 2. お知らせ画面500エラー修正（データベーススキーマ整合性）

**根本原因**: モデル定義とデータベーススキーマの不一致

**問題点**:
- モデル: `TargetClassIds` (複数形、JSON配列想定)
- 実テーブル: `TargetClassId` (単数形、NVARCHAR(50))
- モデル: `TargetChildIds` (複数形、JSON配列想定)
- 実テーブル: `TargetChildId` (単数形, INT)

**解決方法**: サービス層で変換処理実装
```csharp
// Create/Update: 配列 → 単一値
announcement.TargetClassId = request.TargetClassIds.FirstOrDefault();
announcement.TargetChildId = request.TargetChildIds.FirstOrDefault() != null
    ? int.Parse(request.TargetChildIds.First())
    : (int?)null;

// MapToDto: 単一値 → 配列
if (!string.IsNullOrEmpty(announcement.TargetClassId))
    targetClassIds.Add(announcement.TargetClassId);
if (announcement.TargetChildId.HasValue)
    targetChildIds.Add(announcement.TargetChildId.Value.ToString());
```

**影響ファイル**:
- `ReactApp.Server/Models/Announcement.cs`: プロパティ名・型修正
- `ReactApp.Server/Data/KindergartenDbContext.cs`: 設定追加
- `ReactApp.Server/Services/DesktopAnnouncementService.cs`: 4メソッド修正

### 3. クラス管理機能拡張

**実装内容**:
- 年度フィールド削除（不要との要望）
- クラス構成管理画面新規作成（571行）
  - 担任職員の割り当て（オートコンプリート検索）
  - 園児の割り当て（名前・ふりがな検索）
  - デモモード対応（自動データ表示）

**UI特徴**:
- 2カラムレスポンシブレイアウト
- ドロップダウン外クリックで自動クローズ（200ms遅延）
- 既割り当て項目は候補から除外

### 4. カレンダー管理機能（Phase 5）完成

**実装内容**:
- イベント作成・編集・削除モーダル実装
- 週表示: 7:00-21:00タイムライン、全日イベント行、重複イベント横並び表示
- 月表示: セル自動伸縮、全イベント表示
- カレンダー線調整: 0.5px solid #d1d5db（ユーザーフィードバック反映）
- デモモード実装（認証バイパス機能）

**デモデータ**: 12件のサンプルイベント（SQLスクリプト + C#スクリプト）

### 5. 閲覧状況モーダル実装（Phase 7）

**機能**:
- 既読率プログレスバー（0-100%）
- 保護者リストのフィルター（全体/既読/未読）
- テーブル列: 保護者名、園児名、クラス、電話番号、ステータス
- 既読日時の表示（MM/DD HH:MM形式）

**デモデータ**:
- 既読保護者: 3人（田中一郎、佐藤花子、鈴木美咲）
- 未読保護者: 1人（高橋健太）
- 既読率: 75.0%

### 6. 園児ふりがなフィールド追加

**実施内容**:
- データベース: `Furigana NVARCHAR(100) NULL`
- モデル・DTO更新（3ファイル）
- TypeScript型定義更新（3インターフェース）
- マイグレーションスクリプト作成（冪等性確保）

---

## 2025年10月31日の作業

### 1. 写真管理機能のUI/UX改善

**実装内容**:
- PhotoDetailModalコンポーネント作成（詳細表示+編集モード統合）
- 公開済み写真の削除・編集制限撤廃（BR-PHM-003）
- モーダル背景透過対応（`bg-black/50`）
- バッジとボタンの配置最適化（justify-between）

**要件定義書更新**:
- UI-PHM-003: 写真詳細・編集モーダル仕様追加
- BR-PHM-003: 公開済み写真も削除・編集可能に変更

### 2. カレンダー管理機能（Phase 5）実装開始

**バックエンド実装**:
- DTO作成: `CalendarEventDto`, `CreateCalendarEventRequestDto`, `UpdateCalendarEventRequestDto`
- サービス実装: `IDesktopCalendarService`, `DesktopCalendarService`
- コントローラー作成: `DesktopCalendarController`（5エンドポイント）

**フロントエンド実装**:
- 月表示・週表示の完全実装
- イベントカテゴリ別色分け（5種類）
- 時間ベースイベントの正確な配置
- 全日イベント専用行

**UI改善の反復**:
1. `border-gray-300` → `border-gray-200`
2. `border-gray-200` → `border-gray-100`
3. `border-gray-100` → `border-gray-50`
4. **最終版**: `0.5px solid #d1d5db`（色は維持、太さのみ半減）

### 3. デモモード実装

**実装内容**:
- ProtectedRouteの改修（`?demo=true`で認証バイパス）
- LoginPageの自動リダイレクト
- DesktopAuthContextのデモ認証情報設定
- CalendarPageのダミーデータ読み込み

**デモURL**: `https://localhost:5173/desktop/calendar?demo=true`

### 4. イベント詳細ダイアログUI統一

**修正内容**:
- 写真管理画面と同じデザインに統一
- ×ボタンをSVGアイコンに変更
- 外枠のみ薄い灰色（`border-gray-200`）
- 内部の余計な枠線削除
- Overlay + Modal の2層構造

---

## 主要な技術的課題と解決パターン

### 1. 複合主キー対応（継続課題）

**問題パターン**:
```csharp
// NG
var staff = await _context.Staff.FindAsync(staffId);

// OK
var staff = await _context.Staff.FindAsync(nurseryId, staffId);
```

**影響エンティティ**: Staff, PhotoChildren, StaffClassAssignments

### 2. Include/ThenIncludeエラー

**解決パターン**:
```csharp
// NG: 複合主キーエンティティのナビゲーションプロパティ
.Include(p => p.PhotoChildren).ThenInclude(pc => pc.Child)

// OK: 別クエリで取得して辞書で結合
var childIds = photos.SelectMany(p => p.PhotoChildren.Select(pc => new { pc.NurseryId, pc.ChildId })).Distinct();
var children = await _context.Children
    .Where(c => childIds.Select(cid => cid.ChildId).Contains(c.ChildId))
    .ToDictionaryAsync(c => new { c.NurseryId, c.ChildId }, c => c.Name);
```

### 3. React State管理

**問題**: state更新の非同期性

**解決**: overrideSettings引数で直接値を渡す
```typescript
const uploadPhoto = useCallback(async (
  photoId: string,
  overrideSettings?: { description?: string; privacyLevel?: PhotoPrivacyLevel; }
) => {
  const description = overrideSettings?.description !== undefined
    ? overrideSettings.description
    : photo.description;
}, [photos]);
```

### 4. FormDataとContent-Type

**問題**: Axiosが`Content-Type: application/json`を設定

**解決**: native fetch() APIを使用（FormDataを自動認識）
```typescript
const response = await fetch(url, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData // Content-Typeは自動設定
});
```

---

## アーキテクチャ上の重要な設計パターン

### 1. 公開範囲制御（VisibilityLevel）
- **all**: 全体公開
- **grade**: 学年限定（AgeGroupMin/Max）
- **class**: クラス限定（TargetClassId）
- **individual**: 個別指定（PhotoChildren/ChildIds）

### 2. ステータス管理（Status）
- **draft**: 下書き（全編集可能）
- **published**: 公開済み（一部のみ編集可能）
- **archived**: アーカイブ（編集不可）

### 3. サービス層変換パターン

**DTOとモデル間の変換**:
- 受信時（Create/Update）: DTOの配列 → `.FirstOrDefault()` → モデルの単一値
- 送信時（MapToDto）: モデルの単一値 → `.Add()` → DTOの配列

**メリット**: APIコントラクト維持 + データベーススキーマ整合性

---

## 実装完了機能一覧

### デスクトップアプリ
1. **認証システム**: SMS認証 + JWT（マルチロール対応）
2. **マスタ管理**: 園、クラス、職員、保護者、園児
3. **クラス構成管理**: 担任・園児の割り当て（オートコンプリート）
4. **写真管理**: アップロード、編集、削除、詳細モーダル
5. **お知らせ管理**: CRUD、カテゴリ別配信、閲覧状況モーダル
6. **カレンダー管理**: イベントCRUD、月/週表示、デモモード
7. **連絡管理**: 保護者連絡、スタッフ返信
8. **日報管理**: 作成、編集、削除（draft/published）

### モバイルアプリ（PWA）
- 欠席・遅刻・お迎え連絡
- 園児一覧・連絡履歴
- カレンダー表示（権限ベースフィルタリング）
- 通知設定
- カスタマイズ設定（フォントサイズ、言語）

---

## データベーススキーマ重要事項

### Announcementsテーブル（実テーブル）
```sql
[TargetClassId] NVARCHAR(50)  -- 単数形、単一値
[TargetChildId] INT           -- 単数形、単一値、INT型
[ReadCount] INT DEFAULT 0     -- 実カラム（計算列ではない）
[CommentCount] INT DEFAULT 0  -- 実カラム（計算値ではない）
[Status] NVARCHAR(20) DEFAULT 'draft'  -- draft/scheduled/published
```

**重要**: Priorityカラムは存在しない（DTOには定義されているが実テーブルにはない）

### Childrenテーブル
```sql
[Furigana] NVARCHAR(100) NULL  -- 2025-11-03追加
```

### Eventsテーブル（カレンダー）
```sql
[Category] NVARCHAR(50)  -- general_announcement/general_event/nursery_holiday/class_activity/grade_activity
[IsAllDay] BIT
[TargetClassId] NVARCHAR(50)
[TargetGrade] INT
```

---

## 未実装機能（将来対応予定）

### お知らせ管理
1. リッチテキストエディタ（CKEditor/TinyMCE）
2. ファイル添付機能（PDF、Word）
3. 予約配信自動実行（バックエンドスケジューラー）
4. プッシュ通知送信（Azure Notification Hub）
5. 既読保護者API実装

### カレンダー管理
1. 繰り返しイベント機能
2. ドラッグ&ドロップでイベント移動
3. イベント検索・フィルター機能
4. 月表示でのイベント詳細ホバー表示

### クラス構成管理
1. API連携（保存機能）
2. バックエンドエンドポイント実装

---

## 学んだ教訓

### 1. 実テーブル優先の原則
- モデル実装前に必ず実際のDBスキーマと照合
- 仕様書と実テーブルが異なる場合がある

### 2. [NotMapped]の使用は慎重に
- プロパティを[NotMapped]にする前に実テーブルのカラム存在確認
- 計算値と実カラムを混同しやすい

### 3. APIコントラクトの維持
- DTOは既存フロントエンドとの互換性を考慮
- サービス層で変換処理を実装

### 4. UI/UXの反復改善
- ユーザーフィードバックに基づく段階的改善
- デザイン統一性の重要性（モーダル、ボタン、枠線）

---

## コード品質・パフォーマンス

### データベース最適化
- インデックス戦略: 複合インデックス活用
- N+1問題回避: ToDictionaryAsync でバッチ取得

### フロントエンド最適化
- 並列API呼び出し: Promise.all 活用
- blob URL管理: URL.createObjectURL() のメモリ解放

### セキュリティ
- JWT Bearer Token認証
- Claims-based Authorization
- Rate Limiting（SMS送信、認証試行）
- Input Validation（DTO）

---

## 現在のシステム状態（2025年11月3日時点）

- **実装フェーズ**: Phase 7完了
- **APIエンドポイント数**: 50以上
- **エンティティ数**: 25以上
- **画面数**: デスクトップ20+、モバイル15+
- **デモモード**: 完全対応
- **動作確認**: すべての主要機能正常動作

**次のステップ**: バックエンドAPI実装、Phase 8開発、またはテスト強化

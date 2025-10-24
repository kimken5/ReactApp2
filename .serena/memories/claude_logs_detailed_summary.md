# ReactApp プロジェクト開発ログ詳細サマリー

**期間**: 2025年9月6日 - 2025年10月18日  
**プロジェクト**: 保育園・幼稚園向け保護者-スタッフ連絡アプリ

---

## プロジェクト概要

### システム構成
- **フロントエンド**: React 19.1 + TypeScript + Vite
- **バックエンド**: ASP.NET Core 8 Web API
- **データベース**: SQL Server (LocalDB for development)
- **ストレージ**: Azure Blob Storage
- **認証**: SMS認証 (Media4U API) + JWT

### アーキテクチャパターン
- RESTful API設計
- Entity Framework Core (Code-First)
- React Context API for State Management
- Composite Primary Keys (NurseryId + Id pattern)

---

## 主要実装機能

### 1. 認証システム (2025-09-06 ~ 09-09)

#### 実装内容
- **SMS認証フロー**: 電話番号 → 認証コード送信 → 検証 → JWT発行
- **マルチロール対応**: Parent / Staff / Parent-Staff hybrid
- **トークン管理**: 
  - Access Token: 1時間有効
  - Refresh Token: 7日間有効
- **セキュリティ**: BCrypt暗号化、レート制限 (SMS 3回/日、認証3回/5分)

#### 技術的実装
```csharp
// JWT Claims for Staff
claims.Add(new Claim("NurseryId", staffUser.NurseryId.ToString()));
claims.Add(new Claim("StaffId", staffUser.StaffId.ToString()));
var classAssignments = JsonSerializer.Serialize(staffUser.ClassAssignments);
claims.Add(new Claim("ClassAssignments", classAssignments));
```

### 2. 複合主キー対応 (継続課題)

#### 問題パターン
```csharp
// ❌ 間違い
var staff = await _context.Staff.FindAsync(staffId);

// ✅ 正しい
var staff = await _context.Staff.FindAsync(nurseryId, staffId);
```

#### 影響を受けたエンティティ
- Staff (NurseryId, StaffId)
- PhotoChildren (NurseryId, ChildId)
- StaffClassAssignments (NurseryId, StaffId, ClassId)

#### 修正事例
- **2025-10-16**: PhotosController 500エラー修正 (UpdatePhoto, DeletePhoto, ArchivePhoto)
- **2025-10-13**: PhotosController GET /Photos エラー修正 (Include/ThenInclude問題)

### 3. マルチクラス対応スタッフ機能 (2025-09-09)

#### データベース設計
```sql
CREATE TABLE StaffClassAssignments (
    NurseryId INT NOT NULL,
    StaffId INT NOT NULL,
    ClassId NVARCHAR(50) NOT NULL,
    AssignmentRole NVARCHAR(20) NOT NULL DEFAULT 'MainTeacher',
    AssignedAt DATETIME2 DEFAULT GETUTCDATE(),
    CONSTRAINT PK_StaffClassAssignments PRIMARY KEY (NurseryId, StaffId, ClassId)
)
```

#### フロントエンド実装
```typescript
export interface StaffClassContextType {
  nurseryId: number;
  staffId: number;
  currentClass: ClassInfo | null;
  availableClasses: ClassInfo[];
  isMultiClass: boolean;
  switchClass: (classId: string) => Promise<void>;
}
```

#### 影響画面
- スタッフダッシュボード
- 日報作成
- 写真アップロード・管理
- お知らせ作成
- 連絡管理

### 4. 写真機能 (2025-09-10 ~ 10-18)

#### 主要機能
- **複数写真一括アップロード**: 共通設定で一括登録
- **公開範囲設定**: 全体公開 / 学年限定 / クラス限定
- **学年フィルタリング**: AgeGroupMin/Maxによる学年判定

#### 技術的課題と解決

##### 4.1 写真表示403エラー (2025-10-16)
**問題**: VisibilityLevel='all' でも403エラー  
**原因**: PhotoService.CanParentViewPhotoAsync が公開範囲をチェックしていなかった  
**修正**:
```csharp
// 全体公開の場合は全員閲覧可能
if (photo.VisibilityLevel == "all") {
    return true;
}
```

##### 4.2 複数写真アップロード実装 (2025-10-16)
**要件変更**: 「すべての写真をアップロード」ボタン → 単一ボタンで複数対応  
**実装**:
```typescript
const uploadAllPhotos = useCallback(async () => {
  const sharedSettings = {
    description: referencePhoto.description,
    privacyLevel: referencePhoto.privacyLevel,
    selectedChildren: referencePhoto.selectedChildren
  };
  
  for (const photo of notUploadedPhotos) {
    await uploadPhoto(photo.id, sharedSettings);
  }
}, [notUploadedPhotos, selectedPhotoData]);
```

##### 4.3 日本語ファイル名エラー (2025-10-10)
**問題**: Azure Blob Storage で日本語ファイル名が500エラー  
**原因**: Content-Disposition ヘッダーに非ASCII文字  
**修正**: RFC 2231準拠のエンコーディング
```csharp
var encodedFileName = System.Web.HttpUtility.UrlEncode(file.FileName).Replace("+", "%20");
ContentDisposition = $"inline; filename*=UTF-8''{encodedFileName}";
```

##### 4.4 写真表示の縦横比対応 (2025-10-16)
```typescript
// 修正前: 正方形固定
aspectRatio: '1', objectFit: 'cover'

// 修正後: 実際の縦横比を保持
width: '100%', height: 'auto', display: 'block'
```

### 5. お知らせ管理機能 (2025-10-09 ~ 10-18)

#### 実装フロー
1. **2025-10-09**: 要件定義、設計書作成、バックエンドAPI実装
2. **2025-10-10**: フロントエンド実装、UI改善
3. **2025-10-11**: カテゴリ・ステータスの日本語化、下書きボタン表示制御
4. **2025-10-18**: 保護者向けカテゴリバッジ表示

#### データモデル
```csharp
public class Announcement {
    public int Id { get; set; }
    public int NurseryId { get; set; }
    public int StaffId { get; set; }
    public string Title { get; set; } // Max 100
    public string Content { get; set; } // Max 5000
    public string Category { get; set; } // general/urgent/emergency/important/cooperation/event/health/meal/belongings/other
    public string TargetScope { get; set; } // all/class/individual
    public string Status { get; set; } // draft/published/archived
    public string Priority { get; set; } // normal/important/urgent
    // ...
}
```

#### ステータス別編集制限
- **draft (下書き)**: すべて編集可能、下書き保存・公開ボタン表示
- **published (公開済み)**: タイトル・本文・添付のみ編集可、下書き保存ボタン非表示、更新ボタン表示
- **archived (アーカイブ)**: 編集不可 (一覧からアーカイブ解除のみ)

#### カテゴリ表示統一 (2025-10-18)
**実装**: スタッフ側と保護者側でgetCategoryInfo関数を共通化
```typescript
export const getCategoryInfo = (category: string) => {
  switch (category) {
    case 'emergency': return { label: '緊急連絡', color: '#ef4444' };
    case 'important': return { label: '重要通知', color: '#f59e0b' };
    // ... 10種類のカテゴリ
    default: return { label: category, color: '#64748b' };
  }
};
```

### 6. カレンダー機能 (2025-10-12)

#### 実装内容
- **週表示**: 時間範囲イベント、重複イベントの横並び表示
- **月表示**: すべてのイベント表示、セルの自動伸縮
- **イベント種別**:
  - general_announcement (全体お知らせ)
  - general_event (全体イベント)
  - nursery_holiday (休園日)
  - class_activity (クラス活動)
  - grade_activity (学年活動)

#### 技術的改善

##### 6.1 時間範囲イベントの縦方向表示
**アーキテクチャ変更**: 2層構造 (背景グリッド + イベントオーバーレイ)
```typescript
// 開始位置計算
const startPosition = (startHour - 7) × cellHeight;
// イベント高さ計算
const eventHeight = (endHour - startHour) × cellHeight;
```

##### 6.2 重複イベントの横並び表示
**重なり検出アルゴリズム**:
```typescript
const overlapping = otherEvents.filter(e => 
  !(e.endTime <= event.startTime || e.startTime >= event.endTime)
);
const columnIndex = /* 重なっているイベントの中での順序 */;
const maxColumns = /* 重なっているイベントの総数 */;

// レイアウト適用
width: `${100 / maxColumns}%`,
left: `${(100 / maxColumns) * columnIndex}%`
```

### 7. 連絡管理機能 (2025-10-16)

#### 実装内容
- **保護者側**: 連絡履歴画面でスタッフ返信表示
- **スタッフ側**: 返信機能、返信内容編集機能

#### 技術的実装
```typescript
// ステータスバッジ表示
case 'replied':
  return { backgroundColor: '#dbeafe', color: '#1e40af', text: '返信済み' };

// スタッフ返信表示UI
{record.staffResponse && (
  <div style={{
    backgroundColor: '#eff6ff',
    borderLeft: '4px solid #3b82f6'
  }}>
    <p>スタッフからの返信:</p>
    <p>{record.staffResponse}</p>
  </div>
)}
```

### 8. 家族メンバー直接登録機能 (2025-10-17)

#### 要件変更
**旧仕様**: SMS招待コード方式  
**新仕様**: Parentsテーブルへの直接登録

#### 実装内容
```csharp
public async Task<Parent> CreateFamilyMemberAsync(int nurseryId, int childId, int invitedByParentId, CreateFamilyMemberDto dto)
{
    // 既存保護者の再アクティブ化処理
    var existingParent = await _context.Parents
        .FirstOrDefaultAsync(p => p.PhoneNumber == dto.PhoneNumber);
    
    if (existingParent != null) {
        existingParent.IsActive = true;
        // ...
    } else {
        // 新規保護者作成
        var newParent = new Parent {
            PhoneNumber = dto.PhoneNumber,
            Name = dto.Name,
            IsActive = true
        };
        _context.Parents.Add(newParent);
    }
    
    // FamilyMembersテーブルへのリレーション作成
    // ...
}
```

#### 解決した問題
- **Parent.Id自動採番**: ValueGeneratedNever() → ValueGeneratedOnAdd()
- **データベースIDENTITY設定**: 手動でParentsテーブルを再作成

### 9. UI/UX統一化 (2025-10-12)

#### 実施内容
- **背景色統一**: 各画面から個別の背景色設定を削除
- **戻るボタンデザイン統一**: 
  ```typescript
  {
    backgroundColor: 'white',
    border: '2px solid #e2e8f0',
    borderRadius: '8px',
    // ホバー時: borderColor: '#3b82f6'
  }
  ```
- **スクロール位置リセット**: useEffect(() => window.scrollTo(0, 0), [])

---

## 技術的課題と解決パターン

### 1. Entity Framework Core 関連

#### Include/ThenInclude エラー
**問題**: 複合主キーエンティティのナビゲーションプロパティ  
**解決**: 別クエリで取得して辞書で結合
```csharp
// NG
.Include(p => p.PhotoChildren).ThenInclude(pc => pc.Child)

// OK
var childIds = photos.SelectMany(p => p.PhotoChildren.Select(pc => new { pc.NurseryId, pc.ChildId })).Distinct().ToList();
var children = await _context.Children
    .Where(c => childIds.Select(cid => cid.ChildId).Contains(c.ChildId))
    .ToDictionaryAsync(c => new { c.NurseryId, c.ChildId }, c => c.Name);
```

### 2. React State Management

#### State更新の非同期性
**問題**: state更新後すぐに参照すると古い値  
**解決**: overrideSettings引数で直接値を渡す
```typescript
const uploadPhoto = useCallback(async (
  photoId: string,
  overrideSettings?: {
    description?: string;
    privacyLevel?: PhotoPrivacyLevel;
  }
) => {
  const description = overrideSettings?.description !== undefined
    ? overrideSettings.description
    : photo.description;
}, [photos]);
```

### 3. HTTP通信関連

#### FormData と Content-Type
**問題**: Axios の apiClient がデフォルトで `Content-Type: application/json`  
**解決**: native fetch() API を使用
```typescript
// fetch()は FormData を自動認識
const response = await fetch(url, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData // Content-Typeは自動設定
});
```

#### タイムアウト設定
```typescript
// Vite プロキシ
'^/api': {
    timeout: 120000, // 2 minutes
    proxyTimeout: 120000
}
```

```csharp
// Kestrel
builder.WebHost.ConfigureKestrel(options => {
    options.Limits.MaxRequestBodySize = 52428800; // 50MB
    options.Limits.RequestHeadersTimeout = TimeSpan.FromMinutes(2);
});
```

### 4. Azure Blob Storage

#### URL管理のベストプラクティス
```json
{
  "AzureBlobStorage": {
    "BaseUrl": "https://{storage-account}.blob.core.windows.net",
    "ContainerName": "{container-name}"
  }
}
```

```csharp
var blobBaseUrl = _configuration["AzureBlobStorage:BaseUrl"];
var containerName = _configuration["AzureBlobStorage:ContainerName"];
photoDto.FileUrl = $"{blobBaseUrl}/{containerName}/{photo.FileName}";
```

---

## アーキテクチャ上の重要な設計パターン

### 1. 公開範囲制御 (VisibilityLevel)
- **all**: 全体公開
- **grade**: 学年限定 (AgeGroupMin/Maxで判定)
- **class**: クラス限定 (TargetClassIdで判定)
- **individual**: 個別指定 (PhotoChildren/ChildIdsで判定)

### 2. ステータス管理 (Status)
- **draft**: 下書き (全編集可能)
- **published**: 公開済み (一部のみ編集可能)
- **archived**: アーカイブ (編集不可)

### 3. 複合主キーパターン
```csharp
// Entity定義
modelBuilder.Entity<Staff>()
    .HasKey(s => new { s.NurseryId, s.StaffId });

// データ取得
var staff = await _context.Staff.FindAsync(nurseryId, staffId);

// 辞書検索
.ToDictionaryAsync(s => new { s.NurseryId, s.StaffId }, s => s.Name);
```

---

## コードパターンと慣例

### バックエンド

#### DTO変換ヘルパーメソッド
```csharp
private AnnouncementDto MapToDto(Announcement announcement)
{
    return new AnnouncementDto
    {
        Id = announcement.Id,
        Title = announcement.Title,
        ContentPreview = announcement.Content.Length > 100 
            ? announcement.Content.Substring(0, 100) + "..." 
            : announcement.Content,
        TargetClassIds = string.IsNullOrEmpty(announcement.TargetClassIds)
            ? new List<string>()
            : JsonSerializer.Deserialize<List<string>>(announcement.TargetClassIds) ?? new List<string>(),
        // ...
    };
}
```

#### 論理削除パターン
```csharp
announcement.IsActive = false;
announcement.UpdatedAt = DateTime.UtcNow;
await _context.SaveChangesAsync();
```

### フロントエンド

#### ヘルパー関数のデフォルトケース
```typescript
export const getCategoryInfo = (category: string) => {
  switch (category) {
    case 'general': return { label: '一般連絡', color: '#3b82f6' };
    // ...
    default: return { label: category, color: '#64748b' }; // フォールバック
  }
};
```

#### Loading状態管理
```typescript
if (!loading && data.length === 0) {
  return <div>データがありません</div>;
}
```

---

## パフォーマンス最適化

### データベース
- **インデックス戦略**: 複合インデックス活用
  - `IX_Photos_Nursery_Published_Visibility`
  - `IX_Announcements_Staff_Status_Created`
- **N+1問題回避**: ToDictionaryAsync でバッチ取得

### フロントエンド
- **並列API呼び出し**: Promise.all の活用
- **blob URL管理**: URL.createObjectURL() のメモリ解放

---

## セキュリティ実装

### 認証・認可
- JWT Bearer Token認証
- Claims-based Authorization
- Rate Limiting (SMS送信、認証試行)

### データ検証
- Input Validation (DTOでのデータアノテーション)
- XSS対策 (サニタイゼーション)
- CSRF対策 (SameSite Cookie設定)

---

## テスト環境構築

### Playwright設定 (2025-10-10)
- 21プロジェクト設定 (デスクトップ、モバイル、タブレット、PWA)
- E2Eテストスクリプト作成 (お知らせ管理機能)
- ※実行環境準備は未完了

---

## データベース移行管理

### マイグレーション戦略
- **問題**: マイグレーションファイルに既存モデルの変更が含まれる
- **解決**: マイグレーションファイルを手動編集して対象テーブルのみに限定

### スクリプト実行パターン
```csharp
// Program.cs での初期化スクリプト実行
var scriptPath = Path.Combine(AppContext.BaseDirectory, "scripts", "add_family_tables.sql");
if (File.Exists(scriptPath))
{
    var script = await File.ReadAllTextAsync(scriptPath);
    await context.Database.ExecuteSqlRawAsync(script);
    Log.Information("家族テーブル作成スクリプト実行完了");
}
```

---

## 運用・保守

### ログ管理
- Serilog によるファイルログ出力
- `ReactApp.Server/logs/kindergarten-YYYYMMDD.txt`
- LogWarning による詳細デバッグログ

### プロセス管理
- バックグラウンドプロセスの適切な停止
- ポート競合の回避 (netstat確認)
- Visual Studio デバッグモードの活用

---

## 今後の課題・改善提案

### 機能追加
1. GradeLevelフィルタリング実装
2. Location機能の実装 (Eventモデル)
3. イベント編集機能
4. カレンダードラッグ&ドロップ

### パフォーマンス
1. CDN統合 (Azure CDN)
2. 仮想スクロール・遅延ロード
3. クライアントサイドキャッシング

### テスト
1. E2Eテストの実行環境完成
2. 単体テスト・統合テストの作成

### UI/UX
1. アップロード進捗表示
2. ファイル削除機能
3. アクセシビリティ強化 (WCAG 2.1準拠)

---

## まとめ

このプロジェクトは、保育園・幼稚園向けの包括的な保護者-スタッフ連絡アプリとして、SMS認証、マルチロール対応、複数クラス対応、写真共有、お知らせ配信、カレンダー、連絡管理など多岐にわたる機能を実装しています。

技術的には、複合主キーの適切な扱い、Azure Blob Storageの統合、React Contextによる状態管理、Entity Framework Coreによる効率的なデータアクセスなど、モダンなWebアプリケーション開発のベストプラクティスが適用されています。

開発ログからは、継続的な問題解決と改善のプロセスが見て取れ、ユーザーフィードバックに基づくUI/UXの改善、技術的課題への体系的なアプローチ、コード品質の維持に注力していることが分かります。
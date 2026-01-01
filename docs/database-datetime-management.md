# SQL Database テーブル更新時の日時管理パターン調査

## 調査日
2025-12-13

## 調査概要
このプロジェクトにおけるSQL Databaseのテーブル更新時の日時設定方法について調査しました。特に、`GETUTCDATE()`の使用状況と、`DateTime.UtcNow`の使用パターンを分析しました。

---

## 主要な発見

このプロジェクトでは、**2つの異なるアプローチ**を組み合わせて日時を管理しています：

### 1. データベースデフォルト値（SQL関数）
**使用場所**: テーブル定義（KindergartenDbContext.cs）
**使用関数**: `GETUTCDATE()`
**設定方法**: Entity Framework Coreの`.HasDefaultValueSql("GETUTCDATE()")`

### 2. アプリケーションコード（C#）
**使用場所**: サービス層（Services/*.cs）
**使用関数**: `DateTime.UtcNow`
**設定方法**: プロパティへの明示的な代入

---

## パターン1: データベースデフォルト値（GETUTCDATE()）

### 概要
レコード作成時（INSERT）に自動的に日時を設定するために、データベース側のデフォルト値としてSQL関数`GETUTCDATE()`を使用。

### 対象フィールド
主に以下のような「作成日時」を表すフィールドで使用：
- `CreatedAt` - レコード作成日時
- `SubmittedAt` - 送信日時
- `RecordedAt` - 記録日時
- `ResponseAt` - 応答日時
- `AssignedAt` - 割り当て日時
- `UploadedAt` - アップロード日時
- `AccessedAt` - アクセス日時
- `RequestedAt` - 要求日時
- `Timestamp` - タイムスタンプ
- `LastModified` - 最終更新日時（Eventsテーブル）

### 実装例

**KindergartenDbContext.cs の設定:**
```csharp
modelBuilder.Entity<AbsenceNotification>(entity =>
{
    // ...その他の設定
    entity.Property(e => e.SubmittedAt).HasDefaultValueSql("GETUTCDATE()");
});
```

**実装箇所の統計:**
- 全体で**44箇所**のフィールドに`GETUTCDATE()`を設定
- 主なエンティティ:
  - Parent, Child, Class, Staff (CreatedAt)
  - AbsenceNotification (SubmittedAt)
  - AbsenceNotificationResponse (ResponseAt)
  - DailyReport, Event, Photo, Announcement (CreatedAt)
  - RefreshToken, SmsAuthentication (CreatedAt)
  - AcademicYear, ChildClassAssignment (CreatedAt, UpdatedAt)
  - DailyAttendance (RecordedAt, CreatedAt)
  - ApplicationWork (CreatedAt)

### 利点
- **データベース側で自動設定**: コードで明示的に設定する必要がない
- **一貫性**: データベース層で日時を統一管理
- **パフォーマンス**: アプリケーション層での処理が不要
- **信頼性**: データベースサーバーの時刻を使用

---

## パターン2: アプリケーションコード（DateTime.UtcNow）

### 概要
レコード更新時（UPDATE）や特定の状態変更時に、サービス層でC#コードを使用して日時を明示的に設定。

### 対象フィールド
主に以下のような「更新日時」や「状態変更日時」を表すフィールドで使用：
- `UpdatedAt` - レコード更新日時
- `AcknowledgedAt` - 確認日時
- `PublishedAt` - 公開日時
- `ImportedAt` - インポート日時
- `RejectedAt` - 却下日時（ApplicationWork）
- `PromotedAt` - 進級日時

### 実装例

**AbsenceNotificationsテーブルの`AcknowledgedAt`の例:**

**1. テーブル定義（AbsenceNotification.cs）:**
```csharp
public class AbsenceNotification
{
    // ...その他のプロパティ

    public DateTime? AcknowledgedAt { get; set; } // nullable, デフォルト値なし
}
```

**2. DbContext設定（KindergartenDbContext.cs）:**
```csharp
modelBuilder.Entity<AbsenceNotification>(entity =>
{
    // AcknowledgedAtにはデフォルト値を設定しない
    // 確認された時に手動で設定する必要がある
});
```

**3. サービス層での更新（DesktopContactNotificationService.cs）:**
```csharp
// 連絡通知を確認済みにする処理
public async Task<ContactNotificationDto> AcknowledgeNotificationAsync(int id, AcknowledgeNotificationRequest request)
{
    var notification = await _context.AbsenceNotifications
        .FirstOrDefaultAsync(n => n.Id == id);

    if (notification == null)
    {
        throw new KeyNotFoundException($"連絡通知が見つかりません。ID: {id}");
    }

    // 確認日時を明示的に設定
    notification.AcknowledgedAt = DateTime.UtcNow;
    notification.AcknowledgedBy = request.RespondedByStaffId;
    notification.StaffResponse = request.StaffResponse;
    notification.Status = "acknowledged";

    await _context.SaveChangesAsync();

    // ...レスポンス返却
}
```

**他の実装例:**

```csharp
// ApplicationService.cs - 保護者情報の更新
existingParent.UpdatedAt = DateTime.UtcNow;

// DailyReportService.cs - 連絡帳の公開
report.Status = "published";
report.PublishedAt = DateTime.UtcNow;
report.UpdatedAt = DateTime.UtcNow;

// ApplicationService.cs - 申込の却下
application.ApplicationStatus = "Rejected";
application.RejectionReason = request.RejectionReason;
application.UpdatedAt = DateTime.UtcNow;

// DesktopAuthenticationService.cs - パスワード変更
nursery.Password = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
nursery.UpdatedAt = DateTime.UtcNow;
```

### 実装箇所の統計
- `UpdatedAt = DateTime.UtcNow` を使用: **多数のサービスで使用**
- `AcknowledgedAt = DateTime.UtcNow` を使用: **2箇所**（DesktopContactNotificationService.cs）
- `CreatedAt = DateTime.UtcNow` を使用: **70箇所**（16ファイル）

### 利点
- **柔軟性**: コードレベルで日時を制御可能
- **テスト容易性**: 単体テストで日時をモック化しやすい
- **明示性**: コードを読むだけで日時設定のタイミングが明確
- **ビジネスロジック統合**: 状態変更と同時に日時を設定

---

## ハイブリッドアプローチ

### 概要
`CreatedAt`フィールドは、データベースデフォルト値を設定しつつ、一部のサービス層では明示的に`DateTime.UtcNow`も設定しています。

### 理由
1. **デフォルト値の保険**: EF Coreでプロパティに値を設定しない場合、データベースのデフォルト値が使用される
2. **明示的制御**: 必要に応じてコードで日時を制御できる柔軟性を確保
3. **一貫性**: すべてのエンティティで同じパターンを使用

### 実装例

**ApplicationService.cs - 入園申込の作成:**
```csharp
var applicationWork = new ApplicationWork
{
    NurseryId = nurseryId,
    // ...その他のプロパティ
    ApplicationStatus = "Pending",
    IsImported = false,
    CreatedAt = DateTime.UtcNow  // 明示的に設定
};

_context.ApplicationWorks.Add(applicationWork);
await _context.SaveChangesAsync();
```

**注意点:**
- EF Coreでは、プロパティに値を設定した場合、データベースのデフォルト値は使用されない
- したがって、明示的に設定する場合はデフォルト値の設定は不要だが、保険として両方設定している

---

## パターンの使い分け

### レコード作成時（INSERT）の日時
**推奨**: データベースデフォルト値（`GETUTCDATE()`）+ 明示的設定（`DateTime.UtcNow`）

**理由:**
- データベース層での自動設定により、設定忘れを防止
- コード層での明示的設定により、テストやデバッグが容易
- 両方設定することで、どちらのアプローチでも動作する柔軟性

**実装パターン:**
```csharp
// 1. DbContext設定
entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");

// 2. サービス層での明示的設定
var entity = new Entity
{
    // ...その他のプロパティ
    CreatedAt = DateTime.UtcNow
};
```

### レコード更新時（UPDATE）の日時
**推奨**: アプリケーションコード（`DateTime.UtcNow`）

**理由:**
- 更新処理はビジネスロジックと密接に関連
- 更新のタイミングをコードレベルで制御したい
- テストで日時をモック化する必要がある

**実装パターン:**
```csharp
// DbContext設定: UpdatedAtにはデフォルト値を設定しない
// （nullableにして、更新時のみ設定）

// サービス層での明示的設定
existingEntity.SomeProperty = newValue;
existingEntity.UpdatedAt = DateTime.UtcNow;
await _context.SaveChangesAsync();
```

### 状態変更時の日時（AcknowledgedAt, PublishedAtなど）
**推奨**: アプリケーションコード（`DateTime.UtcNow`）のみ

**理由:**
- 特定の状態変更時にのみ設定されるフィールド
- ビジネスロジックと強く結びついている
- データベースデフォルト値は不要（nullable）

**実装パターン:**
```csharp
// DbContext設定: デフォルト値なし（nullable）
public DateTime? AcknowledgedAt { get; set; }

// サービス層での明示的設定
notification.AcknowledgedAt = DateTime.UtcNow;
notification.Status = "acknowledged";
await _context.SaveChangesAsync();
```

---

## 具体的な実装箇所

### AbsenceNotificationsテーブルの日時フィールド

| フィールド | 型 | デフォルト値 | 更新方法 | 設定タイミング |
|-----------|-----|-------------|---------|--------------|
| `SubmittedAt` | DateTime | `GETUTCDATE()` | 自動 | レコード作成時 |
| `AcknowledgedAt` | DateTime? | なし | `DateTime.UtcNow` | スタッフが確認時 |
| `AcknowledgedByAdminAt` | DateTime? | なし | `DateTime.UtcNow` | 管理者が確認時 |

**SubmittedAt の設定:**
```csharp
// KindergartenDbContext.cs
entity.Property(e => e.SubmittedAt).HasDefaultValueSql("GETUTCDATE()");

// データベースが自動的に設定するため、コードでの設定は不要
```

**AcknowledgedAt の設定:**
```csharp
// DesktopContactNotificationService.cs (348行目, 393行目)
notification.AcknowledgedAt = DateTime.UtcNow;
notification.Status = "acknowledged";
```

### DailyReportsテーブルの日時フィールド

| フィールド | 型 | デフォルト値 | 更新方法 | 設定タイミング |
|-----------|-----|-------------|---------|--------------|
| `CreatedAt` | DateTime | `GETUTCDATE()` | 明示的設定も | レコード作成時 |
| `UpdatedAt` | DateTime? | なし | `DateTime.UtcNow` | レコード更新時 |
| `PublishedAt` | DateTime? | なし | `DateTime.UtcNow` | 公開時 |
| `AcknowledgedAt` | DateTime? | なし | `DateTime.UtcNow` | 保護者確認時 |

**PublishedAt の設定例:**
```csharp
// DailyReportService.cs (333-334行目)
report.Status = "published";
report.PublishedAt = DateTime.UtcNow;
report.UpdatedAt = DateTime.UtcNow;
```

### ApplicationWorkテーブルの日時フィールド

| フィールド | 型 | デフォルト値 | 更新方法 | 設定タイミング |
|-----------|-----|-------------|---------|--------------|
| `CreatedAt` | DateTime | `GETUTCDATE()` | 明示的設定も | レコード作成時 |
| `UpdatedAt` | DateTime? | なし | `DateTime.UtcNow` | レコード更新時 |
| `ImportedAt` | DateTime? | なし | `DateTime.UtcNow` | インポート時 |

---

## 時刻の種類（UTC vs Local）

### 使用している時刻
このプロジェクトでは、**すべてUTC（協定世界時）**を使用しています。

### 理由
- **タイムゾーン非依存**: 世界中のどの地域でも一貫した時刻
- **サーバー移行容易**: サーバーのタイムゾーン設定に依存しない
- **夏時間対応不要**: 夏時間の切り替えの影響を受けない

### 使用関数
- SQL: `GETUTCDATE()` （`GETDATE()`ではない）
- C#: `DateTime.UtcNow` （`DateTime.Now`ではない）

### 表示時の変換
データベースにはUTCで保存し、フロントエンドで表示する際にユーザーのタイムゾーンに変換します。

```typescript
// フロントエンド（TypeScript）での変換例
const submittedAt = new Date(notification.submittedAt); // UTCとして解釈
const localTime = submittedAt.toLocaleString('ja-JP'); // 日本時間に変換して表示
```

---

## ベストプラクティス

### 1. 新しいテーブルを追加する場合

**CreatedAtフィールド:**
```csharp
// モデル定義
public DateTime CreatedAt { get; set; }

// DbContext設定
entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");

// サービス層（保険として明示的に設定）
var entity = new Entity
{
    // ...
    CreatedAt = DateTime.UtcNow
};
```

**UpdatedAtフィールド:**
```csharp
// モデル定義
public DateTime? UpdatedAt { get; set; }

// DbContext設定: デフォルト値は設定しない

// サービス層（更新時に明示的に設定）
existingEntity.UpdatedAt = DateTime.UtcNow;
```

### 2. 状態変更日時フィールドを追加する場合

```csharp
// モデル定義
public DateTime? PublishedAt { get; set; }

// DbContext設定: デフォルト値は設定しない

// サービス層（状態変更時に設定）
entity.Status = "published";
entity.PublishedAt = DateTime.UtcNow;
```

### 3. 避けるべきパターン

**❌ ローカル時刻の使用:**
```csharp
// NG: ローカル時刻を使用しない
entity.CreatedAt = DateTime.Now; // サーバーのタイムゾーンに依存

// OK: UTC時刻を使用
entity.CreatedAt = DateTime.UtcNow;
```

**❌ SQL関数のGETDATE()の使用:**
```csharp
// NG: ローカル時刻を返す
entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETDATE()");

// OK: UTC時刻を返す
entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
```

**❌ 更新日時のデフォルト値設定:**
```csharp
// NG: UpdatedAtにデフォルト値を設定しない
entity.Property(e => e.UpdatedAt).HasDefaultValueSql("GETUTCDATE()");

// OK: コードで明示的に設定
existingEntity.UpdatedAt = DateTime.UtcNow;
```

---

## まとめ

### 日時管理の基本原則

1. **作成日時（CreatedAt）**: データベースデフォルト値 + コードでの明示的設定
2. **更新日時（UpdatedAt）**: コードでの明示的設定のみ
3. **状態変更日時（AcknowledgedAt, PublishedAtなど）**: コードでの明示的設定のみ
4. **すべてUTC**: `GETUTCDATE()`と`DateTime.UtcNow`を使用
5. **一貫性**: プロジェクト全体で同じパターンを使用

### 実装統計

- **`GETUTCDATE()`の使用**: 44箇所（テーブル定義）
- **`DateTime.UtcNow`の使用**: 多数（サービス層全体）
- **ハイブリッド（CreatedAt）**: 70箇所（16ファイル）

### 利点

このハイブリッドアプローチにより、以下の利点が得られています：

- ✅ **信頼性**: データベース側の自動設定で設定忘れを防止
- ✅ **柔軟性**: 必要に応じてコードレベルで日時を制御
- ✅ **テスト容易性**: 単体テストで日時をモック化可能
- ✅ **一貫性**: プロジェクト全体で統一されたパターン
- ✅ **グローバル対応**: UTC使用でタイムゾーン問題を回避

---

## 参考情報

### 関連ファイル
- **モデル定義**: `ReactApp.Server/Models/*.cs`
- **DbContext設定**: `ReactApp.Server/Data/KindergartenDbContext.cs`
- **サービス層**: `ReactApp.Server/Services/*.cs`

### 主要なテーブルと日時フィールド
- **AbsenceNotifications**: SubmittedAt, AcknowledgedAt
- **DailyReports**: CreatedAt, UpdatedAt, PublishedAt, AcknowledgedAt
- **ApplicationWorks**: CreatedAt, UpdatedAt, ImportedAt
- **Photos**: UploadedAt, UpdatedAt
- **Events**: CreatedAt, LastModified
- **Parents, Children, Staff**: CreatedAt, UpdatedAt

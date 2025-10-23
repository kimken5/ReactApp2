# スタッフお知らせ管理API 技術仕様書

## 1. 概要

スタッフがお知らせの作成・編集・削除・一覧表示を行うためのREST APIの技術仕様を定義する。

## 2. 基本情報

### 2.1 ベースURL
```
https://localhost:7117/api
```

### 2.2 認証
- **認証方式**：JWT Bearer Token
- **必要な権限**：Staff または Admin ロール
- **ヘッダー**：`Authorization: Bearer {token}`

### 2.3 共通レスポンス形式

#### 成功時
```json
{
  "success": true,
  "data": { ... },
  "message": "Success message"
}
```

#### エラー時
```json
{
  "success": false,
  "error": "Error message",
  "details": { ... }
}
```

## 3. APIエンドポイント仕様

### 3.1 お知らせ一覧取得（スタッフ用）

#### エンドポイント
```
GET /api/Announcements/staff/my
```

#### 説明
ログイン中のスタッフが作成したお知らせの一覧を取得する。

#### リクエストヘッダー
```
Authorization: Bearer {jwt_token}
```

#### クエリパラメータ
| パラメータ | 型 | 必須 | 説明 | デフォルト |
|----------|---|------|------|----------|
| status | string | No | ステータスフィルタ（draft/published/archived） | all |
| category | string | No | カテゴリフィルタ | all |
| targetScope | string | No | 対象範囲フィルタ（all/class/individual） | all |
| keyword | string | No | タイトル・本文の検索キーワード | - |
| page | int | No | ページ番号（1始まり） | 1 |
| pageSize | int | No | 1ページあたりの件数 | 20 |
| sortBy | string | No | ソート項目（createdAt/updatedAt/publishedAt） | createdAt |
| sortOrder | string | No | ソート順序（asc/desc） | desc |

#### レスポンス
**ステータスコード**: 200 OK

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "nurseryId": 1,
        "staffId": 10,
        "staffName": "山田太郎",
        "title": "運動会のお知らせ",
        "content": "来月の運動会について...",
        "contentPreview": "来月の運動会について...",
        "category": "イベント",
        "targetScope": "all",
        "targetClassIds": [],
        "targetChildIds": [],
        "attachments": [
          {
            "fileName": "schedule.pdf",
            "fileUrl": "https://storage.../schedule.pdf",
            "fileSize": 102400,
            "mimeType": "application/pdf"
          }
        ],
        "status": "published",
        "priority": "important",
        "allowComments": true,
        "publishedAt": "2025-10-08T09:00:00Z",
        "scheduledAt": null,
        "createdAt": "2025-10-07T15:30:00Z",
        "updatedAt": "2025-10-08T09:00:00Z",
        "readCount": 25,
        "commentCount": 3
      }
    ],
    "pagination": {
      "currentPage": 1,
      "pageSize": 20,
      "totalItems": 45,
      "totalPages": 3,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  }
}
```

#### エラーレスポンス
**ステータスコード**: 401 Unauthorized
```json
{
  "success": false,
  "error": "認証が必要です"
}
```

**ステータスコード**: 403 Forbidden
```json
{
  "success": false,
  "error": "アクセス権限がありません"
}
```

---

### 3.2 お知らせ詳細取得

#### エンドポイント
```
GET /api/Announcements/{id}
```

#### 説明
指定したIDのお知らせの詳細情報を取得する。

#### パスパラメータ
| パラメータ | 型 | 必須 | 説明 |
|----------|---|------|------|
| id | int | Yes | お知らせID |

#### リクエストヘッダー
```
Authorization: Bearer {jwt_token}
```

#### レスポンス
**ステータスコード**: 200 OK

```json
{
  "success": true,
  "data": {
    "id": 1,
    "nurseryId": 1,
    "staffId": 10,
    "staffName": "山田太郎",
    "title": "運動会のお知らせ",
    "content": "来月の運動会について詳細な内容...",
    "category": "イベント",
    "targetScope": "all",
    "targetClasses": [],
    "targetChildren": [],
    "attachments": [
      {
        "fileName": "schedule.pdf",
        "fileUrl": "https://storage.../schedule.pdf",
        "fileSize": 102400,
        "mimeType": "application/pdf"
      }
    ],
    "status": "published",
    "priority": "important",
    "allowComments": true,
    "publishedAt": "2025-10-08T09:00:00Z",
    "scheduledAt": null,
    "createdAt": "2025-10-07T15:30:00Z",
    "updatedAt": "2025-10-08T09:00:00Z",
    "readCount": 25,
    "comments": [
      {
        "id": 1,
        "parentName": "佐藤花子",
        "content": "楽しみにしています！",
        "createdAt": "2025-10-08T10:00:00Z"
      }
    ]
  }
}
```

#### エラーレスポンス
**ステータスコード**: 404 Not Found
```json
{
  "success": false,
  "error": "お知らせが見つかりません"
}
```

---

### 3.3 お知らせ作成

#### エンドポイント
```
POST /api/Announcements
```

#### 説明
新しいお知らせを作成する。

#### リクエストヘッダー
```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

#### リクエストボディ
```json
{
  "title": "運動会のお知らせ",
  "content": "来月の運動会について...",
  "category": "イベント",
  "targetScope": "all",
  "targetClassIds": [],
  "targetChildIds": [],
  "attachments": [
    {
      "fileName": "schedule.pdf",
      "fileUrl": "https://storage.../schedule.pdf",
      "fileSize": 102400,
      "mimeType": "application/pdf"
    }
  ],
  "status": "draft",
  "priority": "normal",
  "allowComments": true,
  "scheduledAt": null
}
```

#### リクエストボディ詳細
| フィールド | 型 | 必須 | 説明 | 制約 |
|----------|---|------|------|------|
| title | string | Yes | タイトル | 最大100文字 |
| content | string | Yes | 本文 | 最大5000文字 |
| category | string | Yes | カテゴリ | 一般/緊急/イベント/健康/献立/持ち物/その他 |
| targetScope | string | Yes | 対象範囲 | all/class/individual |
| targetClassIds | int[] | No | 対象クラスID配列 | targetScope=classの場合必須 |
| targetChildIds | int[] | No | 対象園児ID配列 | targetScope=individualの場合必須 |
| attachments | object[] | No | 添付ファイル配列 | 最大5個 |
| status | string | Yes | ステータス | draft/published |
| priority | string | No | 重要度 | normal/important/urgent |
| allowComments | bool | No | コメント許可 | デフォルトtrue |
| scheduledAt | datetime | No | 予約公開日時 | ISO 8601形式 |

#### レスポンス
**ステータスコード**: 201 Created

```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "運動会のお知らせ",
    "status": "draft",
    "createdAt": "2025-10-07T15:30:00Z"
  },
  "message": "お知らせを作成しました"
}
```

#### エラーレスポンス
**ステータスコード**: 400 Bad Request
```json
{
  "success": false,
  "error": "入力データが不正です",
  "details": {
    "title": ["タイトルは必須です"],
    "content": ["本文は5000文字以内で入力してください"]
  }
}
```

---

### 3.4 お知らせ更新

#### エンドポイント
```
PUT /api/Announcements/{id}
```

#### 説明
既存のお知らせを更新する。

#### パスパラメータ
| パラメータ | 型 | 必須 | 説明 |
|----------|---|------|------|
| id | int | Yes | お知らせID |

#### リクエストヘッダー
```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

#### リクエストボディ
```json
{
  "title": "運動会のお知らせ（更新）",
  "content": "更新された内容...",
  "category": "イベント",
  "attachments": [
    {
      "fileName": "schedule_updated.pdf",
      "fileUrl": "https://storage.../schedule_updated.pdf",
      "fileSize": 102400,
      "mimeType": "application/pdf"
    }
  ],
  "status": "published",
  "priority": "important",
  "allowComments": true
}
```

#### リクエストボディ詳細
- 公開済みお知らせの場合、`category`、`targetScope`、`targetClassIds`、`targetChildIds`は変更不可
- その他のフィールドは作成時と同様

#### レスポンス
**ステータスコード**: 204 No Content

#### エラーレスポンス
**ステータスコード**: 404 Not Found
```json
{
  "success": false,
  "error": "お知らせが見つかりません"
}
```

**ステータスコード**: 403 Forbidden
```json
{
  "success": false,
  "error": "このお知らせを編集する権限がありません"
}
```

**ステータスコード**: 400 Bad Request
```json
{
  "success": false,
  "error": "公開済みお知らせのカテゴリは変更できません"
}
```

---

### 3.5 お知らせ削除

#### エンドポイント
```
DELETE /api/Announcements/{id}
```

#### 説明
お知らせを削除する（下書きのみ）。

#### パスパラメータ
| パラメータ | 型 | 必須 | 説明 |
|----------|---|------|------|
| id | int | Yes | お知らせID |

#### リクエストヘッダー
```
Authorization: Bearer {jwt_token}
```

#### レスポンス
**ステータスコード**: 204 No Content

#### エラーレスポンス
**ステータスコード**: 400 Bad Request
```json
{
  "success": false,
  "error": "公開済みまたはアーカイブ済みのお知らせは削除できません"
}
```

**ステータスコード**: 403 Forbidden
```json
{
  "success": false,
  "error": "このお知らせを削除する権限がありません"
}
```

---

### 3.6 お知らせ公開

#### エンドポイント
```
POST /api/Announcements/{id}/publish
```

#### 説明
下書き状態のお知らせを公開する。

#### パスパラメータ
| パラメータ | 型 | 必須 | 説明 |
|----------|---|------|------|
| id | int | Yes | お知らせID |

#### リクエストヘッダー
```
Authorization: Bearer {jwt_token}
```

#### レスポンス
**ステータスコード**: 204 No Content

#### エラーレスポンス
**ステータスコード**: 400 Bad Request
```json
{
  "success": false,
  "error": "既に公開済みです"
}
```

---

### 3.7 お知らせアーカイブ

#### エンドポイント
```
POST /api/Announcements/{id}/archive
```

#### 説明
公開済みのお知らせをアーカイブする。

#### パスパラメータ
| パラメータ | 型 | 必須 | 説明 |
|----------|---|------|------|
| id | int | Yes | お知らせID |

#### リクエストヘッダー
```
Authorization: Bearer {jwt_token}
```

#### レスポンス
**ステータスコード**: 204 No Content

#### エラーレスポンス
**ステータスコード**: 400 Bad Request
```json
{
  "success": false,
  "error": "公開済みのお知らせのみアーカイブできます"
}
```

---

## 4. DTO（Data Transfer Object）定義

### 4.1 CreateAnnouncementDto
```csharp
public class CreateAnnouncementDto
{
    [Required]
    [MaxLength(100)]
    public string Title { get; set; }

    [Required]
    [MaxLength(5000)]
    public string Content { get; set; }

    [Required]
    public string Category { get; set; }

    [Required]
    public string TargetScope { get; set; }

    public List<int> TargetClassIds { get; set; } = new();

    public List<int> TargetChildIds { get; set; } = new();

    public List<AttachmentDto> Attachments { get; set; } = new();

    [Required]
    public string Status { get; set; }

    public string Priority { get; set; } = "normal";

    public bool AllowComments { get; set; } = true;

    public DateTime? ScheduledAt { get; set; }
}
```

### 4.2 UpdateAnnouncementDto
```csharp
public class UpdateAnnouncementDto
{
    [Required]
    [MaxLength(100)]
    public string Title { get; set; }

    [Required]
    [MaxLength(5000)]
    public string Content { get; set; }

    public List<AttachmentDto> Attachments { get; set; } = new();

    [Required]
    public string Status { get; set; }

    public string Priority { get; set; }

    public bool AllowComments { get; set; }
}
```

### 4.3 AnnouncementDto
```csharp
public class AnnouncementDto
{
    public int Id { get; set; }
    public int NurseryId { get; set; }
    public int StaffId { get; set; }
    public string StaffName { get; set; }
    public string Title { get; set; }
    public string Content { get; set; }
    public string ContentPreview { get; set; }
    public string Category { get; set; }
    public string TargetScope { get; set; }
    public List<int> TargetClassIds { get; set; }
    public List<int> TargetChildIds { get; set; }
    public List<AttachmentDto> Attachments { get; set; }
    public string Status { get; set; }
    public string Priority { get; set; }
    public bool AllowComments { get; set; }
    public DateTime? PublishedAt { get; set; }
    public DateTime? ScheduledAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public int ReadCount { get; set; }
    public int CommentCount { get; set; }
}
```

### 4.4 AttachmentDto
```csharp
public class AttachmentDto
{
    public string FileName { get; set; }
    public string FileUrl { get; set; }
    public long FileSize { get; set; }
    public string MimeType { get; set; }
}
```

## 5. バリデーションルール

### 5.1 作成時
- `title`: 必須、最大100文字
- `content`: 必須、最大5000文字
- `category`: 必須、許可された値のみ
- `targetScope`: 必須、"all"/"class"/"individual"のいずれか
- `targetClassIds`: targetScope="class"の場合必須、最大50個
- `targetChildIds`: targetScope="individual"の場合必須、最大50個
- `attachments`: 最大5個、各ファイル10MB以内
- `status`: 必須、"draft"/"published"のいずれか

### 5.2 更新時
- 下書き：全項目更新可能
- 公開済み：`title`、`content`、`attachments`、`priority`、`allowComments`のみ更新可能
- アーカイブ：更新不可

### 5.3 削除時
- 下書きのみ削除可能
- 公開済み・アーカイブは削除不可

## 6. エラーコード一覧

| コード | 説明 |
|-------|------|
| 400 | バリデーションエラー、不正なリクエスト |
| 401 | 認証エラー（トークンなし、無効なトークン） |
| 403 | 権限エラー（アクセス権限なし） |
| 404 | リソースが見つからない |
| 409 | 競合エラー（既に公開済みなど） |
| 500 | サーバー内部エラー |

## 7. セキュリティ考慮事項

### 7.1 認証・認可
- 全エンドポイントでJWT認証必須
- スタッフは自分が作成したお知らせのみ操作可能
- 管理者は全てのお知らせを操作可能

### 7.2 入力検証
- 全ての入力値に対してバリデーション実施
- XSS対策：HTMLタグのサニタイズ
- SQL Injection対策：パラメータ化クエリ使用
- ファイルアップロード：MIME Type検証、ウイルススキャン

### 7.3 データ保護
- 論理削除のみ（物理削除は行わない）
- 監査ログの記録（作成・更新・削除の履歴）

## 8. パフォーマンス考慮事項

### 8.1 クエリ最適化
- インデックス活用（staffId、status、createdAt）
- ページネーション必須（1ページ20件まで）
- N+1問題対策（Eager Loading使用）

### 8.2 キャッシュ戦略
- お知らせ一覧：5分間キャッシュ
- お知らせ詳細：10分間キャッシュ
- 更新・削除時にキャッシュ無効化

## 9. テストケース

### 9.1 正常系
- お知らせ一覧取得（フィルタなし）
- お知らせ一覧取得（ステータスフィルタあり）
- お知らせ詳細取得
- お知らせ作成（下書き）
- お知らせ作成（即時公開）
- お知らせ更新（下書き）
- お知らせ更新（公開済み）
- お知らせ削除（下書き）
- お知らせ公開
- お知らせアーカイブ

### 9.2 異常系
- 認証なしでアクセス
- 他人のお知らせを編集
- 公開済みお知らせのカテゴリ変更
- 公開済みお知らせの削除
- 不正なバリデーション入力
- 存在しないIDでアクセス

## 10. 実装時の注意事項

- AutoMapperを使用してEntity↔DTO変換
- Entity Frameworkのトラッキング機能を適切に使用
- 非同期処理（async/await）を活用
- ログ出力（Info、Warning、Error）
- 例外ハンドリング（グローバルエラーハンドラー）

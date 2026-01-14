# API設計仕様書 - 保育園保護者向けモバイルアプリ

## 1. API設計概要

### 1.1 設計原則
- **RESTful設計**: HTTP メソッドとステータスコードの適切な使用
- **一貫性**: 命名規則、レスポンス形式、エラーハンドリングの統一
- **セキュリティ**: JWT認証、レート制限、入力検証の実装
- **バージョン管理**: URL パスでのバージョン管理 (/api/v1/)
- **ドキュメント**: OpenAPI (Swagger) 仕様による自動ドキュメント生成

### 1.2 基本設定
- **ベースURL**: `https://api.nursery-app.com/api/v1`
- **認証方式**: Bearer Token (JWT)
- **Content-Type**: `application/json`
- **文字エンコーディング**: UTF-8
- **タイムゾーン**: Asia/Tokyo (JST)

### 1.3 レスポンス形式標準
```json
{
  "success": true,
  "data": {
    // 実際のデータ
  },
  "message": "処理が正常に完了しました",
  "timestamp": "2025-01-09T10:30:00+09:00",
  "requestId": "uuid-request-id"
}
```

### 1.4 エラーレスポンス形式
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "入力データに問題があります",
    "details": [
      {
        "field": "phoneNumber",
        "message": "電話番号の形式が正しくありません"
      }
    ]
  },
  "timestamp": "2025-01-09T10:30:00+09:00",
  "requestId": "uuid-request-id"
}
```

## 2. 認証・認可API

### 2.1 SMS認証

#### 2.1.1 SMS認証コード送信
```http
POST /auth/send-sms
Content-Type: application/json

{
  "phoneNumber": "+81-90-1234-5678"
}
```

**レスポンス**
```json
{
  "success": true,
  "data": {
    "message": "認証コードを送信しました",
    "expiresIn": 300,
    "retryAfter": 60
  }
}
```

**エラーレスポンス**
```json
{
  "success": false,
  "error": {
    "code": "PHONE_NOT_REGISTERED",
    "message": "この電話番号は登録されていません。保育園にお問い合わせください。"
  }
}
```

#### 2.1.2 SMS認証コード確認
```http
POST /auth/verify-sms
Content-Type: application/json

{
  "phoneNumber": "+81-90-1234-5678",
  "authCode": "123456"
}
```

**レスポンス (保護者の場合)**
```json
{
  "success": true,
  "data": {
    "accessToken": "jwt-access-token",
    "refreshToken": "jwt-refresh-token",
    "expiresIn": 3600,
    "user": {
      "id": "parent-uuid",
      "phoneNumber": "+81-90-1234-5678",
      "name": "田中太郎",
      "role": "Parent",
      "isVerified": true,
      "parent": {
        "id": "1",
        "name": "田中太郎"
      }
    }
  }
}
```

**レスポンス (スタッフの場合)**
```json
{
  "success": true,
  "data": {
    "accessToken": "jwt-access-token",
    "refreshToken": "jwt-refresh-token",
    "expiresIn": 3600,
    "user": {
      "id": "staff-uuid",
      "phoneNumber": "+81-90-5678-1234",
      "name": "山田花子",
      "role": "Staff",
      "isVerified": true,
      "staff": {
        "id": "123",
        "nurseryId": 1,
        "staffId": 123,
        "name": "山田花子",
        "role": "Teacher",
        "classAssignments": [
          {
            "classId": "sakura",
            "className": "さくら組",
            "assignmentRole": "MainTeacher"
          },
          {
            "classId": "himawari",
            "className": "ひまわり組",
            "assignmentRole": "AssistantTeacher"
          }
        ]
      }
    }
  }
}
```

#### 2.1.3 トークン更新
```http
POST /auth/refresh
Authorization: Bearer {refresh-token}
Content-Type: application/json

{
  "refreshToken": "jwt-refresh-token"
}
```

#### 2.1.4 ログアウト
```http
POST /auth/logout
Authorization: Bearer {access-token}
```

## 3. ユーザー管理API

### 3.1 プロフィール管理

#### 3.1.1 プロフィール取得
```http
GET /users/profile
Authorization: Bearer {access-token}
```

**レスポンス**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "firstName": "太郎",
    "lastName": "田中",
    "email": "tanaka@example.com",
    "phoneNumber": "+81-90-1234-5678",
    "address": "東京都渋谷区...",
    "emergencyContact": "080-1234-5678",
    "children": [
      {
        "id": 1,
        "firstName": "花子",
        "lastName": "田中",
        "dateOfBirth": "2020-04-15",
        "nursery": {
          "id": 1,
          "name": "さくら保育園"
        },
        "class": {
          "id": "sakura-2024",
          "name": "さくら組"
        },
        "relationship": "Father"
      }
    ]
  }
}
```

#### 3.1.2 プロフィール更新
```http
PUT /users/profile
Authorization: Bearer {access-token}
Content-Type: application/json

{
  "firstName": "太郎",
  "lastName": "田中",
  "email": "tanaka@example.com",
  "address": "東京都渋谷区新宿1-1-1",
  "emergencyContact": "080-1234-5678"
}
```

### 3.2 家族登録

#### 3.2.1 家族登録
```http
POST /users/register-family
Authorization: Bearer {access-token}
Content-Type: application/json

{
  "phoneNumber": "+81-80-9876-5432",
  "relationshipType": "mother"
}
```

**レスポンス**
```json
{
  "success": true,
  "data": {
    "registrationId": 123,
    "registrationCode": "REG-ABC123DEF456",
    "expiresAt": "2025-01-16T10:30:00+09:00",
    "message": "登録しました"
  }
}
```

#### 3.2.2 家族一覧取得
```http
GET /users/family-members?status=pending
Authorization: Bearer {access-token}
```

#### 3.2.3 登録認証
```http
POST /users/registrations/{registrationCode}/verify
Authorization: Bearer {access-token}
```

#### 3.2.4 家族メンバー一覧
```http
GET /users/family-members
Authorization: Bearer {access-token}
```

**レスポンス**
```json
{
  "success": true,
  "data": {
    "familyMembers": [
      {
        "id": 1,
        "firstName": "太郎",
        "lastName": "田中",
        "relationshipType": "Father",
        "isPrimaryContact": true,
        "permissions": {
          "canViewReports": true,
          "canViewPhotos": true,
          "canDownloadPhotos": true,
          "canSubmitAbsence": true,
          "canReceiveNotifications": true,
          "canManageFamily": true
        }
      },
      {
        "id": 2,
        "firstName": "美咲",
        "lastName": "田中",
        "relationshipType": "Mother",
        "isPrimaryContact": false,
        "permissions": {
          "canViewReports": true,
          "canViewPhotos": true,
          "canDownloadPhotos": false,
          "canSubmitAbsence": false,
          "canReceiveNotifications": true,
          "canManageFamily": false
        }
      }
    ]
  }
}
```

## 4. 園児一覧・CRUD API

### 4.1 園児管理

#### 4.1.1 園児一覧取得
```http
GET /children
Authorization: Bearer {access-token}
```

**レスポンス**
```json
{
  "success": true,
  "data": {
    "children": [
      {
        "id": 1,
        "name": "田中 花音",
        "class": "ばら組",
        "isActive": true
      },
      {
        "id": 2,
        "name": "佐藤 陽太",
        "class": "すみれ組",
        "isActive": true
      }
    ]
  }
}
```

#### 4.1.2 園児詳細取得
```http
GET /children/{childId}
Authorization: Bearer {access-token}
```

**レスポンス**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "田中 花音",
    "class": "ばら組",
    "isActive": true,
    "contactHistory": [
      {
        "id": "contact-123",
        "type": "absence",
        "submittedAt": "2025-01-09T10:30:00+09:00",
        "targetDate": "2025-01-15",
        "reason": "風邪のため",
        "status": "acknowledged",
        "staffResponse": "お大事になさってください"
      }
    ]
  }
}
```

## 5. 欠席・遅刻・お迎え連絡API

### 5.1 連絡管理

#### 5.1.1 連絡提出
```http
POST /contacts/notification
Authorization: Bearer {access-token}
Content-Type: application/json

{
  "childId": 1,
  "contactType": "absence",
  "targetDate": "2025-01-15",
  "reason": "風邪のため休ませていただきます",
  "additionalNotes": "熱が下がったら登園します"
}
```

**レスポンス**
```json
{
  "success": true,
  "data": {
    "contactId": "contact-456",
    "status": "submitted",
    "submittedAt": "2025-01-09T10:30:00+09:00",
    "message": "欠席連絡を提出しました"
  }
}
```

#### 5.1.2 遅刻連絡提出
```http
POST /contacts/notification
Authorization: Bearer {access-token}
Content-Type: application/json

{
  "childId": 1,
  "contactType": "tardiness",
  "targetDate": "2025-01-15",
  "reason": "病院受診のため",
  "expectedArrivalTime": "10:30",
  "additionalNotes": "10時30分頃に登園予定です"
}
```

#### 5.1.3 お迎え連絡提出
```http
POST /contacts/notification
Authorization: Bearer {access-token}
Content-Type: application/json

{
  "childId": 1,
  "contactType": "pickup",
  "targetDate": "2025-01-15",
  "reason": "家族の用事のため早めのお迎え",
  "pickupPerson": "田中 太郎（父）",
  "pickupTime": "15:30",
  "additionalNotes": "通常より30分早くお迎えに伊ります"
}
```

#### 5.1.4 連絡履歴取得
```http
GET /contacts/history/{childId}?contactType=all&dateFrom=2025-01-01&dateTo=2025-01-31&limit=20&offset=0
Authorization: Bearer {access-token}
```

**レスポンス**
```json
{
  "success": true,
  "data": {
    "contactHistory": [
      {
        "id": "contact-456",
        "childId": 1,
        "childName": "田中 花音",
        "type": "absence",
        "targetDate": "2025-01-15",
        "reason": "風邪のため休ませていただきます",
        "additionalNotes": "熱が下がったら登園します",
        "status": "acknowledged",
        "staffResponse": "お大事になさってください。回復をお待ちしています。",
        "submittedAt": "2025-01-09T10:30:00+09:00",
        "acknowledgedAt": "2025-01-09T11:00:00+09:00"
      },
      {
        "id": "contact-789",
        "childId": 1,
        "childName": "田中 花音",
        "type": "pickup",
        "targetDate": "2025-01-12",
        "reason": "家族の用事のため早めのお迎え",
        "pickupPerson": "田中 太郎（父）",
        "pickupTime": "15:30",
        "status": "acknowledged",
        "staffResponse": "承知いたしました。お気をつけてお越しください。",
        "submittedAt": "2025-01-11T14:30:00+09:00",
        "acknowledgedAt": "2025-01-11T14:45:00+09:00"
      }
    ],
    "totalCount": 25,
    "hasMore": true
  }
}
```

#### 5.1.5 連絡編集
```http
PUT /contacts/{contactId}
Authorization: Bearer {access-token}
Content-Type: application/json

{
  "reason": "家族旅行のため",
  "additionalNotes": "予定より遅くなります"
}
```

#### 5.1.6 連絡キャンセル
```http
DELETE /contacts/{contactId}
Authorization: Bearer {access-token}
```

#### 5.1.7 連絡状態取得
```http
GET /contacts/{contactId}/status
Authorization: Bearer {access-token}
```

**レスポンス**
```json
{
  "success": true,
  "data": {
    "contactId": "contact-456",
    "status": "acknowledged",
    "submittedAt": "2025-01-09T10:30:00+09:00",
    "acknowledgedAt": "2025-01-09T11:00:00+09:00",
    "staffResponse": "お大事になさってください"
  }
}
```

## 6. カレンダー・イベントAPI

### 6.1 イベント管理

#### 6.1.1 月間カレンダー取得（保護者用）
**注**: 保護者用カレンダーAPIは、保護者に紐づく園児の学年・クラスに基づいて**サーバーサイドで自動的に権限フィルタリング**を実施します。

```http
GET /calendar/{year}/{month}
Authorization: Bearer {access-token}
Query Parameters:
  - category: string (optional, フィルタ用: general_announcement|general_event|grade_activity|class_activity|nursery_holiday)
```

**権限フィルタリング仕様**
- サーバーサイドで自動的に権限チェックを実施（クライアント側は権限を意識しない）
- 保護者に紐づく全園児の学年・クラスに基づいて自動フィルタリング
- 表示カテゴリ:
  - ✅ 全体お知らせ・全体行事・園休日: すべての保護者
  - 🔒 学年活動: 紐づく園児の学年のみ
  - 🔒 クラス活動: 紐づく園児のクラスのみ

**複数園児の例:**
- 保護者Aに園児2人（年少・さくら組、年長・ひまわり組）が紐づく場合
- 年少と年長の両方の学年活動が表示される
- さくら組とひまわり組の両方のクラス活動が表示される

**レスポンス**
```json
{
  "success": true,
  "data": {
    "year": 2025,
    "month": 1,
    "events": [
      {
        "id": 789,
        "title": "運動会",
        "description": "年一回の大きな行事です",
        "category": "general_event",
        "startDateTime": "2025-01-20T09:00:00+09:00",
        "endDateTime": "2025-01-20T15:00:00+09:00",
        "isAllDay": false, // true の場合は週表示で「全日」行に表示
        "requiresPreparation": true,
        "preparationInstructions": "体操服と水筒をお持ちください",
        "targetAudience": "all"
      },
      {
        "id": 790,
        "title": "年少遠足",
        "description": "近くの公園へ行きます",
        "category": "grade_activity",
        "startDateTime": "2025-01-25T09:00:00+09:00",
        "endDateTime": "2025-01-25T14:00:00+09:00",
        "isAllDay": false,
        "targetGradeLevel": 1,
        "requiresPreparation": true,
        "preparationInstructions": "お弁当と水筒をお持ちください"
      },
      {
        "id": 791,
        "title": "さくら組誕生日会",
        "description": "1月生まれのお友達をお祝いします",
        "category": "class_activity",
        "startDateTime": "2025-01-30T14:00:00+09:00",
        "endDateTime": "2025-01-30T15:00:00+09:00",
        "isAllDay": false,
        "targetClassId": 5,
        "requiresPreparation": false
      }
    ]
  }
}
```

**サーバーサイド権限フィルタリングロジック**
```csharp
// 保護者に紐づく全園児を取得
var children = await GetChildrenForParent(parentId);
var childClassIds = children.Select(c => c.ClassId).Distinct().ToList();
var childGrades = children.Select(c => c.Class.GradeLevel).Distinct().ToList();

// イベントをフィルタリング
var filteredEvents = allEvents.Where(e =>
    e.Category == "general_announcement" ||
    e.Category == "general_event" ||
    e.Category == "nursery_holiday" ||
    (e.Category == "class_activity" && e.TargetClassId.HasValue && childClassIds.Contains(e.TargetClassId.Value)) ||
    (e.Category == "grade_activity" && e.TargetGradeLevel.HasValue && childGrades.Contains(e.TargetGradeLevel.Value))
).ToList();
```

**例: 保護者に園児2人の場合**
```csharp
// 園児1: 年少(GradeLevel=1)・さくら組(ClassId=5)
// 園児2: 年長(GradeLevel=3)・ひまわり組(ClassId=12)

var childClassIds = [5, 12];
var childGrades = [1, 3];

// フィルタリング結果:
// - 全体お知らせ・全体行事・園休日: すべて表示
// - 年少(1)の学年活動: 表示
// - 年長(3)の学年活動: 表示
// - さくら組(5)のクラス活動: 表示
// - ひまわり組(12)のクラス活動: 表示
// - 年中(2)の学年活動: 非表示
// - ばら組(8)のクラス活動: 非表示

```

#### 6.1.2 イベント詳細取得
```http
GET /calendar/events/{eventId}
Authorization: Bearer {access-token}
```

#### 6.1.3 今後のイベント取得
```http
GET /calendar/upcoming?limit=10&childId=1
Authorization: Bearer {access-token}
```

#### 6.1.4 イベント検索
```http
GET /calendar/search?query=運動会&category=general_event&fromDate=2025-01-01&toDate=2025-12-31
Authorization: Bearer {access-token}
```

## 7. レポート管理API

### 7.1 日次レポート

#### 7.1.1 レポート一覧取得
```http
GET /reports?childId=1&dateFrom=2025-01-15&dateTo=2025-01-16&searchText=食事&limit=20&offset=0
Authorization: Bearer {access-token}
```

**レスポンス**
```json
{
  "success": true,
  "data": {
    "reports": [
      {
        "id": "report-101",
        "childId": "child-1",
        "childName": "田中 花子",
        "reportDate": "2025-01-15",
        "tags": ["活動", "食事"],
        "staffMember": "佐藤 美咲先生",
        "staffPhoto": "/api/placeholder/40/40",
        "content": {
          "details": "朝から笑顔で登園し、お友達と楽しく遊んでいました。給食もよく食べて、お昼寝もぐっすり。午後は外遊びで滑り台を何度も楽しそうに滑っていました。",
          "mood": "happy",
          "participation": "active",
          "mealDetails": {
            "breakfast": {
              "percentage": 90,
              "menu": "ごはん、味噌汁、焼き魚",
              "notes": "お魚が大好きで完食でした"
            },
            "lunch": {
              "percentage": 85,
              "menu": "カレーライス、サラダ",
              "notes": "カレーをおかわりしました"
            },
            "snack": {
              "percentage": 100,
              "menu": "おにぎり、お茶",
              "notes": "美味しそうに食べていました"
            },
            "generalNotes": "今日は食欲旺盛でした"
          },
          "sleepDetails": {
            "napStartTime": "13:00",
            "napEndTime": "15:00",
            "duration": 120,
            "quality": "good",
            "notes": "すぐに眠りについて、ぐっすり眠れました"
          },
          "activityDetails": {
            "activities": ["積木遊び", "外遊び", "お絵かき"],
            "achievements": ["新しい積木の作品を作れました"],
            "socialInteraction": "excellent",
            "notes": "他のお友達とも仲良く遊べました"
          }
        },
        "attachments": [
          {
            "id": "photo-1",
            "type": "photo",
            "url": "/api/placeholder/400/300",
            "thumbnailUrl": "/api/placeholder/150/150",
            "description": "積木で作った作品",
            "fileName": "blocks_creation.jpg",
            "fileSize": 1024000
          }
        ],
        "parentAcknowledged": false,
        "createdAt": "2025-01-15T15:30:00+09:00"
      }
    ]
  }
}
```

#### 7.1.2 レポート詳細取得
```http
GET /reports/{reportId}
Authorization: Bearer {access-token}
```

#### 7.1.3 レポート確認
```http
POST /reports/{reportId}/acknowledge
Authorization: Bearer {access-token}
```

**レスポンス**
```json
{
  "success": true,
  "data": {
    "reportId": "report-101",
    "parentAcknowledged": true,
    "acknowledgedAt": "2025-01-15T18:00:00+09:00"
  }
}
```

#### 7.1.4 レポート返信
```http
POST /reports/{reportId}/reply
Authorization: Bearer {access-token}
Content-Type: application/json

{
  "parentNote": "ありがとうございます。よく食べて安心しました。"
}
```

**レスポンス**
```json
{
  "success": true,
  "data": {
    "reportId": "report-101",
    "parentNote": "ありがとうございます。よく食べて安心しました。",
    "parentAcknowledged": true,
    "acknowledgedAt": "2025-01-15T18:00:00+09:00",
    "updatedAt": "2025-01-15T18:00:00+09:00"
  }
}
```
```http
GET /reports/unread-count?childId=1
Authorization: Bearer {access-token}
```

## 8. 写真管理API

### 8.1 写真ギャラリー

#### 8.1.1 写真一覧取得
```http
GET /photos?childId=1&privacySetting=class&limit=20&offset=0&publishDate=2025-01-15
Authorization: Bearer {access-token}
```

**レスポンス**
```json
{
  "success": true,
  "data": {
    "photos": [
      {
        "id": "12345",
        "url": "/photos/12345",
        "thumbnailUrl": "/photos/thumbnail/12345",
        "fileName": "outdoor_play_20250115.jpg",
        "uploadedAt": "2025-01-15T15:30:00+09:00",
        "publishDate": "2025-01-15",
        "uploadedBy": "佐藤 先生",
        "childrenIds": ["1", "3"],
        "childrenNames": ["田中 太郎", "佐藤 花子"],
        "description": "園庭での自由遊びの様子",
        "privacySetting": "class",
        "viewCount": 15,
        "downloadCount": 3
      }
    ],
    "totalCount": 150,
    "hasMore": true
  }
}
```

#### 8.1.2 写真詳細取得
```http
GET /photos/{photoId}
Authorization: Bearer {access-token}
```

#### 8.1.3 写真ダウンロード
```http
GET /photos/{photoId}/download
Authorization: Bearer {access-token}
```

**レスポンス**: 画像ファイルのバイナリデータ
```http
Content-Type: image/jpeg
Content-Disposition: attachment; filename="outdoor_play_20250115.jpg"
Content-Length: 2048576
```

#### 8.1.4 写真検索
```http
GET /photos/search?query=運動会&privacySetting=school&publishDate=2025-01-01
Authorization: Bearer {access-token}
```

#### 8.1.5 月別アルバム取得
```http
GET /photos/albums/2025/01?childId=1
Authorization: Bearer {access-token}
```

## 9. ダッシュボードAPI

### 9.1 統合データ取得

#### 9.1.1 ダッシュボードデータ取得
```http
GET /dashboard
Authorization: Bearer {access-token}
```

**レスポンス**
```json
{
  "success": true,
  "data": {
    "children": [
      {
        "id": 1,
        "name": "田中 花子",
        "unreadReports": 2,
        "newPhotos": 5,
        "pendingNotifications": 0
      }
    ],
    "upcomingEvents": [
      {
        "id": 789,
        "title": "運動会",
        "startDateTime": "2025-01-20T09:00:00+09:00",
        "category": "general_event"
      }
    ],
    "recentReports": [
      {
        "id": 101,
        "childName": "田中 花子",
        "type": "daily",
        "createdAt": "2025-01-15T15:30:00+09:00",
        "isRead": false
      }
    ],
    "recentPhotos": [
      {
        "id": 12345,
        "childName": "田中 花子",
        "thumbnailUrl": "/photos/thumbnail/12345",
        "activityType": "outdoor",
        "capturedDate": "2025-01-15T10:30:00+09:00"
      }
    ],
    "notifications": [
      {
        "id": 456,
        "type": "absence",
        "status": "acknowledged",
        "updatedAt": "2025-01-09T11:00:00+09:00"
      }
    ]
  }
}
```

## 10. 設定・管理API

### 10.1 通知設定

#### 10.1.1 通知設定取得
```http
GET /settings/notifications
Authorization: Bearer {access-token}
```

**レスポンス**
```json
{
  "success": true,
  "data": {
    "pushNotificationsEnabled": true,
    "reportNotificationsEnabled": true,
    "absenceConfirmationEnabled": true,
    "eventNotificationsEnabled": true,
    "announcementNotificationsEnabled": true,
    "updatedAt": "2025-01-09T10:30:00+09:00"
  }
}
```

#### 10.1.2 通知設定更新
```http
PUT /settings/notifications
Authorization: Bearer {access-token}
Content-Type: application/json

{
  "pushNotificationsEnabled": true,
  "reportNotificationsEnabled": true,
  "absenceConfirmationEnabled": false,
  "eventNotificationsEnabled": true,
  "announcementNotificationsEnabled": true
}
```

#### 10.1.3 デバイストークン更新
```http
PUT /settings/device-token
Authorization: Bearer {access-token}
Content-Type: application/json

{
  "deviceToken": "firebase-device-token",
  "platform": "ios"
}
```

### 10.2 アプリ設定・カスタマイズ設定

#### 10.2.1 アプリ設定取得
```http
GET /settings/app
Authorization: Bearer {access-token}
```

#### 10.2.2 カスタマイズ設定取得
```http
GET /settings/customization/{userId}
Authorization: Bearer {access-token}
```

**レスポンス**:
```json
{
  "customizationId": "custom-001",
  "userId": "user-123",
  "fontSize": "medium",
  "language": "ja",
  "updatedAt": "2025-01-15T10:30:00+09:00"
}
```

#### 10.2.3 フォントサイズ設定更新
```http
PUT /settings/customization/{userId}/font-size
Authorization: Bearer {access-token}
Content-Type: application/json

{
  "fontSize": "large"
}
```

#### 10.2.4 言語設定更新
```http
PUT /settings/customization/{userId}/language
Authorization: Bearer {access-token}
Content-Type: application/json

{
  "language": "en"
}
```

#### 10.2.5 カスタマイズ設定リセット
```http
POST /settings/customization/{userId}/reset
Authorization: Bearer {access-token}
```

## 11. エラーコード一覧

### 11.1 認証関連エラー
| コード | メッセージ | HTTP Status |
|--------|-----------|-------------|
| AUTH_001 | 無効な認証情報です | 401 |
| AUTH_002 | トークンの有効期限が切れています | 401 |
| AUTH_003 | アクセス権限がありません | 403 |
| AUTH_004 | 電話番号が登録されていません | 404 |
| AUTH_005 | SMS認証コードが無効です | 400 |
| AUTH_006 | 認証の試行回数が上限に達しました | 429 |
| AUTH_007 | SMS送信回数が上限に達しました | 429 |

### 11.2 バリデーションエラー
| コード | メッセージ | HTTP Status |
|--------|-----------|-------------|
| VALIDATION_001 | 必須項目が入力されていません | 400 |
| VALIDATION_002 | 入力形式が正しくありません | 400 |
| VALIDATION_003 | 入力値が許可された範囲外です | 400 |
| VALIDATION_004 | ファイルサイズが上限を超えています | 400 |
| VALIDATION_005 | サポートされていないファイル形式です | 400 |

### 11.3 リソースエラー
| コード | メッセージ | HTTP Status |
|--------|-----------|-------------|
| RESOURCE_001 | 指定されたリソースが見つかりません | 404 |
| RESOURCE_002 | リソースへのアクセス権限がありません | 403 |
| RESOURCE_003 | リソースは既に削除されています | 410 |
| RESOURCE_004 | 重複するリソースです | 409 |

### 11.4 システムエラー
| コード | メッセージ | HTTP Status |
|--------|-----------|-------------|
| SYSTEM_001 | 一時的なサーバーエラーが発生しました | 500 |
| SYSTEM_002 | データベース接続エラーです | 503 |
| SYSTEM_003 | 外部サービス接続エラーです | 502 |
| SYSTEM_004 | サーバーがメンテナンス中です | 503 |

## 12. レート制限

### 12.1 制限設定
| エンドポイント | 制限 | 期間 |
|--------------|------|------|
| POST /auth/send-sms | 3回 | 1日 |
| POST /auth/verify-sms | 5回 | 5分 |
| 一般的なAPI | 100回 | 1分 |
| 写真ダウンロード | 50回 | 1分 |
| ファイルアップロード | 20回 | 1分 |

### 12.2 レート制限ヘッダー
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1641547800
X-RateLimit-RetryAfter: 60
```

## 13. お知らせ通知API

### 13.1 お知らせ通知管理

#### 13.1.1 お知らせ通知一覧取得
```http
GET /announcements?limit=20&offset=0&category=all&priority=all
Authorization: Bearer {access-token}
```

**レスポンス**
```json
{
  "success": true,
  "data": {
    "announcements": [
      {
        "announcementId": "announce-123",
        "title": "警報発令に伴う登園判断について",
        "summary": "本日午前7時に大雨警報が発令されました。登園の判断について...",
        "content": "保護者の皆様へ\n\n本日午前7時に大雨警報が発令されました。お子様の安全を最優先に考え、以下の対応をお願いいたします...",
        "category": "emergency",
        "priority": "high",
        "targetAudience": "all",
        "createdBy": "園長",
        "createdAt": "2025-01-09T07:15:00+09:00",
        "expiresAt": "2025-01-09T18:00:00+09:00",
        "isRead": false
      },
      {
        "announcementId": "announce-124",
        "title": "運動会準備のお手伝いのお願い",
        "summary": "来月の運動会に向けて、保護者の皆様にご協力をお願いします...",
        "content": "運動会準備について...",
        "category": "cooperation",
        "priority": "normal",
        "targetAudience": "all",
        "createdBy": "田中先生",
        "createdAt": "2025-01-08T15:30:00+09:00",
        "isRead": true,
        "readAt": "2025-01-08T16:00:00+09:00"
      }
    ],
    "totalCount": 25,
    "hasMore": true
  }
}
```

#### 13.1.2 お知らせ詳細取得
```http
GET /announcements/{announcementId}
Authorization: Bearer {access-token}
```

#### 13.1.3 お知らせ既読マーク
```http
PUT /announcements/{announcementId}/read
Authorization: Bearer {access-token}
```

**レスポンス**
```json
{
  "success": true,
  "data": {
    "announcementId": "announce-123",
    "isRead": true,
    "readAt": "2025-01-09T10:30:00+09:00"
  }
}
```

## 14. お知らせ一覧API

### 14.1 統合お知らせ管理

#### 14.1.1 お知らせ一覧取得
```http
GET /notifications/list
Authorization: Bearer {access-token}
```

**レスポンス**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "type": "announcement",
      "source": "nursery",
      "title": "緊急連絡",
      "summary": "警報発令により本日は休園いたします",
      "detail": "台風による警報発令のため、本日は安全を考慮し休園とさせていただきます。詳細は追ってご連絡いたします。",
      "priority": "high",
      "attachments": [
        {
          "id": "att-001",
          "fileName": "台風対応について.pdf",
          "fileType": "pdf",
          "fileSize": 1024000,
          "fileUrl": "https://storage.nursery-app.com/attachments/att-001",
          "uploadedAt": "2025-01-09T07:10:00+09:00"
        }
      ],
      "createdAt": "2025-01-09T07:15:00+09:00"
    },
    {
      "id": 2,
      "type": "report",
      "source": "nursery",
      "title": "園内レポート",
      "summary": "新しいレポートが投稿されました",
      "createdAt": "2025-01-08T16:30:00+09:00"
    },
    {
      "id": 3,
      "type": "event",
      "source": "nursery",
      "title": "イベント通知",
      "summary": "明日は遠足です",
      "createdAt": "2025-01-08T15:00:00+09:00"
    },
    {
      "id": 4,
      "type": "absence",
      "source": "nursery",
      "title": "欠席・遅刻確認",
      "summary": "明日の出欠確認をお願いします",
      "createdAt": "2025-01-07T15:00:00+09:00"
    },
    {
      "id": 5,
      "type": "announcement",
      "source": "system",
      "title": "アプリメンテナンスのお知らせ",
      "summary": "本日深夜にシステムメンテナンスを実施します",
      "detail": "システムの安定性向上のため、メンテナンスを実施いたします。",
      "priority": "medium",
      "attachments": [
        {
          "id": "att-002",
          "fileName": "メンテナンス詳細.docx",
          "fileType": "docx",
          "fileSize": 512000,
          "fileUrl": "https://storage.nursery-app.com/attachments/att-002",
          "uploadedAt": "2025-01-08T17:55:00+09:00"
        }
      ],
      "createdAt": "2025-01-08T18:00:00+09:00"
    }
  ]
}
```

**フィールド説明**
- `source`: "nursery" (保育園発信) または "system" (システム発信)
- 保育園タブでは `source: "nursery"` の全通知を表示
- システムタブでは `source: "system"` かつ `type: "announcement"` の通知のみを表示

#### 14.1.2 お知らせ詳細取得
```http
GET /notifications/announcement/{id}/detail
Authorization: Bearer {access-token}
```

**レスポンス**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "type": "emergency",
    "source": "nursery",
    "title": "緊急連絡",
    "summary": "警報発令により本日は休園いたします",
    "detail": "台風による警報発令のため、本日は安全を考慮し休園とさせていただきます。\n\n今後の予定については、気象情報を確認の上、明日の朝6時頃にあらためてご連絡いたします。\n\n緊急連絡先：090-1234-5678\n\nご不便をおかけしますが、よろしくお願いいたします。",
    "priority": "high",
    "attachments": [
      {
        "id": "att-001",
        "fileName": "台風対応について.pdf",
        "fileType": "pdf",
        "fileSize": 1024000,
        "fileUrl": "https://storage.nursery-app.com/attachments/att-001",
        "uploadedAt": "2025-01-09T07:10:00+09:00"
      }
    ],
    "createdAt": "2025-01-09T07:15:00+09:00"
  }
}
```

**システムからのお知らせ例**
```json
{
  "success": true,
  "data": {
    "id": 5,
    "type": "general",
    "source": "system",
    "title": "アプリメンテナンスのお知らせ",
    "summary": "本日深夜にシステムメンテナンスを実施します",
    "detail": "システムの安定性向上のため、下記日程でメンテナンスを実施いたします。\n\n【日時】本日 23:00〜翌5:00\n【影響範囲】アプリの全機能が利用できません\n\nご不便をおかけしますが、ご理解のほどお願いいたします。",
    "priority": "medium",
    "attachments": [
      {
        "id": "att-002",
        "fileName": "メンテナンス詳細.docx",
        "fileType": "docx",
        "fileSize": 512000,
        "fileUrl": "https://storage.nursery-app.com/attachments/att-002",
        "uploadedAt": "2025-01-08T17:55:00+09:00"
      }
    ],
    "createdAt": "2025-01-08T18:00:00+09:00"
  }
}
```

## 14.2 添付ファイルAPI

### 14.2.1 添付ファイル一覧取得
```http
GET /attachments/announcement/{announcementId}
Authorization: Bearer {access-token}
```

**レスポンス**
```json
{
  "success": true,
  "data": [
    {
      "id": "att-001",
      "fileName": "台風対応について.pdf",
      "fileType": "pdf",
      "fileSize": 1024000,
      "uploadedAt": "2025-01-09T07:10:00+09:00"
    },
    {
      "id": "att-003",
      "fileName": "園だより.docx",
      "fileType": "docx",
      "fileSize": 756000,
      "uploadedAt": "2025-01-09T07:12:00+09:00"
    }
  ]
}
```

### 14.2.2 添付ファイルダウンロードURL取得
```http
GET /attachments/{attachmentId}/download
Authorization: Bearer {access-token}
```

**レスポンス**
```json
{
  "success": true,
  "data": {
    "attachmentId": "att-001",
    "fileName": "台風対応について.pdf",
    "fileType": "pdf",
    "fileSize": 1024000,
    "downloadUrl": "https://storage.nursery-app.com/attachments/att-001?token=xyz123&expires=1672531200",
    "expiresAt": "2025-01-09T08:15:00+09:00"
  }
}
```

**エラーレスポンス**
```json
{
  "success": false,
  "error": {
    "code": "ATTACHMENT_NOT_FOUND",
    "message": "指定された添付ファイルが見つかりません"
  }
}
```

### 14.2.3 添付ファイルアクセス制御

**権限チェック**
- 保護者は自分の子どもに関連するお知らせの添付ファイルのみアクセス可能
- 認証済みユーザーのみアクセス可能
- ファイルアクセス時にアクセスログを記録

**セキュリティ要件**
- Presigned URLによる一時的なアクセス許可（15分間有効）
- ファイルダウンロード時のユーザー識別とログ記録
- 不正アクセス試行時のアラート機能


## 15. OpenAPI仕様

### 15.1 Swagger設定
```yaml
openapi: 3.0.0
info:
  title: 保育園保護者向けモバイルアプリ API
  description: 保護者と保育園の連絡を支援するAPI
  version: 1.0.0
  contact:
    name: API サポート
    email: api-support@nursery-app.com

servers:
  - url: https://api.nursery-app.com/api/v1
    description: 本番環境
  - url: https://staging-api.nursery-app.com/api/v1
    description: ステージング環境

security:
  - BearerAuth: []

components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
      
  schemas:
    Error:
      type: object
      properties:
        success:
          type: boolean
          example: false
        error:
          type: object
          properties:
            code:
              type: string
              example: "VALIDATION_ERROR"
            message:
              type: string
              example: "入力データに問題があります"
            details:
              type: array
              items:
                type: object
        timestamp:
          type: string
          format: date-time
        requestId:
          type: string
          format: uuid
```

## 16. スタッフ用モバイルアプリAPI

### 16.1 スタッフ認証API

#### 16.1.1 スタッフSMS認証コード送信
```http
POST /staff/auth/send-sms
Content-Type: application/json

{
  "phoneNumber": "+81-90-1234-5678"
}
```

**レスポンス**
```json
{
  "success": true,
  "data": {
    "message": "スタッフ認証コードを送信しました",
    "expiresIn": 300,
    "retryAfter": 60
  }
}
```

#### 16.1.2 スタッフSMS認証コード確認
```http
POST /staff/auth/verify-sms
Content-Type: application/json

{
  "phoneNumber": "+81-90-1234-5678",
  "authCode": "123456"
}
```

**レスポンス**
```json
{
  "success": true,
  "data": {
    "accessToken": "jwt-access-token",
    "refreshToken": "jwt-refresh-token",
    "expiresIn": 3600,
    "staff": {
      "id": "123",
      "nurseryId": 1,
      "staffId": 123,
      "firstName": "花子",
      "lastName": "田中",
      "name": "田中花子",
      "role": "Teacher",
      "classAssignments": [
        {
          "classId": "sakura",
          "className": "さくら組",
          "assignmentRole": "MainTeacher"
        },
        {
          "classId": "himawari",
          "className": "ひまわり組",
          "assignmentRole": "AssistantTeacher"
        }
      ]
    }
  }
}
```

**説明**:
- `classAssignments`: スタッフが担当する全クラスの配列
- `assignmentRole`: `MainTeacher`(主担任) または `AssistantTeacher`(副担任)
- 複数クラス担当の場合、配列に複数の要素が含まれる
- フロントエンドは`classAssignments`を元にクラス選択UIを表示

### 16.2 スタッフクラスコンテキストAPI

#### 16.2.1 担当クラス一覧取得
```http
GET /staff/classes
Authorization: Bearer {access_token}
```

**レスポンス**
```json
{
  "success": true,
  "data": {
    "classes": [
      {
        "classId": "sakura",
        "className": "さくら組",
        "assignmentRole": "MainTeacher",
        "nurseryId": 1
      },
      {
        "classId": "himawari",
        "className": "ひまわり組",
        "assignmentRole": "AssistantTeacher",
        "nurseryId": 1
      }
    ]
  }
}
```

#### 16.2.2 クラスコンテキスト検証
```http
POST /staff/validate-class-access
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "nurseryId": 1,
  "classId": "sakura"
}
```

**レスポンス**
```json
{
  "success": true,
  "data": {
    "hasAccess": true,
    "assignmentRole": "MainTeacher"
  }
}
```

**エラーレスポンス (アクセス権なし)**
```json
{
  "success": false,
  "error": {
    "code": "CLASS_ACCESS_DENIED",
    "message": "このクラスへのアクセス権限がありません"
  }
}
```

### 16.3 連絡通知管理API

#### 16.3.1 未確認通知一覧取得
```http
GET /staff/notifications/pending
Authorization: Bearer {access_token}
X-Class-Context: sakura
```

**リクエストヘッダー**:
- `X-Class-Context`: (オプション) 特定のクラスに絞り込む場合に指定
- 省略時は全担当クラスの通知を返す

**レスポンス**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": 1,
        "contactNotificationId": 123,
        "childName": "太郎 山田",
        "classId": "sakura",
        "className": "さくら組",
        "type": "absence",
        "targetDate": "2025-01-10",
        "reason": "体調不良",
        "submittedAt": "2025-01-09T08:00:00+09:00",
        "priority": "normal"
      }
    ],
    "totalCount": 1
  }
}
```

#### 16.3.2 通知確認・返信
```http
POST /staff/notifications/{notificationId}/acknowledge
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "response": "承知いたしました。お気をつけてください。"
}
```

**レスポンス**
```json
{
  "success": true,
  "data": {
    "message": "通知を確認し、返信を送信しました",
    "acknowledgedAt": "2025-01-09T08:30:00+09:00"
  }
}
```

#### 16.3.3 連絡履歴取得
```http
GET /staff/notifications/history
Authorization: Bearer {access_token}
Query Parameters:
  - startDate: 2025-01-01 (optional)
  - endDate: 2025-01-31 (optional)
  - childId: 123 (optional)
  - type: absence|lateness|pickup (optional)
  - page: 1 (default: 1)
  - limit: 20 (default: 20)
```

### 16.3 レポート作成API

#### 16.3.1 レポート作成
```http
POST /staff/reports
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "childId": 123,
  "reportDate": "2025-01-09",
  "tags": ["活動", "食事"],
  "activityContent": "今日は元気にお絵描きをしました。",
  "mealDetails": {
    "breakfast": {
      "percentage": 80,
      "menu": "パン、牛乳",
      "notes": "完食"
    }
  },
  "healthNotes": "元気に過ごしました",
  "specialNotes": "保護者への特記事項"
}
```

#### 16.3.2 下書き保存
```http
POST /staff/reports/draft
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "childId": 123,
  "reportDate": "2025-01-09",
  "activityContent": "途中まで記録..."
}
```

#### 16.3.3 レポートテンプレート取得
```http
GET /staff/reports/templates
Authorization: Bearer {access_token}
```

#### 16.3.4 一括レポート作成
```http
POST /staff/reports/bulk
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "childIds": [123, 124, 125],
  "reportDate": "2025-01-09",
  "tags": ["活動"],
  "activityContent": "みんなで楽しく遊びました"
}
```

### 16.4 写真アップロードAPI

#### 16.4.1 写真アップロード（一括）
```http
POST /staff/photos/upload
Authorization: Bearer {access_token}
Content-Type: multipart/form-data

{
  "photos": [
    {
      "file": file1,
      "description": "外遊びの様子",
      "visibility": {
        "scope": "class",
        "gradeId": null,
        "classId": "class-123",
        "childId": null
      },
      "order": 1
    },
    {
      "file": file2,
      "description": "給食の時間",
      "visibility": {
        "scope": "grade",
        "gradeId": "grade-456",
        "classId": null,
        "childId": null
      },
      "order": 2
    }
  ],
  "reportId": "report-789",
  "publishDate": "2025-01-09"
}
```

**レスポンス**
```json
{
  "success": true,
  "data": {
    "uploadResults": [
      {
        "photoId": "photo-456",
        "fileName": "outdoor_play.jpg",
        "originalFileName": "IMG_20250109_140532.jpg",
        "fileSize": 2048576,
        "mimeType": "image/jpeg",
        "width": 1920,
        "height": 1080,
        "thumbnailUrl": "https://storage/thumbnails/photo-456.jpg",
        "url": "https://storage/photos/photo-456.jpg",
        "description": "外遊びの様子",
        "visibility": {
          "scope": "class",
          "gradeId": null,
          "classId": "class-123",
          "childId": null
        },
        "order": 1,
        "uploadedAt": "2025-01-09T14:30:00+09:00",
        "status": "success"
      }
    ],
    "totalUploaded": 2,
    "totalFailed": 0,
    "failedFiles": []
  }
}
```

#### 16.4.2 写真情報更新
```http
PUT /staff/photos/{photoId}
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "description": "更新された説明文",
  "visibility": {
    "scope": "individual",
    "gradeId": null,
    "classId": null,
    "childId": "child-789"
  },
  "order": 3
}
```

#### 16.4.3 写真削除
```http
DELETE /staff/photos/{photoId}
Authorization: Bearer {access_token}
```

**レスポンス**
```json
{
  "success": true,
  "data": {
    "photoId": "photo-456",
    "deletedAt": "2025-01-09T15:00:00+09:00",
    "message": "写真が正常に削除されました"
  }
}
```

#### 16.4.4 写真公開範囲一括変更
```http
PUT /staff/photos/bulk-visibility
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "photoIds": ["photo-456", "photo-457", "photo-458"],
  "visibility": {
    "scope": "grade",
    "gradeId": "grade-456",
    "classId": null,
    "childId": null
  }
}
```

#### 16.4.5 写真順序変更
```http
PUT /staff/photos/reorder
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "reportId": "report-789",
  "photoOrders": [
    {
      "photoId": "photo-456",
      "order": 3
    },
    {
      "photoId": "photo-457",
      "order": 1
    },
    {
      "photoId": "photo-458",
      "order": 2
    }
  ]
}
```

### 16.5 カレンダー閲覧API

#### 16.5.1 スタッフカレンダー取得
**注**: スタッフ用カレンダーAPIは**保護者用カレンダーAPIと同じレスポンス形式**を返します。フロントエンドでは同じCalendarコンポーネントを使用できます。

```http
GET /staff/calendar/{year}/{month}
Authorization: Bearer {access_token}
Query Parameters:
  - category: string (optional, フィルタ用: general_announcement|general_event|grade_activity|class_activity|nursery_holiday)
```

**権限フィルタリング仕様**
- サーバーサイドで自動的に権限チェックを実施（クライアント側は権限を意識しない）
- スタッフの受け持ちクラス・学年に基づいて自動フィルタリング
- 表示カテゴリ:
  - ✅ 全体お知らせ・全体行事・園休日: すべてのスタッフ
  - 🔒 学年活動: 受け持ち学年のみ
  - 🔒 クラス活動: 受け持ちクラスのみ

**レスポンス (保護者用APIと同一形式)**
```json
{
  "success": true,
  "data": {
    "events": [
      {
        "id": 1,
        "title": "避難訓練",
        "description": "火災避難訓練を実施",
        "category": "general_event",
        "startDateTime": "2025-01-15T10:00:00+09:00",
        "endDateTime": "2025-01-15T11:00:00+09:00",
        "isAllDay": false,
        "recurrencePattern": "none",
        "targetAudience": "all",
        "preparationRequired": true,
        "preparationInstructions": "避難経路を確認"
      }
    ]
  }
}
```

**実装方針**
- 保護者用 `/calendar/{year}/{month}` とスタッフ用 `/staff/calendar/{year}/{month}` は**レスポンス形式が完全に同一**
- フロントエンドでは同じCalendarコンポーネントを使用し、APIエンドポイントのみpropsで切り替え
- 権限フィルタリングはサーバーサイドで完結

**サーバーサイド権限フィルタリングロジック**
```csharp
var staffAssignments = await GetStaffClassAssignments(staffId);
var assignedClassIds = staffAssignments.Select(a => a.ClassId).ToList();
var assignedGrades = staffAssignments.Select(a => a.GradeLevel).Distinct().ToList();

var filteredEvents = allEvents.Where(e =>
    e.Category == "general_announcement" ||
    e.Category == "general_event" ||
    e.Category == "nursery_holiday" ||
    (e.Category == "class_activity" && e.TargetClassId.HasValue && assignedClassIds.Contains(e.TargetClassId.Value)) ||
    (e.Category == "grade_activity" && e.TargetGradeLevel.HasValue && assignedGrades.Contains(e.TargetGradeLevel.Value))
).ToList();
```

### 16.6 クラスお知らせAPI

#### 16.6.1 お知らせ作成
```http
POST /staff/announcements
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "title": "明日の持ち物について",
  "content": "明日は外遊びがありますので、帽子を忘れずにお持ちください。",
  "priority": "Important",
  "target": "Class"
}
```

#### 16.6.2 お知らせ予約送信
```http
POST /staff/announcements/schedule
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "title": "週末のお知らせ",
  "content": "来週の予定をお知らせします。",
  "priority": "Normal",
  "target": "Class",
  "scheduledAt": "2025-01-12T08:00:00+09:00"
}
```

#### 16.6.3 送信済みお知らせ取得
```http
GET /staff/announcements/sent
Authorization: Bearer {access_token}
Query Parameters:
  - page: 1 (default: 1)
  - limit: 20 (default: 20)
```

### 16.7 担当クラス情報API

#### 16.7.1 担当クラス園児一覧
```http
GET /staff/class/children
Authorization: Bearer {access_token}
```

**レスポンス**
```json
{
  "success": true,
  "data": {
    "classInfo": {
      "id": "sakura-2024",
      "name": "さくら組",
      "ageGroup": "4-5歳"
    },
    "children": [
      {
        "id": 123,
        "firstName": "太郎",
        "lastName": "山田",
        "dateOfBirth": "2020-04-01",
        "enrollmentDate": "2024-04-01",
        "isActive": true
      }
    ]
  }
}
```

### 16.8 スタッフ用エラーコード

**スタッフ認証エラー**
- `STAFF_NOT_FOUND`: 指定された電話番号のスタッフが見つかりません
- `STAFF_INACTIVE`: スタッフアカウントが無効です
- `INSUFFICIENT_STAFF_PERMISSION`: スタッフ権限が不足しています

**クラス関連エラー**
- `CLASS_ACCESS_DENIED`: 担当外のクラスにはアクセスできません
- `CHILD_NOT_IN_CLASS`: 指定された園児はこのクラスに所属していません

**レポート関連エラー**
- `REPORT_ALREADY_EXISTS`: 指定された日付のレポートは既に存在します
- `INVALID_REPORT_DATE`: 無効なレポート日付です
- `TEMPLATE_NOT_FOUND`: レポートテンプレートが見つかりません

このAPI設計仕様書により、保護者向けとスタッフ向けの両方の機能を網羅した、安全で使いやすいAPIを構築できます。各エンドポイントは適切な認証・認可、バリデーション、エラーハンドリングを実装し、スケーラブルで保守性の高いシステムを実現します。

## 10. レポート管理API (Staff Report Management API)

### 10.1 スタッフレポート一覧取得

**エンドポイント**: `GET /api/DailyReports/staff/{staffId}`

**説明**: スタッフが作成した日報一覧を取得します

**認証**: 必須（JWT Bearer Token）

**パラメータ**:
- `staffId` (path): スタッフID

**クエリパラメータ**:
- `status` (optional): フィルター条件 (`draft` | `published` | 空=全て)
- `startDate` (optional): 開始日付 (ISO 8601形式)
- `endDate` (optional): 終了日付 (ISO 8601形式)

**レスポンス例**:
```json
[
  {
    "id": 1,
    "childId": 8,
    "childName": "田中花子",
    "staffId": 4,
    "staffName": "高橋健一",
    "reportDate": "2025-10-06T00:00:00Z",
    "reportKind": "activity,meal",
    "title": "田中花子の日報",
    "content": "元気に遊んでいました。",
    "photos": [],
    "status": "draft",
    "createdAt": "2025-10-06T12:40:33Z",
    "updatedAt": null,
    "publishedAt": null
  }
]
```

**ステータスコード**:
- `200 OK`: 成功
- `401 Unauthorized`: 認証エラー
- `403 Forbidden`: 他のスタッフのレポートにアクセス不可

### 10.2 レポート詳細取得

**エンドポイント**: `GET /api/DailyReports/{id}`

**説明**: 特定のレポート詳細を取得します（編集用）

**認証**: 必須（JWT Bearer Token）

**パラメータ**:
- `id` (path): レポートID

**レスポンス例**:
```json
{
  "id": 1,
  "childId": 8,
  "childName": "田中花子",
  "staffId": 4,
  "staffName": "高橋健一",
  "reportDate": "2025-10-06T00:00:00Z",
  "reportKind": "activity,meal",
  "title": "田中花子の日報",
  "content": "元気に遊んでいました。食事も完食しました。",
  "photos": ["https://storage.example.com/photo1.jpg"],
  "status": "draft",
  "createdAt": "2025-10-06T12:40:33Z",
  "updatedAt": null,
  "publishedAt": null
}
```

**ステータスコード**:
- `200 OK`: 成功
- `404 Not Found`: レポートが見つかりません
- `403 Forbidden`: アクセス権限がありません

### 10.3 レポート更新

**エンドポイント**: `PUT /api/DailyReports/{id}`

**説明**: 既存レポートを更新します

**認証**: 必須（JWT Bearer Token）

**パラメータ**:
- `id` (path): レポートID

**リクエストボディ**:
```json
{
  "reportDate": "2025-10-06T00:00:00Z",
  "reportKind": "activity,meal,sleep",
  "title": "田中花子の日報（更新）",
  "content": "元気に遊んでいました。食事も完食しました。午睡は1時間でした。",
  "photos": ["https://storage.example.com/photo1.jpg"]
}
```

**レスポンス**: `204 No Content`

**ステータスコード**:
- `204 No Content`: 更新成功
- `400 Bad Request`: 入力データエラー
- `404 Not Found`: レポートが見つかりません
- `403 Forbidden`: 他のスタッフのレポートは編集不可

### 10.4 レポート削除

**エンドポイント**: `DELETE /api/DailyReports/{id}`

**説明**: 下書きレポートを削除します（公開済みは削除不可）

**認証**: 必須（JWT Bearer Token）

**パラメータ**:
- `id` (path): レポートID

**レスポンス**: `204 No Content`

**ステータスコード**:
- `204 No Content`: 削除成功
- `404 Not Found`: レポートが見つかりません
- `400 Bad Request`: 公開済みレポートは削除できません
- `403 Forbidden`: 他のスタッフのレポートは削除不可

**エラーレスポンス例**:
```json
{
  "success": false,
  "error": {
    "code": "PUBLISHED_REPORT_DELETE_FORBIDDEN",
    "message": "公開済みのレポートは削除できません。保護者が既に閲覧している可能性があります。"
  }
}
```

### 10.5 レポート公開

**エンドポイント**: `POST /api/DailyReports/{id}/publish`

**説明**: 下書きレポートを公開します

**認証**: 必須（JWT Bearer Token）

**パラメータ**:
- `id` (path): レポートID

**レスポンス**: `204 No Content`

**ステータスコード**:
- `204 No Content`: 公開成功
- `404 Not Found`: レポートが見つかりません
- `400 Bad Request`: 既に公開済みです
- `403 Forbidden`: 他のスタッフのレポートは公開不可

### 10.6 ビジネスルール

- **削除制限**: `status: "published"` のレポートは削除不可（保護者が閲覧済みの可能性があるため）
- **編集権限**: 作成者（StaffId一致）のみが編集・削除可能
- **公開の不可逆性**: 一度公開したレポートは下書きに戻せない
- **通知**: レポート公開時は保護者にプッシュ通知を送信
- **写真削除**: レポート削除時は関連する写真も削除される

# 保育園管理デスクトップWebアプリ API設計書

## 概要

本ドキュメントでは、保育園管理デスクトップWebアプリケーションのREST API仕様を定義します。すべてのAPIエンドポイントはASP.NET Core 8 Web APIで実装され、既存のモバイルアプリバックエンドと同じデータベース・インフラストラクチャを共有します。

### 基本情報

- **Base URL**: `https://api.kindergarten.example.com/api/desktop`
- **認証方式**: JWT Bearer Token
- **Content-Type**: `application/json`
- **文字エンコーディング**: UTF-8
- **日付形式**: ISO 8601 (YYYY-MM-DDTHH:mm:ss.sssZ)

---

## 1. 認証API

### 1.1 ログイン

デスクトップアプリ専用のログインID・パスワード認証。

**エンドポイント**: `POST /api/desktop/auth/login`

**リクエスト**:
```json
{
  "loginId": "string",      // ログインID (必須)
  "password": "string"      // パスワード (必須)
}
```

**レスポンス (200 OK)**:
```json
{
  "success": true,
  "data": {
    "accessToken": "string",     // JWTアクセストークン (1時間有効)
    "refreshToken": "string",    // リフレッシュトークン (7日間有効)
    "expiresIn": 3600,          // 有効期限 (秒)
    "nursery": {
      "id": 1,
      "name": "さくら保育園",
      "logoUrl": "https://...",
      "currentAcademicYear": 2025
    }
  }
}
```

**エラーレスポンス**:
- `400 Bad Request`: ログインID・パスワードが不正
- `401 Unauthorized`: 認証失敗
- `423 Locked`: アカウントロック中 (ログイン試行回数超過)

**ビジネスルール**:
- ログイン試行回数: 5回まで
- アカウントロック時間: 30分
- パスワードはBCryptでハッシュ化
- 最終ログイン日時を記録

---

### 1.2 リフレッシュトークン

アクセストークン期限切れ時の再発行。

**エンドポイント**: `POST /api/desktop/auth/refresh`

**リクエスト**:
```json
{
  "refreshToken": "string"   // リフレッシュトークン (必須)
}
```

**レスポンス (200 OK)**:
```json
{
  "success": true,
  "data": {
    "accessToken": "string",
    "refreshToken": "string",
    "expiresIn": 3600
  }
}
```

---

### 1.3 ログアウト

**エンドポイント**: `POST /api/desktop/auth/logout`

**ヘッダー**: `Authorization: Bearer {accessToken}`

**レスポンス (200 OK)**:
```json
{
  "success": true,
  "message": "ログアウトしました"
}
```

---

### 1.4 パスワード変更

**エンドポイント**: `PUT /api/desktop/auth/change-password`

**ヘッダー**: `Authorization: Bearer {accessToken}`

**リクエスト**:
```json
{
  "currentPassword": "string",  // 現在のパスワード (必須)
  "newPassword": "string"       // 新しいパスワード (必須、8文字以上)
}
```

**レスポンス (200 OK)**:
```json
{
  "success": true,
  "message": "パスワードを変更しました"
}
```

---

## 2. マスタ管理API

### 2.1 保育園情報管理

#### 2.1.1 保育園情報取得

**エンドポイント**: `GET /api/desktop/nursery`

**ヘッダー**: `Authorization: Bearer {accessToken}`

**レスポンス (200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "さくら保育園",
    "address": "東京都渋谷区...",
    "phoneNumber": "03-1234-5678",
    "email": "info@sakura-hoikuen.jp",
    "principalName": "山田太郎",
    "establishedDate": "2010-04-01",
    "logoUrl": "https://...",
    "loginId": "sakura_admin",
    "currentAcademicYear": 2025,
    "createdAt": "2010-04-01T00:00:00Z",
    "updatedAt": "2025-01-01T12:00:00Z"
  }
}
```

---

#### 2.1.2 保育園情報更新

**エンドポイント**: `PUT /api/desktop/nursery`

**ヘッダー**: `Authorization: Bearer {accessToken}`

**リクエスト**:
```json
{
  "name": "string",             // 保育園名 (任意)
  "address": "string",          // 住所 (任意)
  "phoneNumber": "string",      // 電話番号 (任意)
  "email": "string",            // メール (任意)
  "principalName": "string",    // 園長名 (任意)
  "logoUrl": "string"           // ロゴURL (任意)
}
```

**レスポンス (200 OK)**:
```json
{
  "success": true,
  "message": "保育園情報を更新しました",
  "data": { /* 更新後のデータ */ }
}
```

---

### 2.2 クラス管理

#### 2.2.1 クラス一覧取得

**エンドポイント**: `GET /api/desktop/classes`

**ヘッダー**: `Authorization: Bearer {accessToken}`

**クエリパラメータ**:
- `academicYear` (number, 任意): 年度フィルター (デフォルト: 現在年度)
- `isActive` (boolean, 任意): 有効/無効フィルター

**レスポンス (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "classId": "sakura",
      "name": "さくら組",
      "ageGroupMin": 0,
      "ageGroupMax": 1,
      "maxCapacity": 12,
      "academicYear": 2025,
      "isActive": true,
      "currentEnrollment": 10,
      "createdAt": "2025-04-01T00:00:00Z",
      "updatedAt": "2025-04-01T00:00:00Z"
    }
  ]
}
```

---

#### 2.2.2 クラス作成

**エンドポイント**: `POST /api/desktop/classes`

**ヘッダー**: `Authorization: Bearer {accessToken}`

**リクエスト**:
```json
{
  "classId": "string",         // クラスID (必須、50文字以内)
  "name": "string",            // クラス名 (必須、50文字以内)
  "ageGroupMin": 0,            // 年齢範囲最小 (必須)
  "ageGroupMax": 5,            // 年齢範囲最大 (必須)
  "maxCapacity": 20,           // 定員 (必須)
  "academicYear": 2025         // 年度 (必須)
}
```

**レスポンス (201 Created)**:
```json
{
  "success": true,
  "message": "クラスを作成しました",
  "data": { /* 作成されたクラスデータ */ }
}
```

---

#### 2.2.3 クラス更新

**エンドポイント**: `PUT /api/desktop/classes/{classId}`

**ヘッダー**: `Authorization: Bearer {accessToken}`

**パスパラメータ**:
- `classId` (string): クラスID

**リクエスト**:
```json
{
  "name": "string",            // クラス名 (任意)
  "ageGroupMin": 0,            // 年齢範囲最小 (任意)
  "ageGroupMax": 5,            // 年齢範囲最大 (任意)
  "maxCapacity": 20,           // 定員 (任意)
  "isActive": true             // 有効/無効 (任意)
}
```

**レスポンス (200 OK)**:
```json
{
  "success": true,
  "message": "クラスを更新しました",
  "data": { /* 更新後のクラスデータ */ }
}
```

---

#### 2.2.4 クラス削除

**エンドポイント**: `DELETE /api/desktop/classes/{classId}`

**ヘッダー**: `Authorization: Bearer {accessToken}`

**パスパラメータ**:
- `classId` (string): クラスID

**クエリパラメータ**:
- `academicYear` (number, 必須): 年度

**レスポンス (200 OK)**:
```json
{
  "success": true,
  "message": "クラスを削除しました"
}
```

**ビジネスルール**:
- 園児が所属しているクラスは削除不可
- 論理削除 (IsActive = false)

---

### 2.3 園児管理

#### 2.3.1 園児一覧取得

**エンドポイント**: `GET /api/desktop/children`

**ヘッダー**: `Authorization: Bearer {accessToken}`

**クエリパラメータ**:
- `classId` (string, 任意): クラスフィルター
- `isActive` (boolean, 任意): 在園中/卒園済みフィルター
- `page` (number, 任意): ページ番号 (デフォルト: 1)
- `pageSize` (number, 任意): 1ページあたりの件数 (デフォルト: 50)
- `search` (string, 任意): 園児名検索

**レスポンス (200 OK)**:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "childId": 1,
        "name": "田中花子",
        "dateOfBirth": "2020-05-15",
        "gender": "female",
        "classId": "sakura",
        "className": "さくら組",
        "medicalNotes": "卵アレルギー",
        "specialInstructions": "水分補給頻度高め",
        "isActive": true,
        "graduationDate": null,
        "graduationStatus": null,
        "bloodType": "A",
        "lastAttendanceDate": "2025-10-23",
        "photoUrl": "https://...",
        "createdAt": "2020-04-01T00:00:00Z",
        "updatedAt": "2025-10-23T12:00:00Z"
      }
    ],
    "totalCount": 50,
    "page": 1,
    "pageSize": 50,
    "totalPages": 1
  }
}
```

---

#### 2.3.2 園児詳細取得

**エンドポイント**: `GET /api/desktop/children/{childId}`

**ヘッダー**: `Authorization: Bearer {accessToken}`

**パスパラメータ**:
- `childId` (number): 園児ID

**レスポンス (200 OK)**:
```json
{
  "success": true,
  "data": {
    "childId": 1,
    "name": "田中花子",
    "dateOfBirth": "2020-05-15",
    "gender": "female",
    "classId": "sakura",
    "className": "さくら組",
    "medicalNotes": "卵アレルギー",
    "specialInstructions": "水分補給頻度高め",
    "bloodType": "A",
    "isActive": true,
    "graduationDate": null,
    "graduationStatus": null,
    "withdrawalReason": null,
    "lastAttendanceDate": "2025-10-23",
    "photoUrl": "https://...",
    "parents": [
      {
        "parentId": 1,
        "name": "田中太郎",
        "relationshipType": "Father",
        "phoneNumber": "090-1234-5678",
        "isPrimaryContact": true
      }
    ],
    "createdAt": "2020-04-01T00:00:00Z",
    "updatedAt": "2025-10-23T12:00:00Z"
  }
}
```

---

#### 2.3.3 園児作成

**エンドポイント**: `POST /api/desktop/children`

**ヘッダー**: `Authorization: Bearer {accessToken}`

**リクエスト**:
```json
{
  "name": "string",              // 園児名 (必須、100文字以内)
  "dateOfBirth": "2020-05-15",   // 生年月日 (必須)
  "gender": "male|female",       // 性別 (必須)
  "classId": "string",           // クラスID (任意)
  "medicalNotes": "string",      // 医療メモ (任意、500文字以内)
  "specialInstructions": "string", // 特別指示 (任意、500文字以内)
  "bloodType": "A|B|O|AB",       // 血液型 (任意)
  "photoUrl": "string"           // 写真URL (任意)
}
```

**レスポンス (201 Created)**:
```json
{
  "success": true,
  "message": "園児を登録しました",
  "data": { /* 作成された園児データ */ }
}
```

---

#### 2.3.4 園児更新

**エンドポイント**: `PUT /api/desktop/children/{childId}`

**ヘッダー**: `Authorization: Bearer {accessToken}`

**パスパラメータ**:
- `childId` (number): 園児ID

**リクエスト**: 園児作成と同じ (すべて任意)

**レスポンス (200 OK)**:
```json
{
  "success": true,
  "message": "園児情報を更新しました",
  "data": { /* 更新後の園児データ */ }
}
```

---

#### 2.3.5 園児一括インポート

**エンドポイント**: `POST /api/desktop/children/import`

**ヘッダー**:
- `Authorization: Bearer {accessToken}`
- `Content-Type: multipart/form-data`

**リクエスト**:
- `file`: CSV/Excelファイル (必須)
- `academicYear`: 年度 (必須)

**レスポンス (200 OK)**:
```json
{
  "success": true,
  "message": "園児データをインポートしました",
  "data": {
    "successCount": 45,
    "failCount": 5,
    "errors": [
      {
        "row": 3,
        "reason": "生年月日の形式が不正です"
      }
    ]
  }
}
```

---

### 2.4 スタッフ管理

#### 2.4.1 スタッフ一覧取得

**エンドポイント**: `GET /api/desktop/staff`

**ヘッダー**: `Authorization: Bearer {accessToken}`

**クエリパラメータ**:
- `isActive` (boolean, 任意): 有効/無効フィルター
- `role` (string, 任意): 役職フィルター (Teacher/Admin/Principal/Nurse)
- `page` (number, 任意): ページ番号
- `pageSize` (number, 任意): 1ページあたりの件数

**レスポンス (200 OK)**:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "staffId": 1,
        "name": "鈴木先生",
        "phoneNumber": "090-9876-5432",
        "email": "suzuki@example.com",
        "role": "Teacher",
        "position": "保育士",
        "isActive": true,
        "hireDate": "2015-04-01",
        "terminationDate": null,
        "dateOfBirth": "1985-03-20",
        "classAssignments": [
          {
            "classId": "sakura",
            "className": "さくら組",
            "assignmentRole": "MainTeacher",
            "academicYear": 2025
          }
        ],
        "createdAt": "2015-04-01T00:00:00Z",
        "updatedAt": "2025-04-01T00:00:00Z"
      }
    ],
    "totalCount": 15,
    "page": 1,
    "pageSize": 50,
    "totalPages": 1
  }
}
```

---

#### 2.4.2 スタッフ作成

**エンドポイント**: `POST /api/desktop/staff`

**ヘッダー**: `Authorization: Bearer {accessToken}`

**リクエスト**:
```json
{
  "name": "string",              // 氏名 (必須、50文字以内)
  "phoneNumber": "string",       // 電話番号 (必須、15文字以内)
  "email": "string",             // メール (任意、200文字以内)
  "role": "Teacher|Admin|Principal|Nurse", // 役職 (必須)
  "position": "string",          // 職位 (任意、100文字以内)
  "hireDate": "2015-04-01",      // 入社日 (任意)
  "dateOfBirth": "1985-03-20",   // 生年月日 (任意)
  "address": "string",           // 住所 (任意、200文字以内)
  "emergencyContactName": "string",  // 緊急連絡先名 (任意)
  "emergencyContactPhone": "string", // 緊急連絡先電話 (任意)
  "notes": "string"              // 備考 (任意、500文字以内)
}
```

**レスポンス (201 Created)**:
```json
{
  "success": true,
  "message": "スタッフを登録しました",
  "data": { /* 作成されたスタッフデータ */ }
}
```

---

#### 2.4.3 スタッフ更新

**エンドポイント**: `PUT /api/desktop/staff/{staffId}`

**ヘッダー**: `Authorization: Bearer {accessToken}`

**パスパラメータ**:
- `staffId` (number): スタッフID

**リクエスト**: スタッフ作成と同じ (すべて任意)

**レスポンス (200 OK)**:
```json
{
  "success": true,
  "message": "スタッフ情報を更新しました",
  "data": { /* 更新後のスタッフデータ */ }
}
```

---

#### 2.4.4 クラス割り当て更新

**エンドポイント**: `PUT /api/desktop/staff/{staffId}/class-assignments`

**ヘッダー**: `Authorization: Bearer {accessToken}`

**パスパラメータ**:
- `staffId` (number): スタッフID

**リクエスト**:
```json
{
  "academicYear": 2025,         // 年度 (必須)
  "assignments": [
    {
      "classId": "sakura",
      "assignmentRole": "MainTeacher|AssistantTeacher"
    }
  ]
}
```

**レスポンス (200 OK)**:
```json
{
  "success": true,
  "message": "クラス割り当てを更新しました",
  "data": { /* 更新後の割り当てデータ */ }
}
```

---

### 2.5 保護者管理

#### 2.5.1 保護者一覧取得

**エンドポイント**: `GET /api/desktop/parents`

**ヘッダー**: `Authorization: Bearer {accessToken}`

**クエリパラメータ**:
- `childId` (number, 任意): 園児IDフィルター
- `isActive` (boolean, 任意): 有効/無効フィルター
- `page` (number, 任意): ページ番号
- `pageSize` (number, 任意): 1ページあたりの件数
- `search` (string, 任意): 保護者名・電話番号検索

**レスポンス (200 OK)**:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "parentId": 1,
        "name": "田中太郎",
        "phoneNumber": "090-1234-5678",
        "email": "tanaka@example.com",
        "address": "東京都渋谷区...",
        "isActive": true,
        "children": [
          {
            "childId": 1,
            "childName": "田中花子",
            "relationshipType": "Father",
            "isPrimaryContact": true,
            "isAuthorizedPickup": true,
            "canReceiveReports": true
          }
        ],
        "createdAt": "2020-04-01T00:00:00Z",
        "updatedAt": "2025-10-23T12:00:00Z"
      }
    ],
    "totalCount": 80,
    "page": 1,
    "pageSize": 50,
    "totalPages": 2
  }
}
```

---

#### 2.5.2 保護者作成

**エンドポイント**: `POST /api/desktop/parents`

**ヘッダー**: `Authorization: Bearer {accessToken}`

**リクエスト**:
```json
{
  "name": "string",              // 氏名 (必須、100文字以内)
  "phoneNumber": "string",       // 電話番号 (必須、15文字以内、ユニーク)
  "email": "string",             // メール (任意、200文字以内)
  "address": "string"            // 住所 (任意、500文字以内)
}
```

**レスポンス (201 Created)**:
```json
{
  "success": true,
  "message": "保護者を登録しました",
  "data": { /* 作成された保護者データ */ }
}
```

---

#### 2.5.3 保護者更新

**エンドポイント**: `PUT /api/desktop/parents/{parentId}`

**ヘッダー**: `Authorization: Bearer {accessToken}`

**パスパラメータ**:
- `parentId` (number): 保護者ID

**リクエスト**: 保護者作成と同じ (すべて任意)

**レスポンス (200 OK)**:
```json
{
  "success": true,
  "message": "保護者情報を更新しました",
  "data": { /* 更新後の保護者データ */ }
}
```

---

#### 2.5.4 保護者-園児紐付け更新

**エンドポイント**: `PUT /api/desktop/parents/{parentId}/children`

**ヘッダー**: `Authorization: Bearer {accessToken}`

**パスパラメータ**:
- `parentId` (number): 保護者ID

**リクエスト**:
```json
{
  "children": [
    {
      "childId": 1,
      "relationshipType": "Father|Mother|Grandfather|Grandmother|Guardian",
      "isPrimaryContact": true,
      "isAuthorizedPickup": true,
      "canReceiveReports": true
    }
  ]
}
```

**レスポンス (200 OK)**:
```json
{
  "success": true,
  "message": "園児との紐付けを更新しました",
  "data": { /* 更新後の紐付けデータ */ }
}
```

---

## 3. 業務管理API

### 3.1 出欠表管理

#### 3.1.1 出欠状況取得

指定した日付・クラスの出欠状況を取得する。

**エンドポイント**: `GET /api/desktop/attendance/{nurseryId}/{classId}/{date}`

**ヘッダー**: `Authorization: Bearer {accessToken}`

**パスパラメータ**:
- `nurseryId` (number): 保育園ID
- `classId` (string): クラスID
- `date` (date): 対象日 (YYYY-MM-DD)

**レスポンス (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "nurseryId": 1,
      "childId": 1,
      "childName": "田中花子",
      "attendanceDate": "2025-10-24",
      "status": "present",
      "arrivalTime": "08:30:00",
      "notes": "元気に登園しました",
      "absenceNotificationId": null,
      "recordedByStaffId": 5,
      "recordedByStaffName": "鈴木先生",
      "recordedAt": "2025-10-24T08:35:00Z",
      "updatedByStaffId": null,
      "updatedByStaffName": null,
      "updatedAt": null,
      "isActive": true
    },
    {
      "nurseryId": 1,
      "childId": 2,
      "childName": "佐藤太郎",
      "attendanceDate": "2025-10-24",
      "status": "absent",
      "arrivalTime": null,
      "notes": "風邪",
      "absenceNotificationId": 123,
      "recordedByStaffId": null,
      "recordedByStaffName": null,
      "recordedAt": "2025-10-24T07:15:00Z",
      "updatedByStaffId": null,
      "updatedByStaffName": null,
      "updatedAt": null,
      "isActive": true
    }
  ]
}
```

---

#### 3.1.2 出欠履歴取得

指定した日付範囲・クラス・園児の出欠履歴を取得する。

**エンドポイント**: `GET /api/desktop/attendance/{nurseryId}/{classId}/history`

**ヘッダー**: `Authorization: Bearer {accessToken}`

**パスパラメータ**:
- `nurseryId` (number): 保育園ID
- `classId` (string): クラスID

**クエリパラメータ**:
- `startDate` (date, 必須): 開始日
- `endDate` (date, 必須): 終了日
- `childId` (number, 任意): 園児ID（指定時は個別園児の履歴）

**レスポンス (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "nurseryId": 1,
      "childId": 1,
      "childName": "田中花子",
      "attendanceDate": "2025-10-23",
      "status": "present",
      "arrivalTime": "08:25:00",
      "notes": null,
      "absenceNotificationId": null,
      "recordedByStaffId": 5,
      "recordedByStaffName": "鈴木先生",
      "recordedAt": "2025-10-23T08:30:00Z",
      "isActive": true
    }
  ],
  "summary": {
    "totalDays": 10,
    "presentDays": 9,
    "absentDays": 1,
    "lateDays": 0,
    "attendanceRate": 90.0
  }
}
```

---

#### 3.1.3 出欠ステータス更新

園児の出欠ステータスを記録・更新する。

**エンドポイント**: `PUT /api/desktop/attendance/{nurseryId}/{childId}/{date}`

**ヘッダー**: `Authorization: Bearer {accessToken}`

**パスパラメータ**:
- `nurseryId` (number): 保育園ID
- `childId` (number): 園児ID
- `date` (date): 対象日 (YYYY-MM-DD)

**リクエスト**:
```json
{
  "status": "present|absent|late",   // ステータス (必須)
  "arrivalTime": "08:30:00",         // 到着時刻 (任意、遅刻の場合推奨)
  "notes": "string",                 // 備考 (任意、500文字以内)
  "recordedByStaffId": 5,            // 記録スタッフID (必須)
  "recordedByStaffNurseryId": 1      // 記録スタッフ保育園ID (必須)
}
```

**レスポンス (200 OK)**:
```json
{
  "success": true,
  "message": "出欠ステータスを更新しました",
  "data": {
    "nurseryId": 1,
    "childId": 1,
    "childName": "田中花子",
    "attendanceDate": "2025-10-24",
    "status": "present",
    "arrivalTime": "08:30:00",
    "notes": null,
    "recordedByStaffId": 5,
    "recordedByStaffName": "鈴木先生",
    "recordedAt": "2025-10-24T08:35:00Z",
    "isActive": true
  }
}
```

**エラーレスポンス**:
- `400 Bad Request`: 過去30日以前のデータは編集不可
- `409 Conflict`: 「欠席」→「出席」への変更警告

**ビジネスルール**:
- BR-AT-004: 「未記録」→「出席」「欠席」「遅刻」への変更は自由
- BR-AT-005: 「欠席」→「出席」への変更は警告を表示
- BR-AT-006: 過去30日以前のデータは編集不可

---

#### 3.1.4 備考更新

出欠記録の備考のみを更新する。

**エンドポイント**: `PUT /api/desktop/attendance/{nurseryId}/{childId}/{date}/notes`

**ヘッダー**: `Authorization: Bearer {accessToken}`

**パスパラメータ**:
- `nurseryId` (number): 保育園ID
- `childId` (number): 園児ID
- `date` (date): 対象日 (YYYY-MM-DD)

**リクエスト**:
```json
{
  "notes": "string",                 // 備考 (必須、500文字以内)
  "updatedByStaffId": 5,             // 更新スタッフID (必須)
  "updatedByStaffNurseryId": 1       // 更新スタッフ保育園ID (必須)
}
```

**レスポンス (200 OK)**:
```json
{
  "success": true,
  "message": "備考を更新しました",
  "data": {
    "nurseryId": 1,
    "childId": 1,
    "attendanceDate": "2025-10-24",
    "notes": "体調良好、午睡も十分取れました",
    "updatedByStaffId": 5,
    "updatedByStaffName": "鈴木先生",
    "updatedAt": "2025-10-24T15:00:00Z"
  }
}
```

---

#### 3.1.5 一括出席登録

クラス全員を「出席」ステータスに一括登録する（未記録の園児のみ対象）。

**エンドポイント**: `POST /api/desktop/attendance/bulk-present`

**ヘッダー**: `Authorization: Bearer {accessToken}`

**リクエスト**:
```json
{
  "nurseryId": 1,                    // 保育園ID (必須)
  "classId": "sakura",               // クラスID (必須)
  "date": "2025-10-24",              // 対象日 (必須)
  "recordedByStaffId": 5,            // 記録スタッフID (必須)
  "recordedByStaffNurseryId": 1      // 記録スタッフ保育園ID (必須)
}
```

**レスポンス (200 OK)**:
```json
{
  "success": true,
  "message": "10人の園児を一括で出席に登録しました",
  "data": {
    "totalChildren": 12,
    "registeredCount": 10,
    "skippedCount": 2,
    "skippedChildren": [
      {
        "childId": 2,
        "childName": "佐藤太郎",
        "reason": "既に欠席として登録済み"
      },
      {
        "childId": 5,
        "childName": "山田次郎",
        "reason": "既に遅刻として登録済み"
      }
    ]
  }
}
```

**ビジネスルール**:
- BR-AT-007: 一括出席は「未記録」の園児のみ対象

---

### 3.2 連絡管理（欠席・遅刻・お迎え）

#### 3.2.1 当日の連絡一覧取得

**エンドポイント**: `GET /api/desktop/contacts/today`

**ヘッダー**: `Authorization: Bearer {accessToken}`

**クエリパラメータ**:
- `classId` (string, 任意): クラスフィルター
- `type` (string, 任意): 種別フィルター (absence/tardiness/pickup)
- `status` (string, 任意): ステータスフィルター (submitted/acknowledged)

**レスポンス (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "notificationId": 1,
      "childId": 1,
      "childName": "田中花子",
      "className": "さくら組",
      "type": "absence",
      "targetDate": "2025-10-24",
      "reason": "風邪",
      "expectedArrivalTime": null,
      "status": "submitted",
      "submittedAt": "2025-10-24T07:30:00Z",
      "parentName": "田中太郎",
      "staffResponse": null,
      "respondedByStaffId": null,
      "respondedByStaffName": null,
      "respondedAt": null,
      "acknowledgedByAdminUser": false,
      "acknowledgedByAdminAt": null
    }
  ]
}
```

---

#### 3.2.2 連絡履歴検索

**エンドポイント**: `GET /api/desktop/contacts/history`

**ヘッダー**: `Authorization: Bearer {accessToken}`

**クエリパラメータ**:
- `startDate` (date, 任意): 開始日
- `endDate` (date, 任意): 終了日
- `childId` (number, 任意): 園児ID
- `classId` (string, 任意): クラスID
- `type` (string, 任意): 種別フィルター
- `page` (number, 任意): ページ番号
- `pageSize` (number, 任意): 1ページあたりの件数

**レスポンス (200 OK)**:
```json
{
  "success": true,
  "data": {
    "items": [ /* 連絡データ配列 */ ],
    "totalCount": 120,
    "page": 1,
    "pageSize": 50,
    "totalPages": 3
  }
}
```

---

#### 3.2.3 連絡に返信・確認済みにする

**エンドポイント**: `PUT /api/desktop/contacts/{notificationId}/respond`

**ヘッダー**: `Authorization: Bearer {accessToken}`

**パスパラメータ**:
- `notificationId` (number): 連絡ID

**リクエスト**:
```json
{
  "staffId": 1,                  // 対応スタッフID (必須)
  "response": "string",          // 返信メッセージ (任意、500文字以内)
  "status": "acknowledged"       // ステータス (必須)
}
```

**レスポンス (200 OK)**:
```json
{
  "success": true,
  "message": "連絡を確認済みにしました",
  "data": { /* 更新後の連絡データ */ }
}
```

---

### 3.3 日報管理

#### 3.3.1 日報一覧取得

**エンドポイント**: `GET /api/desktop/reports`

**ヘッダー**: `Authorization: Bearer {accessToken}`

**クエリパラメータ**:
- `startDate` (date, 任意): 開始日
- `endDate` (date, 任意): 終了日
- `childId` (number, 任意): 園児ID
- `classId` (string, 任意): クラスID
- `staffId` (number, 任意): スタッフID
- `status` (string, 任意): ステータス (draft/published)
- `page` (number, 任意): ページ番号
- `pageSize` (number, 任意): 1ページあたりの件数

**レスポンス (200 OK)**:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "reportId": 1,
        "childId": 1,
        "childName": "田中花子",
        "className": "さくら組",
        "staffId": 1,
        "staffName": "鈴木先生",
        "reportDate": "2025-10-23",
        "reportKind": "activity",
        "title": "お散歩に行きました",
        "content": "公園でどんぐり拾いをしました...",
        "photos": ["https://..."],
        "status": "published",
        "publishedAt": "2025-10-23T15:00:00Z",
        "createdByAdminUser": false,
        "createdAt": "2025-10-23T14:30:00Z",
        "updatedAt": "2025-10-23T15:00:00Z"
      }
    ],
    "totalCount": 45,
    "page": 1,
    "pageSize": 50,
    "totalPages": 1
  }
}
```

---

#### 3.3.2 日報作成

**エンドポイント**: `POST /api/desktop/reports`

**ヘッダー**: `Authorization: Bearer {accessToken}`

**リクエスト**:
```json
{
  "childId": 1,                  // 園児ID (必須)
  "staffId": 1,                  // 作成スタッフID (必須)
  "reportDate": "2025-10-23",    // 日報日付 (必須)
  "reportKind": "activity|meal|sleep|health|incident|behavior", // レポート種別 (必須)
  "title": "string",             // タイトル (必須、200文字以内)
  "content": "string",           // 本文 (必須、1000文字以内)
  "photos": ["string"],          // 写真URL配列 (任意)
  "status": "draft|published"    // ステータス (必須)
}
```

**レスポンス (201 Created)**:
```json
{
  "success": true,
  "message": "日報を作成しました",
  "data": { /* 作成された日報データ */ }
}
```

**ビジネスルール**:
- 管理者が作成した場合、`CreatedByAdminUser = true`
- 公開時に保護者アプリにプッシュ通知送信

---

#### 3.3.3 日報更新

**エンドポイント**: `PUT /api/desktop/reports/{reportId}`

**ヘッダー**: `Authorization: Bearer {accessToken}`

**パスパラメータ**:
- `reportId` (number): 日報ID

**リクエスト**: 日報作成と同じ (すべて任意)

**レスポンス (200 OK)**:
```json
{
  "success": true,
  "message": "日報を更新しました",
  "data": { /* 更新後の日報データ */ }
}
```

---

#### 3.3.4 日報削除

**エンドポイント**: `DELETE /api/desktop/reports/{reportId}`

**ヘッダー**: `Authorization: Bearer {accessToken}`

**パスパラメータ**:
- `reportId` (number): 日報ID

**レスポンス (200 OK)**:
```json
{
  "success": true,
  "message": "日報を削除しました"
}
```

**ビジネスルール**:
- 公開済み日報は削除不可 (BR-RM-001)

---

### 3.4 カレンダー・イベント管理

#### 3.4.1 イベント一覧取得

**エンドポイント**: `GET /api/desktop/events`

**ヘッダー**: `Authorization: Bearer {accessToken}`

**クエリパラメータ**:
- `startDate` (date, 任意): 開始日
- `endDate` (date, 任意): 終了日
- `category` (string, 任意): カテゴリフィルター
- `targetAudience` (string, 任意): 対象フィルター (all/grade/class)

**レスポンス (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "eventId": 1,
      "title": "運動会",
      "description": "年度末の運動会を開催します",
      "category": "general_event",
      "startDateTime": "2025-10-10T09:00:00Z",
      "endDateTime": "2025-10-10T15:00:00Z",
      "isAllDay": false,
      "targetAudience": "all",
      "targetGradeLevel": null,
      "targetClassId": null,
      "isRecurring": false,
      "requiresPreparation": true,
      "preparationInstructions": "水筒、帽子をご持参ください",
      "createdAt": "2025-09-01T00:00:00Z",
      "updatedAt": "2025-09-15T00:00:00Z"
    }
  ]
}
```

---

#### 3.4.2 イベント作成

**エンドポイント**: `POST /api/desktop/events`

**ヘッダー**: `Authorization: Bearer {accessToken}`

**リクエスト**:
```json
{
  "title": "string",             // タイトル (必須、200文字以内)
  "description": "string",       // 説明 (任意、1000文字以内)
  "category": "general_announcement|general_event|grade_activity|class_activity|nursery_holiday", // カテゴリ (必須)
  "startDateTime": "2025-10-10T09:00:00Z", // 開始日時 (必須)
  "endDateTime": "2025-10-10T15:00:00Z",   // 終了日時 (必須)
  "isAllDay": false,             // 終日イベント (必須)
  "targetAudience": "all|grade|class",  // 対象 (必須)
  "targetGradeLevel": null,      // 対象学年 (任意)
  "targetClassId": null,         // 対象クラス (任意)
  "isRecurring": false,          // 繰り返し (任意)
  "recurrencePattern": "daily|weekly|monthly", // 繰り返しパターン (任意)
  "recurrenceEndDate": null,     // 繰り返し終了日 (任意)
  "requiresPreparation": false,  // 準備が必要 (任意)
  "preparationInstructions": "string" // 準備指示 (任意)
}
```

**レスポンス (201 Created)**:
```json
{
  "success": true,
  "message": "イベントを作成しました",
  "data": { /* 作成されたイベントデータ */ }
}
```

---

#### 3.4.3 イベント更新

**エンドポイント**: `PUT /api/desktop/events/{eventId}`

**ヘッダー**: `Authorization: Bearer {accessToken}`

**パスパラメータ**:
- `eventId` (number): イベントID

**リクエスト**: イベント作成と同じ (すべて任意)

**レスポンス (200 OK)**:
```json
{
  "success": true,
  "message": "イベントを更新しました",
  "data": { /* 更新後のイベントデータ */ }
}
```

---

#### 3.4.4 イベント削除

**エンドポイント**: `DELETE /api/desktop/events/{eventId}`

**ヘッダー**: `Authorization: Bearer {accessToken}`

**パスパラメータ**:
- `eventId` (number): イベントID

**レスポンス (200 OK)**:
```json
{
  "success": true,
  "message": "イベントを削除しました"
}
```

---

### 3.5 お知らせ管理

#### 3.5.1 お知らせ一覧取得

**エンドポイント**: `GET /api/desktop/announcements`

**ヘッダー**: `Authorization: Bearer {accessToken}`

**クエリパラメータ**:
- `status` (string, 任意): ステータス (draft/published/archived)
- `category` (string, 任意): カテゴリ (emergency/cooperation/general/important)
- `priority` (string, 任意): 優先度 (high/normal/low)
- `page` (number, 任意): ページ番号
- `pageSize` (number, 任意): 1ページあたりの件数

**レスポンス (200 OK)**:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "announcementId": 1,
        "title": "インフルエンザ注意喚起",
        "content": "インフルエンザが流行しています...",
        "category": "important",
        "priority": "high",
        "targetAudience": "all",
        "targetGradeLevel": null,
        "targetClassId": null,
        "createdByStaffId": 1,
        "createdByStaffName": "鈴木先生",
        "createdByAdminUser": false,
        "scheduledAt": null,
        "publishedAt": "2025-10-23T09:00:00Z",
        "expiresAt": null,
        "attachments": [
          {
            "fileName": "インフルエンザ予防.pdf",
            "fileUrl": "https://...",
            "fileSize": 524288,
            "fileType": "pdf"
          }
        ],
        "readStatus": {
          "totalRecipients": 80,
          "readCount": 65,
          "readRate": 81.25
        },
        "createdAt": "2025-10-23T08:30:00Z",
        "updatedAt": "2025-10-23T09:00:00Z"
      }
    ],
    "totalCount": 25,
    "page": 1,
    "pageSize": 50,
    "totalPages": 1
  }
}
```

---

#### 3.5.2 お知らせ作成

**エンドポイント**: `POST /api/desktop/announcements`

**ヘッダー**: `Authorization: Bearer {accessToken}`

**リクエスト**:
```json
{
  "title": "string",             // タイトル (必須、100文字以内)
  "content": "string",           // 本文 (必須、5000文字以内)
  "category": "emergency|cooperation|general|important", // カテゴリ (必須)
  "priority": "high|normal|low", // 優先度 (必須)
  "targetAudience": "all|grade|class", // 対象 (必須)
  "targetGradeLevel": null,      // 対象学年 (任意)
  "targetClassId": null,         // 対象クラス (任意)
  "createdByStaffId": 1,         // 作成スタッフID (必須)
  "scheduledAt": null,           // 予約配信日時 (任意)
  "expiresAt": null,             // 有効期限 (任意)
  "attachments": [               // 添付ファイル (任意)
    {
      "fileName": "string",
      "fileUrl": "string",
      "fileSize": 524288,
      "fileType": "pdf|docx"
    }
  ],
  "status": "draft|published"    // ステータス (必須)
}
```

**レスポンス (201 Created)**:
```json
{
  "success": true,
  "message": "お知らせを作成しました",
  "data": { /* 作成されたお知らせデータ */ }
}
```

---

#### 3.5.3 お知らせ更新

**エンドポイント**: `PUT /api/desktop/announcements/{announcementId}`

**ヘッダー**: `Authorization: Bearer {accessToken}`

**パスパラメータ**:
- `announcementId` (number): お知らせID

**リクエスト**: お知らせ作成と同じ (すべて任意)

**レスポンス (200 OK)**:
```json
{
  "success": true,
  "message": "お知らせを更新しました",
  "data": { /* 更新後のお知らせデータ */ }
}
```

---

#### 3.5.4 お知らせ削除

**エンドポイント**: `DELETE /api/desktop/announcements/{announcementId}`

**ヘッダー**: `Authorization: Bearer {accessToken}`

**パスパラメータ**:
- `announcementId` (number): お知らせID

**レスポンス (200 OK)**:
```json
{
  "success": true,
  "message": "お知らせを削除しました"
}
```

---

### 3.6 写真管理

#### 3.6.1 写真一覧取得

**エンドポイント**: `GET /api/desktop/photos`

**ヘッダー**: `Authorization: Bearer {accessToken}`

**クエリパラメータ**:
- `startDate` (date, 任意): 開始日
- `endDate` (date, 任意): 終了日
- `classId` (string, 任意): クラスID
- `staffId` (number, 任意): スタッフID
- `status` (string, 任意): ステータス (draft/published/archived)
- `visibilityLevel` (string, 任意): 公開範囲 (class/grade/school/individual)
- `page` (number, 任意): ページ番号
- `pageSize` (number, 任意): 1ページあたりの件数

**レスポンス (200 OK)**:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "photoId": 1,
        "fileName": "photo_001.jpg",
        "url": "https://...",
        "thumbnailUrl": "https://...",
        "uploadedByStaffId": 1,
        "uploadedByStaffName": "鈴木先生",
        "uploadedByAdminUser": false,
        "uploadedAt": "2025-10-23T14:00:00Z",
        "publishDate": "2025-10-23",
        "description": "お散歩の様子",
        "visibilityLevel": "class",
        "targetClassId": "sakura",
        "targetGradeLevel": null,
        "taggedChildren": [
          {
            "childId": 1,
            "childName": "田中花子"
          }
        ],
        "status": "published",
        "viewCount": 45,
        "downloadCount": 12,
        "createdAt": "2025-10-23T14:00:00Z",
        "updatedAt": "2025-10-23T14:30:00Z"
      }
    ],
    "totalCount": 120,
    "page": 1,
    "pageSize": 50,
    "totalPages": 3
  }
}
```

---

#### 3.6.2 写真アップロード

**エンドポイント**: `POST /api/desktop/photos`

**ヘッダー**:
- `Authorization: Bearer {accessToken}`
- `Content-Type: multipart/form-data`

**リクエスト**:
- `file`: 画像ファイル (必須、最大50MB)
- `uploadedByStaffId`: スタッフID (必須)
- `publishDate`: 公開日 (必須)
- `description`: 説明 (任意)
- `visibilityLevel`: 公開範囲 (必須)
- `targetClassId`: 対象クラスID (任意)
- `targetGradeLevel`: 対象学年 (任意)
- `taggedChildrenIds`: タグ付け園児ID配列 (任意)

**レスポンス (201 Created)**:
```json
{
  "success": true,
  "message": "写真をアップロードしました",
  "data": { /* アップロードされた写真データ */ }
}
```

---

#### 3.6.3 写真更新

**エンドポイント**: `PUT /api/desktop/photos/{photoId}`

**ヘッダー**: `Authorization: Bearer {accessToken}`

**パスパラメータ**:
- `photoId` (number): 写真ID

**リクエスト**:
```json
{
  "description": "string",       // 説明 (任意)
  "visibilityLevel": "class|grade|school|individual", // 公開範囲 (任意)
  "targetClassId": "string",     // 対象クラスID (任意)
  "targetGradeLevel": null,      // 対象学年 (任意)
  "taggedChildrenIds": [1, 2],   // タグ付け園児ID配列 (任意)
  "status": "draft|published|archived" // ステータス (任意)
}
```

**レスポンス (200 OK)**:
```json
{
  "success": true,
  "message": "写真情報を更新しました",
  "data": { /* 更新後の写真データ */ }
}
```

---

#### 3.6.4 写真削除

**エンドポイント**: `DELETE /api/desktop/photos/{photoId}`

**ヘッダー**: `Authorization: Bearer {accessToken}`

**パスパラメータ**:
- `photoId` (number): 写真ID

**レスポンス (200 OK)**:
```json
{
  "success": true,
  "message": "写真を削除しました"
}
```

---

#### 3.6.5 写真一括ダウンロード

**エンドポイント**: `POST /api/desktop/photos/bulk-download`

**ヘッダー**: `Authorization: Bearer {accessToken}`

**リクエスト**:
```json
{
  "photoIds": [1, 2, 3, 4, 5]    // 写真ID配列 (必須)
}
```

**レスポンス (200 OK)**:
```json
{
  "success": true,
  "data": {
    "downloadUrl": "https://...",  // ZIPファイルのダウンロードURL
    "expiresAt": "2025-10-24T00:00:00Z"  // URL有効期限
  }
}
```

---

## 4. レポート・分析API

### 4.1 ダッシュボード

#### 4.1.1 ダッシュボードデータ取得

**エンドポイント**: `GET /api/desktop/dashboard`

**ヘッダー**: `Authorization: Bearer {accessToken}`

**クエリパラメータ**:
- `date` (date, 任意): 対象日 (デフォルト: 当日)

**レスポンス (200 OK)**:
```json
{
  "success": true,
  "data": {
    "date": "2025-10-24",
    "classSummary": [
      {
        "classId": "sakura",
        "className": "さくら組",
        "totalChildren": 12,
        "absenceCount": 2,
        "tardinessCount": 1,
        "pickupCount": 3,
        "unacknowledgedCount": 1
      }
    ],
    "todayEvents": [
      {
        "eventId": 1,
        "title": "遠足",
        "startTime": "09:00",
        "endTime": "15:00"
      }
    ],
    "pendingTasks": {
      "unpublishedReports": 5,
      "pendingPhotoApprovals": 12,
      "unacknowledgedContacts": 3
    },
    "recentActivities": [
      {
        "activityType": "report_published",
        "description": "鈴木先生が日報を公開しました",
        "timestamp": "2025-10-24T15:00:00Z"
      }
    ]
  }
}
```

---

### 4.2 出席状況レポート

#### 4.2.1 クラス別出席状況取得

**エンドポイント**: `GET /api/desktop/reports/attendance/by-class`

**ヘッダー**: `Authorization: Bearer {accessToken}`

**クエリパラメータ**:
- `startDate` (date, 必須): 開始日
- `endDate` (date, 必須): 終了日
- `classId` (string, 任意): クラスID

**レスポンス (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "classId": "sakura",
      "className": "さくら組",
      "period": {
        "startDate": "2025-10-01",
        "endDate": "2025-10-31"
      },
      "statistics": {
        "totalDays": 23,
        "totalChildren": 12,
        "averageAttendanceRate": 92.5,
        "totalAbsences": 21,
        "totalTardiness": 8
      },
      "dailyRecords": [
        {
          "date": "2025-10-01",
          "presentCount": 11,
          "absentCount": 1,
          "tardyCount": 0,
          "attendanceRate": 91.67
        }
      ]
    }
  ]
}
```

---

#### 4.2.2 園児別出席状況取得

**エンドポイント**: `GET /api/desktop/reports/attendance/by-child`

**ヘッダー**: `Authorization: Bearer {accessToken}`

**クエリパラメータ**:
- `childId` (number, 必須): 園児ID
- `academicYear` (number, 任意): 年度 (デフォルト: 現在年度)
- `month` (number, 任意): 月 (1-12)

**レスポンス (200 OK)**:
```json
{
  "success": true,
  "data": {
    "childId": 1,
    "childName": "田中花子",
    "className": "さくら組",
    "academicYear": 2025,
    "statistics": {
      "totalDays": 200,
      "presentDays": 185,
      "absentDays": 12,
      "tardyDays": 3,
      "attendanceRate": 92.5
    },
    "monthlyBreakdown": [
      {
        "month": 4,
        "totalDays": 22,
        "presentDays": 20,
        "absentDays": 2,
        "tardyDays": 0,
        "attendanceRate": 90.91
      }
    ]
  }
}
```

---

### 4.3 園児別統計レポート

#### 4.3.1 園児別統計取得

**エンドポイント**: `GET /api/desktop/reports/child-statistics/{childId}`

**ヘッダー**: `Authorization: Bearer {accessToken}`

**パスパラメータ**:
- `childId` (number): 園児ID

**クエリパラメータ**:
- `academicYear` (number, 任意): 年度

**レスポンス (200 OK)**:
```json
{
  "success": true,
  "data": {
    "childId": 1,
    "childName": "田中花子",
    "className": "さくら組",
    "academicYear": 2025,
    "attendance": {
      "totalDays": 200,
      "presentDays": 185,
      "absentDays": 12,
      "tardyDays": 3,
      "attendanceRate": 92.5
    },
    "dailyReports": {
      "totalCount": 180,
      "reportKindBreakdown": [
        { "reportKind": "activity", "count": 120 },
        { "reportKind": "meal", "count": 30 },
        { "reportKind": "sleep", "count": 25 },
        { "reportKind": "health", "count": 5 }
      ]
    },
    "photos": {
      "totalCount": 150,
      "recentPhotos": [ /* 最新5枚 */ ]
    },
    "contacts": {
      "absenceCount": 12,
      "tardinessCount": 3,
      "pickupCount": 25
    }
  }
}
```

---

### 4.4 年度別アーカイブ

#### 4.4.1 年度別データ取得

**エンドポイント**: `GET /api/desktop/reports/archive/{academicYear}`

**ヘッダー**: `Authorization: Bearer {accessToken}`

**パスパラメータ**:
- `academicYear` (number): 年度

**レスポンス (200 OK)**:
```json
{
  "success": true,
  "data": {
    "academicYear": 2024,
    "isArchived": true,
    "summary": {
      "totalChildren": 50,
      "graduatedChildren": 10,
      "totalClasses": 5,
      "totalStaff": 15,
      "totalReports": 2500,
      "totalPhotos": 5000,
      "totalEvents": 120
    },
    "classes": [ /* クラス一覧 */ ],
    "children": [ /* 園児一覧 */ ],
    "graduatedChildren": [ /* 卒園児一覧 */ ]
  }
}
```

---

## 5. 年度管理API

### 5.1 年度管理

#### 5.1.1 年度一覧取得

**エンドポイント**: `GET /api/desktop/academic-years`

**ヘッダー**: `Authorization: Bearer {accessToken}`

**レスポンス (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "year": 2025,
      "startDate": "2025-04-01",
      "endDate": "2026-03-31",
      "isCurrent": true,
      "isArchived": false,
      "archivedAt": null,
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ]
}
```

---

#### 5.1.2 年度作成

**エンドポイント**: `POST /api/desktop/academic-years`

**ヘッダー**: `Authorization: Bearer {accessToken}`

**リクエスト**:
```json
{
  "year": 2026,                  // 年度 (必須)
  "startDate": "2026-04-01",     // 開始日 (必須)
  "endDate": "2027-03-31"        // 終了日 (必須)
}
```

**レスポンス (201 Created)**:
```json
{
  "success": true,
  "message": "年度を作成しました",
  "data": { /* 作成された年度データ */ }
}
```

---

#### 5.1.3 年度切り替え

**エンドポイント**: `POST /api/desktop/academic-years/{year}/activate`

**ヘッダー**: `Authorization: Bearer {accessToken}`

**パスパラメータ**:
- `year` (number): 年度

**レスポンス (200 OK)**:
```json
{
  "success": true,
  "message": "年度を切り替えました",
  "data": {
    "previousYear": 2024,
    "currentYear": 2025
  }
}
```

**ビジネスルール**:
- 1つの保育園で現在年度は1つのみ
- 前年度は自動的にアーカイブ化

---

#### 5.1.4 年度アーカイブ

**エンドポイント**: `POST /api/desktop/academic-years/{year}/archive`

**ヘッダー**: `Authorization: Bearer {accessToken}`

**パスパラメータ**:
- `year` (number): 年度

**レスポンス (200 OK)**:
```json
{
  "success": true,
  "message": "年度をアーカイブしました",
  "data": {
    "year": 2024,
    "isArchived": true,
    "archivedAt": "2025-04-01T00:00:00Z"
  }
}
```

---

### 5.2 進級処理

#### 5.2.1 進級プレビュー

次年度クラス構成の事前確認。

**エンドポイント**: `POST /api/desktop/promotion/preview`

**ヘッダー**: `Authorization: Bearer {accessToken}`

**リクエスト**:
```json
{
  "fromAcademicYear": 2024,      // 進級元年度 (必須)
  "toAcademicYear": 2025,        // 進級先年度 (必須)
  "promotionRules": [            // 進級ルール (必須)
    {
      "fromClassId": "sakura",
      "toClassId": "himawari"
    }
  ]
}
```

**レスポンス (200 OK)**:
```json
{
  "success": true,
  "data": {
    "preview": [
      {
        "childId": 1,
        "childName": "田中花子",
        "currentClassId": "sakura",
        "currentClassName": "さくら組",
        "nextClassId": "himawari",
        "nextClassName": "ひまわり組",
        "age": 1
      }
    ],
    "totalChildren": 50,
    "warnings": [
      {
        "childId": 5,
        "warning": "進級先クラスが定員オーバーです"
      }
    ]
  }
}
```

---

#### 5.2.2 進級実行

**エンドポイント**: `POST /api/desktop/promotion/execute`

**ヘッダー**: `Authorization: Bearer {accessToken}`

**リクエスト**:
```json
{
  "fromAcademicYear": 2024,      // 進級元年度 (必須)
  "toAcademicYear": 2025,        // 進級先年度 (必須)
  "promotionRules": [            // 進級ルール (必須)
    {
      "fromClassId": "sakura",
      "toClassId": "himawari"
    }
  ],
  "notes": "2025年度進級処理"   // 備考 (任意)
}
```

**レスポンス (200 OK)**:
```json
{
  "success": true,
  "message": "進級処理を実行しました",
  "data": {
    "promotedCount": 50,
    "failedCount": 0,
    "executedAt": "2025-03-31T23:59:59Z",
    "promotionHistories": [
      {
        "childId": 1,
        "fromClassId": "sakura",
        "toClassId": "himawari"
      }
    ]
  }
}
```

**ビジネスルール**:
- 進級処理は年度末（2月〜3月）のみ実行可能
- 次年度クラスが事前登録されている必要がある
- 進級履歴を `PromotionHistory` テーブルに記録

---

#### 5.2.3 進級履歴取得

**エンドポイント**: `GET /api/desktop/promotion/history`

**ヘッダー**: `Authorization: Bearer {accessToken}`

**クエリパラメータ**:
- `childId` (number, 任意): 園児ID
- `academicYear` (number, 任意): 年度
- `page` (number, 任意): ページ番号
- `pageSize` (number, 任意): 1ページあたりの件数

**レスポンス (200 OK)**:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "childId": 1,
        "childName": "田中花子",
        "fromAcademicYear": 2024,
        "toAcademicYear": 2025,
        "fromClassId": "sakura",
        "fromClassName": "さくら組",
        "toClassId": "himawari",
        "toClassName": "ひまわり組",
        "promotedAt": "2025-03-31T23:59:59Z",
        "promotedByUserId": 1,
        "notes": "2025年度進級処理"
      }
    ],
    "totalCount": 50,
    "page": 1,
    "pageSize": 50,
    "totalPages": 1
  }
}
```

---

### 5.3 卒園処理

#### 5.3.1 卒園対象園児取得

**エンドポイント**: `GET /api/desktop/graduation/candidates`

**ヘッダー**: `Authorization: Bearer {accessToken}`

**クエリパラメータ**:
- `academicYear` (number, 必須): 年度

**レスポンス (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "childId": 10,
      "name": "山田太郎",
      "classId": "fuji",
      "className": "ふじ組",
      "dateOfBirth": "2019-04-10",
      "age": 6,
      "isEligible": true
    }
  ]
}
```

**ビジネスルール**:
- 最高学年（5歳児クラス）の園児のみ対象

---

#### 5.3.2 卒園処理実行

**エンドポイント**: `POST /api/desktop/graduation/execute`

**ヘッダー**: `Authorization: Bearer {accessToken}`

**リクエスト**:
```json
{
  "academicYear": 2025,          // 年度 (必須)
  "childrenIds": [10, 11, 12],   // 卒園園児ID配列 (必須)
  "graduationDate": "2026-03-31", // 卒園日 (必須)
  "notes": "2025年度卒園"        // 備考 (任意)
}
```

**レスポンス (200 OK)**:
```json
{
  "success": true,
  "message": "卒園処理を実行しました",
  "data": {
    "graduatedCount": 3,
    "executedAt": "2026-03-31T00:00:00Z",
    "graduatedChildren": [
      {
        "childId": 10,
        "name": "山田太郎",
        "graduationDate": "2026-03-31",
        "graduationStatus": "Graduated"
      }
    ]
  }
}
```

**ビジネスルール**:
- 卒園処理により `IsActive = false` に設定
- `GraduationDate` と `GraduationStatus = "Graduated"` を記録

---

#### 5.3.3 途中退園処理

**エンドポイント**: `POST /api/desktop/graduation/withdraw`

**ヘッダー**: `Authorization: Bearer {accessToken}`

**リクエスト**:
```json
{
  "childId": 5,                  // 園児ID (必須)
  "withdrawalDate": "2025-12-31", // 退園日 (必須)
  "reason": "転居のため"          // 理由 (必須、200文字以内)
}
```

**レスポンス (200 OK)**:
```json
{
  "success": true,
  "message": "退園処理を実行しました",
  "data": {
    "childId": 5,
    "name": "佐藤花子",
    "graduationDate": "2025-12-31",
    "graduationStatus": "Withdrawn",
    "withdrawalReason": "転居のため"
  }
}
```

---

## 6. 監査ログAPI

### 6.1 監査ログ取得

**エンドポイント**: `GET /api/desktop/audit-logs`

**ヘッダー**: `Authorization: Bearer {accessToken}`

**クエリパラメータ**:
- `startDate` (datetime, 任意): 開始日時
- `endDate` (datetime, 任意): 終了日時
- `userId` (number, 任意): ユーザーID
- `action` (string, 任意): 操作種別 (Create/Update/Delete/Login/Logout)
- `entityType` (string, 任意): エンティティ種別 (Child/Staff/Class等)
- `page` (number, 任意): ページ番号
- `pageSize` (number, 任意): 1ページあたりの件数

**レスポンス (200 OK)**:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "userId": 1,
        "userName": "管理者",
        "action": "Update",
        "entityType": "Child",
        "entityId": "1",
        "beforeValue": "{\"name\":\"旧名前\"}",
        "afterValue": "{\"name\":\"新名前\"}",
        "ipAddress": "192.168.1.100",
        "userAgent": "Mozilla/5.0...",
        "timestamp": "2025-10-24T10:30:00Z"
      }
    ],
    "totalCount": 500,
    "page": 1,
    "pageSize": 50,
    "totalPages": 10
  }
}
```

---

## 7. エラーレスポンス

すべてのAPIエンドポイントは、エラー発生時に以下の形式でレスポンスを返します。

### 標準エラーレスポンス

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "エラーメッセージ",
    "details": [ /* 詳細情報 (任意) */ ]
  }
}
```

### HTTPステータスコード

| コード | 意味 | 使用例 |
|--------|------|--------|
| 200 | OK | 成功 |
| 201 | Created | 新規作成成功 |
| 400 | Bad Request | リクエストパラメータ不正 |
| 401 | Unauthorized | 認証失敗 |
| 403 | Forbidden | 権限不足 |
| 404 | Not Found | リソースが存在しない |
| 409 | Conflict | 重複データ |
| 422 | Unprocessable Entity | バリデーションエラー |
| 423 | Locked | アカウントロック |
| 429 | Too Many Requests | レート制限超過 |
| 500 | Internal Server Error | サーバーエラー |

### エラーコード一覧

| エラーコード | 説明 |
|-------------|------|
| AUTH_INVALID_CREDENTIALS | ログインID・パスワードが不正 |
| AUTH_ACCOUNT_LOCKED | アカウントロック中 |
| AUTH_TOKEN_EXPIRED | トークン期限切れ |
| VALIDATION_ERROR | バリデーションエラー |
| RESOURCE_NOT_FOUND | リソースが存在しない |
| DUPLICATE_RESOURCE | 重複データ |
| BUSINESS_RULE_VIOLATION | ビジネスルール違反 |
| INSUFFICIENT_PERMISSION | 権限不足 |
| RATE_LIMIT_EXCEEDED | レート制限超過 |
| SERVER_ERROR | サーバーエラー |

---

## 8. レート制限

APIエンドポイントには以下のレート制限が適用されます。

| エンドポイントカテゴリ | 制限 |
|---------------------|------|
| 認証 (`/api/desktop/auth/*`) | 10リクエスト/分 |
| マスタ管理 (`/api/desktop/*`) | 100リクエスト/分 |
| 写真アップロード | 10リクエスト/分 |
| その他 | 200リクエスト/分 |

レート制限を超えた場合、`429 Too Many Requests` が返されます。

---

## 9. セキュリティ

### 9.1 認証

- JWTトークンベースの認証
- アクセストークン有効期限: 1時間
- リフレッシュトークン有効期限: 7日間

### 9.2 アカウントロック

- ログイン試行回数: 5回まで
- ロック時間: 30分

### 9.3 監査ログ

すべての重要操作（作成、更新、削除）は監査ログに記録されます。

### 9.4 データ暗号化

- パスワードはBCryptでハッシュ化
- 通信はHTTPS必須

---

## 10. ページネーション

リスト取得APIは以下のページネーション形式をサポートします。

### リクエスト

```
GET /api/desktop/children?page=1&pageSize=50
```

### レスポンス

```json
{
  "success": true,
  "data": {
    "items": [ /* データ配列 */ ],
    "totalCount": 120,
    "page": 1,
    "pageSize": 50,
    "totalPages": 3
  }
}
```

---

## 11. フィルタリング・ソート

### フィルタリング

クエリパラメータでフィルタリングをサポート:
```
GET /api/desktop/children?classId=sakura&isActive=true
```

### ソート

`sortBy` と `sortOrder` パラメータでソートをサポート:
```
GET /api/desktop/children?sortBy=name&sortOrder=asc
```

---

## 12. バージョニング

APIバージョンはURLパスで管理:
```
/api/desktop/v1/...  (将来のバージョン)
```

現在は `/api/desktop/` がデフォルトバージョン(v1)です。

---

## 付録A: データ形式

### 日付形式
- **ISO 8601**: `2025-10-24T10:30:00.000Z`
- **日付のみ**: `2025-10-24`
- **時刻のみ**: `10:30:00`

### 電話番号形式
- ハイフンなし: `09012345678`

### 性別
- `male` または `female`

### 血液型
- `A`, `B`, `O`, `AB`

---

## 付録B: 変更履歴

| バージョン | 日付 | 変更内容 |
|-----------|------|----------|
| 1.0.0 | 2025-10-24 | 初版作成 |

---

**本ドキュメントは、開発スケジュールのPhase 1（基盤構築）に基づいて作成されました。実装時に仕様変更が必要な場合は、このドキュメントを更新してください。**

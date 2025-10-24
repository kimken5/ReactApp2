# 保育園管理デスクトップWebアプリ 要件定義書

## 概要

本要件定義書では、保育園の事務職員・管理者・園長先生が使用する、保育園管理用デスクトップWebアプリケーションの要件を定義します。このアプリは、React + TypeScript のWebインターフェースを通じて、モバイルアプリと同じ ASP.NET Core Web API バックエンドに接続し、保育園運営に必要な管理機能を提供します。

## 1. 製品概要

### 1.1 ビジョン
保育園の日常業務を効率化し、園児・保護者・スタッフの情報を一元管理することで、保育の質向上と業務負担軽減を実現する管理システムを構築します。

### 1.2 成功指標
- **業務効率化**: 事務作業時間を50%削減
- **データ正確性**: 入力ミス・データ不整合を90%削減
- **即時性**: 保護者からの連絡への対応時間を70%短縮
- **ユーザー満足度**: 管理者・事務職員の満足度評価4.5+

### 1.3 対象ユーザー
- **主要対象**: 保育園の事務職員・管理者・園長先生
- **権限**: 全ユーザーが同一権限（保育園単位のログインID・パスワード）
- **スコープ**: 自園の情報のみ登録・参照・編集可能

### 1.4 認証方式
- **ログイン方式**: ログインID + パスワード（Nurseriesテーブルに保存）
- **セッション管理**: JWT トークンベース
- **SMS OTP認証**: 不要（モバイルアプリのみ）

## 2. 機能要件

### 2.1 マスタ管理機能

#### 2.1.1 保育園情報管理

**機能要件**
- **FR-NM-001**: 保育園の基本情報（名前、住所、電話番号、メール、園長名等）を編集できる
- **FR-NM-002**: 保育園ロゴ画像をアップロード・変更できる
- **FR-NM-003**: ログインID・パスワードを変更できる
- **FR-NM-004**: 変更履歴を記録する

**データ要件**
```json
{
  "nurseryId": "number",
  "name": "string",
  "loginId": "string",
  "password": "string (hashed)",
  "address": "string",
  "phoneNumber": "string",
  "email": "string",
  "principalName": "string (園長名)",
  "establishedDate": "date",
  "logoUrl": "string"
}
```

#### 2.1.2 クラス管理

**機能要件**
- **FR-CM-001**: 年度ごとにクラスを作成できる
- **FR-CM-002**: クラス名、年齢範囲、定員を設定できる
- **FR-CM-003**: クラスを編集・削除できる
- **FR-CM-004**: 次年度のクラス構成を事前登録できる（年度後半から）
- **FR-CM-005**: クラス一覧をテーブル形式で表示し、一括編集できる
- **FR-CM-006**: 学年レベル（GradeLevel）を設定できる

**ユーザーインターフェース要件**
- **UI-CM-001**: クラス一覧をテーブル形式で表示（Excel風の編集UI）
- **UI-CM-002**: 行内編集でクラス名・年齢・定員を変更
- **UI-CM-003**: 新規行追加ボタンでクラス追加
- **UI-CM-004**: 削除チェックボックスで一括削除
- **UI-CM-005**: 年度切り替えタブで過去・現在・次年度を切り替え

**データ要件**
```json
{
  "nurseryId": "number",
  "classId": "string",
  "name": "string",
  "ageGroupMin": "number",
  "ageGroupMax": "number",
  "gradeLevel": "number",
  "maxCapacity": "number",
  "academicYear": "number (年度)"
}
```

#### 2.1.3 園児管理

**機能要件**
- **FR-CHM-001**: 園児を新規登録できる
- **FR-CHM-002**: 園児の基本情報（名前、生年月日、性別、クラス等）を編集できる
- **FR-CHM-003**: 医療情報・アレルギー・特記事項を登録できる
- **FR-CHM-004**: 園児の顔写真をアップロードできる
- **FR-CHM-005**: 進級処理（次年度のクラスへ自動移動）を実行できる
- **FR-CHM-006**: 卒園処理（IsActive = false）を実行できる
- **FR-CHM-007**: 園児一覧をクラスでフィルタリングできる
- **FR-CHM-008**: 園児情報を一括インポート（CSV/Excel）できる
- **FR-CHM-009**: テーブル形式で園児一覧を表示し、行内編集できる

**ユーザーインターフェース要件**
- **UI-CHM-001**: 園児一覧をテーブル形式で表示（Excel風の編集UI）
- **UI-CHM-002**: クラスフィルター、在園中/卒園済みフィルター
- **UI-CHM-003**: 行内編集で名前・生年月日・クラスを変更
- **UI-CHM-004**: 詳細編集モーダルで医療情報・写真等を編集
- **UI-CHM-005**: 進級処理ボタン（一括進級ウィザード）
- **UI-CHM-006**: 卒園処理ボタン（該当園児の一括選択）

**データ要件**
```json
{
  "nurseryId": "number",
  "childId": "number",
  "name": "string",
  "dateOfBirth": "date",
  "gender": "string",
  "classId": "string",
  "medicalNotes": "string",
  "specialInstructions": "string",
  "enrollmentDate": "date",
  "isActive": "boolean",
  "photoUrl": "string"
}
```

**ビジネスルール**
- **BR-CHM-001**: 進級処理は年度末（2月〜3月）のみ実行可能
- **BR-CHM-002**: 卒園処理は最高学年の園児のみ対象
- **BR-CHM-003**: 進級処理実行前に次年度クラスが登録されている必要がある

#### 2.1.4 スタッフ管理

**機能要件**
- **FR-SM-001**: スタッフ（先生）を新規登録できる
- **FR-SM-002**: スタッフの基本情報（名前、電話番号、メール、役職）を編集できる
- **FR-SM-003**: スタッフに複数のクラスを割り当てできる（主担任・副担任）
- **FR-SM-004**: 次年度のクラス割り当てを事前登録できる
- **FR-SM-005**: スタッフの有効/無効状態を管理できる
- **FR-SM-006**: テーブル形式でスタッフ一覧を表示し、行内編集できる

**ユーザーインターフェース要件**
- **UI-SM-001**: スタッフ一覧をテーブル形式で表示（Excel風の編集UI）
- **UI-SM-002**: 行内編集で名前・電話番号・メールを変更
- **UI-SM-003**: クラス割り当ては詳細編集モーダルで管理
- **UI-SM-004**: 複数クラス選択UI（主担任/副担任の役割指定）
- **UI-SM-005**: 年度切り替えタブで次年度の割り当てを事前設定

**データ要件**
```json
{
  "nurseryId": "number",
  "staffId": "number",
  "name": "string",
  "phoneNumber": "string",
  "email": "string",
  "role": "string (Teacher/Admin/Clerk)",
  "position": "string",
  "isActive": "boolean",
  "classAssignments": [
    {
      "classId": "string",
      "assignmentRole": "string (MainTeacher/AssistantTeacher)",
      "academicYear": "number"
    }
  ]
}
```

#### 2.1.5 保護者アカウント管理

**機能要件**
- **FR-PM-001**: 保護者アカウントを新規作成できる
- **FR-PM-002**: 保護者の基本情報（名前、電話番号、メール、住所）を編集できる
- **FR-PM-003**: 保護者と園児の紐付けを管理できる（複数園児対応）
- **FR-PM-004**: 続柄、主連絡先、お迎え権限、レポート受信権限を設定できる
- **FR-PM-005**: 保護者アカウントを無効化できる
- **FR-PM-006**: テーブル形式で保護者一覧を表示し、フィルタリングできる

**ユーザーインターフェース要件**
- **UI-PM-001**: 保護者一覧をテーブル形式で表示
- **UI-PM-002**: 園児名でフィルタリング
- **UI-PM-003**: 詳細編集モーダルで園児との紐付けを管理
- **UI-PM-004**: 権限設定チェックボックス（お迎え権限、レポート受信等）

**データ要件**
```json
{
  "parentId": "number",
  "name": "string",
  "phoneNumber": "string (unique)",
  "email": "string",
  "address": "string",
  "isActive": "boolean",
  "children": [
    {
      "childId": "number",
      "childName": "string",
      "relationshipType": "string (Father/Mother/Grandfather等)",
      "isPrimaryContact": "boolean",
      "isAuthorizedPickup": "boolean",
      "canReceiveReports": "boolean"
    }
  ]
}
```

### 2.2 業務管理機能

#### 2.2.1 連絡管理（欠席・遅刻・お迎え）

**機能要件**
- **FR-NM-001**: 当日の全クラスの欠席・遅刻・お迎え連絡を一覧表示できる
- **FR-NM-002**: クラスごとにグループ化して表示できる
- **FR-NM-003**: 連絡の詳細（理由、時間、保護者名等）を確認できる
- **FR-NM-004**: スタッフに成り代わって返信・確認済みにできる
- **FR-NM-005**: 過去の連絡履歴を検索・閲覧できる
- **FR-NM-006**: 連絡ステータス（未確認/確認済み）を一括変更できる

**ユーザーインターフェース要件**
- **UI-NM-001**: ダッシュボードにクラスごとの連絡カードを表示
- **UI-NM-002**: 各カードに欠席人数・遅刻人数・お迎え人数を表示
- **UI-NM-003**: カードクリックで詳細一覧を表示
- **UI-NM-004**: テーブル形式で連絡一覧を表示（園児名、連絡種別、理由、時間）
- **UI-NM-005**: 返信入力欄とスタッフ選択ドロップダウン
- **UI-NM-006**: ステータス一括変更チェックボックス

**データ要件**
```json
{
  "notificationId": "number",
  "childId": "number",
  "childName": "string",
  "className": "string",
  "type": "string (absence/tardiness/pickup)",
  "targetDate": "date",
  "reason": "string",
  "pickupPerson": "string (optional)",
  "pickupTime": "time (optional)",
  "expectedArrivalTime": "time (optional)",
  "status": "string (submitted/acknowledged)",
  "submittedAt": "datetime",
  "staffResponse": "string",
  "respondedByStaffId": "number",
  "respondedAt": "datetime"
}
```

**ビジネスルール**
- **BR-NM-001**: 当日午前8時30分以降の欠席連絡は「遅延連絡」として強調表示
- **BR-NM-002**: 確認済みにした連絡は保護者アプリに通知される
- **BR-NM-003**: スタッフ選択が必須（誰が対応したかを記録）

#### 2.2.2 日報管理

**機能要件**
- **FR-RM-001**: 全クラスの日報一覧を表示できる
- **FR-RM-002**: 日報を新規作成できる（スタッフに成り代わって作成）
- **FR-RM-003**: 下書き・公開済みの日報を編集できる
- **FR-RM-004**: 日報を公開・非公開にできる
- **FR-RM-005**: 日報に写真を添付できる
- **FR-RM-006**: 日付・クラス・園児でフィルタリングできる
- **FR-RM-007**: 日報テンプレートを作成・管理できる

**ユーザーインターフェース要件**
- **UI-RM-001**: 日報一覧をテーブル形式で表示（日付、園児名、クラス、ステータス）
- **UI-RM-002**: フィルター（日付範囲、クラス、ステータス）
- **UI-RM-003**: 日報作成フォーム（リッチテキストエディタ）
- **UI-RM-004**: 作成者スタッフ選択ドロップダウン
- **UI-RM-005**: 写真アップロード・プレビュー機能
- **UI-RM-006**: 一括公開ボタン（選択した複数日報を一括公開）

**データ要件**
```json
{
  "reportId": "number",
  "childId": "number",
  "childName": "string",
  "staffId": "number",
  "staffName": "string",
  "reportDate": "date",
  "category": "string",
  "title": "string",
  "content": "string (rich text)",
  "tags": ["string"],
  "photos": ["string (URLs)"],
  "status": "string (draft/published)",
  "createdAt": "datetime",
  "publishedAt": "datetime",
  "createdByAdminUser": "boolean"
}
```

**ビジネスルール**
- **BR-RM-001**: 公開済み日報は削除不可（編集のみ可能）
- **BR-RM-002**: 日報公開時に保護者アプリにプッシュ通知送信
- **BR-RM-003**: 管理者が作成した日報には「管理者作成」フラグを付与

#### 2.2.3 カレンダー・イベント管理

**機能要件**
- **FR-EM-001**: イベントを新規作成できる
- **FR-EM-002**: イベントのカテゴリを設定できる（全体お知らせ、全体行事、学年活動、クラス活動、園休日）
- **FR-EM-003**: イベントの対象（全体、学年別、クラス別）を指定できる
- **FR-EM-004**: 繰り返しイベント（毎週、毎月）を作成できる
- **FR-EM-005**: イベントを編集・削除できる
- **FR-EM-006**: 月次・週次カレンダービューで表示できる
- **FR-EM-007**: イベント一覧をテーブル形式でエクスポートできる

**ユーザーインターフェース要件**
- **UI-EM-001**: カレンダービュー（月次・週次切り替え）
- **UI-EM-002**: イベント作成フォーム（モーダル）
- **UI-EM-003**: カテゴリ・対象選択ドロップダウン
- **UI-EM-004**: 繰り返し設定UI（頻度、終了日）
- **UI-EM-005**: イベント一覧テーブル（日付、タイトル、カテゴリ、対象）
- **UI-EM-006**: ドラッグ&ドロップでイベント日付変更

**データ要件**
```json
{
  "eventId": "number",
  "title": "string",
  "description": "string",
  "category": "string (general_announcement/general_event/grade_activity/class_activity/nursery_holiday)",
  "startDateTime": "datetime",
  "endDateTime": "datetime",
  "isAllDay": "boolean",
  "targetAudience": "string (all/grade/class)",
  "targetGradeLevel": "number (optional)",
  "targetClassId": "string (optional)",
  "isRecurring": "boolean",
  "recurrencePattern": "string (daily/weekly/monthly)",
  "recurrenceEndDate": "date (optional)",
  "requiresPreparation": "boolean",
  "preparationInstructions": "string"
}
```

**ビジネスルール**
- **BR-EM-001**: 全体イベントはすべての保護者・スタッフに表示
- **BR-EM-002**: 学年・クラス活動は該当学年・クラスの保護者・スタッフのみに表示
- **BR-EM-003**: イベント作成時に関連する保護者・スタッフにプッシュ通知送信

#### 2.2.4 お知らせ作成・配信

**機能要件**
- **FR-AM-001**: お知らせを新規作成できる（スタッフに成り代わって作成）
- **FR-AM-002**: お知らせの優先度を設定できる（高、中、低）
- **FR-AM-003**: お知らせの対象を指定できる（全体、学年別、クラス別）
- **FR-AM-004**: お知らせにファイル（PDF、Word）を添付できる
- **FR-AM-005**: お知らせを即時配信・予約配信できる
- **FR-AM-006**: 配信済みお知らせの閲覧状況を確認できる
- **FR-AM-007**: お知らせを編集・削除できる

**ユーザーインターフェース要件**
- **UI-AM-001**: お知らせ作成フォーム（リッチテキストエディタ）
- **UI-AM-002**: 優先度・対象・カテゴリ選択ドロップダウン
- **UI-AM-003**: ファイル添付UI（最大10MB）
- **UI-AM-004**: 配信日時設定（即時/予約）
- **UI-AM-005**: お知らせ一覧テーブル（日付、タイトル、対象、優先度、配信状況）
- **UI-AM-006**: 閲覧状況モーダル（既読率、未読保護者リスト）

**データ要件**
```json
{
  "announcementId": "number",
  "title": "string",
  "summary": "string",
  "content": "string (rich text)",
  "category": "string (emergency/cooperation/general/important)",
  "priority": "string (high/normal/low)",
  "targetAudience": "string (all/grade/class)",
  "targetGradeLevel": "number (optional)",
  "targetClassId": "string (optional)",
  "createdByStaffId": "number",
  "createdByAdminUser": "boolean",
  "scheduledAt": "datetime",
  "publishedAt": "datetime",
  "expiresAt": "datetime (optional)",
  "attachments": [
    {
      "fileName": "string",
      "fileUrl": "string",
      "fileSize": "number",
      "fileType": "string (pdf/docx)"
    }
  ],
  "readStatus": {
    "totalRecipients": "number",
    "readCount": "number",
    "readRate": "number"
  }
}
```

**ビジネスルール**
- **BR-AM-001**: お知らせ配信時に対象の保護者にプッシュ通知送信
- **BR-AM-002**: 緊急お知らせ（priority=high）は最優先で通知
- **BR-AM-003**: 予約配信は指定日時に自動配信

#### 2.2.5 写真管理・承認

**機能要件**
- **FR-PHM-001**: スタッフがアップロードした写真を一覧表示できる
- **FR-PHM-002**: 写真の公開範囲を設定できる（クラス、学年、全体、個別園児）
- **FR-PHM-003**: 写真を園児にタグ付けできる（複数園児対応）
- **FR-PHM-004**: 写真を承認・非承認にできる
- **FR-PHM-005**: 写真を削除できる
- **FR-PHM-006**: 写真を一括ダウンロードできる

**ユーザーインターフェース要件**
- **UI-PHM-001**: 写真一覧をグリッド形式で表示
- **UI-PHM-002**: フィルター（日付、クラス、公開範囲、承認状態）
- **UI-PHM-003**: 写真プレビュー・拡大表示モーダル
- **UI-PHM-004**: 園児タグ付けUI（写真に園児を複数選択）
- **UI-PHM-005**: 公開範囲設定ドロップダウン
- **UI-PHM-006**: 一括操作（承認、削除、ダウンロード）

**データ要件**
```json
{
  "photoId": "number",
  "fileName": "string",
  "url": "string",
  "thumbnailUrl": "string",
  "uploadedByStaffId": "number",
  "uploadedByAdminUser": "boolean",
  "uploadedAt": "datetime",
  "publishDate": "date",
  "description": "string",
  "privacySetting": "string (class/grade/school/individual)",
  "targetClassId": "string (optional)",
  "targetGradeLevel": "number (optional)",
  "taggedChildren": [
    {
      "childId": "number",
      "childName": "string"
    }
  ],
  "approvalStatus": "string (pending/approved/rejected)",
  "approvedAt": "datetime",
  "viewCount": "number",
  "downloadCount": "number"
}
```

**ビジネスルール**
- **BR-PHM-001**: 承認済み写真のみ保護者アプリに表示
- **BR-PHM-002**: 個別園児の写真はタグ付けされた園児の保護者のみ閲覧可能

### 2.3 レポート・分析機能

#### 2.3.1 ダッシュボード

**機能要件**
- **FR-DB-001**: ログイン直後にダッシュボードを表示する
- **FR-DB-002**: 当日の全クラスの欠席・遅刻・お迎え連絡をクラスごとに表示
- **FR-DB-003**: 各クラスの欠席人数・遅刻人数を表示
- **FR-DB-004**: 未確認の連絡件数を強調表示
- **FR-DB-005**: 今日のイベント・予定を表示
- **FR-DB-006**: 未公開の日報件数を表示
- **FR-DB-007**: 承認待ちの写真件数を表示

**ユーザーインターフェース要件**
- **UI-DB-001**: クラスカード形式でクラスごとの連絡状況を表示
- **UI-DB-002**: カード内に欠席・遅刻・お迎えの人数バッジ
- **UI-DB-003**: 未確認の連絡は赤色で強調
- **UI-DB-004**: 今日の予定リスト（時系列順）
- **UI-DB-005**: 通知カウンター（未公開日報、承認待ち写真）

**データ要件**
```json
{
  "date": "date",
  "classSummary": [
    {
      "classId": "string",
      "className": "string",
      "absenceCount": "number",
      "tardinessCount": "number",
      "pickupCount": "number",
      "unacknowledgedCount": "number"
    }
  ],
  "todayEvents": [
    {
      "eventId": "number",
      "title": "string",
      "startTime": "time"
    }
  ],
  "pendingTasks": {
    "unpublishedReports": "number",
    "pendingPhotoApprovals": "number"
  }
}
```

#### 2.3.2 出席状況レポート

**機能要件**
- **FR-AR-001**: 日別の出席状況（出席・欠席・遅刻）を表示できる
- **FR-AR-002**: 月別の出席状況を集計できる
- **FR-AR-003**: クラス別の出席率を表示できる
- **FR-AR-004**: 園児別の年度累計欠席・遅刻回数を表示できる
- **FR-AR-005**: 出席状況をCSV/Excelでエクスポートできる
- **FR-AR-006**: グラフ表示（月別推移、クラス比較）

**ユーザーインターフェース要件**
- **UI-AR-001**: 日付範囲選択カレンダー
- **UI-AR-002**: クラスフィルター（複数選択可）
- **UI-AR-003**: 出席状況テーブル（日付×園児のマトリックス）
- **UI-AR-004**: 月別集計グラフ（棒グラフ）
- **UI-AR-005**: クラス別出席率グラフ（円グラフ）
- **UI-AR-006**: エクスポートボタン（CSV/Excel）

**データ要件**
```json
{
  "reportType": "string (daily/monthly/yearly)",
  "dateFrom": "date",
  "dateTo": "date",
  "classFilters": ["string"],
  "attendanceData": [
    {
      "date": "date",
      "childId": "number",
      "childName": "string",
      "className": "string",
      "status": "string (present/absent/tardy)",
      "absenceType": "string (absence/sickness/familyEvent)",
      "notes": "string"
    }
  ],
  "summary": {
    "totalDays": "number",
    "presentDays": "number",
    "absentDays": "number",
    "tardyDays": "number",
    "attendanceRate": "number (percentage)"
  }
}
```

#### 2.3.3 園児別統計

**機能要件**
- **FR-CS-001**: 園児別の年度累計欠席回数を表示できる
- **FR-CS-002**: 園児別の年度累計遅刻回数を表示できる
- **FR-CS-003**: 園児別の出席率を表示できる
- **FR-CS-004**: 連絡履歴（欠席・遅刻理由）を表示できる
- **FR-CS-005**: 過去年度の統計も閲覧できる

**ユーザーインターフェース要件**
- **UI-CS-001**: 園児一覧テーブル（名前、クラス、欠席回数、遅刻回数、出席率）
- **UI-CS-002**: 並び替え（欠席回数順、遅刻回数順、出席率順）
- **UI-CS-003**: 園児詳細モーダル（月別推移グラフ、連絡履歴）
- **UI-CS-004**: 年度切り替えドロップダウン

**データ要件**
```json
{
  "academicYear": "number",
  "childId": "number",
  "childName": "string",
  "className": "string",
  "statistics": {
    "totalAbsences": "number",
    "totalTardiness": "number",
    "attendanceRate": "number (percentage)",
    "monthlyBreakdown": [
      {
        "month": "number",
        "absences": "number",
        "tardiness": "number"
      }
    ]
  },
  "contactHistory": [
    {
      "date": "date",
      "type": "string (absence/tardiness)",
      "reason": "string"
    }
  ]
}
```

#### 2.3.4 年度別アーカイブ

**機能要件**
- **FR-YA-001**: 年度ごとに集計データを保管する
- **FR-YA-002**: 過去年度のデータを閲覧できる
- **FR-YA-003**: 年度をまたいだ比較ができる
- **FR-YA-004**: 年度別データをエクスポートできる

**ユーザーインターフェース要件**
- **UI-YA-001**: 年度選択ドロップダウン（過去5年分）
- **UI-YA-002**: 年度別集計サマリー（総園児数、出席率、イベント数等）
- **UI-YA-003**: 年度比較グラフ（出席率推移、クラス構成変化）

**データ要件**
```json
{
  "academicYear": "number",
  "summary": {
    "totalChildren": "number",
    "totalClasses": "number",
    "totalStaff": "number",
    "averageAttendanceRate": "number",
    "totalEvents": "number",
    "totalReports": "number"
  },
  "archived": "boolean",
  "archivedAt": "datetime"
}
```

**ビジネスルール**
- **BR-YA-001**: 年度終了後（3月31日）に自動アーカイブ
- **BR-YA-002**: アーカイブされたデータは読み取り専用
- **BR-YA-003**: 過去5年分のデータを保持（それ以前は別途バックアップ）

### 2.4 年度管理機能

#### 2.4.1 年度切り替え準備

**機能要件**
- **FR-YP-001**: 年度後半（10月〜3月）に次年度のクラス構成を事前登録できる
- **FR-YP-002**: 次年度のスタッフクラス割り当てを事前設定できる
- **FR-YP-003**: 進級予定の園児リストを確認できる
- **FR-YP-004**: 卒園予定の園児リストを確認できる
- **FR-YP-005**: 次年度のカレンダーテンプレートを作成できる

**ユーザーインターフェース要件**
- **UI-YP-001**: 年度切り替えウィザード（ステップ形式）
- **UI-YP-002**: 次年度クラス作成画面
- **UI-YP-003**: 進級シミュレーション（現在のクラス → 次年度クラス）
- **UI-YP-004**: スタッフ配置シミュレーション
- **UI-YP-005**: 確認画面（全体プレビュー）

**データ要件**
```json
{
  "currentYear": "number",
  "nextYear": "number",
  "nextYearClasses": [
    {
      "classId": "string",
      "name": "string",
      "gradeLevel": "number",
      "maxCapacity": "number"
    }
  ],
  "promotionPlan": [
    {
      "childId": "number",
      "currentClassId": "string",
      "nextClassId": "string"
    }
  ],
  "staffAssignmentPlan": [
    {
      "staffId": "number",
      "nextYearAssignments": [
        {
          "classId": "string",
          "assignmentRole": "string"
        }
      ]
    }
  ],
  "graduationList": [
    {
      "childId": "number",
      "childName": "string",
      "graduationDate": "date"
    }
  ]
}
```

**ビジネスルール**
- **BR-YP-001**: 次年度設定は10月1日以降に可能
- **BR-YP-002**: 年度切り替え実行は3月31日以降
- **BR-YP-003**: 年度切り替え実行前に次年度データの完全性チェック

## 3. 非機能要件

### 3.1 パフォーマンス要件
- **NFR-P-001**: ページ読み込み時間は3秒以内
- **NFR-P-002**: テーブル表示は最大1000行まで対応（ページネーション）
- **NFR-P-003**: 一括処理（進級、卒園）は5分以内に完了

### 3.2 セキュリティ要件
- **NFR-S-001**: パスワードはBCryptでハッシュ化
- **NFR-S-002**: JWTトークンは1日有効（リフレッシュトークン対応）
- **NFR-S-003**: HTTPS通信必須
- **NFR-S-004**: ファイルアップロードはウイルススキャン実施
- **NFR-S-005**: SQLインジェクション対策（パラメータ化クエリ）

### 3.3 ユーザビリティ要件
- **NFR-U-001**: レスポンシブデザイン（PC、タブレット対応）
- **NFR-U-002**: Excel風の直感的なテーブル編集UI
- **NFR-U-003**: キーボードショートカット対応（Ctrl+S保存等）
- **NFR-U-004**: エラーメッセージは日本語で分かりやすく表示

### 3.4 互換性要件
- **NFR-C-001**: Chrome、Edge、Firefox最新版対応
- **NFR-C-002**: モバイルアプリと同一APIバックエンド使用
- **NFR-C-003**: データベーススキーマはモバイルアプリと共有

### 3.5 保守性要件
- **NFR-M-001**: エラーログは構造化ログ（Serilog）で記録
- **NFR-M-002**: 操作ログ（監査ログ）を記録
- **NFR-M-003**: データベースバックアップは日次自動実行

## 4. 画面遷移図

```
ログイン画面
    ↓
ダッシュボード
    ├→ マスタ管理
    │   ├→ 保育園情報管理
    │   ├→ クラス管理（一覧・編集）
    │   ├→ 園児管理（一覧・詳細・進級・卒園）
    │   ├→ スタッフ管理（一覧・詳細・クラス割り当て）
    │   └→ 保護者管理（一覧・詳細・園児紐付け）
    │
    ├→ 業務管理
    │   ├→ 連絡管理（一覧・詳細・返信）
    │   ├→ 日報管理（一覧・作成・編集・公開）
    │   ├→ カレンダー管理（カレンダービュー・イベント作成）
    │   ├→ お知らせ管理（一覧・作成・配信状況）
    │   └→ 写真管理（一覧・承認・タグ付け）
    │
    ├→ レポート・分析
    │   ├→ 出席状況レポート（日別・月別・クラス別）
    │   ├→ 園児別統計（欠席・遅刻回数）
    │   └→ 年度別アーカイブ（過去年度データ）
    │
    └→ 年度管理
        ├→ 次年度クラス設定
        ├→ 進級シミュレーション
        ├→ スタッフ配置計画
        └→ 年度切り替え実行
```

## 5. データフロー図

```
保護者（モバイルアプリ）
    ↓ 欠席・遅刻連絡送信
API (ASP.NET Core)
    ↓ データ保存
Database (Azure SQL)
    ↓ データ取得
管理画面（デスクトップWebアプリ）
    ↓ 確認・返信
API (ASP.NET Core)
    ↓ プッシュ通知送信
保護者（モバイルアプリ）
```

## 6. 技術スタック

### 6.1 フロントエンド
- **フレームワーク**: React 19.1 + TypeScript
- **ビルドツール**: Vite
- **スタイリング**: Tailwind CSS
- **状態管理**: React Context API + useReducer
- **UIコンポーネント**: Material-UI (MUI) または Ant Design
- **テーブルUI**: TanStack Table (React Table)
- **フォーム管理**: React Hook Form
- **バリデーション**: Zod
- **HTTP通信**: Axios

### 6.2 バックエンド（モバイルアプリと共有）
- **フレームワーク**: ASP.NET Core 8 Web API
- **認証**: JWT Bearer Token
- **ORM**: Entity Framework Core 8
- **ログ**: Serilog
- **バリデーション**: FluentValidation
- **DTO マッピング**: AutoMapper

### 6.3 データベース（モバイルアプリと共有）
- **RDBMS**: Azure SQL Database
- **スキーマ**: モバイルアプリと同一スキーマを使用
- **接続**: Entity Framework Core 8経由
- **バックアップ**: Azure SQL Databaseの自動バックアップ機能使用
- **スケーリング**: DTU/vCoreベースのスケーリング対応
- **パフォーマンス**: インデックス最適化、クエリチューニング

### 6.4 インフラ（Azure環境）
- **Webアプリホスティング**: Azure App Service（Windows または Linux）
- **API**: モバイルアプリと同一のAzure App Service
- **ストレージ**: Azure Blob Storage（写真・添付ファイル）
- **CDN**: Azure CDN（静的ファイル配信）
- **CI/CD**: Azure DevOps または GitHub Actions
- **監視**: Azure Application Insights
- **セキュリティ**: Azure Key Vault（接続文字列・シークレット管理）

## 7. 開発スケジュール（参考）

### Phase 1: 基盤構築（2週間）
- 認証システム実装（ログインID・パスワード）
- 基本レイアウト実装（サイドバー、ヘッダー）
- ダッシュボード画面実装

### Phase 2: マスタ管理（3週間）
- 保育園情報管理
- クラス管理
- 園児管理（新規登録・編集）
- スタッフ管理
- 保護者管理

### Phase 3: 業務管理（4週間）
- 連絡管理（欠席・遅刻・お迎え）
- 日報管理
- カレンダー・イベント管理
- お知らせ管理
- 写真管理

### Phase 4: レポート・分析（2週間）
- 出席状況レポート
- 園児別統計
- 年度別アーカイブ

### Phase 5: 年度管理（2週間）
- 進級処理
- 卒園処理
- 次年度設定
- 年度切り替え

### Phase 6: テスト・改善（2週間）
- 統合テスト
- ユーザビリティテスト
- パフォーマンスチューニング
- バグ修正

**合計**: 約15週間（3.5ヶ月）

## 8. 今後の課題・拡張機能

### 8.1 機能拡張案
- [ ] レポートテンプレート機能（日報フォーマット作成）
- [ ] 園児の成長記録グラフ（身長・体重推移）
- [ ] 保護者からのアンケート機能
- [ ] スタッフ勤怠管理
- [ ] 給食献立管理
- [ ] 入園申し込み管理

### 8.2 技術改善案
- [ ] PWA化（オフライン対応）
- [ ] リアルタイム通知（SignalR）
- [ ] データエクスポート自動化（定期レポート配信）
- [ ] AI活用（日報自動生成補助）

## 9. 関連ドキュメント

- [モバイルアプリ要件定義書](../mobile/requirements.md)
- [API設計仕様書](../mobile/api-design.md)
- [データベース設計書](../mobile/database-design.md)
- [認証技術仕様書](../mobile/specifications/authentication-technical-spec.md)

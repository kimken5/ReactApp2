# 保育園保護者向けモバイルアプリ要件定義書

## 概要

本要件定義書では、保護者が保育園との連絡を行うためのモバイルアプリケーションの要件を定義します。このアプリは、React ベースのモバイルインターフェースを通じて、保育園の管理用ウェブアプリケーションと同じ C# バックエンド API に接続し、日常的なコミュニケーション機能を提供します。

## 1. 製品概要

### 1.1 ビジョン
保護者と保育園スタッフの間のシームレスなデジタルコミュニケーションブリッジを構築し、子どもたちの日常活動、出席状況、特別なイベントに関するリアルタイム情報共有を可能にします。

### 1.2 成功指標
- **導入率**: 3ヶ月以内に登録家庭の90%が積極的にアプリを利用
- **日次アクティブユーザー**: 保育期間中、登録保護者の70%が毎日アプリを利用
- **コミュニケーション効率**: 定型的な連絡のための電話が80%削減
- **ユーザー満足度**: アプリストアで平均4.5+星評価

### 1.3 対象ユーザー
- **主要対象**: 保育園児の保護者・保護者
- **二次対象**: 保育園スタッフ（スマホ対応機能）
  - クラス担当の先生が中心ユーザー
  - 自分のクラスの園児に関する業務をスマホで対応

## 2. 機能仕様

### 2.1 欠席・遅刻・お迎え連絡機能 (Absence/Lateness/Pickup Notification Feature)

#### 2.1.1 機能要件
- **FR-AN-001**: 保護者は理由選択付きで欠席通知を提出できる
- **FR-AN-002**: 保護者は予定到着時刻付きで遅刻通知を提出できる
- **FR-AN-003**: 保護者はお迎え者と時間を指定してお迎え通知を提出できる
- **FR-AN-004**: 通知は最大7日前から当日まで提出可能
- **FR-AN-005**: スタッフは欠席・遅刻・お迎え通知をリアルタイムで受信する
- **FR-AN-006**: 保護者は提出した通知を修正・キャンセルできる（未処理の場合）

#### 2.1.2 ユーザーフロー要件
- **UF-AN-001**: 園児一覧画面で園児を選択する
- **UF-AN-002**: 各園児の行に「連絡ボタン」と「履歴ボタン」を配置する
- **UF-AN-003**: 連絡ボタンクリック時に連絡種別選択フォームが開く
- **UF-AN-004**: 履歴ボタンクリック時に対象園児の連絡履歴一覧が表示される

#### 2.1.3 ユーザーインターフェース要件
- **UI-AN-001**: 園児一覧画面での園児情報表示（名前、クラス）
- **UI-AN-002**: 連絡種別選択（欠席、遅刻、お迎え）
- **UI-AN-003**: 対象日選択用の日付ピッカー
- **UI-AN-004**: お迎え連絡時のお迎え者入力欄（必須）
- **UI-AN-005**: お迎え連絡時のお迎え時間選択（必須）
- **UI-AN-006**: 理由入力用のテキストエリア（必須）
- **UI-AN-007**: 補足事項入力用のオプション自由記述欄
- **UI-AN-008**: 提出された連絡詳細を表示する確認画面
- **UI-AN-009**: 連絡配信状況を示すステータス表示

#### 2.1.4 お迎え連絡仕様
- **PU-AN-001**: 早めのお迎え（通常時間より早い場合）
- **PU-AN-002**: 遅めのお迎え（通常時間より遅い場合）
- **PU-AN-003**: お迎え者の変更（保護者以外が迎えに来る場合）
- **PU-AN-004**: 理由例：家族の用事、仕事の都合、病院受診、急用等

#### 2.1.5 ビジネスルール
- **BR-AN-001**: 当日欠席の通知は午前8時30分までに提出する必要がある
- **BR-AN-002**: 遅刻通知は午前11時まで受け付ける
- **BR-AN-003**: お迎え通知は当日午後2時まで受け付ける
- **BR-AN-004**: スタッフは業務時間内に30分以内に受信確認を行う必要がある
- **BR-AN-005**: 連続5日以上の欠席はスタッフとの直接連絡が必要
- **BR-AN-006**: お迎え者が保護者以外の場合は身分確認が必要

#### 2.1.6 データ要件
```json
{
  "childId": "string",
  "notificationType": "absence|lateness|pickup",
  "targetDate": "date",
  "reason": "string (required)",
  "pickupPerson": "string (required for pickup only)",
  "pickupTime": "time (required for pickup only)",
  "expectedArrivalTime": "time (for lateness only)",
  "additionalNotes": "string (optional)",
  "submittedAt": "datetime",
  "status": "submitted|acknowledged", // submitted:提出済み, acknowledged:確認済み
  "staffResponse": "string (optional)"
}
```

### 2.2 園児一覧・連絡管理機能 (Children List & Contact Management Feature)

#### 2.2.1 機能要件
- **FR-CL-001**: 保護者に関連付けられた全園児の一覧表示を提供する
- **FR-CL-002**: 各園児の基本情報（名前、クラス）をシンプルに表示する
- **FR-CL-003**: 各園児行に「連絡」と「履歴」ボタンを配置する
- **FR-CL-004**: 連絡ボタンから欠席・遅刻・お迎え連絡フォームへ遷移する
- **FR-CL-005**: 履歴ボタンから対象園児の連絡履歴一覧へ遷移する

#### 2.2.2 ユーザーインターフェース要件
- **UI-CL-001**: 園児情報をシンプルに表示（名前、クラスのみ）
- **UI-CL-002**: 各園児行に「連絡する」と「履歴」ボタンを明確に配置
- **UI-CL-003**: 簡潔で見やすいリスト形式での表示

#### 2.2.3 連絡履歴表示要件
- **FR-CH-001**: 対象園児の連絡履歴を時系列降順で表示する
- **FR-CH-002**: 連絡種別（欠席・遅刻・お迎え）による絞り込み機能
- **FR-CH-003**: 日付範囲による絞り込み機能
- **FR-CH-004**: 各連絡の詳細表示（送信日時、種別、内容、状況）
- **FR-CH-005**: スタッフからの返信がある場合は表示

#### 2.2.4 データ要件
```json
{
  "childId": "string",
  "childName": "string", 
  "class": "string",
  "isActive": "boolean",
  "contactHistory": [{
    "id": "string",
    "type": "absence|lateness|pickup",
    "submittedAt": "datetime",
    "targetDate": "date",
    "reason": "string",
    "status": "submitted|acknowledged", // submitted:提出済み, acknowledged:確認済み
    "staffResponse": "string (optional)"
  }]
}
```

### 2.3 通知設定機能 (Notification Settings Feature)

#### 2.2.1 機能要件
- **FR-NS-001**: プッシュ通知の全体ON/OFF切り替えができる
- **FR-NS-002**: レポート通知のON/OFF切り替えができる
- **FR-NS-003**: 保護者連絡の園確認通知のON/OFF切り替えができる
- **FR-NS-004**: イベント通知のON/OFF切り替えができる
- **FR-NS-005**: お知らせ通知のON/OFF切り替えができる
- **FR-NS-006**: 各通知設定は個別に制御可能である
- **FR-NS-007**: プッシュ通知がOFFの場合、全ての通知が無効化される

#### 2.2.2 ユーザーインターフェース要件
- **UI-NS-001**: 各通知項目にON/OFFトグルスイッチを表示
- **UI-NS-002**: プッシュ通知がOFFの場合、他の設定を無効化表示
- **UI-NS-003**: 設定変更時に即座に視覚的フィードバックを提供
- **UI-NS-004**: 各通知設定項目にアイコンを表示（📱📋✅🎉📢）

#### 2.2.3 ビジネスルール
- **BR-NS-001**: プッシュ通知がOFFの場合、個別通知設定も自動的に無効化される
- **BR-NS-002**: 設定変更は即座にサーバーに保存される
- **BR-NS-003**: 通知設定のデフォルト値は全てONである

#### 2.2.4 データ要件
```json
{
  "userId": "string",
  "pushNotificationsEnabled": "boolean",
  "reportNotificationsEnabled": "boolean", 
  "parentContactConfirmationEnabled": "boolean",
  "eventNotificationsEnabled": "boolean",
  "announcementNotificationsEnabled": "boolean",
  "updatedAt": "datetime"
}
```

### 2.3 お知らせ通知機能 (Announcement Notification Feature)

#### 2.3.1 機能要件
- **FR-AN-001**: 緊急を要するお知らせ通知を受信する（警報発令時の登園判断など）
- **FR-AN-002**: 保護者協力依頼のお知らせ通知を受信する（運動会準備・片付けなど）
- **FR-AN-003**: 一般的な園からの連絡事項を受信する
- **FR-AN-004**: お知らせ通知の優先度別表示に対応する
- **FR-AN-005**: お知らせ通知の既読・未読管理を行う

#### 2.3.2 お知らせカテゴリ
- **緊急通知**: 警報発令、登園判断、緊急連絡
- **協力依頼**: 行事準備、片付け、ボランティア募集
- **一般連絡**: 日程変更、持ち物のお知らせ、園からの報告
- **重要通知**: 入園説明会、保護者会、重要な連絡事項

#### 2.3.3 ユーザーインターフェース要件
- **UI-AN-001**: お知らせタイトルと概要を一覧表示
- **UI-AN-002**: 優先度別のアイコン表示（🚨⚠️📢📝）
- **UI-AN-003**: タップ時にダイアログで詳細内容を表示
- **UI-AN-004**: 既読・未読状態の視覚的区別
- **UI-AN-005**: 送信日時の表示

#### 2.3.4 データ要件
```json
{
  "announcementId": "string",
  "title": "string",
  "summary": "string",
  "content": "string",
  "category": "emergency|cooperation|general|important",
  "priority": "high|normal|low",
  "targetAudience": "all|specific_class|specific_child",
  "createdBy": "string (staff member)",
  "createdAt": "datetime",
  "expiresAt": "datetime (optional)",
  "isRead": "boolean",
  "readAt": "datetime (optional)"
}
```

### 2.4 お知らせ一覧機能 (Announcement List Feature)

#### 2.4.1 機能要件
- **FR-AL-001**: 保育園とシステムのお知らせをタブで分離した一覧表示を提供する
- **FR-AL-002**: 保育園タブでは保育園からの全通知を表示（お知らせ、レポート、イベント、保護者連絡の園確認）
- **FR-AL-003**: システムタブではシステムからのお知らせ通知のみを表示
- **FR-AL-004**: 通知日時の降順で並び替えを行う（最新が最上位）
- **FR-AL-005**: お知らせ通知（保育園・システム問わず）はタップで詳細ダイアログ表示
- **FR-AL-006**: その他通知は各画面への誘導メッセージを表示する
- **FR-AL-007**: 未読・既読管理は行わない（シンプルな一覧表示）
- **FR-AL-008**: 保育園スタッフが送信したお知らせ通知に添付されたPDFまたはWordファイルを確認できる
- **FR-AL-009**: 添付ファイル付きお知らせには一覧にクリップアイコンを表示する
- **FR-AL-010**: PDFファイルはブラウザの新しいタブで表示できる
- **FR-AL-011**: Wordファイルはダウンロード機能を提供する

#### 2.4.2 タブ仕様
- **保育園からのお知らせ**: 保育園発信の全通知（お知らせ、レポート、イベント、保護者連絡の園確認）
- **システムからのお知らせ**: システム発信のお知らせ通知のみ

#### 2.4.3 通知種別と表示仕様
- **お知らせ通知**: 概要表示 → タップで詳細ダイアログ（保育園・システム共通）
- **レポート通知**: 概要表示 → タップで「レポート画面で確認してください」メッセージ
- **イベント通知**: 概要表示 → タップで「イベント画面で確認してください」メッセージ  
- **保護者連絡の園確認通知**: 概要表示 → タップで「欠席・遅刻画面で確認してください」メッセージ

#### 2.4.4 ユーザーインターフェース要件
- **UI-AL-001**: 保育園・システムタブによる通知分類表示
- **UI-AL-002**: 通知種別アイコンによる視覚的分類（📢📝📅📋）
- **UI-AL-003**: 通知日時の降順カード形式表示
- **UI-AL-004**: 各カード間の適切なマージン設定
- **UI-AL-005**: お知らせ通知の詳細表示ダイアログ（保育園・システム共通）
- **UI-AL-006**: 他通知タップ時の誘導メッセージ表示
- **UI-AL-007**: 通知概要のプレビュー表示（1-2行）
- **UI-AL-008**: 添付ファイルがある場合は日時の下にクリップアイコン📎を表示
- **UI-AL-009**: 詳細ダイアログに添付ファイル一覧を表示（ファイル名、サイズ、種別）
- **UI-AL-010**: PDFファイルには「表示」ボタン、Wordファイルには「ダウンロード」ボタンを配置

#### 2.4.5 データ要件
```json
{
  "notificationId": "string",
  "userId": "string",
  "type": "announcement|report|event|absence",
  "source": "nursery|system",
  "title": "string",
  "summary": "string",
  "detail": "string (optional - お知らせ通知のみ)",
  "relatedId": "string (optional - 関連するreportId, eventId等)",
  "priority": "high|medium|low",
  "attachments": [{
    "id": "string",
    "fileName": "string",
    "fileType": "pdf|docx|doc",
    "fileSize": "number (bytes)",
    "fileUrl": "string",
    "uploadedAt": "datetime"
  }],
  "createdAt": "datetime"
}
```

#### 2.4.6 添付ファイル技術要件
- **TR-AL-001**: 対応ファイル形式はPDF (.pdf)、Microsoft Word (.doc, .docx)
- **TR-AL-002**: ファイルサイズ制限は1ファイルあたり最大10MB
- **TR-AL-003**: PDFファイルはブラウザのネイティブビューアで表示
- **TR-AL-004**: Wordファイルは適切なMIMEタイプでダウンロード配信
- **TR-AL-005**: ファイルURLは一時的なPresigned URLまたはトークン認証対応

#### 2.4.7 添付ファイルセキュリティ要件
- **PS-AL-001**: 添付ファイルは認証済みユーザーのみアクセス可能
- **PS-AL-002**: ファイルダウンロード時のアクセスログ記録
- **PS-AL-003**: ウイルススキャンによる安全性確認
- **PS-AL-004**: ファイル名の不正文字エスケープ処理
- **PS-AL-005**: 保護者は自分の子どもに関連するお知らせの添付ファイルのみアクセス可能

### 2.5 カスタマイズ設定機能 (Customization Settings Feature)

#### 2.5.1 機能要件
- **FR-CS-001**: フォントサイズのカスタマイズ設定を提供する
- **FR-CS-002**: アプリケーション言語の切り替え機能を提供する
- **FR-CS-003**: 設定変更の即座反映機能を提供する
- **FR-CS-004**: 設定のリセット機能を提供する
- **FR-CS-005**: 設定変更履歴の保存機能を提供する

#### 2.5.2 フォントサイズ設定要件
- **FR-FS-001**: 4段階のフォントサイズレベルを提供する（小・中・大・特大）
- **FR-FS-002**: アクセシビリティ考慮した読みやすいサイズ範囲の提供
- **FR-FS-003**: 全画面でのフォントサイズ統一適用

#### 2.5.3 多言語設定要件
- **FR-ML-001**: 日本語、英語、中国語（簡体字）、韓国語の4言語をサポート
- **FR-ML-002**: 言語切り替え時の即座反映機能
- **FR-ML-003**: 日付・時刻表示の各言語対応ローカライゼーション
- **FR-ML-004**: 通知メッセージの多言語対応
- **FR-ML-005**: 言語設定のデバイス設定との連携

#### 2.5.4 ユーザーインターフェース要件

##### 画面構成
- **UI-CS-001**: タブ形式で3つの設定カテゴリを表示（フォント、言語、通知）
- **UI-CS-002**: 画面上部にダッシュボードへの戻るボタンを配置
- **UI-CS-003**: 設定保存後に成功メッセージを表示（緑色の確認表示）
- **UI-CS-004**: 画面下部に「初期設定に戻す」と「保存」ボタンを配置

##### フォント設定タブ
- **UI-FS-001**: 4段階のフォントサイズを選択可能（小・中・大・特大）
- **UI-FS-002**: 各フォントサイズにラジオボタンとプレビュー表示を提供
- **UI-FS-003**: 小=12px、中=14px（デフォルト）、大=16px、特大=18px
- **UI-FS-004**: 選択中のフォントサイズは青色の背景で強調表示

##### 言語設定タブ
- **UI-ML-001**: 4言語（日本語、英語、中国語、韓国語）をラジオボタンで選択
- **UI-ML-002**: 各言語に国旗の絵文字アイコンを表示（🇯🇵🇺🇸🇨🇳🇰🇷）
- **UI-ML-003**: 言語名を母国語表記で表示（日本語、English、简体中文、한국어）
- **UI-ML-004**: 各言語に日本語説明を併記（英語、中国語簡体字、韓国語）
- **UI-ML-005**: 選択中の言語は青色の背景で強調表示

##### 通知設定タブ
- **UI-NS-001**: 5種類の通知設定を個別にON/OFF可能
  - プッシュ通知（全体制御）：緑色強調、📱アイコン
  - レポート通知：青色強調、📄アイコン
  - 連絡確認通知：黄色強調、🏠アイコン
  - イベント通知：青色強調、📅アイコン
  - お知らせ通知：黄色強調、🔔アイコン
- **UI-NS-002**: プッシュ通知がOFFの場合、他の通知設定を無効化（グレーアウト）
- **UI-NS-003**: プッシュ通知がOFFの場合、個別通知のチェックボックスを操作不可に設定
- **UI-NS-004**: 各通知設定にチェックボックスとアイコン、説明文を表示
- **UI-NS-005**: 有効な通知設定には「通知が有効になっています」確認メッセージを表示
- **UI-NS-006**: プッシュ通知には「全ての通知を受け取る」説明と「無効にすると全て停止」警告を表示

##### ボタンとアクション
- **UI-AC-001**: 「初期設定に戻す」ボタン：灰色の枠線ボタン、リセットアイコン付き
- **UI-AC-002**: 「保存」ボタン：青色の塗りつぶしボタン、保存アイコン付き
- **UI-AC-003**: 保存中は「保存」ボタンを無効化し、灰色表示
- **UI-AC-004**: 保存成功時に緑色の確認バナーを画面上部に3秒間表示

#### 2.5.5 技術要件
- **TR-CS-001**: 設定変更の即座適用（リロード不要）
- **TR-CS-002**: ローカルストレージによる設定保持
- **TR-CS-003**: サーバーサイドでの設定同期
- **TR-CS-004**: 言語ファイルの効率的な読み込み

#### 2.5.6 データ要件

##### カスタマイズ設定（Parentsテーブルに統合）
```sql
-- Parentsテーブルに以下のカラムを追加
FontSize NVARCHAR(10) NOT NULL DEFAULT 'medium',  -- small|medium|large|xlarge
Language NVARCHAR(10) NOT NULL DEFAULT 'ja'       -- ja|en|zh-CN|ko
```

##### 通知設定（Parentsテーブルに統合）
```sql
-- Parentsテーブルに以下のカラムを追加
PushNotificationsEnabled BIT NOT NULL DEFAULT 1,        -- プッシュ通知全体制御
AbsenceConfirmationEnabled BIT NOT NULL DEFAULT 1,      -- 連絡確認通知
DailyReportEnabled BIT NOT NULL DEFAULT 1,              -- レポート通知
EventNotificationEnabled BIT NOT NULL DEFAULT 1,        -- イベント通知
AnnouncementEnabled BIT NOT NULL DEFAULT 1              -- お知らせ通知
```

##### フロントエンド用DTO
```typescript
interface NotificationSettings {
  id: number;
  parentId: number;
  pushNotificationsEnabled: boolean;
  absenceConfirmationEnabled: boolean;
  dailyReportEnabled: boolean;
  eventNotificationEnabled: boolean;
  announcementEnabled: boolean;
  createdAt: string;
  updatedAt?: string;
}
```

#### 2.5.7 言語マッピング
- **ja**: 日本語（デフォルト）
- **en**: English（英語）
- **zh-CN**: 简体中文（中国語簡体字）
- **ko**: 한국어（韓国語）

#### 2.5.8 API仕様

##### 通知設定取得
- **エンドポイント**: `GET /api/Notifications/settings/{parentId}`
- **レスポンス**: NotificationSettings DTO（Parentsテーブルから取得）

##### 通知設定更新
- **エンドポイント**: `PUT /api/Notifications/settings/{parentId}`
- **リクエストボディ**: UpdateNotificationSettingsDto
  ```typescript
  {
    pushNotificationsEnabled?: boolean;
    absenceConfirmationEnabled?: boolean;
    dailyReportEnabled?: boolean;
    eventNotificationEnabled?: boolean;
    announcementEnabled?: boolean;
  }
  ```
- **処理**: Parentsテーブルの該当カラムを更新

##### カスタマイズ設定（フォント・言語）
- **保存先**: 現在はフロントエンドのローカルストレージ（モックデータ）
- **将来実装**: Parentsテーブルの FontSize, Language カラムへの保存API

### 2.6 カレンダー・行事表示機能 (Calendar/Events Display Feature)

#### 2.5.1 機能要件
- **FR-CD-001**: イベント表示付きの月次・週次カレンダービューを表示する
- **FR-CD-002**: 定期活動や特別行事を含む日次スケジュールを表示する（7:00-21:00対応）
- **FR-CD-003**: カレンダー項目が選択されたときにイベント詳細を表示する
- **FR-CD-004**: 繰り返しイベント（日課、週間活動）に対応する
- **FR-CD-005**: 重要なイベントのプッシュ通知（24時間前）
- **FR-CD-006**: カテゴリ別のイベントフィルター（全体お知らせ、全体行事、学年活動、クラス活動、園休日）
- **FR-CD-007**: 週表示・月表示の動的切り替え機能
- **FR-CD-008**: マトリックス線による時間軸・日付軸の視覚的分離
- **FR-CD-009**: モバイルデバイス対応（スマートフォン・タブレット最適化）
- **FR-CD-010**: レスポンシブ表示（画面サイズに応じたレイアウト調整）
- **FR-CD-011**: イベント表示最適化（時間表記削除、タイトルのみ表示）
- **FR-CD-012**: モバイル環境でのイベントタイトル折り返し表示

#### 2.5.2 ユーザーインターフェース要件
- **UI-CD-001**: イベントタイプ別に色分けされた月表示・週表示カレンダー
- **UI-CD-002**: 詳細なスケジュールタイムラインを表示する週表示（6:00-21:00対応）
- **UI-CD-002-1**: 全日イベント（isAllDay=true）は週表示において時間軸の最上位に「全日」行を設けて表示する
- **UI-CD-003**: 説明、時間、要件を含むイベント詳細モーダル
- **UI-CD-004**: カテゴリフィルターボタン（すべて、全体お知らせ、全体行事、学年活動、クラス活動、園休日）
- **UI-CD-005**: 現在日へのクイックナビゲーション用の今日・今月ボタン
- **UI-CD-006**: 週表示・月表示の切り替えボタン
- **UI-CD-007**: 週間・月間ナビゲーション（前/次ボタン）
- **UI-CD-008**: マトリックス線表示（グリッド線による時間・日付の視覚的分離）
- **UI-CD-009**: モバイル最適化（レスポンシブデザイン、狭い画面での表示調整）
- **UI-CD-010**: イベントタイトル表示（時間表記なし、モバイルでは折り返し表示）
- **UI-CD-011**: 土曜日ヘッダー背景色（薄い青色）
- **UI-CD-012**: 当日ヘッダー・セル背景色（オレンジ色）

#### 2.5.3 イベントカテゴリ
- **全体お知らせ**: 園全体への重要な連絡、お知らせ事項
- **全体行事**: 運動会、卒園式、保護者会、入園式
- **学年活動**: 学年別遠足、学年保護者会、学年行事
- **クラス活動**: クラス内での工作活動、季節のお祝い、誕生日会
- **園休日**: 国民の祝日、園指定休日、長期休暇

#### 2.5.3.1 保護者用カレンダー仕様

##### 表示イベントの権限フィルタリング
保護者は紐づく園児の学年・クラスに基づいて表示イベントが自動的にフィルタリングされます。

**表示可能なカテゴリ:**
- ✅ **全体お知らせ**: すべての保護者が閲覧可能
- ✅ **全体行事**: すべての保護者が閲覧可能
- 🔒 **学年活動**: 紐づく園児の学年のみ閲覧可能
- 🔒 **クラス活動**: 紐づく園児のクラスのみ閲覧可能
- ✅ **園休日**: すべての保護者が閲覧可能

**権限チェックロジック (サーバーサイド実装):**
```
保護者に紐づく全園児の学年リストを取得
保護者に紐づく全園児のクラスリストを取得

イベントの対象学年 IN 園児の学年リスト → 表示
イベントの対象クラス IN 園児のクラスリスト → 表示
全体系カテゴリ (general_announcement, general_event, nursery_holiday) → 常に表示
```

**複数園児の例:**
- 保護者Aに園児2人（年少・さくら組、年長・ひまわり組）が紐づく場合
- 年少の学年活動、年長の学年活動が**両方とも**表示される
- さくら組のクラス活動、ひまわり組のクラス活動が**両方とも**表示される

**データソース:**
- `ParentChildRelationships` テーブル: 保護者と園児の紐付け
- `Children` テーブル: 園児のクラス・学年情報
- `Classes` テーブル: クラスの学年情報 (GradeLevel)

**実装方針:**
- APIレベルで権限フィルタリングを実施（クライアント側は権限を意識しない）
- 保護者用API (`/calendar/{year}/{month}`) で園児情報に基づく自動フィルタリング

#### 2.5.3.2 スタッフ用カレンダー仕様
スタッフ用カレンダー画面は**保護者用カレンダーと同じUI・機能**を使用します。

##### UI/機能の共通点
- **同一コンポーネント**: 保護者用とスタッフ用で同じCalendarコンポーネントを使用
- **同一機能**: 週表示/月表示切り替え、カテゴリフィルター、イベント詳細モーダル
- **同一デザイン**: レイアウト、色分け、レスポンシブ対応すべて同じ

##### 唯一の違い: 表示イベントの権限フィルタリング
スタッフは受け持ちクラス・学年に基づいて表示イベントが自動的にフィルタリングされます。

**表示可能なカテゴリ:**
- ✅ **全体お知らせ**: すべてのスタッフが閲覧可能
- ✅ **全体行事**: すべてのスタッフが閲覧可能
- 🔒 **学年活動**: 受け持ち学年のみ閲覧可能
- 🔒 **クラス活動**: 受け持ちクラスのみ閲覧可能
- ✅ **園休日**: すべてのスタッフが閲覧可能

**権限チェックロジック (サーバーサイド実装):**
```
イベントの対象学年 IN スタッフの受け持ち学年リスト → 表示
イベントの対象クラス IN スタッフの受け持ちクラスリスト → 表示
全体系カテゴリ (general_announcement, general_event, nursery_holiday) → 常に表示
```

**データソース:**
- `StaffClassAssignments` テーブル: スタッフの受け持ちクラス情報
- `Classes` テーブル: クラスの学年情報 (GradeLevel)

**実装方針:**
- APIレベルで権限フィルタリングを実施（クライアント側は権限を意識しない）
- 保護者用API (`/calendar/{year}/{month}`) とスタッフ用API (`/staff/calendar/{year}/{month}`) は異なるエンドポイントだが、同じレスポンス形式
- フロントエンドは同じCalendarコンポーネントを使用し、APIエンドポイントのみ切り替え

#### 2.5.4 データ要件
```json
{
  "eventId": "string",
  "title": "string",
  "description": "string",
  "category": "general_announcement|general_event|grade_activity|class_activity|nursery_holiday",
  "startDateTime": "datetime",
  "endDateTime": "datetime",
  "isAllDay": "boolean",
  "recurrencePattern": "none|daily|weekly|monthly",
  "targetAudience": "all|specific_class|specific_child",
  "requiresPreparation": "boolean",
  "preparationInstructions": "string (optional)",
  "createdBy": "string (staff member)",
  "lastModified": "datetime"
}
```

### 2.6 園内報告受信機能 (Nursery Reports Reception Feature)

#### 2.6.1 機能要件
- **FR-NR-001**: 各子どもの日次活動レポートを受信する
- **FR-NR-002**: 食事摂取レポート（摂取量、食べ物の好み）を閲覧する
- **FR-NR-003**: スタッフからの健康・行動観察を受信する
- **FR-NR-004**: 事故レポートがある場合はアクセスする
- **FR-NR-005**: お昼寝時間と睡眠の質レポートを閲覧する
- **FR-NR-006**: 新しいレポートのプッシュ通知を受信する
- **FR-NR-007**: レポート確認と返信は独立した機能として提供する
- **FR-NR-008**: 返信投稿時に自動的にレポート確認済みとする

#### 2.6.2 レポートタグシステム
園内レポートには以下の6種類のタグを複数組み合わせて分類できます：
- **活動** (🎨): 制作活動、遊び、学習活動、運動など
- **食事** (🍽️): 午前おやつ、昼食、午後おやつの摂取に関する報告
- **睡眠** (😴): お昼寝時間、睡眠の質に関する報告
- **ケガ** (🩹): 軽微なけがや治療が必要な傷の報告
- **事故** (⚠️): 転倒、衝突などの事故発生の報告
- **喧嘩** (😤): 友達との喧嘩やトラブルの報告

※1つのレポートに複数のタグを付与することができます（例：「食事」+「事故」タグ）

#### 2.6.3 ユーザーインターフェース要件
- **UI-NR-001**: 最新レポートを上位に表示するレポートタイムライン
- **UI-NR-002**: 簡単識別用のレポートタグアイコン（6種類のタグ対応）
- **UI-NR-003**: 詳細情報付きの展開可能レポートカード
- **UI-NR-004**: レポート内の写真添付（該当する場合）
- **UI-NR-011**: 写真アップロード時の公開範囲選択（学年・クラス単位）
- **UI-NR-012**: 各写真への説明・コメント入力機能
- **UI-NR-013**: アップロード済み写真の確認・削除機能
- **UI-NR-005**: 各レポートのスタッフ署名・名前
- **UI-NR-006**: 日付と内容で検索可能なレポート履歴
- **UI-NR-007**: 確認ボタンと返信ボタンの独立表示
- **UI-NR-008**: 確認後も返信可能なインターフェース
- **UI-NR-009**: レポート概要表示の廃止（詳細のみ表示）
- **UI-NR-010**: 総レポート数や未読数表示の廃止

#### 2.6.4 フィルター機能要件
- **FR-NR-009**: 開始日付フィルター（YYYY-MM-DD形式）
- **FR-NR-010**: 終了日付フィルター（YYYY-MM-DD形式）
- **FR-NR-011**: レポート内容のテキスト検索機能
- **FR-NR-012**: フィルター条件のクリア機能
- **FR-NR-013**: 現在適用中のフィルター条件の表示

#### 2.6.5 写真アップロード機能要件

##### 基本アップロード機能
- **FR-PH-001**: 複数写真の同時アップロード機能（最大10ファイル）
- **FR-PH-002**: 写真ファイル形式制限（JPG、PNG、HEIC、最大10MB）
- **FR-PH-003**: 写真自動圧縮・リサイズ機能（最大1920x1080px）
- **FR-PH-004**: アップロード進捗表示とエラーハンドリング

##### 公開範囲設定機能
- **FR-PH-005**: 写真ごとの公開範囲選択機能
  - 全体公開：園全体の保護者が閲覧可能
  - 学年限定：同一学年の保護者のみ閲覧可能
  - クラス限定：同一クラスの保護者のみ閲覧可能
- **FR-PH-006**: デフォルト公開範囲の設定機能（クラス限定）
- **FR-PH-007**: 公開範囲の一括変更機能

##### 写真管理機能
- **FR-PH-008**: 各写真への説明・コメント入力（最大200文字）
- **FR-PH-009**: アップロード済み写真のプレビュー表示
- **FR-PH-010**: 写真の個別削除機能
- **FR-PH-011**: 写真の順序変更機能（ドラッグ&ドロップ）
- **FR-PH-012**: 写真の編集機能（回転、トリミング）

##### セキュリティ・プライバシー機能
- **FR-PH-013**: 顔認識による園児プライバシー保護
- **FR-PH-014**: 不適切画像の自動検出・警告
- **FR-PH-015**: アップロード履歴の追跡・監査機能

#### 2.6.5 データ要件
```json
{
  "reportId": "string",
  "childId": "string",
  "childName": "string",
  "tags": ["活動", "食事", "睡眠", "ケガ", "事故", "喧嘩"],
  "reportDate": "date",
  "staffMember": "string",
  "staffPhoto": "string (optional)",
  "content": {
    "details": "string",
    "mood": "happy|neutral|upset|excited|sleepy|active",
    "participation": "active|moderate|low|shy|enthusiastic",
    "mealDetails": {
      "breakfast": {
        "percentage": "number",
        "menu": "string",
        "notes": "string (optional)"
      },
      "lunch": {
        "percentage": "number", 
        "menu": "string",
        "notes": "string (optional)"
      },
      "snack": {
        "percentage": "number",
        "menu": "string", 
        "notes": "string (optional)"
      },
      "generalNotes": "string (optional)"
    },
    "sleepDetails": {
      "napStartTime": "string (optional)",
      "napEndTime": "string (optional)",
      "duration": "number (minutes)",
      "quality": "good|fair|poor|restless|deep",
      "notes": "string (optional)"
    },
    "healthObservations": {
      "temperature": "number (optional)",
      "symptoms": ["string_array (optional)"],
      "medication": [{
        "name": "string",
        "time": "string", 
        "dosage": "string"
      }],
      "generalHealth": "good|fair|concern|sick",
      "notes": "string (optional)"
    },
    "activityDetails": {
      "activities": ["string_array"],
      "achievements": ["string_array (optional)"],
      "challenges": ["string_array (optional)"], 
      "socialInteraction": "excellent|good|fair|needs_support",
      "notes": "string (optional)"
    }
  },
  "attachments": [{
    "id": "string",
    "type": "photo|video|document",
    "url": "string",
    "thumbnailUrl": "string (optional)",
    "description": "string (optional, max 200 chars)",
    "fileName": "string",
    "fileSize": "number",
    "mimeType": "string",
    "width": "number (optional)",
    "height": "number (optional)",
    "uploadedAt": "datetime",
    "visibility": {
      "scope": "all_school|grade|class",
      "gradeId": "string (optional)",
      "classId": "string (optional)"
    },
    "metadata": {
      "camera": "string (optional)",
      "gpsLocation": "string (optional, removed for privacy)",
      "originalFileName": "string",
      "compression": "boolean",
      "rotation": "number (degrees)"
    }
  }],
  "parentAcknowledged": "boolean",
  "acknowledgedAt": "datetime (optional)",
  "parentNote": "string (optional)",
  "createdAt": "datetime",
  "updatedAt": "datetime (optional)"
}
```

#### 2.6.6 写真アップロードUIワークフロー要件

##### スタッフ側操作フロー
1. **写真選択**: ファイル選択ダイアログまたはドラッグ&ドロップ
2. **写真プレビュー**: アップロード前のサムネイル表示
3. **個別設定**: 各写真に対して以下を設定
   - 公開範囲選択（全園/学年/クラス）
   - 説明・コメント入力（200文字以内）
   - 順序調整（ドラッグ&ドロップ）
4. **確認・編集**: アップロード前の最終確認と修正
5. **アップロード実行**: 進捗表示付きでアップロード
6. **完了確認**: アップロード結果の表示

##### 保護者側閲覧フロー
1. **レポート閲覧**: レポート内に写真サムネイル表示
2. **写真拡大**: タップで全画面表示
3. **説明表示**: 写真に付けられたコメントの確認
4. **公開範囲確認**: どの範囲に公開されているかの表示

##### 管理機能要件
- **UI-PH-001**: 写真アップロード専用セクションの設置
- **UI-PH-002**: 公開範囲選択のわかりやすいUI（アイコン+テキスト）
- **UI-PH-003**: 説明入力用のテキストエリア（文字数カウンター付き）
- **UI-PH-004**: アップロード進捗バーとエラー表示
- **UI-PH-005**: 写真の順序変更用ドラッグハンドル
- **UI-PH-006**: 削除確認ダイアログの実装

### 2.7 写真・活動記録機能 (Photo/Activity Records Feature)

#### 2.7.1 機能要件
- **FR-PR-001**: 子どもの日次活動写真を閲覧する
- **FR-PR-002**: 高解像度写真を端末にダウンロードする
- **FR-PR-003**: 写真ダイアログ表示機能（詳細表示・ダウンロード）
- **FR-PR-004**: 日付と公開範囲別に整理された写真ギャラリーにアクセスする
- **FR-PR-005**: 新しい写真が利用可能になったときの通知を受信する

#### 2.7.2 写真閲覧仕様
- 保護者は写真の閲覧・ダウンロードのみ可能
- 写真のアップロードはスタッフ専用機能（セクション9.4参照）

#### 2.7.3 写真表示要件  
- **UI-PR-001**: グリッド表示とリスト表示の切り替え機能
- **UI-PR-002**: 各写真に公開日と公開範囲を表示
- **UI-PR-003**: 写真クリック時のダイアログ表示（公開日、公開範囲、説明・コメント、ダウンロードボタン）
- **UI-PR-004**: 月別と検索による写真フィルタリング機能

#### 2.7.4 プライバシーとセキュリティ要件
- **PS-PR-001**: 写真は子どもの登録された保護者のみがアクセス可能
- **PS-PR-002**: 公開範囲による写真表示制御
- **PS-PR-003**: 不正共有防止のためのアクセス制御
- **PS-PR-004**: 学年度終了後の写真自動削除
- **PS-PR-005**: 写真掲載には保護者の同意が必要

#### 2.7.5 技術要件
- **TR-PR-001**: JPEGとPNGフォーマットに対応（写真1枚あたり最大10MB）
- **TR-PR-002**: 高速読み込みのためのサムネイル生成
- **TR-PR-003**: 低速接続用のプログレッシブ画像読み込み
- **TR-PR-004**: 最近表示した写真のローカルキャッシュ
- **TR-PR-005**: CDN配信とクラウドストレージ連携

#### 2.7.6 データ要件
```json
{
  "photoId": "string",
  "url": "string",
  "thumbnailUrl": "string", 
  "fileName": "string",
  "uploadedAt": "datetime",
  "publishDate": "date",
  "uploadedBy": "string",
  "childrenIds": ["string_array"],
  "childrenNames": ["string_array"],
  "description": "string (optional)",
  "privacySetting": "class|grade|school",
  "viewCount": "number",
  "downloadCount": "number",
  "metadata": {
    "fileSize": "number",
    "dimensions": "width_x_height"
  }
}
```

## 3. 技術アーキテクチャ要件

### 3.1 フロントエンドアーキテクチャ
- **プラットフォーム**: TypeScript を使用した React 19.1
- **ビルドツール**: 開発・本番ビルド用の Vite
- **モバイル最適化**: プログレッシブウェブアプリ（PWA）機能
- **ブラウザ互換性**: モダンモバイルブラウザ（Chrome、Safari、Firefox）
- **レスポンシブデザイン**: モバイルファーストデザインアプローチ

### 3.2 バックエンドアーキテクチャ
- **フレームワーク**: ASP.NET Core 8 Web API
- **データベース**: Entity Framework Core を使用した SQL Server
- **認証**: リフレッシュトークン対応の JWT トークン
- **リアルタイム通信**: インスタント通知用の SignalR
- **ファイルストレージ**: 写真・文書用の Azure Blob Storage または AWS S3

### 3.3 API設計原則
- **RESTful API**: 全エンドポイントでREST規約に従う
- **APIバージョン管理**: v1、v2 API バージョンのサポート
- **レート制限**: リクエストスロットリングによる悪用防止
- **エラーハンドリング**: 一貫したエラーレスポンス形式
- **ドキュメント**: Swagger/OpenAPI仕様

### 3.4 データモデル コアエンティティ

```csharp
// 保育システムのコアエンティティ
public class Nursery
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string Address { get; set; }
    public string PhoneNumber { get; set; }
    public string Email { get; set; }
    public string PrincipalName { get; set; }
    public DateTime EstablishedDate { get; set; }
    public string LogoUrl { get; set; }
    public List<Class> Classes { get; set; }
}

public class Class
{
    public string Id { get; set; }
    public string Name { get; set; }
    public int NurseryId { get; set; }
    public int AgeGroupMin { get; set; }
    public int AgeGroupMax { get; set; }
    public int MaxCapacity { get; set; }
    public List<Teacher> Teachers { get; set; }
    public List<Child> Children { get; set; }
}

public class Teacher
{
    public int Id { get; set; }
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public string Email { get; set; }
    public string PhoneNumber { get; set; }
    public string ClassId { get; set; }
    public TeacherRole Role { get; set; } // MainTeacher, AssistantTeacher, SubstituteTeacher
    public DateTime HireDate { get; set; }
    public string Qualifications { get; set; }
    public bool IsActive { get; set; }
}

public class Child
{
    public int Id { get; set; }
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public DateTime DateOfBirth { get; set; }
    public int NurseryId { get; set; }
    public string ClassId { get; set; }
    public List<ParentChildRelationship> ParentRelationships { get; set; }
}

public class Parent
{
    public int Id { get; set; }
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public string Email { get; set; }
    public string PhoneNumber { get; set; }
    public string DeviceToken { get; set; } // プッシュ通知用
    public string Address { get; set; }
    public string EmergencyContact { get; set; }
    public List<ParentChildRelationship> ChildRelationships { get; set; }
}

public class ParentChildRelationship
{
    public int ParentId { get; set; }
    public int ChildId { get; set; }
    public RelationshipType RelationshipType { get; set; } // Father, Mother, Grandfather, Grandmother, Brother, Sister, Guardian, Other
    public bool IsPrimaryContact { get; set; }
    public bool IsAuthorizedPickup { get; set; }
    public bool CanReceiveReports { get; set; }
    public DateTime CreatedAt { get; set; }
    public Parent Parent { get; set; }
    public Child Child { get; set; }
}

public class ContactNotification
{
    public int Id { get; set; }
    public int ChildId { get; set; }
    public NotificationType Type { get; set; } // Absence, Lateness, Pickup
    public DateTime TargetDate { get; set; }
    public string Reason { get; set; }
    public string PickupPerson { get; set; } // お迎え通知時のみ必須
    public TimeSpan? PickupTime { get; set; } // お迎え通知時のみ必須
    public TimeSpan? ExpectedArrivalTime { get; set; } // 遅刻通知時のみ
    public string AdditionalNotes { get; set; }
    public NotificationStatus Status { get; set; }
    public DateTime SubmittedAt { get; set; }
    public string StaffResponse { get; set; }
}

public class Event
{
    public int Id { get; set; }
    public string Title { get; set; }
    public string Description { get; set; }
    public EventCategory Category { get; set; }
    public DateTime StartDateTime { get; set; }
    public DateTime EndDateTime { get; set; }
    public bool IsRecurring { get; set; }
    public RecurrencePattern RecurrencePattern { get; set; }
}

public class DailyReport
{
    public int Id { get; set; }
    public int ChildId { get; set; }
    public DateTime ReportDate { get; set; }
    public ReportType Type { get; set; }
    public string Content { get; set; }
    public string StaffMember { get; set; }
    public List<Photo> Attachments { get; set; }
}

public class Photo
{
    public int Id { get; set; }
    public int ChildId { get; set; }
    public string FileName { get; set; }
    public string OriginalUrl { get; set; }
    public string ThumbnailUrl { get; set; }
    public DateTime CapturedDate { get; set; }
    public string StaffMember { get; set; }
}
```

### 3.5 認証とセキュリティ

#### 3.5.1 SMS認証システム
- **事前登録**: 保育園スタッフが保護者の電話番号を事前にデータベースに登録
- **電話番号認証**: 保護者がアプリで電話番号を入力
- **登録確認**: 入力された電話番号がデータベースに存在するかチェック
- **SMS認証コード**: 登録済み電話番号にSMS認証コードを送信
- **認証完了**: 認証コード入力により本人確認とログイン完了
- **トークン発行**: 認証成功後にJWTトークンを発行してセッション管理

#### 3.5.2 認証フロー
```
1. 保護者が電話番号を入力
2. システムがデータベースで電話番号を検索
3. 登録済みの場合: 6桁の認証コードをSMSで送信
4. 未登録の場合: エラーメッセージ表示「保育園にお問い合わせください」
5. 保護者が認証コードを入力（5分間有効）
6. 認証成功: JWTトークン発行とログイン
7. 認証失敗: 再送信オプション提供（1日3回まで）
```

#### 3.5.3 SMS認証データモデル
```csharp
public class SmsAuthentication
{
    public int Id { get; set; }
    public string PhoneNumber { get; set; }
    public string AuthenticationCode { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime ExpiresAt { get; set; }
    public bool IsUsed { get; set; }
    public int AttemptCount { get; set; }
    public string IpAddress { get; set; }
}
```

#### 3.5.4 家族メンバー登録システム
- **登録権限**: 主要保護者（最初に登録した保護者）が他の家族メンバーを登録可能
- **直接登録**: 主要保護者が家族メンバーの電話番号と名前をアプリ内で登録
- **SMS送信なし**: シンプルな登録のみでSMS通知は不要
- **関係性設定**: 登録時に家族関係（父、母、祖父、祖母、兄、姉、その他）を選択
- **即座にアクセス可能**: 登録された家族メンバーは即座にログイン可能
- **共有アクセス**: 登録者の園児情報に自動的にアクセス権限が付与される

#### 3.5.5 家族メンバー登録フロー
```
1. 主要保護者がアプリ内「家族一覧」画面で「家族を登録」を選択
2. 家族メンバーの名前、電話番号、関係性を入力（父、母、祖父、祖母、兄、姉、その他）
3. 「登録」ボタンで即座にParentsテーブルとFamilyMembersテーブルに登録
4. 登録された家族メンバーは電話番号でSMS認証ログインが可能
5. ログイン後、登録者の園児情報に自動的にアクセス可能
6. 家族一覧画面に新しいメンバーが表示される
```

#### 3.5.6 家族登録データモデル
```csharp
// FamilyMembersテーブル - 家族関係を管理
public class FamilyMember
{
    public int Id { get; set; }
    public int ParentId { get; set; } // 追加された家族メンバーのParentId
    public int NurseryId { get; set; } // 保育園ID
    public int ChildId { get; set; } // 対象園児ID
    public string RelationshipType { get; set; } // father, mother, grandfather, grandmother, brother, sister, other
    public string? DisplayName { get; set; } // 表示名（オプション）
    public bool IsPrimaryContact { get; set; } // 主要連絡先フラグ
    public bool CanReceiveNotifications { get; set; } // 通知受信可否
    public bool CanViewReports { get; set; } // 連絡帳閲覧可否
    public bool CanViewPhotos { get; set; } // 写真閲覧可否
    public bool HasPickupPermission { get; set; } // お迎え権限
    public DateTime JoinedAt { get; set; } // 参加日時
    public int? InvitedByParentId { get; set; } // 登録者のParentId
    public bool IsActive { get; set; } // アクティブ状態（論理削除用）
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

// Parentsテーブル - 既存テーブル活用
// 家族メンバー登録時にParentsテーブルに新規レコード作成
public class Parent
{
    public int Id { get; set; }
    public string PhoneNumber { get; set; } // 電話番号（一意）
    public string Name { get; set; } // 名前
    public string? Email { get; set; }
    public bool IsPrimary { get; set; } // true: 保育園側で登録, false: 家族登録で追加
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}
```

#### 3.5.7 家族招待機能の制限仕様

**目的**: 家族追加機能で招待された保護者が、さらに別の家族メンバーを招待することを防止し、招待チェーンの無限連鎖や権限管理の複雑化を回避する。

**基本ルール**:
- **主保護者（初期登録者）**: 家族メンバーを招待できる（家族追加メニュー表示）
- **招待された保護者**: 家族メンバーを招待できない（家族追加メニュー非表示）

**判定方法**:
1. `FamilyMembers`テーブルの`InvitedByParentId`カラムを使用
2. ログイン中の保護者IDで`FamilyMembers`テーブルを検索
3. `ParentId = 自分のID` かつ `InvitedByParentId IS NOT NULL` のレコードが存在する場合、その保護者は「招待された保護者」
4. 該当レコードが存在しない、または`InvitedByParentId IS NULL`の場合は「主保護者」

**実装箇所**:

```sql
-- 招待された保護者かどうかを判定するクエリ
SELECT COUNT(*)
FROM FamilyMembers
WHERE ParentId = @CurrentParentId
  AND InvitedByParentId IS NOT NULL
  AND IsActive = 1;

-- 結果が1件以上の場合 → 招待された保護者（家族追加メニュー非表示）
-- 結果が0件の場合 → 主保護者（家族追加メニュー表示）
```

**フロントエンド実装**:
- ParentDashboard（保護者ダッシュボード）で家族追加メニューボタンの表示制御
- API呼び出し: `/api/family/can-invite/{parentId}` で招待可否を取得
- レスポンスが`false`の場合、家族追加ボタンを非表示または無効化

**バックエンド実装**:
- FamilyController に `CanInviteFamilyMember(int parentId)` メソッドを追加
- 家族メンバー招待API (`POST /api/family/invite`) で事前チェック
- 招待された保護者が招待APIを呼び出した場合は `403 Forbidden` エラーを返す

**エラーメッセージ**:
- 日本語: 「あなたは招待された家族メンバーのため、新しい家族メンバーを追加できません。」
- 英語: "You cannot invite new family members as you were invited by another member."
- 中国語: "您作为受邀成员，无法邀请新的家庭成员。"
- 韓国語: "초대받은 가족 구성원이므로 새 가족 구성원을 추가할 수 없습니다."

**データ整合性**:
- `InvitedByParentId`は`Parents`テーブルの`Id`への外部キー制約
- 招待者が削除された場合でも、`InvitedByParentId`の値は保持（履歴として維持）
- 論理削除（`IsActive = 0`）の場合は判定対象外

**テストケース**:
1. 主保護者がログイン → 家族追加メニュー表示 ✓
2. 招待された保護者がログイン → 家族追加メニュー非表示 ✓
3. 招待された保護者が直接APIを呼び出し → 403エラー ✓
4. 複数の園児を持つ主保護者 → 全ての園児に対して家族追加可能 ✓
5. 招待された保護者が別の園児の主保護者になった場合 → その園児に対してのみ家族追加可能 ✓

#### 3.5.8 セキュリティ要件
- **ロールベースアクセス**: 保護者、スタッフ、管理者ロール
- **家族内権限管理**: 主要保護者、一般家族メンバーの権限区分
- **家族招待制限**: 招待された保護者は新たな家族メンバーを招待不可（無限連鎖防止）
- **データ暗号化**: 全通信のHTTPS、データベースフィールドの暗号化
- **レート制限**: SMS送信は1日3回まで、認証試行は5分間に3回まで
- **登録制限**: 1つの子どもに対して最大10名の家族メンバーまで登録可能
- **セッション管理**: 自動ログアウト付きのセキュアセッション処理（24時間）
- **GDPRコンプライアンス**: データプライバシー制御と削除機能
- **不正利用防止**: IP制限、異常なアクセスパターンの監視

## 4. 実装ロードマップ

### 4.1 開発フェーズ

#### フェーズ1: 基礎と認証（1～2週間）
**成果物:**
- ユーザー登録と認証システム
- ナビゲーション付き基本アプリシェル
- JWTトークン実装
- データベーススキーマセットアップ
- ユーザー管理用基本APIエンドポイント

**受入基準:**
- 保護者が正常に登録・ログインできる
- セキュアなAPI通信が確立されている
- データベースがコアエンティティで適切に構成されている

#### フェーズ2: 欠席・遅刻通知（3～4週間）
**成果物:**
- 欠席通知提出フォーム
- 時刻ピッカー付き遅刻通知
- スタッフ通知システム
- 通知状況追跡
- 基本プッシュ通知セットアップ

**受入基準:**
- 保護者が欠席・遅刻通知を提出できる
- スタッフがリアルタイムで通知を受信できる
- 通知履歴が維持されている
- モバイル端末でプッシュ通知が機能する

#### フェーズ3: カレンダーとイベント（5～6週間）
**成果物:**
- 月次カレンダー表示
- イベント詳細表示
- カテゴリ別イベントフィルター
- イベント作成API（スタッフウェブアプリ用）
- イベントプッシュ通知

**受入基準:**
- 保護者がイベント付き月次カレンダーを表示できる
- イベント詳細が明確に表示される
- カテゴリフィルターが正常に機能する
- イベント通知が24時間前に配信される

#### フェーズ4: レポートとコミュニケーション（7～8週間）
**成果物:**
- 日次レポート閲覧インターフェース
- レポートカテゴリ分けとフィルター
- レポートタイムライン表示
- スタッフレポート作成API
- レポート通知システム

**受入基準:**
- 保護者が子どもの日次レポートを受信できる
- レポートがカテゴリ分けされ簡単にナビゲーションできる
- リアルタイムレポート配信が機能する
- レポート履歴が検索可能である

#### フェーズ5: 写真と活動記録（9～10週間）
**成果物:**
- 写真ギャラリーインターフェース
- 写真ダウンロード機能
- 活動ベースの写真整理
- 写真プライバシー制御
- クラウドストレージ連携

**受入基準:**
- 保護者が活動別に整理された子どもの写真を表示できる
- 写真ダウンロードが確実に機能する（フル機能版のみ）
- プライバシー制御が不正アクセスを防ぐ
- モバイル端末で写真が効率的に読み込まれる
- MVP版では写真クリック時にダイアログ表示し、ダイアログ内でダウンロード機能を提供する

#### フェーズ6: 仕上げと最適化（11～12週間）
**成果物:**
- パフォーマンス最適化
- ユーザーエクスペリエンス改善
- 包括的テスト
- アプリストア提出準備
- スタッフ研修材料

**受入基準:**
- アプリがモバイル端末で高速に読み込まれる
- 全機能が確実に動作する
- ユーザーインターフェースが洗練され直感的である
- アプリストア提出準備が完了している

### 4.2 MVP対フル機能セット

#### MVP機能（最小実用製品）
1. **ユーザー認証**: 基本ログイン・ログアウト機能
2. **欠席通知**: 状況表示付きの簡単欠席報告
3. **基本カレンダー**: 複雑なフィルターなしのイベント表示
4. **簡単レポート**: 高度機能なしの日次レポート表示
5. **写真表示**: グリッド・リスト表示切り替え、公開日・公開範囲表示、写真ダイアログ（詳細情報・ダウンロード機能）付きの写真ギャラリー

#### フル機能セットへの追加機能
1. **基本通知**: プッシュ通知ON/OFF、レポート通知ON/OFF、保護者連絡の園確認通知ON/OFF、イベント通知ON/OFF設定
2. **リッチカレンダー**: イベントフィルター、繰り返しイベント、詳細表示
3. **包括レポート**: レポート検索、カテゴリ分け、スタッフレスポンス
4. **写真管理**: ダウンロード、共有、アルバム整理、活動タグ
5. **高度機能**: 複数子サポート、家族共有、オフラインモード

## 5. 主要な連携ポイント

### 5.1 保護者モバイルアプリ ↔ C# バックエンド API

```csharp
// モバイルアプリ用主要APIエンドポイント
[ApiController]
[Route("api/v1/[controller]")]
public class ContactsController : ControllerBase
{
    [HttpPost("notification")]
    public async Task<IActionResult> SubmitContactNotification([FromBody] ContactNotificationDto dto)
    
    [HttpGet("status/{id}")]
    public async Task<IActionResult> GetNotificationStatus(int id)
    
    [HttpPut("cancel/{id}")]
    public async Task<IActionResult> CancelNotification(int id)
    
    [HttpGet("history/{childId}")]
    public async Task<IActionResult> GetContactHistory(int childId, [FromQuery] ContactFilter filter)
}

[ApiController]
[Route("api/v1/[controller]")]
public class ChildrenController : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetChildren()
    
    [HttpGet("{id}")]
    public async Task<IActionResult> GetChildById(int id)
}

[ApiController]
[Route("api/v1/[controller]")]
public class EventsController : ControllerBase
{
    [HttpGet("calendar/{year}/{month}")]
    public async Task<IActionResult> GetMonthlyEvents(int year, int month)
    
    [HttpGet("upcoming")]
    public async Task<IActionResult> GetUpcomingEvents()
}

[ApiController]
[Route("api/v1/[controller]")]
public class ReportsController : ControllerBase
{
    [HttpGet("daily/{childId}")]
    public async Task<IActionResult> GetDailyReports(int childId, DateTime date)
    
    [HttpPost("acknowledge/{reportId}")]
    public async Task<IActionResult> AcknowledgeReport(int reportId)
}

[ApiController]
[Route("api/v1/[controller]")]
public class PhotosController : ControllerBase
{
    [HttpGet("child/{childId}")]
    public async Task<IActionResult> GetChildPhotos(int childId, DateTime? fromDate = null)
    
    [HttpGet("download/{photoId}")]
    public async Task<IActionResult> DownloadPhoto(int photoId)
}
```

### 5.2 保育園ウェブアプリ ↔ 同一バックエンド API

```csharp
// 保育園ウェブアプリ用スタッフ専用エンドポイント
[ApiController]
[Route("api/v1/staff/[controller]")]
[Authorize(Roles = "Staff,Administrator")]
public class ReportsController : ControllerBase
{
    [HttpPost("daily")]
    public async Task<IActionResult> CreateDailyReport([FromBody] DailyReportDto dto)
    
    [HttpPost("upload-photo")]
    public async Task<IActionResult> UploadPhoto([FromForm] PhotoUploadDto dto)
    
    [HttpGet("notifications")]
    public async Task<IActionResult> GetPendingNotifications()
}

[ApiController]
[Route("api/v1/staff/[controller]")]
[Authorize(Roles = "Staff,Administrator")]
public class EventsController : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> CreateEvent([FromBody] EventDto dto)
    
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateEvent(int id, [FromBody] EventDto dto)
}
```

### 5.3 プッシュ通知システム

```csharp
// プッシュ通知サービス連携
public interface IPushNotificationService
{
    Task SendAbsenceConfirmation(int parentId, string childName);
    Task SendEventReminder(int parentId, string eventTitle, DateTime eventDate);
    Task SendNewReportNotification(int parentId, string childName, string reportType);
    Task SendNewPhotoNotification(int parentId, string childName, int photoCount);
}

// Firebase Cloud Messaging または Azure Notification Hubs を使用した実装
public class PushNotificationService : IPushNotificationService
{
    private readonly IConfiguration _configuration;
    private readonly HttpClient _httpClient;
    
    public async Task SendContactConfirmation(int parentId, string childName, string contactType)
    {
        var typeDisplayName = contactType switch {
            "absence" => "欠席",
            "lateness" => "遅刻",
            "pickup" => "お迎え",
            _ => "連絡"
        };
        
        var notification = new
        {
            title = $"{typeDisplayName}連絡確認",
            body = $"{childName}さんの{typeDisplayName}連絡を受け付けました。",
            data = new { type = $"{contactType}_confirmation" }
        };
        
        await SendNotificationToDevice(parentId, notification);
    }
}
```

### 5.4 写真ストレージと配信

```csharp
// クラウド連携用写真ストレージサービス
public interface IPhotoStorageService
{
    Task<string> UploadPhotoAsync(IFormFile photo, int childId, string staffMember);
    Task<string> GenerateThumbnailAsync(string originalUrl);
    Task<Stream> DownloadPhotoAsync(string photoId);
    Task DeletePhotoAsync(string photoId);
}

// Azure Blob Storage 実装
public class AzureBlobPhotoService : IPhotoStorageService
{
    private readonly BlobServiceClient _blobServiceClient;
    private readonly IImageResizeService _imageResizeService;
    
    public async Task<string> UploadPhotoAsync(IFormFile photo, int childId, string staffMember)
    {
        var containerClient = _blobServiceClient.GetBlobContainerClient("nursery-photos");
        var blobName = $"{childId}/{DateTime.UtcNow:yyyy/MM/dd}/{Guid.NewGuid()}.jpg";
        
        using var stream = photo.OpenReadStream();
        await containerClient.UploadBlobAsync(blobName, stream);
        
        return containerClient.GetBlobClient(blobName).Uri.ToString();
    }
}
```

## 6. 成功基準と受入テスト

### 6.1 機能受入テスト

#### 欠席・遅刻通知
- [ ] 保護者が欠席通知を提出し確認を受信できる
- [ ] スタッフが2分以内にリアルタイムで通知を受信できる
- [ ] 保護者がスタッフ確認前に通知を修正できる
- [ ] システムが同一日の重複通知を防ぐ
- [ ] 通知履歴が正確で完全である

#### カレンダー・イベント表示
- [ ] カレンダーが現在月の全イベントを正しく表示する
- [ ] イベント選択時に詳細情報が完全に表示される
- [ ] 全イベントタイプでカテゴリフィルターが機能する
- [ ] イベントの24時間前にプッシュ通知が届く
- [ ] 月間ナビゲーションがスムーズに機能する

#### 保育園レポート受信
- [ ] 日次レポートが作成後1時間以内に表示される
- [ ] 全レポートタイプが正しい情報を表示する
- [ ] レポート内の写真添付が適切に読み込まれる
- [ ] レポート確認が機能しステータスが更新される
- [ ] レポート検索が関連結果を見つけられる

#### 写真・活動記録
- [ ] 3G接続で写真が3秒以内に読み込まれる
- [ ] ダウンロード機能が写真を端末に保存できる
- [ ] プライバシー制御が不正アクセスを防ぐ

### 6.2 技術受入基準
- [ ] アプリがモバイル端末で5秒以内に読み込まれる
- [ ] 全APIコールが2秒以内にレスポンスする
- [ ] プッシュ通知の配信率が95%以上
- [ ] 写真サムネイルがアップロード後30秒以内に生成される
- [ ] データベースクエリが500ms以内に実行される
- [ ] アプリがキャッシュコンテンツのオフライン閲覧に対応している
- [ ] セキュリティ侵入テストがクリティカル問題なしでパスする
- [ ] GDPRコンプライアンス監査が成功している

### 6.3 ユーザーエクスペリエンス基準
- [ ] アプリがテクノロジー経験の少ないユーザーにも直感的である
- [ ] 全テキストがズームなしでモバイル画面で読みやすい
- [ ] タッチターゲットが最小44pxサイズ要件を満たしている
- [ ] アプリがプラットフォームUI規約（iOS/Android）に従っている
- [ ] エラーメッセージが明確で実用的である
- [ ] 読み込み状態が適切なフィードバックを提供している
- [ ] アプリがアプリ間での切り替え時に状態を維持している

## 7. 制約と前提

### 7.1 技術的制約
- iOS SafariとAndroid Chromeブラウザで動作する必要がある
- 写真の最大サイズは1枚あたり10MBに制限
- APIレート制限による悪用防止（ユーザー当たり毎分100リクエスト）
- オフライン機能は読み取り専用キャッシュコンテンツに限定
- プッシュ通知にはユーザー許可と適切な端末設定が必要

### 7.2 ビジネス制約
- 開発スケジュールは学校カレンダーに合わせる必要がある
- 予算では年間最大1TBまでのクラウドストレージを許可
- スタッフ研修は学校休業中に完了する必要がある
- プライバシー規制で日本国内のデータ保管が必要
- 全写真共有機能に保護者の同意が必要

### 7.3 主要な前提
- 保護者がモダンウェブブラウザ対応スマートフォンを所有している
- 保育園スタッフがデスクトップコンピューターでウェブインターフェースを使用する
- 通常の保育時間中にインターネット接続が利用可能
- 保護者がタイムリーなコミュニケーションのためにプッシュ通知を選択する
- 学校管理がデジタル変革取り組みを支援する

## 8. リスク評価と緩和策

### 8.1 技術リスク
**リスク**: 写真ストレージコストが予算を超過  
**緩和策**: 自動圧縮と保存ポリシーを実装する

**リスク**: プッシュ通知配信失敗  
**緩和策**: メール通知とアプリ内メッセージセンターへのフォールバック

**リスク**: 写真メタデータによるデータベースパフォーマンス問題  
**緩和策**: データベースインデックシングとクエリ最適化を実装する

### 8.2 ユーザー採用リスク
**リスク**: テクノロジー抵抗による保護者の低採用率  
**緩和策**: 包括的なオンボーディングと研修材料を提供する

**リスク**: デジタルワークフローに対するスタッフの抵抗  
**緩和策**: 幅広い研修とサポートを伴う段階的ロールアウト

### 8.3 プライバシーとセキュリティリスク
**リスク**: 子どもの写真への不正アクセス  
**緩和策**: 多要素認証とロールベースアクセス制御

**リスク**: 個人情報のデータ漏洩  
**緩和策**: 保存時・通信時の暗号化、定期セキュリティ監査

## 9. スタッフ用スマホ対応機能

### 9.1 スタッフ認証・アクセス機能

#### 9.1.1 機能要件
- **FR-SA-001**: スタッフ専用認証システムによるログイン機能
- **FR-SA-002**: 自分の担当クラスの情報のみアクセス可能
- **FR-SA-003**: スマホでの利用を前提としたレスポンシブUI
- **FR-SA-004**: 保護者アプリと同一システムでの権限分離

#### 9.1.2 認証要件
- **AR-SA-001**: 事前登録されたスタッフアカウント（電話番号ベース）
- **AR-SA-002**: SMS認証による本人確認
- **AR-SA-003**: 担当クラス情報の自動紐付け
- **AR-SA-004**: セッション管理（8時間有効）

### 9.2 連絡通知受信・確認機能

#### 9.2.1 機能要件
- **FR-SC-001**: 自分のクラスの園児の欠席・遅刻・お迎え連絡をリアルタイム受信
- **FR-SC-002**: 連絡内容を確認し「確認済み」ステータスに変更可能
- **FR-SC-003**: 必要に応じて保護者へ返信メッセージを送信可能
- **FR-SC-004**: 連絡の重要度判定（緊急/通常）と優先表示

#### 9.2.2 連絡履歴管理要件
- **FR-SH-001**: 日付別の連絡履歴表示
- **FR-SH-002**: 園児別のフィルタリング機能
- **FR-SH-003**: 連絡種別（欠席・遅刻・お迎え）による絞り込み
- **FR-SH-004**: 過去30日間の履歴検索機能

#### 9.2.3 ユーザーインターフェース要件
- **UI-SC-001**: 新着連絡の件数表示とアイコン強調
- **UI-SC-002**: 連絡種別ごとの色分け表示
- **UI-SC-003**: 確認ボタンのワンタップ操作
- **UI-SC-004**: 返信入力用の簡易メッセージフォーム

### 9.3 レポート作成・送信機能

#### 9.3.1 機能要件
- **FR-SR-001**: 担当クラスの園児に対する日次レポート作成
- **FR-SR-002**: レポートタグ機能（活動/食事/睡眠/ケガ/事故/喧嘩）
- **FR-SR-003**: スマホカメラで撮影した写真の添付機能
- **FR-SR-004**: 音声入力による効率的なレポート作成

#### 9.3.2 レポート内容要件
- **CR-SR-001**: 基本情報（園児名、日付、スタッフ名）の自動設定
- **CR-SR-002**: 活動内容の詳細記述欄
- **CR-SR-003**: 食事摂取量の記録（午前おやつ/昼食/午後おやつ）
- **CR-SR-004**: お昼寝時間の記録（開始/終了時刻）
- **CR-SR-005**: 健康状態・気になる点の記録
- **CR-SR-006**: 保護者への特記事項欄

#### 9.3.3 効率化機能要件
- **EF-SR-001**: よく使う文言のテンプレート機能
- **EF-SR-002**: 前日のレポートをベースにした複製機能
- **EF-SR-003**: 一括作成機能（同じクラスの複数園児）
- **EF-SR-004**: 下書き保存機能

#### 9.3.4 レポート管理機能要件
- **FR-RM-001**: 自分が作成したレポート一覧の表示機能
- **FR-RM-002**: レポートの編集機能（下書き・公開済み両方）
- **FR-RM-003**: レポートの削除機能（下書きのみ削除可能）
- **FR-RM-004**: レポートステータス管理（下書き/公開済み）
- **FR-RM-005**: 公開ボタンによる下書きから公開への変更機能

#### 9.3.5 レポート一覧表示要件
- **UI-RM-001**: レポート一覧画面の表示（日付降順）
- **UI-RM-002**: 各レポートカードに園児名、日付、ステータス、タグを表示
- **UI-RM-003**: 下書きと公開済みのステータスバッジ表示
- **UI-RM-004**: レポートタップで編集画面への遷移
- **UI-RM-005**: フィルター機能（全て/下書き/公開済み）
- **UI-RM-006**: 日付範囲での絞り込み機能

#### 9.3.6 レポート編集・削除要件
- **UI-RM-007**: レポート作成画面を編集モードで再利用
- **UI-RM-008**: 編集モード時は既存データを自動入力
- **UI-RM-009**: 下書きレポートの場合は削除ボタンを表示
- **UI-RM-010**: 公開済みレポートは編集のみ可能（削除不可）
- **UI-RM-011**: 削除時は確認ダイアログを表示
- **UI-RM-012**: 下書き保存ボタンと公開ボタンを分離表示

#### 9.3.7 ビジネスルール
- **BR-RM-001**: 公開されたレポートは削除できない（保護者が既に閲覧している可能性があるため）
- **BR-RM-002**: 下書きレポートは作成者のみ編集・削除可能
- **BR-RM-003**: 公開されたレポートは編集可能だが、編集履歴が記録される
- **BR-RM-004**: 下書きから公開への変更は取り消し不可
- **BR-RM-005**: レポート削除時は関連する写真も削除される

#### 9.3.8 データ要件
```json
{
  "reportId": "number",
  "childId": "number",
  "childName": "string",
  "staffId": "number",
  "staffName": "string",
  "reportDate": "datetime",
  "category": "string",
  "title": "string",
  "content": "string",
  "tags": ["活動", "食事", "睡眠", "ケガ", "事故", "喧嘩"],
  "photos": ["url1", "url2"],
  "status": "draft|published",
  "createdAt": "datetime",
  "updatedAt": "datetime",
  "publishedAt": "datetime|null"
}
```

### 9.4 写真アップロード・管理機能

#### 9.4.1 機能要件
- **FR-SP-001**: スマホカメラで撮影した写真の即座アップロード
- **FR-SP-002**: 複数園児を含む写真の園児タグ付け機能
- **FR-SP-003**: 公開日の設定機能（当日/未来日指定）
- **FR-SP-004**: 公開範囲の設定（クラス/学年/全体）

#### 9.4.2 写真管理要件
- **PM-SP-001**: アップロード進行状況の表示
- **PM-SP-002**: 写真に説明・コメント追加
- **PM-SP-003**: アップロード後の編集・削除機能
- **PM-SP-004**: 園児のプライバシー配慮のための確認機能

### 9.5 カレンダー閲覧機能

#### 9.5.1 機能要件
- **FR-SC-001**: 自分のクラス関連イベントの優先表示
- **FR-SC-002**: 学年・園全体イベントの閲覧
- **FR-SC-003**: イベント詳細情報の確認
- **FR-SC-004**: イベントへの準備事項確認

#### 9.5.2 制限事項
- **LI-SC-001**: イベントの作成・編集は不可（閲覧のみ）
- **LI-SC-002**: 管理機能へのアクセス制限

### 9.6 クラス限定お知らせ機能

#### 9.6.1 機能要件
- **FR-SN-001**: 自分のクラス向けお知らせの作成・送信
- **FR-SN-002**: 緊急度設定（緊急/重要/通常）
- **FR-SN-003**: 送信対象の選択（クラス全体/個別園児）
- **FR-SN-004**: 送信予約機能

#### 9.6.2 お知らせ内容要件
- **CN-SN-001**: タイトル・本文の入力
- **CN-SN-002**: 添付ファイル機能（PDF/写真）
- **CN-SN-003**: 配信確認・既読状況の把握

### 9.7 スタッフ用データモデル

```csharp
public class Staff
{
    public int Id { get; set; }
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public string PhoneNumber { get; set; }
    public string Email { get; set; }
    public int NurseryId { get; set; }
    public string ClassId { get; set; }
    public StaffRole Role { get; set; } // Teacher, AssistantTeacher, SubstituteTeacher
    public string DeviceToken { get; set; } // プッシュ通知用
    public DateTime LastLoginAt { get; set; }
    public bool IsActive { get; set; }
}

public class StaffNotification
{
    public int Id { get; set; }
    public int StaffId { get; set; }
    public int ContactNotificationId { get; set; }
    public DateTime ReceivedAt { get; set; }
    public DateTime? AcknowledgedAt { get; set; }
    public string StaffResponse { get; set; }
    public NotificationStatus Status { get; set; } // Received, Acknowledged, Responded
}

public class StaffReport
{
    public int Id { get; set; }
    public int ChildId { get; set; }
    public int StaffId { get; set; }
    public DateTime ReportDate { get; set; }
    public List<ReportTag> Tags { get; set; } // 活動, 食事, 睡眠, ケガ, 事故, 喧嘩
    public string ActivityContent { get; set; }
    public MealRecord MealDetails { get; set; }
    public SleepRecord SleepDetails { get; set; }
    public string HealthNotes { get; set; }
    public string SpecialNotes { get; set; }
    public List<Photo> AttachedPhotos { get; set; }
    public DateTime CreatedAt { get; set; }
    public bool IsDraft { get; set; }
}

public class StaffAnnouncement
{
    public int Id { get; set; }
    public int StaffId { get; set; }
    public string Title { get; set; }
    public string Content { get; set; }
    public AnnouncementPriority Priority { get; set; } // Emergency, Important, Normal
    public AnnouncementTarget Target { get; set; } // Class, Individual
    public List<int> TargetChildrenIds { get; set; }
    public DateTime? ScheduledAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public AnnouncementStatus Status { get; set; } // Draft, Sent, Scheduled
}
```

### 9.8 スタッフ用API設計

```csharp
[ApiController]
[Route("api/v1/staff/[controller]")]
[Authorize(Roles = "Staff")]
public class ContactsController : ControllerBase
{
    [HttpGet("notifications")]
    public async Task<IActionResult> GetPendingNotifications()

    [HttpPost("acknowledge/{notificationId}")]
    public async Task<IActionResult> AcknowledgeNotification(int notificationId, [FromBody] string response = null)

    [HttpGet("history")]
    public async Task<IActionResult> GetContactHistory([FromQuery] ContactHistoryFilter filter)
}

[ApiController]
[Route("api/v1/staff/[controller]")]
[Authorize(Roles = "Staff")]
public class ReportsController : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> CreateReport([FromBody] CreateReportDto dto)

    [HttpPost("draft")]
    public async Task<IActionResult> SaveDraft([FromBody] CreateReportDto dto)

    [HttpGet("templates")]
    public async Task<IActionResult> GetReportTemplates()

    [HttpPost("bulk")]
    public async Task<IActionResult> CreateBulkReports([FromBody] BulkReportDto dto)
}

[ApiController]
[Route("api/v1/staff/[controller]")]
[Authorize(Roles = "Staff")]
public class PhotosController : ControllerBase
{
    [HttpPost("upload")]
    public async Task<IActionResult> UploadPhotos([FromForm] StaffPhotoUploadDto dto)

    [HttpPost("tag")]
    public async Task<IActionResult> TagChildren([FromBody] PhotoTaggingDto dto)
}

[ApiController]
[Route("api/v1/staff/[controller]")]
[Authorize(Roles = "Staff")]
public class AnnouncementsController : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> CreateAnnouncement([FromBody] CreateAnnouncementDto dto)

    [HttpPost("schedule")]
    public async Task<IActionResult> ScheduleAnnouncement([FromBody] ScheduleAnnouncementDto dto)

    [HttpGet("sent")]
    public async Task<IActionResult> GetSentAnnouncements()
}
```

### 9.9 スタッフ用成功指標

#### 9.9.1 利用率指標
- **スタッフアプリ導入率**: 担当クラス教員の95%が利用
- **日次利用率**: 勤務日にアプリを利用するスタッフが90%
- **連絡確認速度**: 30分以内の確認率95%

#### 9.9.2 効率化指標
- **レポート作成時間**: 1園児あたり平均3分以内
- **写真アップロード**: 撮影から公開まで5分以内
- **連絡対応時間**: 受信から確認まで平均15分以内

この包括的なPRDは、セキュリティ、使いやすさ、技術的優秀性の高い基準を維持しながら、保護者とスタッフ双方のニーズを満たす堅牢な保育園向けモバイルアプリ開発の基盤を提供します。
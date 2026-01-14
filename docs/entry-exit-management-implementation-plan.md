# 保護者入退管理機能 実装計画書

## ドキュメント情報
- **作成日**: 2026-01-14
- **バージョン**: 1.0
- **ステータス**: 初版
- **関連ドキュメント**: [要件定義書](./entry-exit-management-requirements.md)

---

## 目次
1. [実装概要](#1-実装概要)
2. [フェーズ分割](#2-フェーズ分割)
3. [詳細タスク](#3-詳細タスク)
4. [工数見積もり](#4-工数見積もり)
5. [技術的リスクと対策](#5-技術的リスクと対策)
6. [テスト計画](#6-テスト計画)
7. [デプロイ計画](#7-デプロイ計画)

---

## 1. 実装概要

### 1.1 実装方針
保護者入退管理機能を**4つのフェーズ**に分けて段階的に実装します。各フェーズは独立してテスト・デプロイ可能な単位とし、リスクを最小化します。

### 1.2 開発環境
- **フロントエンド**: React 19.1 + TypeScript + Vite
- **バックエンド**: ASP.NET Core 8 Web API
- **データベース**: Azure SQL Database
- **認証**: JWT（既存の認証システムを拡張）
- **バーコード**: JsBarcode（npm package）

### 1.3 実装範囲
以下の機能を実装します：
1. データベーススキーマ変更（EntryExitLogsテーブル追加）
2. バックエンドAPI（認証、入退ログCRUD、ハートビート）
3. 保護者アプリ（バーコード表示画面）
4. 入退登録画面（タブレット専用、ログイン + スキャン）
5. デスクトップ管理画面（入退ログ一覧、出欠管理連携）

---

## 2. フェーズ分割

### フェーズ1: データベース + バックエンドAPI基盤（最優先）
**目的**: データベーススキーマと基本APIの実装
**期間**: 2-3日
**成果物**:
- EntryExitLogsテーブル作成
- Nurseriesテーブル拡張（EntryExitPasswordカラム追加）
- 入退ログCRUD API
- 入退登録ログインAPI
- ハートビートAPI

**完了条件**:
- マイグレーションが正常に実行される
- Postmanで全APIエンドポイントが正常動作する
- 単体テストが全て通る

---

### フェーズ2: 保護者アプリ - バーコード表示機能（高優先度）
**目的**: 保護者がバーコードを表示できるようにする
**期間**: 1-2日
**成果物**:
- 保護者アプリのバーコード表示画面
- JsBarcodeライブラリ統合
- ナビゲーションメニュー追加

**完了条件**:
- スマートフォンでバーコードが正しく表示される
- バーコードをバーコードスキャナで読み取れる
- オフライン時でもバーコードが表示される

---

### フェーズ3: 入退登録画面（タブレット専用）（高優先度）
**目的**: タブレット+バーコードスキャナで入退を記録
**期間**: 3-4日
**成果物**:
- 入退登録ログイン画面
- 入退登録画面（スキャン + 記録）
- ハートビート機能
- スキャンフィードバック（画面フラッシュ、メッセージ表示）
- スキャン履歴表示

**完了条件**:
- ログインが正常に動作する
- バーコードスキャンで入退が記録される
- ハートビートが30秒ごとに送信される
- スキャン成功時に適切なメッセージが表示される
- オフライン時のデータ蓄積が動作する

---

### フェーズ4: デスクトップ管理画面（中優先度）
**目的**: 管理者が入退ログを確認・管理できるようにする
**期間**: 2-3日
**成果物**:
- 入退ログ一覧画面
- フィルター機能（日付、保護者名、入/出）
- CSVエクスポート機能
- 削除機能
- 出欠管理画面への入退時刻表示追加
- 園情報編集画面への入退パスワード設定追加

**完了条件**:
- 入退ログが一覧表示される
- フィルターが正常動作する
- CSVエクスポートが正常動作する
- 出欠管理画面に送り迎え時刻が表示される
- 園情報編集画面で入退パスワードを設定できる

---

## 3. 詳細タスク

### 3.1 フェーズ1: データベース + バックエンドAPI基盤

#### 3.1.1 データベース
- [ ] **Task 1.1.1**: EntryExitLogsテーブル作成のマイグレーションスクリプト作成
  - ファイル: `ReactApp.Server/Migrations/YYYYMMDDHHMMSS_CreateEntryExitLogs.cs`
  - テーブル定義: Id, ParentId, NurseryId, EntryType, Timestamp, CreatedAt
  - インデックス: ParentId, NurseryId+Timestamp, Timestamp
  - 外部キー: ParentId → Parents.Id, NurseryId → Nurseries.Id

- [ ] **Task 1.1.2**: Nurseriesテーブル拡張のマイグレーションスクリプト作成
  - ファイル: `ReactApp.Server/Migrations/YYYYMMDDHHMMSS_AddEntryExitPasswordToNurseries.cs`
  - カラム追加: EntryExitPassword (NVARCHAR(100), NULL)

- [ ] **Task 1.1.3**: EntryExitLogエンティティクラス作成
  - ファイル: `ReactApp.Server/Models/EntryExitLog.cs`
  - プロパティ: Id, ParentId, NurseryId, EntryType, Timestamp, CreatedAt
  - ナビゲーションプロパティは明示的に無視

- [ ] **Task 1.1.4**: Nurseryエンティティクラス拡張
  - ファイル: `ReactApp.Server/Models/Nursery.cs`
  - プロパティ追加: EntryExitPassword

- [ ] **Task 1.1.5**: DbContext更新
  - ファイル: `ReactApp.Server/Data/KindergartenDbContext.cs`
  - DbSet追加: `DbSet<EntryExitLog> EntryExitLogs`
  - OnModelCreating: ナビゲーションプロパティを無視

#### 3.1.2 DTOs
- [ ] **Task 1.2.1**: EntryExitLogDto作成
  - ファイル: `ReactApp.Server/DTOs/EntryExitLogDto.cs`
  - プロパティ: Id, ParentId, ParentName, NurseryId, EntryType, Timestamp, ChildNames

- [ ] **Task 1.2.2**: CreateEntryExitLogRequest作成
  - ファイル: `ReactApp.Server/DTOs/CreateEntryExitLogRequest.cs`
  - プロパティ: ParentId, NurseryId, EntryType

- [ ] **Task 1.2.3**: EntryExitLoginRequest/Response作成
  - ファイル: `ReactApp.Server/DTOs/EntryExitLoginRequest.cs`
  - ファイル: `ReactApp.Server/DTOs/EntryExitLoginResponse.cs`

- [ ] **Task 1.2.4**: HeartbeatResponse作成
  - ファイル: `ReactApp.Server/DTOs/HeartbeatResponse.cs`
  - プロパティ: Token, ExpiresAt

#### 3.1.3 Services
- [ ] **Task 1.3.1**: IEntryExitService インターフェース作成
  - ファイル: `ReactApp.Server/Services/IEntryExitService.cs`
  - メソッド: CreateLog, GetLogs, DeleteLog, GetLogsByDate

- [ ] **Task 1.3.2**: EntryExitService実装
  - ファイル: `ReactApp.Server/Services/EntryExitService.cs`
  - CreateLog: 入退ログ作成、保護者存在チェック
  - GetLogs: フィルター付き一覧取得（ページネーション）
  - DeleteLog: 論理削除または物理削除
  - GetLogsByDate: 特定日付の入退ログ取得

- [ ] **Task 1.3.3**: IAuthenticationService拡張
  - ファイル: `ReactApp.Server/Services/IAuthenticationService.cs`
  - メソッド追加: EntryExitLogin, RefreshToken (ハートビート用)

- [ ] **Task 1.3.4**: AuthenticationService拡張実装
  - ファイル: `ReactApp.Server/Services/AuthenticationService.cs`
  - EntryExitLogin: 保育園コード+パスワード認証、JWT発行
  - RefreshToken: 既存トークン検証、新トークン発行

#### 3.1.4 Controllers
- [ ] **Task 1.4.1**: EntryExitController作成
  - ファイル: `ReactApp.Server/Controllers/EntryExitController.cs`
  - POST /api/entry-exit-logs: ログ作成
  - GET /api/entry-exit-logs: ログ一覧取得
  - DELETE /api/entry-exit-logs/{id}: ログ削除

- [ ] **Task 1.4.2**: AuthenticationController拡張
  - ファイル: `ReactApp.Server/Controllers/AuthenticationController.cs`
  - POST /api/auth/entry-exit-login: 入退登録ログイン
  - POST /api/auth/heartbeat: ハートビート

#### 3.1.5 Validators
- [ ] **Task 1.5.1**: CreateEntryExitLogRequestValidator作成
  - ファイル: `ReactApp.Server/Validators/CreateEntryExitLogRequestValidator.cs`
  - 検証: ParentId必須、EntryType必須（Entry/Exit）

- [ ] **Task 1.5.2**: EntryExitLoginRequestValidator作成
  - ファイル: `ReactApp.Server/Validators/EntryExitLoginRequestValidator.cs`
  - 検証: NurseryCode必須、Password必須

#### 3.1.6 テスト
- [ ] **Task 1.6.1**: EntryExitServiceの単体テスト作成
- [ ] **Task 1.6.2**: EntryExitControllerの統合テスト作成
- [ ] **Task 1.6.3**: 認証フローの統合テスト作成

---

### 3.2 フェーズ2: 保護者アプリ - バーコード表示機能

#### 3.2.1 パッケージインストール
- [ ] **Task 2.1.1**: JsBarcodeライブラリインストール
  - コマンド: `npm install jsbarcode --save`
  - 型定義: `npm install @types/jsbarcode --save-dev`

#### 3.2.2 画面実装
- [ ] **Task 2.2.1**: ParentBarcodePage作成
  - ファイル: `reactapp.client/src/mobile/pages/ParentBarcodePage.tsx`
  - 保護者情報取得（localStorage or API）
  - バーコード生成（JsBarcode）
  - 画面明るさ最大化（Screen Wake Lock API または CSS）

- [ ] **Task 2.2.2**: バーコードコンポーネント作成
  - ファイル: `reactapp.client/src/mobile/components/Barcode.tsx`
  - JsBarcodeラッパー
  - Code128形式
  - カスタマイズ可能（サイズ、色）

#### 3.2.3 ナビゲーション
- [ ] **Task 2.3.1**: モバイルナビゲーションメニュー更新
  - ファイル: `reactapp.client/src/mobile/components/Navigation.tsx`
  - 「入退管理バーコード」メニュー追加
  - アイコン: QRコードまたはバーコードアイコン

- [ ] **Task 2.3.2**: ルーティング追加
  - ファイル: `reactapp.client/src/App.tsx` または `Router.tsx`
  - `/mobile/barcode` ルート追加

#### 3.2.4 テスト
- [ ] **Task 2.4.1**: バーコード表示のE2Eテスト作成
- [ ] **Task 2.4.2**: オフライン時のバーコード表示テスト

---

### 3.3 フェーズ3: 入退登録画面（タブレット専用）

#### 3.3.1 ログイン画面
- [ ] **Task 3.1.1**: EntryExitLoginPage作成
  - ファイル: `reactapp.client/src/entry-exit/pages/EntryExitLoginPage.tsx`
  - フォーム: 保育園コード、パスワード
  - ログイン処理、エラーハンドリング
  - ログイン成功時、トークンをlocalStorageに保存

#### 3.3.2 入退登録画面
- [ ] **Task 3.2.1**: EntryExitRegistrationPage作成
  - ファイル: `reactapp.client/src/entry-exit/pages/EntryExitRegistrationPage.tsx`
  - 「入」「出」トグルボタン
  - 現在時刻リアルタイム表示
  - バーコード入力受付（非表示input要素）
  - スキャン処理、API呼び出し

- [ ] **Task 3.2.2**: ScanFeedbackコンポーネント作成
  - ファイル: `reactapp.client/src/entry-exit/components/ScanFeedback.tsx`
  - 画面フラッシュ（緑/赤）
  - メッセージ表示（おはようございます/お疲れ様でした）
  - 3秒後に自動非表示

- [ ] **Task 3.2.3**: ScanHistoryコンポーネント作成
  - ファイル: `reactapp.client/src/entry-exit/components/ScanHistory.tsx`
  - 最新10件の履歴表示
  - テーブル形式（時刻、保護者名、入/出、ステータス）
  - 自動スクロール

#### 3.3.3 ハートビート機能
- [ ] **Task 3.3.1**: useHeartbeatカスタムフック作成
  - ファイル: `reactapp.client/src/entry-exit/hooks/useHeartbeat.ts`
  - setIntervalで30秒ごとに実行
  - ハートビートAPI呼び出し
  - トークン更新処理
  - エラーハンドリング（3回リトライ）
  - クリーンアップ処理

#### 3.3.4 オフライン対応
- [ ] **Task 3.4.1**: オフラインデータ蓄積機能実装
  - IndexedDB または localStorage
  - 最大100件まで蓄積
  - オンライン復帰時に順次送信

#### 3.3.5 ルーティング
- [ ] **Task 3.5.1**: 入退登録画面用ルーティング追加
  - `/entry-exit-login` ルート
  - `/entry-exit-registration` ルート（認証ガード付き）

#### 3.3.6 テスト
- [ ] **Task 3.6.1**: ログイン画面のE2Eテスト
- [ ] **Task 3.6.2**: バーコードスキャンのE2Eテスト（モック使用）
- [ ] **Task 3.6.3**: ハートビート機能の単体テスト
- [ ] **Task 3.6.4**: オフライン動作テスト

---

### 3.4 フェーズ4: デスクトップ管理画面

#### 3.4.1 入退ログ一覧画面
- [ ] **Task 4.1.1**: EntryExitLogsPage作成
  - ファイル: `reactapp.client/src/desktop/pages/EntryExitLogsPage.tsx`
  - フィルター（日付範囲、保護者名、入/出、園児名）
  - テーブル表示（日時、保護者名、入/出、関連園児、アクション）
  - ページネーション（50件/ページ）

- [ ] **Task 4.1.2**: CSVエクスポート機能実装
  - ファイル: `reactapp.client/src/utils/csvExport.ts`
  - CSV形式変換
  - ダウンロード処理

- [ ] **Task 4.1.3**: 削除機能実装
  - 削除確認ダイアログ
  - API呼び出し、一覧更新

#### 4.1.4 ナビゲーション
- [ ] **Task 4.1.4**: デスクトップナビゲーションメニュー更新
  - ファイル: `reactapp.client/src/desktop/components/Navigation.tsx`
  - 「入退管理ログ」メニュー追加

#### 3.4.2 出欠管理画面の拡張
- [ ] **Task 4.2.1**: AttendancePageに送り迎え時刻列追加
  - ファイル: `reactapp.client/src/desktop/pages/AttendancePage.tsx`
  - API拡張（入退ログを含める）
  - 送り迎え時刻列の表示
  - ツールチップ（ホバー時の詳細表示）

- [ ] **Task 4.2.2**: AttendanceService拡張
  - ファイル: `ReactApp.Server/Services/AttendanceService.cs`
  - GetAttendances: 入退ログを含めて返す

#### 3.4.3 園情報編集画面の拡張
- [ ] **Task 4.3.1**: NurseryInfoPageに入退パスワード設定追加
  - ファイル: `reactapp.client/src/desktop/pages/NurseryInfoPage.tsx`
  - パスワード入力フォーム
  - パスワード表示/非表示切り替え
  - パスワード更新処理

- [ ] **Task 4.3.2**: NurseryService拡張
  - ファイル: `ReactApp.Server/Services/NurseryService.cs`
  - UpdateEntryExitPassword: bcryptでハッシュ化して保存

#### 3.4.4 テスト
- [ ] **Task 4.4.1**: 入退ログ一覧画面のE2Eテスト
- [ ] **Task 4.4.2**: CSVエクスポート機能のテスト
- [ ] **Task 4.4.3**: 出欠管理画面の入退時刻表示テスト
- [ ] **Task 4.4.4**: 園情報編集画面のパスワード設定テスト

---

## 4. 工数見積もり

### 4.1 フェーズ別工数

| フェーズ | タスク数 | 見積工数 | バッファ | 合計 |
|---------|---------|---------|---------|------|
| フェーズ1: DB + API基盤 | 18 | 16時間 | 4時間 | **20時間** (2.5日) |
| フェーズ2: 保護者アプリ | 6 | 8時間 | 2時間 | **10時間** (1.25日) |
| フェーズ3: 入退登録画面 | 11 | 20時間 | 4時間 | **24時間** (3日) |
| フェーズ4: 管理画面 | 11 | 16時間 | 4時間 | **20時間** (2.5日) |
| **合計** | **46** | **60時間** | **14時間** | **74時間** (9.25日) |

### 4.2 タスク別詳細工数

#### フェーズ1: データベース + バックエンドAPI基盤（20時間）
| タスクID | タスク名 | 見積時間 |
|---------|---------|---------|
| 1.1.1 | EntryExitLogsテーブルマイグレーション | 1h |
| 1.1.2 | Nurseriesテーブル拡張マイグレーション | 0.5h |
| 1.1.3 | EntryExitLogエンティティ作成 | 0.5h |
| 1.1.4 | Nurseryエンティティ拡張 | 0.5h |
| 1.1.5 | DbContext更新 | 0.5h |
| 1.2.1 | EntryExitLogDto作成 | 0.5h |
| 1.2.2 | CreateEntryExitLogRequest作成 | 0.5h |
| 1.2.3 | EntryExitLoginRequest/Response作成 | 0.5h |
| 1.2.4 | HeartbeatResponse作成 | 0.5h |
| 1.3.1 | IEntryExitServiceインターフェース | 0.5h |
| 1.3.2 | EntryExitService実装 | 3h |
| 1.3.3 | IAuthenticationService拡張 | 0.5h |
| 1.3.4 | AuthenticationService拡張実装 | 2h |
| 1.4.1 | EntryExitController作成 | 2h |
| 1.4.2 | AuthenticationController拡張 | 1h |
| 1.5.1 | CreateEntryExitLogRequestValidator | 0.5h |
| 1.5.2 | EntryExitLoginRequestValidator | 0.5h |
| 1.6.1-3 | テスト作成 | 2h |
| **バッファ** | | **4h** |

#### フェーズ2: 保護者アプリ（10時間）
| タスクID | タスク名 | 見積時間 |
|---------|---------|---------|
| 2.1.1 | JsBarcodeインストール | 0.5h |
| 2.2.1 | ParentBarcodePage作成 | 3h |
| 2.2.2 | Barcodeコンポーネント作成 | 2h |
| 2.3.1 | ナビゲーションメニュー更新 | 0.5h |
| 2.3.2 | ルーティング追加 | 0.5h |
| 2.4.1-2 | テスト作成 | 1.5h |
| **バッファ** | | **2h** |

#### フェーズ3: 入退登録画面（24時間）
| タスクID | タスク名 | 見積時間 |
|---------|---------|---------|
| 3.1.1 | EntryExitLoginPage作成 | 3h |
| 3.2.1 | EntryExitRegistrationPage作成 | 5h |
| 3.2.2 | ScanFeedbackコンポーネント | 2h |
| 3.2.3 | ScanHistoryコンポーネント | 2h |
| 3.3.1 | useHeartbeatフック作成 | 3h |
| 3.4.1 | オフライン対応実装 | 2h |
| 3.5.1 | ルーティング追加 | 0.5h |
| 3.6.1-4 | テスト作成 | 2.5h |
| **バッファ** | | **4h** |

#### フェーズ4: デスクトップ管理画面（20時間）
| タスクID | タスク名 | 見積時間 |
|---------|---------|---------|
| 4.1.1 | EntryExitLogsPage作成 | 4h |
| 4.1.2 | CSVエクスポート機能 | 2h |
| 4.1.3 | 削除機能実装 | 1h |
| 4.1.4 | ナビゲーションメニュー更新 | 0.5h |
| 4.2.1 | AttendancePage拡張 | 3h |
| 4.2.2 | AttendanceService拡張 | 1.5h |
| 4.3.1 | NurseryInfoPage拡張 | 2h |
| 4.3.2 | NurseryService拡張 | 1h |
| 4.4.1-4 | テスト作成 | 1h |
| **バッファ** | | **4h** |

### 4.3 スケジュール

**総工数**: 74時間（約9.25日）

**推奨スケジュール**（1日8時間作業として）:
- **Week 1**:
  - Day 1-3: フェーズ1（DB + API基盤）
  - Day 4-5: フェーズ2（保護者アプリ）
- **Week 2**:
  - Day 1-3: フェーズ3（入退登録画面）
  - Day 4-5: フェーズ4（管理画面）

**マイルストーン**:
- Week 1 終了: バックエンドAPI完成、保護者がバーコード表示可能
- Week 2 終了: 全機能完成、テスト完了、デプロイ準備完了

---

## 5. 技術的リスクと対策

### 5.1 高リスク項目

#### リスク1: バーコードスキャナのキーボードエミュレーション互換性
**リスク内容**: USBバーコードスキャナがキーボードエミュレーションモードで正常動作しない可能性

**影響度**: 高（機能の根幹に関わる）
**発生確率**: 中

**対策**:
- 事前にバーコードスキャナの仕様を確認
- 複数のバーコードスキャナで動作確認
- フォールバック: カメラによるバーコード読み取り機能の追加検討

**回避策**:
- プロトタイプ段階でバーコードスキャナを実機テスト
- スキャナ設定マニュアルを作成

---

#### リスク2: ハートビート機能の安定性
**リスク内容**: ネットワーク不安定時にハートビートが失敗し、セッションが切れる

**影響度**: 中（再ログインで復旧可能）
**発生確率**: 中

**対策**:
- リトライ機構の実装（3回まで）
- ハートビート失敗時もローカルキャッシュでセッション維持
- トークン有効期限を十分に長く設定（1時間）

**回避策**:
- ネットワーク状態監視機能の追加
- オフライン時は自動的にローカル処理に切り替え

---

#### リスク3: タブレットのブラウザ互換性
**リスク内容**: 古いタブレットのブラウザで動作しない可能性

**影響度**: 中
**発生確率**: 低

**対策**:
- ターゲットブラウザを明確化（Android 8.0+, iOS 12.0+）
- Polyfillの使用（必要に応じて）
- ブラウザ互換性テストの実施

**回避策**:
- サポート対象外のブラウザには警告メッセージを表示
- タブレット推奨機種リストを作成

---

#### リスク4: オフライン時のデータ同期
**リスク内容**: オフライン時に蓄積したデータの同期に失敗する可能性

**影響度**: 中（手動で再入力が必要）
**発生確率**: 低

**対策**:
- 同期失敗時のリトライ機構
- 同期ステータスの可視化
- 手動同期ボタンの提供

**回避策**:
- 蓄積データの上限を設定（100件）
- 同期完了までデータを保持

---

### 5.2 中リスク項目

#### リスク5: パフォーマンス（スキャン応答時間）
**リスク内容**: スキャンから記録完了まで2秒以上かかる

**影響度**: 低（UXに影響）
**発生確率**: 低

**対策**:
- 楽観的UI更新（ローカルで即座に表示、バックグラウンドでAPI呼び出し）
- API応答時間の最適化（インデックス、クエリ最適化）
- ネットワーク遅延の監視

---

#### リスク6: バーコード表示の明るさ
**リスク内容**: 屋外でバーコードが読み取りにくい

**影響度**: 低
**発生確率**: 中

**対策**:
- Screen Wake Lock APIで画面を常時点灯
- CSS で背景を完全な白、前景を完全な黒に設定
- バーコードサイズを十分に大きく（推奨: 300x150px）

---

### 5.3 リスク管理表

| ID | リスク | 影響度 | 確率 | 対策状況 | 担当 |
|----|--------|--------|------|---------|------|
| R1 | バーコードスキャナ互換性 | 高 | 中 | 対策済み | 開発チーム |
| R2 | ハートビート安定性 | 中 | 中 | 対策済み | 開発チーム |
| R3 | タブレット互換性 | 中 | 低 | 対策済み | 開発チーム |
| R4 | オフライン同期 | 中 | 低 | 対策済み | 開発チーム |
| R5 | パフォーマンス | 低 | 低 | 監視中 | 開発チーム |
| R6 | バーコード明るさ | 低 | 中 | 対策済み | 開発チーム |

---

## 6. テスト計画

### 6.1 テスト戦略
各フェーズで以下のテストを実施します：
1. **単体テスト**: Service層、Validator層
2. **統合テスト**: API エンドポイント
3. **E2Eテスト**: フロントエンド画面操作
4. **手動テスト**: バーコードスキャナ実機テスト

### 6.2 テストケース

#### 6.2.1 フェーズ1: バックエンドAPI

**単体テスト**:
- [ ] EntryExitService.CreateLog: 正常系（入/出）
- [ ] EntryExitService.CreateLog: 異常系（存在しない保護者ID）
- [ ] EntryExitService.GetLogs: フィルターなし
- [ ] EntryExitService.GetLogs: 日付フィルター
- [ ] EntryExitService.GetLogs: 保護者名フィルター
- [ ] EntryExitService.DeleteLog: 正常系
- [ ] AuthenticationService.EntryExitLogin: 正常系
- [ ] AuthenticationService.EntryExitLogin: 異常系（間違ったパスワード）
- [ ] AuthenticationService.RefreshToken: 正常系

**統合テスト**:
- [ ] POST /api/entry-exit-logs: 入ログ作成
- [ ] POST /api/entry-exit-logs: 出ログ作成
- [ ] GET /api/entry-exit-logs: ページネーション
- [ ] DELETE /api/entry-exit-logs/{id}: 削除
- [ ] POST /api/auth/entry-exit-login: ログイン成功
- [ ] POST /api/auth/entry-exit-login: ログイン失敗
- [ ] POST /api/auth/heartbeat: トークン更新

#### 6.2.2 フェーズ2: 保護者アプリ

**E2Eテスト**:
- [ ] バーコード表示画面へのナビゲーション
- [ ] バーコードが正しく表示される
- [ ] 保護者名が正しく表示される
- [ ] オフライン時でもバーコードが表示される

**手動テスト**:
- [ ] バーコードスキャナで読み取り可能
- [ ] 屋外での視認性確認

#### 6.2.3 フェーズ3: 入退登録画面

**E2Eテスト**:
- [ ] ログイン画面: 正常系（正しい認証情報）
- [ ] ログイン画面: 異常系（間違った認証情報）
- [ ] 入退登録画面: 「入」モードでスキャン成功
- [ ] 入退登録画面: 「出」モードでスキャン成功
- [ ] 入退登録画面: スキャン失敗（存在しない保護者ID）
- [ ] 入退登録画面: スキャン履歴が表示される
- [ ] ハートビート: 30秒ごとに送信される
- [ ] ハートビート: トークンが更新される
- [ ] オフライン: データが蓄積される
- [ ] オンライン復帰: 蓄積データが送信される

**手動テスト**:
- [ ] バーコードスキャナで実機テスト（入）
- [ ] バーコードスキャナで実機テスト（出）
- [ ] 成功メッセージの確認（おはようございます/お疲れ様でした）
- [ ] 画面フラッシュの確認
- [ ] ハートビート動作確認（ネットワーク監視ツール）

#### 6.2.4 フェーズ4: デスクトップ管理画面

**E2Eテスト**:
- [ ] 入退ログ一覧: 表示確認
- [ ] 入退ログ一覧: 日付フィルター
- [ ] 入退ログ一覧: 保護者名フィルター
- [ ] 入退ログ一覧: ページネーション
- [ ] CSVエクスポート: ダウンロード確認
- [ ] 削除機能: 正常系
- [ ] 出欠管理画面: 送り迎え時刻表示
- [ ] 出欠管理画面: ツールチップ表示
- [ ] 園情報編集: パスワード設定

### 6.3 テストカバレッジ目標
- **単体テスト**: 80%以上
- **統合テスト**: 主要エンドポイント100%
- **E2Eテスト**: クリティカルパス100%

---

## 7. デプロイ計画

### 7.1 デプロイ戦略
各フェーズ完了後、段階的にデプロイします。

### 7.2 デプロイ手順

#### フェーズ1: データベース + バックエンドAPI
1. **マイグレーション実行**:
   ```bash
   cd ReactApp.Server
   dotnet ef database update
   ```
2. **バックエンドビルド**:
   ```bash
   dotnet build --configuration Release
   ```
3. **API動作確認**: Postmanで全エンドポイントテスト
4. **Azure App Service へデプロイ**

#### フェーズ2: 保護者アプリ
1. **フロントエンドビルド**:
   ```bash
   cd reactapp.client
   npm run build
   ```
2. **静的ファイルデプロイ**: Azure Static Web Apps または App Service
3. **動作確認**: 実機（スマートフォン）でバーコード表示確認

#### フェーズ3: 入退登録画面
1. **フロントエンドビルド** (フェーズ2と同様)
2. **デプロイ**
3. **動作確認**: タブレット + バーコードスキャナで実機テスト

#### フェーズ4: デスクトップ管理画面
1. **フロントエンドビルド** (フェーズ2と同様)
2. **デプロイ**
3. **動作確認**: デスクトップブラウザで全機能テスト

### 7.3 ロールバック計画
問題発生時のロールバック手順：
1. Azure App Service のデプロイスロット機能を使用
2. 前バージョンにスワップ
3. データベースマイグレーションのロールバック（必要に応じて）

### 7.4 本番環境チェックリスト
- [ ] データベースマイグレーション完了
- [ ] 環境変数設定（JWT Secret、Azure接続文字列等）
- [ ] HTTPS有効化
- [ ] CORS設定確認
- [ ] ログ設定確認（Application Insights）
- [ ] バックアップ設定確認
- [ ] 負荷テスト実施
- [ ] セキュリティスキャン実施

---

## 8. 運用・保守計画

### 8.1 監視項目
- **API応答時間**: スキャンから記録完了まで2秒以内
- **エラー率**: 5%以下
- **ハートビート失敗率**: 10%以下
- **オフライン同期失敗率**: 5%以下

### 8.2 ログ収集
- **Application Insights**: API呼び出し、エラー、パフォーマンス
- **フロントエンドログ**: スキャンイベント、ハートビート、エラー

### 8.3 バックアップ
- **データベース**: 日次自動バックアップ（Azure SQL Database）
- **保持期間**: 30日

### 8.4 ドキュメント
- [ ] ユーザーマニュアル作成（保護者向け）
- [ ] ユーザーマニュアル作成（保育園スタッフ向け）
- [ ] 管理者マニュアル作成
- [ ] バーコードスキャナ設定マニュアル作成
- [ ] トラブルシューティングガイド作成

---

## 9. 次のアクション

### 9.1 即座に開始可能なタスク
1. **フェーズ1開始**: データベースマイグレーションスクリプト作成
2. **開発環境準備**: JsBarcodeライブラリのインストール
3. **バーコードスキャナ調達**: 実機テスト用

### 9.2 依存関係の解決
- バーコードスキャナの仕様確認
- タブレット端末の選定・調達

### 9.3 承認待ち項目
- なし（要件定義が承認されているため、実装開始可能）

---

## 付録

### 付録A: 使用技術・ライブラリ

| カテゴリ | 技術/ライブラリ | バージョン | 用途 |
|---------|---------------|-----------|------|
| フロントエンド | React | 19.1 | UI構築 |
| フロントエンド | TypeScript | 5.x | 型安全性 |
| フロントエンド | Vite | 5.x | ビルドツール |
| フロントエンド | Tailwind CSS | 3.x | スタイリング |
| フロントエンド | JsBarcode | 3.11+ | バーコード生成 |
| バックエンド | ASP.NET Core | 8.0 | Web API |
| バックエンド | Entity Framework Core | 8.0 | ORM |
| データベース | Azure SQL Database | - | データストア |
| 認証 | JWT | - | トークン認証 |
| パスワードハッシュ | BCrypt.Net | 0.1+ | パスワードハッシュ化 |

### 付録B: 参考リンク
- [JsBarcode Documentation](https://github.com/lindell/JsBarcode)
- [Screen Wake Lock API](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API)
- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)

---

## 変更履歴

| バージョン | 日付 | 変更者 | 変更内容 |
|-----------|------|--------|---------|
| 1.0 | 2026-01-14 | Claude | 初版作成 |

---

**END OF DOCUMENT**

# 保育園管理システム - インフラストラクチャガイド

## 概要

本ドキュメントは、保育園管理システムの本番環境向けインフラストラクチャ構成とデプロイメント手順を説明します。

## アーキテクチャ概要

### システム構成図

```
[Load Balancer/CDN] → [Nginx Reverse Proxy] → [ASP.NET Core App (x2)]
                                                        ↓
[Redis Cache] ← → [ASP.NET Core App] ← → [Azure SQL Database]
                          ↓
[Application Insights] ← [Monitoring Stack]
                          ↓
[Prometheus] → [Grafana Dashboard]
```

### 主要コンポーネント

- **ASP.NET Core 8.0**: バックエンド API サーバー
- **React 19 + Vite**: フロントエンド SPA
- **Azure SQL Database**: メインデータベース
- **Redis**: 分散キャッシュ・セッション管理
- **Nginx**: リバースプロキシ・負荷分散
- **Application Insights**: APM・監視
- **Prometheus + Grafana**: メトリクス・ダッシュボード

## パフォーマンス最適化

### 1. CDN とアセット配信

#### 静的ファイルキャッシュ戦略
```
画像・メディア: 1年キャッシュ
JS・CSS: ハッシュベースファイル名
API レスポンス: ETag + 条件付きリクエスト
```

#### Nginx 最適化設定
- Gzip/Brotli 圧縮
- HTTP/2 サポート
- Keep-alive 接続最適化
- レート制限実装

### 2. データベース最適化

#### インデックス戦略
```sql
-- パフォーマンス重要インデックス
IX_DailyReport_ChildId_Date    -- 日報検索
IX_Photo_ChildId_TakenAt       -- 写真表示
IX_Staff_Email                 -- 認証
IX_Child_Class_IsActive        -- クラス別表示
```

#### 接続プール設定
```json
{
  "MaxPoolSize": 100,
  "MinPoolSize": 5,
  "ConnectionTimeout": 60,
  "CommandTimeout": 30
}
```

### 3. アプリケーション レベル キャッシュ

#### 階層キャッシュ戦略
```
L1: Memory Cache (5分) - 高頻度データ
L2: Redis Cache (2時間) - 共有データ
L3: Database - 永続データ
```

#### キャッシュ対象データ
- ユーザー権限情報
- 園児・保護者マスタ
- クラス情報
- システム設定

## セキュリティ設定

### 1. ネットワークセキュリティ

```nginx
# セキュリティヘッダー
add_header X-Frame-Options "SAMEORIGIN";
add_header X-Content-Type-Options "nosniff";
add_header X-XSS-Protection "1; mode=block";
add_header Referrer-Policy "strict-origin-when-cross-origin";
add_header Content-Security-Policy "default-src 'self'";
```

### 2. アプリケーションセキュリティ

- JWT トークン認証（RS256）
- レート制限（認証: 5req/min、API: 100req/min）
- HTTPS 強制・HSTS 有効
- 入力値検証・サニタイズ

### 3. データベースセキュリティ

- Always Encrypted 列暗号化
- 最小権限アクセス制御
- 接続文字列暗号化
- 定期バックアップ

## 監視・観測可能性

### 1. ヘルスチェック

#### エンドポイント
```
GET /health              - 総合ヘルスチェック
GET /health/database     - DB 接続状態
GET /health/redis        - Redis 接続状態
GET /health/external     - 外部サービス状態
```

#### 監視項目
- レスポンス時間（< 2秒）
- データベース接続プール使用率
- メモリ使用量
- CPU 使用率

### 2. Application Insights 統合

```csharp
// 自動収集される情報
- HTTP リクエスト追跡
- 依存関係呼び出し
- 例外・エラー詳細
- カスタム メトリクス
```

### 3. ログ集約

#### Serilog 設定
```json
{
  "Serilog": {
    "WriteTo": [
      { "Name": "Console" },
      { "Name": "File", "Args": { "path": "logs/app-.txt" } },
      { "Name": "ApplicationInsights" }
    ]
  }
}
```

### 4. Prometheus メトリクス

#### 収集メトリクス
- HTTP リクエスト数・レスポンス時間
- データベース クエリ実行時間
- キャッシュ ヒット率
- メモリ・CPU 使用量

## デプロイメント

### 1. 前提条件

#### 必要ツール
- Docker & Docker Compose
- .NET 8 SDK
- Node.js 20+
- PowerShell 7+

#### 環境変数設定
```bash
# 必須設定
DB_USER=kindergarten_admin
DB_PASSWORD=<secure_password>
JWT_SECRET_KEY=<256bit_secret>
REDIS_CONNECTION_STRING=redis:6379

# Azure 統合
APP_INSIGHTS_CONNECTION_STRING=<connection_string>
AZURE_STORAGE_CONNECTION_STRING=<storage_account>
CDN_ENDPOINT=https://cdn.example.com

# 外部サービス
MEDIA4U_USERNAME=<sms_service_user>
MEDIA4U_PASSWORD=<sms_service_password>
```

### 2. 本番デプロイ手順

#### Step 1: 設定ファイル準備
```bash
# デプロイ設定をカスタマイズ
cp deployment.config.json.template deployment.config.json
```

#### Step 2: デプロイ実行
```powershell
# 自動デプロイスクリプト実行
.\scripts\deploy-production.ps1 -Environment Production -Version v1.0.0
```

#### Step 3: 検証
```bash
# ヘルスチェック確認
curl http://localhost/health

# アプリケーション動作確認
curl http://localhost/api/health
```

### 3. ローリングアップデート

```bash
# Zero-downtime deployment
docker-compose -f docker-compose.yml -f docker-compose.production.yml up -d --no-deps kindergarten-app
```

### 4. ロールバック手順

```powershell
# 前のバージョンにロールバック
docker-compose -f docker-compose.yml -f docker-compose.production.yml up -d kindergarten-app:v1.0.0
```

## 運用・メンテナンス

### 1. 日次メンテナンス

#### 自動実行項目
- データベース統計更新
- ログファイル ローテーション
- キャッシュ最適化
- バックアップ検証

#### 監視ダッシュボード確認
- Grafana: http://localhost:3000
- Prometheus: http://localhost:9090
- Application Insights ポータル

### 2. 週次メンテナンス

- インデックス断片化チェック
- パフォーマンス メトリクス レビュー
- セキュリティ パッチ適用
- キャパシティ プランニング

### 3. 月次メンテナンス

```sql
-- インデックス再構築（月次）
EXEC sp_RebuildIndexes @FragmentationThreshold = 30.0;

-- 統計情報更新
UPDATE STATISTICS Staff WITH FULLSCAN;
UPDATE STATISTICS Child WITH FULLSCAN;
UPDATE STATISTICS DailyReport WITH FULLSCAN;
```

## トラブルシューティング

### 1. 一般的な問題

#### アプリケーション起動失敗
```bash
# ログ確認
docker-compose logs kindergarten-app

# ヘルスチェック詳細
curl -v http://localhost/health
```

#### データベース接続エラー
```bash
# 接続文字列確認
echo $DB_PASSWORD | base64

# ネットワーク接続テスト
telnet production-server.database.windows.net 1433
```

#### Redis 接続問題
```bash
# Redis 接続確認
docker exec kindergarten-redis redis-cli ping

# キー確認
docker exec kindergarten-redis redis-cli keys "*"
```

### 2. パフォーマンス問題

#### 遅いクエリ特定
```sql
-- 実行時間の長いクエリ
SELECT TOP 10
    qs.execution_count,
    qs.total_elapsed_time/1000 as total_elapsed_time_ms,
    qs.total_elapsed_time/qs.execution_count/1000 as avg_elapsed_time_ms,
    qt.text
FROM sys.dm_exec_query_stats qs
CROSS APPLY sys.dm_exec_sql_text(qs.sql_handle) qt
ORDER BY qs.total_elapsed_time DESC;
```

#### メモリ使用量監視
```bash
# コンテナ リソース使用量
docker stats kindergarten-app

# .NET GC 情報
curl http://localhost/metrics | grep dotnet_gc
```

## セキュリティ ベストプラクティス

### 1. 定期セキュリティ タスク

- SSL 証明書更新（3ヶ月前通知）
- 依存関係脆弱性スキャン
- アクセス ログ監査
- 不正アクセス検出

### 2. インシデント対応

```bash
# セキュリティ ログ確認
grep "疑わしいリクエスト" logs/app-*.txt

# IP ブロック（緊急時）
docker exec nginx nginx -s reload
```

## スケーリング戦略

### 1. 水平スケーリング

```yaml
# docker-compose.yml
services:
  kindergarten-app:
    deploy:
      replicas: 4  # インスタンス数増加
```

### 2. 垂直スケーリング

```yaml
# リソース制限調整
deploy:
  resources:
    limits:
      memory: 8G    # メモリ増加
      cpus: '4.0'   # CPU 増加
```

### 3. データベース スケーリング

- 読み取り専用レプリカ追加
- パーティショニング実装
- インデックス最適化

## 災害復旧

### 1. バックアップ戦略

- データベース: 日次フル + 15分間隔ログ
- ファイル ストレージ: 日次差分
- 設定ファイル: Git 管理

### 2. 復旧手順

```bash
# データベース復旧
sqlcmd -S server -Q "RESTORE DATABASE kindergarten FROM DISK='backup.bak'"

# アプリケーション復旧
docker-compose up -d
```

## 連絡先・サポート

### 開発チーム
- 技術サポート: dev-team@kindergarten.com
- インフラ担当: infra@kindergarten.com

### 緊急時対応
- 24時間サポート: emergency@kindergarten.com
- システム管理者: admin@kindergarten.com

---

最終更新: 2024年12月
バージョン: 1.0.0
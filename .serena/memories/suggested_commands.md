# 開発コマンド一覧

## 基本開発コマンド

### 開発サーバー起動
```bash
# フロントエンド・バックエンド同時起動
npm run dev

# 個別起動
npm run dev:client    # React開発サーバー (https://localhost:5173)
npm run dev:server    # ASP.NET Core サーバー (https://localhost:7154)
```

### ビルド
```bash
# 全体ビルド (フロントエンド + バックエンド)
npm run build

# 分析付きビルド
npm run analyze
npm run bundle-analyzer
```

## テスト関連

### 全テスト実行
```bash
npm run test:all      # 全種類のテスト実行
npm run test:unit     # 単体テスト (フロントエンド + バックエンド)
npm run test:integration  # 統合テスト
npm run test:e2e      # E2Eテスト (Playwright)
```

### カバレッジ
```bash
npm run coverage         # 全体カバレッジ
npm run coverage:frontend
npm run coverage:backend
```

### パフォーマンス・品質テスト
```bash
npm run test:performance  # パフォーマンステスト
npm run test:lighthouse   # Lighthouse
npm run test:load        # 負荷テスト
npm run test:security    # セキュリティチェック
npm run accessibility    # アクセシビリティテスト
```

## コード品質

### Lint・フォーマット
```bash
npm run lint          # ESLint実行
npm run lint:fix      # ESLint自動修正
npm run type-check    # TypeScript型チェック
npm run format        # Prettier実行
```

### 品質ゲート
```bash
npm run quality-gate  # 品質ゲートチェック
npm run pre-commit    # コミット前チェック
npm run pre-push      # プッシュ前チェック
```

## データベース関連

### マイグレーション
```bash
npm run db:migrate "MigrationName"  # マイグレーション作成
npm run db:update                   # データベース更新
npm run db:reset                    # データベースリセット
```

### テストデータ
```bash
npm run setup:test-db      # テストDB構築
npm run setup:test-data    # テストデータ生成
npm run seed:test-data     # テストデータ投入
```

## 開発ユーティリティ

### セットアップ
```bash
npm run install:all    # 全依存関係インストール
npm run install:tools  # 開発ツールインストール
npm run clean         # クリーンアップ
```

### ヘルスチェック・ログ
```bash
npm run health-check   # サーバーヘルスチェック
npm run logs:frontend  # フロントエンドログ
npm run logs:backend   # バックエンドログ
```

## Docker関連
```bash
npm run docker:build   # Dockerイメージビルド
npm run docker:run     # Dockerコンテナ実行
npm run docker:test    # Docker環境でテスト
```

## デプロイメント
```bash
npm run deploy:staging     # ステージング環境デプロイ
npm run deploy:production  # 本番環境デプロイ
```

## 重要な設定

### Node.js バージョン
- **要求バージョン**: Node.js >=18.0.0, npm >=8.0.0
- **推奨バージョン**: Node.js 20.10.0, npm 10.2.3 (Volta設定)

### 品質基準
- **テストカバレッジ**: >90% (lines), >95% (functions)
- **Lighthouse**: Performance>80, Accessibility>90, Best-practices>80, SEO>80
- **テストタイムアウト**: 5分

### Git Hooks
- **pre-commit**: lint + type-check
- **pre-push**: unit tests

## トラブルシューティング

### 依存関係の問題
```bash
npm run clean && npm run install:all
```

### テスト失敗
```bash
npm run setup:test-db
npm run setup:test-data
npm run test:unit
```

### パフォーマンス問題
```bash
npm run perf:profile  # プロファイリング
npm run lighthouse    # パフォーマンス分析
```
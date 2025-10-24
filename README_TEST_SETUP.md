# テスト基盤セットアップ完了

保育園保護者向けモバイルアプリのテスト環境が構築されました。

## 🧪 テスト環境構成

### フロントエンドテスト
- **テストフレームワーク**: Vitest + React Testing Library
- **設定ファイル**: `reactapp.client/vitest.config.ts`
- **セットアップ**: `reactapp.client/src/test/setup.ts`
- **ユーティリティ**: `reactapp.client/src/test/utils.tsx`
- **型定義**: `reactapp.client/src/test/types.ts`

### バックエンドテスト  
- **テストフレームワーク**: xUnit + FluentAssertions + Moq
- **プロジェクトファイル**: `ReactApp.Server.Tests/ReactApp.Server.Tests.csproj`
- **ベースクラス**: `ReactApp.Server.Tests/TestBase.cs`
- **モックサービス**: `ReactApp.Server.Tests/Mocks/MockServices.cs`
- **テスト設定**: `ReactApp.Server.Tests/appsettings.Test.json`

### E2Eテスト
- **テストフレームワーク**: Playwright
- **設定ファイル**: `playwright.config.ts`
- **ページオブジェクト**: `e2e/pages/`
- **テストフィクスチャ**: `e2e/fixtures/`
- **ヘルパーユーティリティ**: `e2e/utils/`

### パフォーマンステスト
- **Lighthouse**: `performance/lighthouse.config.js`, `performance/performance-test.js`
- **負荷テスト**: `performance/load-test.js` (Autocannon)
- **統合パフォーマンステスト**: 複数のツールを組み合わせた包括的テスト

### CI/CDパイプライン
- **GitHub Actions**: `.github/workflows/test.yml`, `.github/workflows/quality-gate.yml`
- **品質ゲート**: カバレッジ、パフォーマンス、アクセシビリティの自動チェック
- **セキュリティスキャン**: 脆弱性検出とCodeQL分析

### テストデータとユーティリティ
- **テストデータ生成**: `scripts/test-data-generator.js`
- **SQLシードスクリプト**: `scripts/seed-test-data.sql`
- **統合テストランナー**: `scripts/test-utilities.js`

## 🚀 テスト実行方法

### 全テスト実行
```bash
npm run test:all
```

### 個別テスト実行
```bash
# フロントエンド単体テスト
npm run test:unit:frontend

# バックエンド単体テスト  
npm run test:unit:backend

# E2Eテスト
npm run test:e2e

# パフォーマンステスト
npm run test:performance

# セキュリティテスト
npm run test:security
```

### カバレッジ測定
```bash
npm run coverage
```

### 品質ゲート実行
```bash
npm run quality-gate
```

## 📊 カバレッジ要件

### フロントエンド
- **ステートメント**: 95%
- **ブランチ**: 90%  
- **関数**: 95%
- **ライン**: 95%

### バックエンド
- **ライン**: 90%
- **ブランチ**: 80%

## 🎯 品質基準

### パフォーマンス
- **Lighthouseスコア**: パフォーマンス80%, アクセシビリティ90%
- **Core Web Vitals**: FCP<1.5s, LCP<2.5s, CLS<0.1
- **バンドルサイズ**: JS<500KB, CSS<100KB

### 信頼性
- **テスト成功率**: 95%以上
- **エラー率**: 1%未満

## 🔧 セットアップ手順

### 1. 依存関係インストール
```bash
npm run install:all
```

### 2. テストデータベース準備
```bash
npm run setup:test-db
npm run seed:test-data
```

### 3. テストデータ生成
```bash
npm run setup:test-data
```

### 4. 全テスト実行
```bash
npm run test:all
```

## 📁 ディレクトリ構造

```
ReactApp/
├── e2e/                          # E2Eテスト
│   ├── fixtures/                 # テストデータ
│   ├── pages/                    # ページオブジェクト
│   ├── tests/                    # テストケース
│   └── utils/                    # ヘルパー関数
├── performance/                  # パフォーマンステスト
│   ├── lighthouse.config.js      # Lighthouse設定
│   ├── load-test.js             # 負荷テスト
│   └── performance-test.js      # 統合パフォーマンステスト
├── scripts/                     # テスト用スクリプト
│   ├── seed-test-data.sql       # テストデータSQL
│   ├── test-data-generator.js   # テストデータ生成
│   └── test-utilities.js        # テスト統合ユーティリティ
├── ReactApp.Server.Tests/       # バックエンドテスト
│   ├── Mocks/                   # モックサービス
│   ├── TestBase.cs              # テストベースクラス
│   └── appsettings.Test.json    # テスト設定
├── reactapp.client/src/test/    # フロントエンドテスト
│   ├── setup.ts                 # テストセットアップ
│   ├── utils.tsx                # テストユーティリティ
│   └── types.ts                 # テスト型定義
└── .github/workflows/           # CI/CDパイプライン
    ├── test.yml                 # テスト実行
    └── quality-gate.yml         # 品質ゲート
```

## 🎉 TDD開発フロー

1. **Red**: 失敗するテストを書く
2. **Green**: 最小限のコードでテストを通す  
3. **Refactor**: コードを改善する
4. **Repeat**: サイクルを繰り返す

## 📚 参考資料

- [TDD Implementation Guide](docs/tdd-implementation-guide.md)
- [Testing Best Practices](docs/testing-best-practices.md)
- [Performance Testing Strategy](performance/README.md)
- [CI/CD Pipeline Documentation](.github/workflows/README.md)

---

✅ **テスト基盤セットアップ完了**

TDD開発の準備が整いました。認証システムの実装から開始できます。
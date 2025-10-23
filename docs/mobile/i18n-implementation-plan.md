# 多言語対応（i18n）実装計画

## 概要

保護者向けモバイルアプリに多言語対応機能を実装し、カスタマイズ設定画面で選択した言語（日本語、英語、中国語、韓国語）に応じてアプリ全体の表記を切り替える。

---

## 現状分析

### ✅ 既存実装

- **言語設定UI**: `CustomizationPage.tsx:460-565` で4言語選択可能（日本語、英語、中国語、韓国語）
- **DB保存機能**: `CustomizationSettings`テーブルに`Language`カラム存在
- **API連携**: 言語設定の保存・取得が実装済み（`/Customization/settings/{parentId}`）

### ❌ 未実装

- **翻訳システムなし**: i18nライブラリ未導入
- **ハードコードされた日本語文字列**: 60ファイルで572箇所以上
- **言語切り替え時のUI反映ロジックなし**: 設定保存後に画面が日本語のまま

---

## 技術アーキテクチャ

### 1. i18nライブラリ選定: **react-i18next**

**選定理由**:
- React専用で軽量（bundle size: ~40KB gzipped）
- Context APIベースで既存アーキテクチャと親和性が高い
- TypeScript完全サポート
- 名前空間機能で大規模アプリに対応
- 4言語対応に必要な機能を網羅（言語検出、フォールバック、変数補間）

**必要パッケージ**:
```bash
npm install react-i18next i18next i18next-browser-languagedetector
```

---

### 2. フォルダ構造

```
reactapp.client/src/
├── i18n/
│   ├── index.ts                    # i18n初期化設定
│   ├── locales/
│   │   ├── ja/                     # 日本語翻訳ファイル
│   │   │   ├── common.json         # 共通用語（保存、キャンセル、エラーメッセージ等）
│   │   │   ├── dashboard.json      # ダッシュボード画面
│   │   │   ├── reports.json        # レポート関連
│   │   │   ├── photos.json         # 写真ギャラリー
│   │   │   ├── announcements.json  # お知らせ
│   │   │   ├── notifications.json  # 通知設定
│   │   │   ├── customization.json  # カスタマイズ設定
│   │   │   ├── calendar.json       # カレンダー
│   │   │   ├── absence.json        # 欠席連絡
│   │   │   └── family.json         # 家族管理
│   │   ├── en/                     # 英語翻訳ファイル
│   │   │   └── (同様の構成)
│   │   ├── zh-CN/                  # 中国語（簡体字）翻訳ファイル
│   │   │   └── (同様の構成)
│   │   └── ko/                     # 韓国語翻訳ファイル
│   │       └── (同様の構成)
│   ├── types.ts                    # 翻訳キーの型定義（TypeScript型安全性）
│   └── formatters.ts               # 日付・数値フォーマッター
├── contexts/
│   └── LanguageContext.tsx         # 言語切り替えContext（カスタマイズ設定と連携）
```

---

### 3. 実装コンポーネント設計

#### A. i18n初期化 (`i18n/index.ts`)

```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// 各言語の翻訳リソースをインポート
import jaCommon from './locales/ja/common.json';
import jaDashboard from './locales/ja/dashboard.json';
import jaReports from './locales/ja/reports.json';
// ... 他のネームスペース

import enCommon from './locales/en/common.json';
import enDashboard from './locales/en/dashboard.json';
// ... 他の言語も同様

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ja: {
        common: jaCommon,
        dashboard: jaDashboard,
        reports: jaReports,
        photos: jaPhotos,
        announcements: jaAnnouncements,
        notifications: jaNotifications,
        customization: jaCustomization,
        calendar: jaCalendar,
        absence: jaAbsence,
        family: jaFamily
      },
      en: {
        common: enCommon,
        dashboard: enDashboard,
        // ...
      },
      'zh-CN': {
        common: zhCNCommon,
        dashboard: zhCNDashboard,
        // ...
      },
      ko: {
        common: koCommon,
        dashboard: koDashboard,
        // ...
      }
    },
    fallbackLng: 'ja',           // フォールバック言語は日本語
    defaultNS: 'common',          // デフォルト名前空間
    interpolation: {
      escapeValue: false          // Reactは自動でエスケープするため不要
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    }
  });

export default i18n;
```

---

#### B. LanguageContext (`contexts/LanguageContext.tsx`)

カスタマイズ設定APIと連携し、ユーザーの言語設定を自動で読み込む。

```typescript
import React, { createContext, useContext, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from './AuthContext';
import { apiClient } from '../services/apiClient';

interface LanguageContextType {
  currentLanguage: string;
  changeLanguage: (lang: string) => Promise<void>;
  t: (key: string, options?: any) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { i18n, t } = useTranslation();
  const { user } = useAuth();

  // ユーザーのカスタマイズ設定から言語を自動取得・適用
  useEffect(() => {
    const loadUserLanguage = async () => {
      if (!user?.parent?.id) return;

      try {
        const response = await apiClient.get(`/Customization/settings/${user.parent.id}`);
        if (response.data?.language) {
          await i18n.changeLanguage(response.data.language);
        }
      } catch (error) {
        console.error('言語設定取得エラー:', error);
        // エラー時はフォールバック言語（日本語）を使用
      }
    };

    loadUserLanguage();
  }, [user?.parent?.id, i18n]);

  const changeLanguage = async (lang: string) => {
    await i18n.changeLanguage(lang);

    // 注意: CustomizationPageで保存される想定（二重保存防止）
    // ここでは言語変更のみ実施
  };

  return (
    <LanguageContext.Provider value={{
      currentLanguage: i18n.language,
      changeLanguage,
      t
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};
```

---

#### C. 翻訳JSONファイル例

**`i18n/locales/ja/dashboard.json`**
```json
{
  "greeting": "こんにちは、{{name}}さん",
  "menu": {
    "absence": {
      "title": "欠席・遅刻・お迎え連絡",
      "description": "連絡機能・履歴管理"
    },
    "photos": {
      "title": "写真ギャラリー",
      "description": "園での様子を確認"
    },
    "reports": {
      "title": "レポート",
      "description": "園生活の記録を確認"
    },
    "calendar": {
      "title": "カレンダー",
      "description": "イベントや予定を確認"
    },
    "announcements": {
      "title": "お知らせ",
      "description": "園からの重要な連絡"
    },
    "settings": {
      "title": "設定",
      "description": "アプリ設定・カスタマイズ"
    }
  },
  "logout": "ログアウト",
  "familyManagement": "家族メンバー管理"
}
```

**`i18n/locales/en/dashboard.json`**
```json
{
  "greeting": "Hello, {{name}}",
  "menu": {
    "absence": {
      "title": "Absence & Pickup",
      "description": "Contact & History"
    },
    "photos": {
      "title": "Photo Gallery",
      "description": "View kindergarten activities"
    },
    "reports": {
      "title": "Reports",
      "description": "Daily activity records"
    },
    "calendar": {
      "title": "Calendar",
      "description": "Events & Schedule"
    },
    "announcements": {
      "title": "Announcements",
      "description": "Important notices"
    },
    "settings": {
      "title": "Settings",
      "description": "App settings & customization"
    }
  },
  "logout": "Logout",
  "familyManagement": "Family Management"
}
```

**`i18n/locales/ja/common.json`**
```json
{
  "buttons": {
    "save": "保存",
    "cancel": "キャンセル",
    "delete": "削除",
    "edit": "編集",
    "add": "追加",
    "close": "閉じる",
    "confirm": "確認",
    "back": "戻る",
    "next": "次へ",
    "submit": "送信"
  },
  "messages": {
    "loading": "読み込み中...",
    "saving": "保存中...",
    "success": "成功しました",
    "error": "エラーが発生しました",
    "noData": "データがありません",
    "confirmDelete": "本当に削除しますか？"
  },
  "errors": {
    "network": "ネットワークエラーが発生しました",
    "unauthorized": "認証エラー",
    "notFound": "データが見つかりません",
    "serverError": "サーバーエラーが発生しました"
  }
}
```

---

#### D. コンポーネント実装例

**変更前 (`ParentDashboard.tsx`)**
```typescript
const menuItems = [
  {
    title: '欠席・遅刻・お迎え連絡',
    description: '連絡機能・履歴管理',
    icon: HiUser,
    path: '/children',
    color: 'from-red-500 to-pink-500'
  },
  // ...
];

return (
  <div>
    <h1>こんにちは、{userName}さん</h1>
    {/* ... */}
  </div>
);
```

**変更後 (`ParentDashboard.tsx`)**
```typescript
import { useTranslation } from 'react-i18next';

export function ParentDashboard() {
  const { t } = useTranslation(['dashboard', 'common']);
  const { user } = useAuth();

  const menuItems = [
    {
      title: t('dashboard:menu.absence.title'),
      description: t('dashboard:menu.absence.description'),
      icon: HiUser,
      path: '/children',
      color: 'from-red-500 to-pink-500'
    },
    {
      title: t('dashboard:menu.photos.title'),
      description: t('dashboard:menu.photos.description'),
      icon: HiPhoto,
      path: '/photos',
      color: 'from-blue-500 to-cyan-500'
    },
    // ... 他のメニューアイテム
  ];

  return (
    <div>
      <h1>{t('dashboard:greeting', { name: userName })}</h1>
      <button onClick={logout}>{t('dashboard:logout')}</button>
      {/* ... */}
    </div>
  );
}
```

---

#### E. App.tsxへのProvider追加

```typescript
import { LanguageProvider } from './contexts/LanguageContext';
import './i18n'; // i18n初期化

function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <Routes>
          {/* ... */}
        </Routes>
      </LanguageProvider>
    </AuthProvider>
  );
}
```

---

## 実装ステップ（詳細計画）

### Phase 1: 基盤構築 (1-2日)

#### タスク

1. **ライブラリ導入**
   ```bash
   cd reactapp.client
   npm install react-i18next i18next i18next-browser-languagedetector
   ```

2. **フォルダ構造作成**
   ```bash
   mkdir -p src/i18n/locales/{ja,en,zh-CN,ko}
   ```

3. **i18n初期化**
   - `src/i18n/index.ts` 作成
   - 初期設定（fallbackLng, defaultNS, 名前空間設定）
   - 4言語分のリソース登録

4. **LanguageContext実装**
   - `src/contexts/LanguageContext.tsx` 作成
   - カスタマイズ設定APIとの連携実装
   - 言語切り替え関数の実装

5. **App.tsxへのProvider追加**
   - `LanguageProvider`でアプリ全体をラップ
   - i18n初期化スクリプトのインポート

#### 成果物
- i18n設定ファイル一式
- LanguageContext
- Providerが統合されたApp.tsx

---

### Phase 2: 翻訳リソース作成 (3-4日)

#### 優先順位付けアプローチ

**High Priority（まず対応）**:
1. `common.json`: ボタン、エラーメッセージ等の共通用語
2. `dashboard.json`: メインダッシュボード
3. `customization.json`: 設定画面自体

**Medium Priority**:
4. `reports.json`: レポート関連
5. `photos.json`: 写真ギャラリー
6. `announcements.json`: お知らせ
7. `notifications.json`: 通知設定
8. `calendar.json`: カレンダー
9. `absence.json`: 欠席連絡

**Low Priority**:
10. `family.json`: 家族管理
11. エラーページ、デバッグ画面等

#### 作業手順

1. **日本語文字列の抽出**
   - 既存コンポーネントから日本語文字列をGrepで抽出
   - JSONファイルに構造化して配置
   - 重複排除、階層化

2. **英語翻訳**
   - Google Translate API活用（初期翻訳）
   - 重要画面は人間レビュー実施

3. **中国語・韓国語翻訳**
   - 第三者翻訳サービス利用（Gengo、Conyac等）
   - またはネイティブスピーカーによるレビュー

4. **品質確認**
   - 変数補間部分（`{{name}}`等）の整合性確認
   - 文字長によるレイアウト崩れのチェック

#### 成果物
- 4言語 × 約10ファイル = 40個のJSONファイル
- 翻訳品質チェックリスト

---

### Phase 3: コンポーネント変換 (5-7日)

#### 変換パターン

**基本パターン**:
```typescript
// Before
<h1>レポート</h1>

// After
const { t } = useTranslation('reports');
<h1>{t('reports:title')}</h1>
```

**変数補間パターン**:
```typescript
// Before
<p>こんにちは、{userName}さん</p>

// After
const { t } = useTranslation('dashboard');
<p>{t('dashboard:greeting', { name: userName })}</p>
```

**複数形パターン**:
```typescript
// Before
<p>{count}件のレポート</p>

// After
const { t } = useTranslation('reports');
<p>{t('reports:count', { count })}</p>

// i18n/locales/ja/reports.json
{
  "count_one": "{{count}}件のレポート",
  "count_other": "{{count}}件のレポート"
}
```

#### 対象ファイル（優先順位順）

**Week 1**:
1. `ParentDashboard.tsx`
2. `CustomizationPage.tsx`
3. `App.tsx`（エラーメッセージ等）
4. `AuthContext.tsx`（認証メッセージ）

**Week 2**:
5. `ReportsPage.tsx`
6. `ReportCard.tsx`
7. `ReportSummaryCard.tsx`
8. `PhotoGalleryPage.tsx`
9. `PhotoViewer.tsx`
10. `PhotoGallery.tsx`

**Week 3**:
11. `AnnouncementListPage.tsx`
12. `AnnouncementCard.tsx`
13. `NotificationSettingsPage.tsx`
14. `Calendar.tsx`
15. `AbsencePage.tsx`
16. `AbsenceForm.tsx`
17. `AbsenceList.tsx`
18. `ContactForm.tsx`
19. `ContactHistory.tsx`
20. `FamilyInvitePage.tsx`

**Week 4（残り40ファイル）**:
- スタッフ側画面
- サブコンポーネント群
- エラーページ、デバッグページ

#### 自動化スクリプト活用

単純な文字列置換は正規表現で一括処理:
```bash
# 例: "保存"ボタンの一括置換
find src -name "*.tsx" -exec sed -i 's/保存/{t("common:buttons.save")}/g' {} \;
```

変数補間が必要なケースは手動対応。

#### 成果物
- 変換済みコンポーネント（約60ファイル）
- 変換ログ（どのファイルをいつ変換したか）

---

### Phase 4: 動作確認・調整 (2-3日)

#### 1. 各言語での画面確認

**確認項目**:
- 日本語、英語、中国語、韓国語で全画面確認
- レイアウト崩れチェック（特に中国語・韓国語の文字長問題）
- 変数補間の正常動作確認
- 複数形表現の正常動作確認

**確認画面リスト**:
- ダッシュボード
- レポート一覧・詳細
- 写真ギャラリー
- お知らせ一覧・詳細
- カレンダー
- 欠席連絡フォーム
- カスタマイズ設定
- 通知設定
- 家族管理

#### 2. API連携テスト

**テストシナリオ**:
1. カスタマイズ設定画面で言語を「英語」に変更
2. 「設定を保存」ボタンをクリック
3. ページをリロード
4. 全画面が英語表示されることを確認
5. 他の言語（中国語、韓国語）でも同様のテストを実施

#### 3. エラーハンドリング

**確認項目**:
- 翻訳キー未定義時のフォールバック動作確認
- APIエラー時の言語維持確認
- ネットワークエラー時の挙動確認

#### 4. パフォーマンステスト

**測定項目**:
- 初期ロード時間への影響（目標: +200ms以内）
- 言語切り替えのレスポンス速度（目標: 100ms以内）
- バンドルサイズの増加量（目標: +100KB以内）

#### 成果物
- 動作確認チェックリスト
- バグ修正リスト
- パフォーマンス測定結果レポート

---

## 技術的考慮事項

### 1. TypeScript型安全性

翻訳キーの型定義で型エラーを防止:

```typescript
// i18n/types.ts
import { TFunction } from 'i18next';

export type TranslationNamespaces = {
  dashboard: {
    greeting: string;
    menu: {
      absence: { title: string; description: string };
      photos: { title: string; description: string };
      reports: { title: string; description: string };
      calendar: { title: string; description: string };
      announcements: { title: string; description: string };
    };
    logout: string;
    familyManagement: string;
  };
  common: {
    buttons: {
      save: string;
      cancel: string;
      delete: string;
      edit: string;
      add: string;
      close: string;
      confirm: string;
      back: string;
      next: string;
      submit: string;
    };
    messages: {
      loading: string;
      saving: string;
      success: string;
      error: string;
      noData: string;
      confirmDelete: string;
    };
    errors: {
      network: string;
      unauthorized: string;
      notFound: string;
      serverError: string;
    };
  };
};

// 使用時の型補完
const { t } = useTranslation<keyof TranslationNamespaces>();
t('dashboard:greeting');      // ✅ 型安全
t('dashboard:menu.absence.title'); // ✅ 型安全
t('invalid:key');             // ❌ 型エラー
```

---

### 2. 日付・時刻の国際化

date-fnsを活用した日付フォーマット:

```typescript
// i18n/formatters.ts
import { format } from 'date-fns';
import { ja, enUS, zhCN, ko } from 'date-fns/locale';

const localeMap: Record<string, Locale> = {
  ja: ja,
  en: enUS,
  'zh-CN': zhCN,
  ko: ko
};

export const formatDate = (date: Date, formatStr: string, lang: string): string => {
  return format(date, formatStr, { locale: localeMap[lang] || ja });
};

// 使用例
// 日本語: 2025年1月15日
// 英語: January 15, 2025
// 中国語: 2025年1月15日
// 韓国語: 2025년 1월 15일
```

---

### 3. 数値・通貨のフォーマット

Intl.NumberFormatを活用:

```typescript
// i18n/formatters.ts
export const formatNumber = (num: number, lang: string): string => {
  return new Intl.NumberFormat(lang).format(num);
};

export const formatCurrency = (amount: number, lang: string, currency = 'JPY'): string => {
  return new Intl.NumberFormat(lang, {
    style: 'currency',
    currency
  }).format(amount);
};

// 使用例
// 日本語: 1,234 / ¥1,234
// 英語: 1,234 / ¥1,234
// 中国語: 1,234 / ¥1,234
// 韓国語: 1,234 / ¥1,234
```

---

### 4. パフォーマンス最適化

#### Code Splitting（言語ファイルの動的インポート）

```typescript
// i18n/index.ts（最適化版）
const loadLocale = async (lang: string) => {
  const locale = await import(`./locales/${lang}/index.ts`);
  i18n.addResourceBundle(lang, 'translation', locale.default);
};

i18n.on('languageChanged', (lng) => {
  loadLocale(lng);
});
```

#### Lazy Loading

初回は日本語のみロード、他言語は選択時にロード:

```typescript
// i18n/index.ts
i18n.init({
  resources: {
    ja: jaResources  // 日本語のみ初期ロード
  },
  // ...
});

// 言語切り替え時に動的ロード
export const changeLanguageWithLoad = async (lang: string) => {
  if (!i18n.hasResourceBundle(lang, 'common')) {
    const resources = await import(`./locales/${lang}/index.ts`);
    Object.keys(resources.default).forEach(ns => {
      i18n.addResourceBundle(lang, ns, resources.default[ns]);
    });
  }
  await i18n.changeLanguage(lang);
};
```

---

## 移行戦略

### 段階的ロールアウト

**Week 1-2**: Phase 1 + Phase 2 (基盤構築 + 翻訳リソース作成)
- i18nライブラリ導入
- LanguageContext実装
- 4言語分の翻訳JSONファイル作成（約40ファイル）

**Week 3-4**: Phase 3 前半（主要画面20ファイル変換）
- ダッシュボード、カスタマイズ設定、レポート、写真等
- 保護者向けメイン画面の多言語化

**Week 5-6**: Phase 3 後半（残り40ファイル変換）
- スタッフ側画面
- サブコンポーネント群
- エラーページ、デバッグページ

**Week 7**: Phase 4（テスト・調整）
- 全言語での動作確認
- バグ修正
- パフォーマンスチューニング

---

### 後方互換性維持

- 既存の日本語ハードコードは段階的に置換（破壊的変更なし）
- i18n導入初期は日本語のみでもアプリ動作可能
- 翻訳未完了キーはfallback言語（日本語）で表示
- 既存機能に影響を与えない段階的移行

---

## リスクと対策

| リスク | 影響度 | 発生確率 | 対策 |
|--------|--------|----------|------|
| 翻訳品質の低下 | 高 | 中 | ネイティブレビュー実施、重要画面は専門翻訳サービス利用 |
| レイアウト崩れ | 中 | 高 | CSSでmax-width設定、長文対応のテスト、文字長チェック自動化 |
| パフォーマンス劣化 | 低 | 低 | Code Splitting、Lazy Loading実装、バンドルサイズ監視 |
| 既存機能のバグ混入 | 中 | 中 | 段階的移行、各Phase後に回帰テスト、E2Eテスト追加 |
| 変数補間の不整合 | 中 | 中 | TypeScript型定義、自動テストスクリプト、レビュープロセス |
| 翻訳漏れ | 低 | 高 | 翻訳キーカバレッジチェックスクリプト、i18n-linter導入 |

---

## 成果物

### 1. コード

- **i18n設定ファイル**: `src/i18n/index.ts`
- **4言語分の翻訳JSONファイル**: 約60ファイル × 4言語 = 240ファイル
- **LanguageContext**: `src/contexts/LanguageContext.tsx`
- **フォーマッター**: `src/i18n/formatters.ts`
- **型定義**: `src/i18n/types.ts`
- **変換済みコンポーネント**: 約60ファイル

### 2. ドキュメント

- **翻訳追加ガイド**: 新規翻訳キーの追加方法
- **新規画面開発時のi18n対応手順書**: 開発者向けガイドライン
- **翻訳品質チェックリスト**: レビュー基準
- **パフォーマンス測定結果レポート**: Before/After比較

### 3. テスト

- **各言語での画面表示確認リスト**: 全画面チェックリスト
- **E2Eテストスクリプト**: 言語切り替えシナリオ
- **翻訳キーカバレッジレポート**: 未翻訳キー検出
- **パフォーマンステスト結果**: ロード時間、バンドルサイズ

---

## スケジュール

| Week | Phase | タスク | 成果物 |
|------|-------|--------|--------|
| 1 | Phase 1 | 基盤構築 | i18n設定、LanguageContext |
| 2 | Phase 2 | 翻訳リソース作成（High Priority） | common.json, dashboard.json, customization.json |
| 3 | Phase 2 | 翻訳リソース作成（Medium/Low Priority） | 残りのJSONファイル（40ファイル） |
| 4 | Phase 3 | コンポーネント変換（Week 1） | 主要画面20ファイル変換 |
| 5 | Phase 3 | コンポーネント変換（Week 2） | 残り20ファイル変換 |
| 6 | Phase 3 | コンポーネント変換（Week 3） | 残り20ファイル変換 |
| 7 | Phase 4 | 動作確認・調整 | テストレポート、バグ修正 |

**総工数**: 約6-7週間（1人月）

---

## 参考リンク

- [react-i18next公式ドキュメント](https://react.i18next.com/)
- [i18next公式ドキュメント](https://www.i18next.com/)
- [date-fns国際化ガイド](https://date-fns.org/docs/I18n)
- [MDN - Intl.NumberFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat)

---

## 更新履歴

| 日付 | 更新内容 | 作成者 |
|------|----------|--------|
| 2025-10-21 | 初版作成 | Claude |

# 技術スタック・コーディング規約

## フロントエンド技術スタック

### コア技術
- **React 19.1** - 最新安定版、Concurrent Features活用
- **TypeScript 5.8** - 型安全性、最新ES機能
- **Vite 7.1** - 高速ビルド、HMR、開発体験
- **React Router 7.8** - SPA ルーティング

### UI・スタイリング
- **Tailwind CSS 4.1** - ユーティリティファーストCSS
- **@tailwindcss/forms** - フォームスタイリング
- **React Icons 5.5** - Material Design Icons (`react-icons/md`)
- **Autoprefixer** - CSS自動プレフィックス

### フォーム・バリデーション
- **React Hook Form 7.62** - パフォーマンス重視フォーム
- **@hookform/resolvers** - バリデーションライブラリ統合
- **Zod 4.1** - TypeScript-first スキーマバリデーション

### HTTP通信
- **Axios 1.11** - HTTP クライアント
- **React Router DOM** - ナビゲーション

## バックエンド技術スタック

### コア技術
- **ASP.NET Core 8** - Web API フレームワーク
- **C# 12** - 最新言語機能
- **Entity Framework Core 8** - ORM
- **SQL Server** - リレーショナルデータベース

### 開発・品質管理
- **ESLint 9.33** - JavaScript/TypeScript Linter
- **TypeScript ESLint** - TypeScript専用ルール
- **Globals** - グローバル変数定義

## アイコン使用規約

### 使用ライブラリ
```typescript
// Material Design Icons のみ使用
import { MdIconName } from 'react-icons/md';
```

### サイズ規格
- **小**: 16px (ボタン内、入力フィールド)
- **中**: 20px (リスト項目、カード)
- **大**: 24px (ヘッダー、メイン機能)
- **特大**: 32px (アイコンボタン、ステータス)

### カラーパレット
- **Primary**: `#2563eb` (青) - 主要アクション
- **Secondary**: `#64748b` (グレー) - 補助情報
- **Error**: `#dc2626` (赤) - エラー・警告
- **Success**: `#16a34a` (緑) - 成功・完了

### 推奨アイコン
```typescript
// ナビゲーション
MdArrowBack, MdHome, MdMenu, MdClose

// アクション
MdSend, MdEdit, MdDelete, MdRefresh, MdDownload, MdAdd

// コンテンツ
MdMessage, MdHistory, MdDateRange, MdAccessTime, MdPhoto

// ステータス
MdCheck, MdWarning, MdError, MdInfo, MdNotifications

// 機能別
MdFamilyRestroom, MdChildCare, MdSchool, MdCalendarToday
```

## コーディング規約

### TypeScript規約
```typescript
// 厳格な型定義
interface UserProfile {
  id: number;
  firstName: string;
  lastName: string;
  email?: string; // オプショナル
}

// 関数型コンポーネント
const UserCard: React.FC<{ user: UserProfile }> = ({ user }) => {
  return <div>{user.firstName}</div>;
};

// カスタムフック
const useUserData = (userId: number) => {
  // フック実装
};
```

### ファイル命名規約
```
components/
├── auth/
│   ├── LoginForm.tsx          # PascalCase (コンポーネント)
│   ├── AuthContext.tsx        # PascalCase (Context)
│   └── types.ts              # camelCase (型定義)
├── common/
│   ├── Button.tsx
│   └── Input.tsx
└── layout/
    ├── Header.tsx
    └── Navigation.tsx

hooks/
├── useAuth.ts                # camelCase (カスタムフック)
├── useNotification.ts
└── useLocalStorage.ts

services/
├── authService.ts            # camelCase (サービス)
├── apiClient.ts
└── types/
    ├── auth.ts              # camelCase (型定義ファイル)
    └── notification.ts

utils/
├── dateUtils.ts             # camelCase (ユーティリティ)
├── validation.ts
└── constants.ts
```

### CSS/Tailwind規約
```typescript
// Tailwind クラス順序
// 1. Layout (display, position, etc.)
// 2. Spacing (margin, padding)
// 3. Sizing (width, height)
// 4. Typography
// 5. Visual (color, border, etc.)
// 6. Interactivity (hover, focus)

className="flex flex-col items-center gap-4 p-6 w-full max-w-md bg-white border rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
```

### 状態管理規約
```typescript
// Context + useReducer パターン
interface AppState {
  user: User | null;
  notifications: Notification[];
  loading: boolean;
}

type AppAction = 
  | { type: 'SET_USER'; payload: User }
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'SET_LOADING'; payload: boolean };

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    default:
      return state;
  }
};
```

## フォルダ構造規約

### フロントエンド構造
```
src/
├── components/           # 再利用可能コンポーネント
│   ├── auth/            # 認証関連
│   ├── common/          # 共通UI要素
│   ├── forms/           # フォーム要素
│   └── layout/          # レイアウト要素
├── pages/               # ページコンポーネント
│   ├── auth/            # 認証ページ
│   ├── dashboard/       # ダッシュボード
│   ├── contacts/        # 連絡機能
│   ├── reports/         # レポート
│   ├── calendar/        # カレンダー
│   ├── photos/          # 写真ギャラリー
│   └── settings/        # 設定
├── hooks/               # カスタムフック
├── contexts/            # React Context
├── services/            # API通信・外部サービス
├── utils/               # ユーティリティ関数
├── types/               # TypeScript型定義
├── assets/              # 静的リソース
└── styles/              # グローバルスタイル
```

## 開発プロセス規約

### Git規約
- **ブランチ命名**: `feature/功能名`, `fix/修正内容`, `hotfix/緊急修正`
- **コミットメッセージ**: `type: 変更内容の概要`
- **プルリクエスト**: 必須レビュー（2名承認）

### テスト規約
- **単体テスト**: 70%以上のカバレッジ
- **統合テスト**: API・DB連携テスト
- **E2Eテスト**: ユーザーシナリオテスト
- **TDD**: Red-Green-Refactor サイクル

### コードレビュー規約
- **必須項目**: 機能要件、セキュリティ、パフォーマンス
- **チェック項目**: 型安全性、エラーハンドリング、テスト
- **承認基準**: 2名以上のレビュアー承認
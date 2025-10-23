# スタッフクラスコンテキスト - フロントエンド技術仕様書

## 1. 概要

### 1.1 目的
複数クラスを担当するスタッフが、現在作業中のクラスコンテキストを明確に管理し、スムーズにクラスを切り替えられる仕組みをフロントエンドで実装します。

### 1.2 対象画面
- スタッフダッシュボード (`/staff/dashboard`)
- レポート作成画面 (`/staff/reports/create`)
- 写真管理画面 (`/staff/photos`)
- 写真アップロード画面 (`/staff/photos/upload`)
- お知らせ作成画面 (`/staff/announcements/create`)
- 連絡受信・確認画面 (`/staff/contacts`)

## 2. 型定義

### 2.1 既存型の拡張

#### `reactapp.client/src/types/auth.ts`

```typescript
// ClassAssignmentの型定義を追加
export interface ClassAssignment {
  classId: string;
  className: string;
  assignmentRole: 'MainTeacher' | 'AssistantTeacher';
}

// AuthUserインターフェースの拡張
export interface AuthUser {
  id: string;
  phoneNumber: string;
  name?: string;
  role: 'Parent' | 'Staff';
  isVerified: boolean;
  createdAt: string;
  parent?: {
    id: string;
    name: string;
  } | null;
  staff?: {
    id: string;
    nurseryId: number;
    staffId: number;
    name: string;
    role: string;
    classAssignments: ClassAssignment[]; // ← 追加
  } | null;
}
```

### 2.2 新規型定義

#### `reactapp.client/src/types/staffClass.ts`

```typescript
export interface ClassInfo {
  classId: string;
  className: string;
  assignmentRole: 'MainTeacher' | 'AssistantTeacher';
  nurseryId: number;
}

export interface StaffClassContextType {
  nurseryId: number;
  staffId: number;
  currentClass: ClassInfo | null;
  availableClasses: ClassInfo[];
  isMultiClass: boolean;
  isLoading: boolean;
  switchClass: (classId: string) => Promise<void>;
  refreshClasses: () => Promise<void>;
}

export interface ClassSelectorProps {
  currentClass: ClassInfo | null;
  availableClasses: ClassInfo[];
  onClassChange: (classId: string) => void;
  showAllClassesOption?: boolean;
}
```

## 3. React Context実装

### 3.1 StaffClassContext

#### `reactapp.client/src/contexts/StaffClassContext.tsx`

```typescript
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import { ClassInfo, StaffClassContextType } from '../types/staffClass';

const StaffClassContext = createContext<StaffClassContextType | undefined>(undefined);

interface StaffClassProviderProps {
  children: ReactNode;
}

export function StaffClassProvider({ children }: StaffClassProviderProps) {
  const { user } = useAuth();
  const [currentClass, setCurrentClass] = useState<ClassInfo | null>(null);
  const [availableClasses, setAvailableClasses] = useState<ClassInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const staffInfo = user?.staff;
  const nurseryId = staffInfo?.nurseryId ?? 0;
  const staffId = staffInfo?.staffId ?? 0;
  const isMultiClass = (availableClasses.length > 1);

  // 初期化: 認証情報からクラス一覧を取得
  useEffect(() => {
    if (staffInfo?.classAssignments) {
      const classes: ClassInfo[] = staffInfo.classAssignments.map(assignment => ({
        classId: assignment.classId,
        className: assignment.className,
        assignmentRole: assignment.assignmentRole,
        nurseryId: staffInfo.nurseryId,
      }));

      setAvailableClasses(classes);

      // 単一クラスの場合は自動選択
      if (classes.length === 1) {
        setCurrentClass(classes[0]);
      } else {
        // 複数クラスの場合、localStorageから復元
        const savedClassId = localStorage.getItem(`lastSelectedClass_${staffId}`);
        const savedClass = classes.find(c => c.classId === savedClassId);
        setCurrentClass(savedClass || null);
      }
    }
  }, [staffInfo, staffId]);

  // クラス切り替え処理
  const switchClass = useCallback(async (classId: string) => {
    const targetClass = availableClasses.find(c => c.classId === classId);
    if (!targetClass) {
      console.error(`Class not found: ${classId}`);
      return;
    }

    setCurrentClass(targetClass);

    // localStorageに保存
    localStorage.setItem(`lastSelectedClass_${staffId}`, classId);

    // Toast通知 (オプション)
    console.log(`クラスを${targetClass.className}に切り替えました`);
  }, [availableClasses, staffId]);

  // クラス一覧の再取得 (APIから最新情報を取得)
  const refreshClasses = useCallback(async () => {
    if (!staffInfo) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/staff/classes', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const classes: ClassInfo[] = data.data.classes.map((c: any) => ({
          classId: c.classId,
          className: c.className,
          assignmentRole: c.assignmentRole,
          nurseryId: c.nurseryId,
        }));

        setAvailableClasses(classes);

        // 現在のクラスが削除されている場合はリセット
        if (currentClass && !classes.find(c => c.classId === currentClass.classId)) {
          setCurrentClass(null);
        }
      }
    } catch (error) {
      console.error('Failed to refresh classes:', error);
    } finally {
      setIsLoading(false);
    }
  }, [staffInfo, currentClass]);

  const value: StaffClassContextType = {
    nurseryId,
    staffId,
    currentClass,
    availableClasses,
    isMultiClass,
    isLoading,
    switchClass,
    refreshClasses,
  };

  return (
    <StaffClassContext.Provider value={value}>
      {children}
    </StaffClassContext.Provider>
  );
}

export function useStaffClass() {
  const context = useContext(StaffClassContext);
  if (context === undefined) {
    throw new Error('useStaffClass must be used within StaffClassProvider');
  }
  return context;
}
```

## 4. コンポーネント実装

### 4.1 ClassSelectorコンポーネント

#### `reactapp.client/src/components/staff/ClassSelector.tsx`

```typescript
import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import { ClassInfo } from '../../types/staffClass';

interface ClassSelectorProps {
  currentClass: ClassInfo | null;
  availableClasses: ClassInfo[];
  onClassChange: (classId: string) => void;
  showAllClassesOption?: boolean;
}

export function ClassSelector({
  currentClass,
  availableClasses,
  onClassChange,
  showAllClassesOption = false,
}: ClassSelectorProps) {
  const getRoleBadge = (role: 'MainTeacher' | 'AssistantTeacher') => {
    return role === 'MainTeacher' ? (
      <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">主担任</span>
    ) : (
      <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">副担任</span>
    );
  };

  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button className="inline-flex w-full justify-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
          {currentClass ? (
            <>
              🏫 {currentClass.className}
              {getRoleBadge(currentClass.assignmentRole)}
            </>
          ) : (
            'クラスを選択'
          )}
          <ChevronDownIcon className="-mr-1 h-5 w-5 text-gray-400" aria-hidden="true" />
        </Menu.Button>
      </div>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">
            {availableClasses.map((classInfo) => (
              <Menu.Item key={classInfo.classId}>
                {({ active }) => (
                  <button
                    onClick={() => onClassChange(classInfo.classId)}
                    className={`${
                      active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                    } ${
                      currentClass?.classId === classInfo.classId ? 'font-bold' : ''
                    } block w-full px-4 py-2 text-left text-sm`}
                  >
                    {classInfo.className}
                    {getRoleBadge(classInfo.assignmentRole)}
                  </button>
                )}
              </Menu.Item>
            ))}

            {showAllClassesOption && availableClasses.length > 1 && (
              <>
                <div className="border-t border-gray-100 my-1" />
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => onClassChange('all')}
                      className={`${
                        active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                      } block w-full px-4 py-2 text-left text-sm`}
                    >
                      全クラス表示
                    </button>
                  )}
                </Menu.Item>
              </>
            )}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
```

### 4.2 StaffHeaderコンポーネント

#### `reactapp.client/src/components/staff/StaffHeader.tsx`

```typescript
import { useStaffClass } from '../../contexts/StaffClassContext';
import { ClassSelector } from './ClassSelector';

export function StaffHeader() {
  const { currentClass, availableClasses, isMultiClass, switchClass } = useStaffClass();

  return (
    <header className="bg-white shadow">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            スタッフポータル
          </h1>

          {isMultiClass && (
            <ClassSelector
              currentClass={currentClass}
              availableClasses={availableClasses}
              onClassChange={switchClass}
            />
          )}

          {!isMultiClass && currentClass && (
            <div className="text-sm text-gray-600">
              🏫 {currentClass.className}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
```

## 5. 使用例

### 5.1 App.tsxでの統合

```typescript
import { StaffClassProvider } from './contexts/StaffClassContext';
import { useAuth } from './hooks/useAuth';

function App() {
  const { user, isAuthenticated } = useAuth();

  return (
    <AuthProvider>
      {isAuthenticated && user?.role === 'Staff' && (
        <StaffClassProvider>
          <StaffHeader />
          <StaffRoutes />
        </StaffClassProvider>
      )}
      {/* Parent routes etc. */}
    </AuthProvider>
  );
}
```

### 5.2 画面コンポーネントでの使用

```typescript
// レポート作成画面での使用例
import { useStaffClass } from '../../contexts/StaffClassContext';

export function CreateReportPage() {
  const { currentClass, isMultiClass } = useStaffClass();

  if (isMultiClass && !currentClass) {
    return (
      <div className="text-center py-8">
        <p>クラスを選択してください</p>
      </div>
    );
  }

  // currentClassを使用してAPIリクエスト
  const fetchChildren = async () => {
    const response = await fetch(
      `/api/staff/classes/${currentClass?.classId}/children`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Class-Context': currentClass?.classId || '',
        },
      }
    );
    // ...
  };

  return (
    <div>
      <h2>{currentClass?.className}のレポート作成</h2>
      {/* ... */}
    </div>
  );
}
```

## 6. APIリクエストヘッダー

### 6.1 クラスコンテキストヘッダー

全てのスタッフAPI呼び出しに以下のヘッダーを含める:

```typescript
const headers = {
  'Authorization': `Bearer ${accessToken}`,
  'X-Class-Context': currentClass?.classId || '',
  'X-Nursery-Id': nurseryId.toString(),
};
```

### 6.2 Axios Interceptorでの自動付与

```typescript
// reactapp.client/src/services/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

// リクエストインターセプター
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // StaffClassContextから現在のクラスを取得して付与
  const staffContext = localStorage.getItem('currentStaffClass');
  if (staffContext) {
    const { classId, nurseryId } = JSON.parse(staffContext);
    config.headers['X-Class-Context'] = classId;
    config.headers['X-Nursery-Id'] = nurseryId;
  }

  return config;
});

export default api;
```

## 7. エラーハンドリング

### 7.1 クラスアクセス権限エラー

```typescript
// 403 Forbiddenエラー時の処理
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 403) {
      const errorCode = error.response.data?.error?.code;

      if (errorCode === 'CLASS_ACCESS_DENIED') {
        // クラス選択画面にリダイレクト
        window.location.href = '/staff/select-class';
      }
    }
    return Promise.reject(error);
  }
);
```

## 8. テスト考慮事項

### 8.1 Contextのモック

```typescript
// __tests__/components/staff/ClassSelector.test.tsx
import { render, screen } from '@testing-library/react';
import { StaffClassContext } from '../../../contexts/StaffClassContext';
import { ClassSelector } from '../../../components/staff/ClassSelector';

const mockContextValue = {
  nurseryId: 1,
  staffId: 123,
  currentClass: {
    classId: 'sakura',
    className: 'さくら組',
    assignmentRole: 'MainTeacher' as const,
    nurseryId: 1,
  },
  availableClasses: [
    {
      classId: 'sakura',
      className: 'さくら組',
      assignmentRole: 'MainTeacher' as const,
      nurseryId: 1,
    },
    {
      classId: 'himawari',
      className: 'ひまわり組',
      assignmentRole: 'AssistantTeacher' as const,
      nurseryId: 1,
    },
  ],
  isMultiClass: true,
  isLoading: false,
  switchClass: jest.fn(),
  refreshClasses: jest.fn(),
};

test('displays current class name', () => {
  render(
    <StaffClassContext.Provider value={mockContextValue}>
      <ClassSelector {...mockContextValue} onClassChange={jest.fn()} />
    </StaffClassContext.Provider>
  );

  expect(screen.getByText(/さくら組/)).toBeInTheDocument();
});
```

## 9. パフォーマンス最適化

### 9.1 メモ化

```typescript
const ClassSelector = memo(function ClassSelector({
  currentClass,
  availableClasses,
  onClassChange,
}: ClassSelectorProps) {
  // ...
});

export { ClassSelector };
```

### 9.2 localStorageキャッシュ

クラス切り替え時にlocalStorageに保存し、ページリロード時にも復元:

```typescript
// localStorageキー: lastSelectedClass_{staffId}
localStorage.setItem(`lastSelectedClass_${staffId}`, classId);
```

## 10. アクセシビリティ

- `aria-label`をClassSelectorに追加
- キーボードナビゲーション対応 (HeadlessUIが自動提供)
- スクリーンリーダー対応のラベル付け

```typescript
<Menu.Button
  aria-label="担当クラスを選択"
  className="..."
>
  {/* ... */}
</Menu.Button>
```

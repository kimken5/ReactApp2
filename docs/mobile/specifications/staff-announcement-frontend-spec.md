# スタッフお知らせ管理機能 フロントエンド設計書

## 1. 概要

スタッフがダッシュボードからお知らせ一覧を表示し、新規作成・編集・削除を行うためのフロントエンド実装仕様。レポート管理機能（`ReportList`, `ReportCreate`）と同様のUI/UXパターンを採用し、一貫性のある操作性を実現する。

---

## 2. コンポーネント構成

### 2.1 ディレクトリ構造

```
reactapp.client/src/
├── components/
│   └── staff/
│       ├── dashboard/
│       │   └── StaffDashboard.tsx          # ダッシュボード（お知らせ管理へのエントリーポイント追加）
│       └── announcements/
│           ├── AnnouncementList.tsx        # お知らせ一覧画面
│           ├── AnnouncementCreate.tsx      # お知らせ作成・編集画面
│           └── AnnouncementCard.tsx        # お知らせカード（一覧表示用）
├── contexts/
│   └── AuthContext.tsx                     # 認証コンテキスト（既存）
├── services/
│   └── apiClient.ts                        # APIクライアント（既存、お知らせAPIエンドポイント追加）
└── pages/
    └── AnnouncementPage.tsx                # お知らせページ（ルーティング用ラッパー）
```

---

## 3. ルーティング設計

### 3.1 ルート定義

既存の `App.tsx` に以下のルートを追加：

```typescript
import AnnouncementPage from './pages/AnnouncementPage';
import AnnouncementList from './components/staff/announcements/AnnouncementList';
import AnnouncementCreate from './components/staff/announcements/AnnouncementCreate';

// ルート定義
{
  path: '/staff/announcements',
  element: <AnnouncementPage />,
  children: [
    {
      index: true,
      element: <AnnouncementList />
    },
    {
      path: 'create',
      element: <AnnouncementCreate />
    },
    {
      path: 'edit/:id',
      element: <AnnouncementCreate />
    }
  ]
}
```

### 3.2 ナビゲーションフロー

```
StaffDashboard
  └─ "お知らせ管理" ボタン
       └─ /staff/announcements → AnnouncementList
            ├─ "新規作成" ボタン → /staff/announcements/create
            ├─ "編集" ボタン → /staff/announcements/edit/:id
            └─ "削除" ボタン → 確認ダイアログ → 削除実行 → AnnouncementList
```

---

## 4. データモデル（TypeScript型定義）

### 4.1 Announcement 型

```typescript
export interface Announcement {
  id: number;
  nurseryId: number;
  staffId: number;
  staffName: string;
  title: string;
  content: string;
  category: AnnouncementCategory;
  targetScope: TargetScope;
  targetClassIds: number[];
  targetChildIds: number[];
  attachments: Attachment[];
  status: AnnouncementStatus;
  priority: Priority;
  allowComments: boolean;
  publishedAt?: string; // ISO 8601 形式
  scheduledAt?: string; // ISO 8601 形式
  createdAt: string;    // ISO 8601 形式
  updatedAt: string;    // ISO 8601 形式
  isActive: boolean;
}

export type AnnouncementCategory =
  | 'general'      // 一般
  | 'urgent'       // 緊急
  | 'event'        // イベント
  | 'health'       // 健康
  | 'meal'         // 献立
  | 'belongings'   // 持ち物
  | 'other';       // その他

export type TargetScope =
  | 'all'          // 全体
  | 'class'        // クラス単位
  | 'individual';  // 個別

export type AnnouncementStatus =
  | 'draft'        // 下書き
  | 'published'    // 公開済み
  | 'archived';    // アーカイブ

export type Priority =
  | 'normal'       // 通常
  | 'important'    // 重要
  | 'urgent';      // 緊急

export interface Attachment {
  fileName: string;
  fileUrl: string;
  fileSize: number;
  contentType: string;
}
```

### 4.2 リクエスト DTO 型

```typescript
export interface CreateAnnouncementRequest {
  title: string;
  content: string;
  category: AnnouncementCategory;
  targetScope: TargetScope;
  targetClassIds?: number[];
  targetChildIds?: number[];
  attachments?: File[];
  status: AnnouncementStatus;
  priority: Priority;
  allowComments: boolean;
  scheduledAt?: string;
}

export interface UpdateAnnouncementRequest {
  title: string;
  content: string;
  category?: AnnouncementCategory;      // 公開済みは変更不可
  targetScope?: TargetScope;            // 公開済みは変更不可
  targetClassIds?: number[];            // 公開済みは変更不可
  targetChildIds?: number[];            // 公開済みは変更不可
  attachments?: File[];
  priority: Priority;
  allowComments: boolean;
  scheduledAt?: string;
}
```

---

## 5. AnnouncementList コンポーネント

### 5.1 主要機能

- スタッフが作成したお知らせ一覧を表示
- ステータス・カテゴリ・対象範囲でフィルタリング
- タイトル・本文のキーワード検索
- ページネーション（20件/ページ）
- お知らせカードから編集・削除・詳細表示

### 5.2 状態管理（useState）

```typescript
const [announcements, setAnnouncements] = useState<Announcement[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

// フィルタ・検索状態
const [statusFilter, setStatusFilter] = useState<AnnouncementStatus | 'all'>('all');
const [categoryFilter, setCategoryFilter] = useState<AnnouncementCategory | 'all'>('all');
const [targetScopeFilter, setTargetScopeFilter] = useState<TargetScope | 'all'>('all');
const [searchKeyword, setSearchKeyword] = useState('');

// ページネーション状態
const [currentPage, setCurrentPage] = useState(1);
const [totalCount, setTotalCount] = useState(0);
const [pageSize] = useState(20);
```

### 5.3 API呼び出しパターン

```typescript
useEffect(() => {
  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/Announcements/staff/my', {
        params: {
          status: statusFilter !== 'all' ? statusFilter : undefined,
          category: categoryFilter !== 'all' ? categoryFilter : undefined,
          targetScope: targetScopeFilter !== 'all' ? targetScopeFilter : undefined,
          keyword: searchKeyword || undefined,
          page: currentPage,
          pageSize: pageSize
        }
      });
      setAnnouncements(response.data.announcements);
      setTotalCount(response.data.totalCount);
      setError(null);
    } catch (err) {
      console.error('お知らせ取得エラー:', err);
      setError('お知らせの取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  fetchAnnouncements();
}, [statusFilter, categoryFilter, targetScopeFilter, searchKeyword, currentPage, pageSize]);
```

### 5.4 UIレイアウト（レポート一覧パターン準拠）

```typescript
return (
  <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
    {/* ヘッダー */}
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '24px'
    }}>
      <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>
        <MdAnnouncement size={28} style={{ marginRight: '8px' }} />
        お知らせ管理
      </h2>
      <button
        onClick={() => navigate('/staff/announcements/create')}
        style={{
          backgroundColor: '#3b82f6',
          color: 'white',
          padding: '10px 20px',
          borderRadius: '8px',
          border: 'none',
          cursor: 'pointer'
        }}
      >
        <MdAdd size={20} style={{ marginRight: '4px' }} />
        新規作成
      </button>
    </div>

    {/* フィルタ・検索セクション */}
    <div style={{
      backgroundColor: 'white',
      padding: '16px',
      borderRadius: '8px',
      marginBottom: '20px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    }}>
      {/* ステータスフィルタ */}
      <div style={{ marginBottom: '12px' }}>
        <label style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>
          ステータス
        </label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as AnnouncementStatus | 'all')}
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid #e2e8f0',
            width: '200px'
          }}
        >
          <option value="all">すべて</option>
          <option value="draft">下書き</option>
          <option value="published">公開済み</option>
          <option value="archived">アーカイブ</option>
        </select>
      </div>

      {/* カテゴリフィルタ */}
      <div style={{ marginBottom: '12px' }}>
        <label style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>
          カテゴリ
        </label>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as AnnouncementCategory | 'all')}
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid #e2e8f0',
            width: '200px'
          }}
        >
          <option value="all">すべて</option>
          <option value="general">一般</option>
          <option value="urgent">緊急</option>
          <option value="event">イベント</option>
          <option value="health">健康</option>
          <option value="meal">献立</option>
          <option value="belongings">持ち物</option>
          <option value="other">その他</option>
        </select>
      </div>

      {/* キーワード検索 */}
      <div>
        <label style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>
          キーワード検索
        </label>
        <input
          type="text"
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          placeholder="タイトルまたは本文で検索..."
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid #e2e8f0',
            width: '100%',
            maxWidth: '400px'
          }}
        />
      </div>
    </div>

    {/* お知らせカード一覧 */}
    {loading ? (
      <div style={{ textAlign: 'center', padding: '40px' }}>読み込み中...</div>
    ) : error ? (
      <div style={{ color: '#ef4444', padding: '20px', textAlign: 'center' }}>{error}</div>
    ) : announcements.length === 0 ? (
      <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
        お知らせがありません
      </div>
    ) : (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {announcements.map((announcement) => (
          <AnnouncementCard
            key={announcement.id}
            announcement={announcement}
            onEdit={() => navigate(`/staff/announcements/edit/${announcement.id}`)}
            onDelete={() => handleDelete(announcement.id)}
          />
        ))}
      </div>
    )}

    {/* ページネーション */}
    {totalCount > pageSize && (
      <div style={{
        marginTop: '24px',
        display: 'flex',
        justifyContent: 'center',
        gap: '8px'
      }}>
        {/* ページネーションボタン */}
      </div>
    )}
  </div>
);
```

### 5.5 削除処理

```typescript
const handleDelete = async (id: number) => {
  const announcement = announcements.find(a => a.id === id);

  if (!announcement) return;

  // 公開済み・アーカイブは削除不可
  if (announcement.status !== 'draft') {
    alert('下書きのみ削除できます。');
    return;
  }

  if (!confirm(`「${announcement.title}」を削除しますか?\nこの操作は取り消せません。`)) {
    return;
  }

  try {
    await apiClient.delete(`/Announcements/${id}`);
    // 一覧を再取得
    setAnnouncements(prev => prev.filter(a => a.id !== id));
    alert('お知らせを削除しました。');
  } catch (err) {
    console.error('削除エラー:', err);
    alert('削除に失敗しました。');
  }
};
```

---

## 6. AnnouncementCard コンポーネント

### 6.1 Props 定義

```typescript
interface AnnouncementCardProps {
  announcement: Announcement;
  onEdit: () => void;
  onDelete: () => void;
}
```

### 6.2 ステータスバッジスタイル

```typescript
const getStatusBadgeStyle = (status: AnnouncementStatus) => {
  switch (status) {
    case 'draft':
      return {
        backgroundColor: '#fef3c7',
        color: '#f59e0b',
        label: '下書き'
      };
    case 'published':
      return {
        backgroundColor: '#d1fae5',
        color: '#10b981',
        label: '公開済み'
      };
    case 'archived':
      return {
        backgroundColor: '#f1f5f9',
        color: '#64748b',
        label: 'アーカイブ'
      };
  }
};
```

### 6.3 カテゴリバッジスタイル

```typescript
const getCategoryInfo = (category: AnnouncementCategory) => {
  switch (category) {
    case 'general':
      return { label: '一般', color: '#3b82f6' };
    case 'urgent':
      return { label: '緊急', color: '#ef4444' };
    case 'event':
      return { label: 'イベント', color: '#8b5cf6' };
    case 'health':
      return { label: '健康', color: '#10b981' };
    case 'meal':
      return { label: '献立', color: '#f59e0b' };
    case 'belongings':
      return { label: '持ち物', color: '#06b6d4' };
    case 'other':
      return { label: 'その他', color: '#64748b' };
  }
};
```

### 6.4 UIレイアウト

```typescript
return (
  <div style={{
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    border: '1px solid #e2e8f0'
  }}>
    {/* ヘッダー行 */}
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'start',
      marginBottom: '12px'
    }}>
      <div style={{ flex: 1 }}>
        <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>
          {announcement.title}
        </h3>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {/* ステータスバッジ */}
          <span style={{
            ...getStatusBadgeStyle(announcement.status),
            padding: '4px 12px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: '600'
          }}>
            {getStatusBadgeStyle(announcement.status).label}
          </span>

          {/* カテゴリバッジ */}
          <span style={{
            backgroundColor: getCategoryInfo(announcement.category).color + '20',
            color: getCategoryInfo(announcement.category).color,
            padding: '4px 12px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: '600'
          }}>
            {getCategoryInfo(announcement.category).label}
          </span>

          {/* 重要度バッジ（緊急・重要のみ表示） */}
          {announcement.priority !== 'normal' && (
            <span style={{
              backgroundColor: announcement.priority === 'urgent' ? '#fee2e2' : '#fef3c7',
              color: announcement.priority === 'urgent' ? '#ef4444' : '#f59e0b',
              padding: '4px 12px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: '600'
            }}>
              {announcement.priority === 'urgent' ? '緊急' : '重要'}
            </span>
          )}
        </div>
      </div>

      {/* アクションボタン */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={onEdit}
          style={{
            padding: '8px 16px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          <MdEdit size={16} />
        </button>
        {announcement.status === 'draft' && (
          <button
            onClick={onDelete}
            style={{
              padding: '8px 16px',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            <MdDelete size={16} />
          </button>
        )}
      </div>
    </div>

    {/* 本文プレビュー */}
    <p style={{
      color: '#64748b',
      marginBottom: '12px',
      lineHeight: '1.6'
    }}>
      {announcement.content.substring(0, 100)}
      {announcement.content.length > 100 && '...'}
    </p>

    {/* メタ情報 */}
    <div style={{
      fontSize: '12px',
      color: '#94a3b8',
      display: 'flex',
      gap: '16px',
      flexWrap: 'wrap'
    }}>
      <span>対象: {getTargetScopeLabel(announcement.targetScope)}</span>
      {announcement.publishedAt && (
        <span>公開日時: {formatDateTime(announcement.publishedAt)}</span>
      )}
      <span>作成: {formatDateTime(announcement.createdAt)}</span>
      <span>更新: {formatDateTime(announcement.updatedAt)}</span>
    </div>
  </div>
);
```

---

## 7. AnnouncementCreate コンポーネント

### 7.1 主要機能

- 新規お知らせ作成（下書き保存 or 即時公開）
- 既存お知らせ編集（ステータスに応じた編集制限）
- マークダウン対応本文エディタ
- ファイル添付（画像・PDF、最大5個、各10MB）
- バリデーション（必須項目、文字数制限）

#### 7.1.1 ステータス別の編集制限

**下書き (draft)**
- すべてのフィールドを編集可能
- 下書き保存ボタンを表示
- 公開ボタンを表示

**公開済み (published)**
- タイトル、本文、添付ファイル、重要度、コメント許可を編集可能
- カテゴリ、対象範囲（ターゲット）は変更不可
- **下書き保存ボタンを非表示**（公開状態を維持）
- 更新ボタンを表示（公開状態を維持して更新）

**アーカイブ (archived)**
- 編集不可（一覧からアーカイブ解除のみ可能）

### 7.2 状態管理（useState）

```typescript
const [isEditMode, setIsEditMode] = useState(false);
const [announcementId, setAnnouncementId] = useState<number | null>(null);
const [loading, setLoading] = useState(false);

// フォーム状態
const [title, setTitle] = useState('');
const [content, setContent] = useState('');
const [category, setCategory] = useState<AnnouncementCategory>('general');
const [targetScope, setTargetScope] = useState<TargetScope>('all');
const [targetClassIds, setTargetClassIds] = useState<number[]>([]);
const [targetChildIds, setTargetChildIds] = useState<number[]>([]);
const [attachments, setAttachments] = useState<File[]>([]);
const [existingAttachments, setExistingAttachments] = useState<Attachment[]>([]);
const [status, setStatus] = useState<AnnouncementStatus>('draft');
const [priority, setPriority] = useState<Priority>('normal');
const [allowComments, setAllowComments] = useState(true);
const [scheduledAt, setScheduledAt] = useState<string>('');

// バリデーションエラー
const [errors, setErrors] = useState<Record<string, string>>({});
```

### 7.3 編集データ読み込み

```typescript
useEffect(() => {
  const loadAnnouncement = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const response = await apiClient.get(`/Announcements/${id}`);
      const data: Announcement = response.data;

      setIsEditMode(true);
      setAnnouncementId(data.id);
      setTitle(data.title);
      setContent(data.content);
      setCategory(data.category);
      setTargetScope(data.targetScope);
      setTargetClassIds(data.targetClassIds);
      setTargetChildIds(data.targetChildIds);
      setExistingAttachments(data.attachments);
      setStatus(data.status);
      setPriority(data.priority);
      setAllowComments(data.allowComments);
      setScheduledAt(data.scheduledAt || '');
    } catch (err) {
      console.error('お知らせ取得エラー:', err);
      alert('お知らせの取得に失敗しました。');
      navigate('/staff/announcements');
    } finally {
      setLoading(false);
    }
  };

  loadAnnouncement();
}, [id, navigate]);
```

### 7.4 バリデーション

```typescript
const validate = (): boolean => {
  const newErrors: Record<string, string> = {};

  if (!title.trim()) {
    newErrors.title = 'タイトルは必須です。';
  } else if (title.length > 100) {
    newErrors.title = 'タイトルは100文字以内で入力してください。';
  }

  if (!content.trim()) {
    newErrors.content = '本文は必須です。';
  } else if (content.length > 5000) {
    newErrors.content = '本文は5000文字以内で入力してください。';
  }

  if (targetScope === 'class' && targetClassIds.length === 0) {
    newErrors.targetClassIds = 'クラスを1つ以上選択してください。';
  }

  if (targetScope === 'individual' && targetChildIds.length === 0) {
    newErrors.targetChildIds = '園児を1つ以上選択してください。';
  }

  if (attachments.length + existingAttachments.length > 5) {
    newErrors.attachments = '添付ファイルは最大5個までです。';
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};
```

### 7.5 保存処理

```typescript
const handleSave = async (saveStatus: AnnouncementStatus) => {
  if (!validate()) {
    alert('入力内容を確認してください。');
    return;
  }

  try {
    setLoading(true);

    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    formData.append('category', category);
    formData.append('targetScope', targetScope);
    formData.append('status', saveStatus);
    formData.append('priority', priority);
    formData.append('allowComments', String(allowComments));

    if (targetScope === 'class') {
      targetClassIds.forEach(id => formData.append('targetClassIds', String(id)));
    }

    if (targetScope === 'individual') {
      targetChildIds.forEach(id => formData.append('targetChildIds', String(id)));
    }

    attachments.forEach(file => {
      formData.append('attachments', file);
    });

    if (scheduledAt) {
      formData.append('scheduledAt', scheduledAt);
    }

    if (isEditMode && announcementId) {
      await apiClient.put(`/Announcements/${announcementId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('お知らせを更新しました。');
    } else {
      await apiClient.post('/Announcements', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('お知らせを作成しました。');
    }

    navigate('/staff/announcements');
  } catch (err) {
    console.error('保存エラー:', err);
    alert('保存に失敗しました。');
  } finally {
    setLoading(false);
  }
};
```

### 7.6 UIレイアウト（ReportCreateパターン準拠）

```typescript
return (
  <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
    {/* ヘッダー */}
    <div style={{ marginBottom: '24px' }}>
      <button
        onClick={() => navigate('/staff/announcements')}
        style={{
          backgroundColor: 'transparent',
          border: 'none',
          color: '#3b82f6',
          cursor: 'pointer',
          marginBottom: '16px'
        }}
      >
        ← 一覧に戻る
      </button>
      <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>
        {isEditMode ? 'お知らせ編集' : 'お知らせ作成'}
      </h2>
    </div>

    {/* フォーム */}
    <div style={{
      backgroundColor: 'white',
      padding: '24px',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    }}>
      {/* タイトル */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{
          fontWeight: '600',
          marginBottom: '8px',
          display: 'block'
        }}>
          タイトル <span style={{ color: '#ef4444' }}>*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="お知らせのタイトルを入力..."
          maxLength={100}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '6px',
            border: `1px solid ${errors.title ? '#ef4444' : '#e2e8f0'}`
          }}
        />
        {errors.title && (
          <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
            {errors.title}
          </p>
        )}
      </div>

      {/* カテゴリ */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{
          fontWeight: '600',
          marginBottom: '8px',
          display: 'block'
        }}>
          カテゴリ <span style={{ color: '#ef4444' }}>*</span>
        </label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as AnnouncementCategory)}
          disabled={isEditMode && status === 'published'}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '6px',
            border: '1px solid #e2e8f0',
            backgroundColor: (isEditMode && status === 'published') ? '#f1f5f9' : 'white',
            cursor: (isEditMode && status === 'published') ? 'not-allowed' : 'pointer'
          }}
        >
          <option value="general">一般</option>
          <option value="urgent">緊急</option>
          <option value="event">イベント</option>
          <option value="health">健康</option>
          <option value="meal">献立</option>
          <option value="belongings">持ち物</option>
          <option value="other">その他</option>
        </select>
      </div>

      {/* 対象範囲 */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{
          fontWeight: '600',
          marginBottom: '8px',
          display: 'block'
        }}>
          対象範囲 <span style={{ color: '#ef4444' }}>*</span>
        </label>
        <select
          value={targetScope}
          onChange={(e) => setTargetScope(e.target.value as TargetScope)}
          disabled={isEditMode && status === 'published'}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '6px',
            border: '1px solid #e2e8f0',
            backgroundColor: (isEditMode && status === 'published') ? '#f1f5f9' : 'white',
            cursor: (isEditMode && status === 'published') ? 'not-allowed' : 'pointer'
          }}
        >
          <option value="all">全体</option>
          <option value="class">クラス単位</option>
          <option value="individual">個別</option>
        </select>
      </div>

      {/* 本文 */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{
          fontWeight: '600',
          marginBottom: '8px',
          display: 'block'
        }}>
          本文 <span style={{ color: '#ef4444' }}>*</span>
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="お知らせの内容を入力... (マークダウン記法対応)"
          maxLength={5000}
          rows={12}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '6px',
            border: `1px solid ${errors.content ? '#ef4444' : '#e2e8f0'}`,
            fontFamily: 'monospace',
            resize: 'vertical'
          }}
        />
        {errors.content && (
          <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
            {errors.content}
          </p>
        )}
        <p style={{
          fontSize: '12px',
          color: '#94a3b8',
          marginTop: '4px'
        }}>
          {content.length} / 5000文字
        </p>
      </div>

      {/* 添付ファイル */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{
          fontWeight: '600',
          marginBottom: '8px',
          display: 'block'
        }}>
          添付ファイル（画像・PDF、最大5個、各10MB以内）
        </label>
        <input
          type="file"
          multiple
          accept="image/*,.pdf"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
          id="file-upload"
        />
        <label
          htmlFor="file-upload"
          style={{
            display: 'inline-block',
            padding: '10px 20px',
            backgroundColor: '#3b82f6',
            color: 'white',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          ファイルを選択
        </label>
        {errors.attachments && (
          <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
            {errors.attachments}
          </p>
        )}
        {/* 添付ファイルプレビュー */}
      </div>

      {/* 重要度 */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{
          fontWeight: '600',
          marginBottom: '8px',
          display: 'block'
        }}>
          重要度
        </label>
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as Priority)}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '6px',
            border: '1px solid #e2e8f0'
          }}
        >
          <option value="normal">通常</option>
          <option value="important">重要</option>
          <option value="urgent">緊急</option>
        </select>
      </div>

      {/* コメント許可 */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={allowComments}
            onChange={(e) => setAllowComments(e.target.checked)}
            style={{ marginRight: '8px' }}
          />
          保護者からのコメントを許可する
        </label>
      </div>

      {/* 保存ボタン */}
      <div style={{
        display: 'flex',
        gap: '12px',
        justifyContent: 'flex-end',
        marginTop: '24px'
      }}>
        {/* 下書き保存ボタン: 新規作成時、または編集時に元のステータスが下書きの場合のみ表示 */}
        {/* 公開済み(published)のお知らせを編集する場合は下書き保存ボタンを非表示 */}
        {!isEditMode && (
          <button
            onClick={() => handleSave('draft')}
            disabled={loading}
            style={{
              padding: '10px 24px',
              backgroundColor: '#f59e0b',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            下書き保存
          </button>
        )}
        {isEditMode && status === 'draft' && (
          <button
            onClick={() => handleSave('draft')}
            disabled={loading}
            style={{
              padding: '10px 24px',
              backgroundColor: '#f59e0b',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            下書き保存
          </button>
        )}
        <button
          onClick={() => handleSave('published')}
          disabled={loading}
          style={{
            padding: '10px 24px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {isEditMode ? '更新して公開' : '公開'}
        </button>
      </div>
    </div>
  </div>
);
```

---

## 8. StaffDashboard 統合

### 8.1 お知らせ管理ボタン追加

既存の `StaffDashboard.tsx` に以下のボタンを追加：

```typescript
<button
  onClick={() => navigate('/staff/announcements')}
  style={{
    display: 'flex',
    alignItems: 'center',
    padding: '16px',
    backgroundColor: 'white',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    cursor: 'pointer',
    width: '100%',
    transition: 'all 0.2s'
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.backgroundColor = '#f8fafc';
    e.currentTarget.style.borderColor = '#3b82f6';
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.backgroundColor = 'white';
    e.currentTarget.style.borderColor = '#e2e8f0';
  }}
>
  <MdAnnouncement size={24} style={{ color: '#3b82f6', marginRight: '12px' }} />
  <div style={{ textAlign: 'left' }}>
    <div style={{ fontWeight: '600', fontSize: '16px' }}>お知らせ管理</div>
    <div style={{ fontSize: '12px', color: '#64748b' }}>
      保護者向けお知らせの作成・編集
    </div>
  </div>
</button>
```

---

## 9. API統合（apiClient.ts）

既存の `apiClient.ts` はそのまま使用可能。エンドポイント例：

```typescript
// お知らせ一覧取得
const response = await apiClient.get('/Announcements/staff/my', {
  params: { status: 'all', page: 1, pageSize: 20 }
});

// お知らせ詳細取得
const response = await apiClient.get(`/Announcements/${id}`);

// お知らせ作成
const response = await apiClient.post('/Announcements', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});

// お知らせ更新
const response = await apiClient.put(`/Announcements/${id}`, formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});

// お知らせ削除
await apiClient.delete(`/Announcements/${id}`);

// お知らせ公開
await apiClient.post(`/Announcements/${id}/publish`);

// お知らせアーカイブ
await apiClient.post(`/Announcements/${id}/archive`);
```

---

## 10. レスポンシブデザイン対応

### 10.1 モバイルビュー（画面幅 < 768px）

```typescript
const isMobile = window.innerWidth < 768;

// AnnouncementList: グリッドレイアウトをシングルカラムに変更
<div style={{
  display: 'flex',
  flexDirection: 'column',
  gap: isMobile ? '12px' : '16px'
}}>

// AnnouncementCard: パディング調整
<div style={{
  padding: isMobile ? '16px' : '20px',
  fontSize: isMobile ? '14px' : '16px'
}}>

// AnnouncementCreate: フォームパディング調整
<div style={{
  padding: isMobile ? '16px' : '24px',
  maxWidth: isMobile ? '100%' : '900px'
}}>
```

---

## 11. エラーハンドリング

### 11.1 API エラー処理

```typescript
try {
  const response = await apiClient.get('/Announcements/staff/my');
  // 成功処理
} catch (err: any) {
  console.error('API エラー:', err);

  if (err.response?.status === 401) {
    alert('認証エラー: 再度ログインしてください。');
    navigate('/staff/login');
  } else if (err.response?.status === 403) {
    alert('権限エラー: アクセスが拒否されました。');
  } else if (err.response?.status === 404) {
    alert('お知らせが見つかりませんでした。');
  } else {
    alert('エラーが発生しました。もう一度お試しください。');
  }
}
```

### 11.2 バリデーションエラー表示

- 各入力フィールドの下にエラーメッセージ表示
- エラーフィールドは赤枠で強調
- 送信時に全エラーをまとめてアラート表示

---

## 12. パフォーマンス最適化

### 12.1 画像遅延読み込み

```typescript
<img
  src={attachment.fileUrl}
  loading="lazy"
  style={{ maxWidth: '100%', height: 'auto' }}
/>
```

### 12.2 useCallback でハンドラー最適化

```typescript
const handleDelete = useCallback(async (id: number) => {
  // 削除処理
}, [announcements]);

const handleEdit = useCallback((id: number) => {
  navigate(`/staff/announcements/edit/${id}`);
}, [navigate]);
```

### 12.3 useMemo でフィルタ結果キャッシュ

```typescript
const filteredAnnouncements = useMemo(() => {
  return announcements.filter(a => {
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    if (categoryFilter !== 'all' && a.category !== categoryFilter) return false;
    if (searchKeyword && !a.title.includes(searchKeyword) && !a.content.includes(searchKeyword)) return false;
    return true;
  });
}, [announcements, statusFilter, categoryFilter, searchKeyword]);
```

---

## 13. アイコン定義

react-icons から以下のアイコンをインポート：

```typescript
import {
  MdAnnouncement,
  MdAdd,
  MdEdit,
  MdDelete,
  MdSend,
  MdArchive,
  MdVisibility,
  MdCloudUpload,
  MdAttachFile
} from 'react-icons/md';
```

---

## 14. 今後の拡張予定

- マークダウンプレビュー機能
- 既読確認詳細表示
- 保護者コメント管理インターフェース
- お知らせテンプレート機能
- お知らせの複製機能
- 一括操作（一括アーカイブなど）

---

## 15. テスト観点

### 15.1 機能テスト

- ✅ お知らせ一覧の正常表示
- ✅ フィルタ・検索の動作確認
- ✅ 新規作成（下書き保存・公開）
- ✅ 編集（ステータス別の制限確認）
- ✅ 削除（下書きのみ削除可能）
- ✅ ファイルアップロード（サイズ・形式制限）
- ✅ バリデーションエラー表示

### 15.2 セキュリティテスト

- ✅ 他のスタッフのお知らせへのアクセス制限
- ✅ JWT トークン有効期限切れ時の挙動
- ✅ XSS対策（入力値のサニタイズ）
- ✅ CSRF対策（APIクライアントでトークン送信）

### 15.3 パフォーマンステスト

- ✅ 大量データ（100件以上）の一覧表示速度
- ✅ ページネーション動作
- ✅ 画像遅延読み込み動作

---

## 16. 参考

- **レポート管理機能**: `ReportList.tsx`, `ReportCreate.tsx`
- **認証コンテキスト**: `AuthContext.tsx`
- **APIクライアント**: `apiClient.ts`
- **アイコンライブラリ**: `react-icons`

---

**作成日**: 2025-10-09
**バージョン**: 1.0.0

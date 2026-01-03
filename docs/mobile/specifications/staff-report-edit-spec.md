# スタッフ日報編集機能 UI仕様書

## 1. 概要

スタッフが作成した日報（DailyReport）を編集する機能のUI仕様。
お知らせ編集機能と同様に、ステータスに応じた編集制限とボタン表示制御を実装する。

### 1.1 複数園児選択機能（2025-12-26追加）

同じ内容のレポートを複数の園児に同時に送信できる機能を実装する。

**主な仕様:**
- 園児選択UIをチェックボックス形式に変更し、複数園児を選択可能
- 選択された園児ごとに個別のDailyReportレコードを作成
- グループID（GroupId）で同一内容のレポートを関連付け
- 編集時はグループ内の全レポートを一括更新
- 削除時はグループ内の全レポートを一括削除

**データベース設計:**
- DailyReportsテーブルにGroupId (int, nullable) カラムを追加
- 同じGroupIdを持つレポートは同一内容のグループレポートとして扱う
- 単一園児レポートの場合はGroupId = NULL

---

## 2. ステータス別の編集制限

### 2.1 下書き (draft)

- **編集可能項目**: すべてのフィールド
- **ボタン表示**:
  - ✅ 下書き保存ボタンを表示
  - ✅ 公開ボタンを表示

### 2.2 公開済み (published)

- **編集可能項目**: タイトル、本文、カテゴリ、タグ、写真
- **編集不可項目**: 報告日、対象園児、園児構成（GroupIdがある場合）
- **ボタン表示**:
  - ❌ **下書き保存ボタンを非表示**（公開状態を維持）
  - ✅ 更新ボタンを表示（公開状態を維持して更新）
- **グループレポートの場合**:
  - 園児選択エリアは読み取り専用で表示
  - 選択された園児のリストを表示（変更不可）
  - 編集内容はGroupId内の全レポートに一括適用

### 2.3 アーカイブ (archived)

- **編集**: 不可（一覧からアーカイブ解除のみ可能）

---

## 3. 実装仕様

### 3.1 状態管理

```typescript
const [originalStatus, setOriginalStatus] = useState<string>(''); // 編集前のステータスを保持
```

### 3.2 データ取得時の処理

```typescript
useEffect(() => {
  const fetchReportData = async () => {
    if (!isEditMode || !reportId) return;

    try {
      const response = await apiClient.get(`/DailyReports/${reportId}`);
      const data = response.data;

      // 各フィールドを設定
      setTitle(data.title);
      setContent(data.content);
      // ... その他のフィールド

      // 元のステータスを保存
      setOriginalStatus(data.status || '');
    } catch (error) {
      console.error('日報データ取得エラー:', error);
    }
  };

  fetchReportData();
}, [isEditMode, reportId]);
```

### 3.3 下書き保存ボタンの表示制御

```typescript
{/* 下書き保存ボタン: 公開済みの場合は非表示 */}
{originalStatus !== 'published' && (
  <button
    onClick={() => handleSave(true)}
    disabled={loading}
    style={{
      padding: '8px 16px',
      backgroundColor: 'white',
      color: 'rgb(249, 115, 22)',
      border: '2px solid rgb(249, 115, 22)',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: 'bold',
      cursor: 'pointer',
    }}
  >
    <MdSave size={16} />
    下書き保存
  </button>
)}
```

---

## 4. UI表示例

### 4.1 新規作成時（複数園児選択）

```
┌─────────────────────────────────────┐
│ [← 戻る]                            │
│ レポート作成                         │
├─────────────────────────────────────┤
│ 園児選択                            │
│ □ 佐藤 太郎                         │
│ ☑ 鈴木 花子                         │
│ ☑ 田中 次郎                         │
│ □ 山田 美咲                         │
│ [全員選択] [全解除]                 │
│                                     │
│ 選択中: 鈴木花子、田中次郎 (2名)    │
│                                     │
│ [その他のフォーム内容]              │
│                                     │
├─────────────────────────────────────┤
│              [下書き保存] [送信]    │
└─────────────────────────────────────┘
```

### 4.2 下書き編集時

```
┌─────────────────────────────────────┐
│ [← 戻る]                            │
│ 日報編集 (下書き)                   │
├─────────────────────────────────────┤
│                                     │
│ [フォーム内容]                       │
│                                     │
├─────────────────────────────────────┤
│              [下書き保存] [公開]    │
└─────────────────────────────────────┘
```

### 4.3 公開済み編集時（グループレポート）

```
┌─────────────────────────────────────┐
│ [← 戻る]                            │
│ レポート編集 (公開済み)             │
├─────────────────────────────────────┤
│ 対象園児 (変更不可)                 │
│ このレポートは2名の園児に送信されて │
│ います:                             │
│ • 鈴木 花子                         │
│ • 田中 次郎                         │
│                                     │
│ [その他のフォーム内容]              │
│                                     │
├─────────────────────────────────────┤
│                          [更新]     │
└─────────────────────────────────────┘
※ 下書き保存ボタンは非表示
※ 園児選択は読み取り専用
※ 更新内容はグループ内の全レポートに適用
```

---

## 5. バリデーション

### 5.1 公開済み日報の編集制限

公開済み日報を編集する場合、以下の項目は編集不可（disabled または非表示）:
- 報告日 (reportDate)
- 対象園児 (targetChildren)

---

## 6. エラーハンドリング

### 6.1 権限チェック

```typescript
// 自分が作成した日報のみ編集可能
if (report.staffId !== currentStaffId) {
  alert('この日報を編集する権限がありません。');
  navigate('/staff/reports');
  return;
}
```

### 6.2 ステータスチェック

```typescript
// アーカイブ済みは編集不可
if (report.status === 'archived') {
  alert('アーカイブ済みの日報は編集できません。');
  navigate('/staff/reports');
  return;
}
```

---

## 7. テストケース

### 7.1 下書き保存ボタン表示テスト

| テストケース | 条件 | 期待結果 |
|-------------|------|---------|
| 新規作成 | 初回作成 | 下書き保存ボタン表示 |
| 下書き編集 | status='draft' | 下書き保存ボタン表示 |
| 公開済み編集 | status='published' | 下書き保存ボタン非表示 |
| アーカイブ編集 | status='archived' | 編集画面に遷移しない |

### 7.2 保存処理テスト

| テストケース | 操作 | 期待結果 |
|-------------|------|---------|
| 下書き保存 | 下書き保存ボタンクリック | status='draft'で保存 |
| 公開 | 公開ボタンクリック | status='published'で保存 |
| 公開済み更新 | 更新ボタンクリック | status='published'を維持して更新 |

---

## 8. 関連仕様書

- [スタッフお知らせ管理機能 フロントエンド設計書](./staff-announcement-frontend-spec.md)
  - お知らせ編集機能も同様のステータス別編集制限を実装
  - UI/UXパターンを統一

---

## 9. 実装状況

- ✅ お知らせ編集: ステータス別の下書き保存ボタン表示制御を実装済み
- ✅ 日報編集: 同様の実装が必要（本仕様書に基づいて実装）
- 🔄 複数園児選択機能: 実装中（2025-12-26）
  - ✅ データベース設計完了（GroupIdカラム追加）
  - ✅ DailyReportモデル更新完了
  - ⏳ バックエンドAPI実装中
  - ⏳ フロントエンドUI実装中

---

## 10. 複数園児選択機能の詳細仕様

### 10.1 GroupID生成ロジック

```csharp
// 複数園児選択時のみGroupIdを生成
int? groupId = childIds.Length > 1
    ? (int)DateTimeOffset.UtcNow.ToUnixTimeSeconds()
    : null;
```

### 10.2 バックエンドAPI仕様

#### Create API
```
POST /api/DailyReports
Body: {
  "childIds": [1, 2, 3],  // 複数園児ID配列
  "reportDate": "2025-12-26",
  "reportKind": "activity,meal",
  "title": "今日の活動",
  "content": "...",
  "photos": "...",
  "status": "draft" | "published"
}

処理:
1. GroupIdを生成（複数園児の場合のみ）
2. 各childIdに対してDailyReportレコードを作成
3. 全レコードに同じGroupIdを設定
4. トランザクション内で一括作成
```

#### Update API
```
PUT /api/DailyReports/{id}
Body: {
  "title": "更新後のタイトル",
  "content": "更新後の内容",
  ...
}

処理:
1. 対象レポートのGroupIdを取得
2. GroupIdがnullでない場合、同じGroupIdの全レポートを検索
3. グループ内の全レポートを同じ内容で一括更新
```

#### Delete API
```
DELETE /api/DailyReports/{id}

処理:
1. 対象レポートのGroupIdを取得
2. GroupIdがnullでない場合、同じGroupIdの全レポートを検索
3. グループ内の全レポートを一括論理削除（IsActive=false）
```

### 10.3 フロントエンド実装仕様

#### State管理
```typescript
// 単一園児 → 複数園児配列に変更
const [selectedChildren, setSelectedChildren] = useState<ClassChild[]>([]);

// 園児の選択/選択解除
const toggleChildSelection = (child: ClassChild) => {
  setSelectedChildren(prev => {
    const isSelected = prev.some(c => c.childId === child.childId);
    if (isSelected) {
      return prev.filter(c => c.childId !== child.childId);
    } else {
      return [...prev, child];
    }
  });
};

// 全選択
const selectAllChildren = () => {
  setSelectedChildren(children);
};

// 全解除
const deselectAllChildren = () => {
  setSelectedChildren([]);
};
```

#### 保存処理
```typescript
const handleSave = async (isDraft: boolean) => {
  const payload = {
    childIds: selectedChildren.map(c => c.childId),
    reportDate,
    reportKind: selectedTags.join(','),
    title: reportContent.title,
    content: reportContent.content,
    photos: uploadedPhotos,
    status: isDraft ? 'draft' : 'published'
  };

  await apiClient.post('/DailyReports', payload);
};
```

---

## 11. 備考

### 11.1 設計思想

一度公開したコンテンツ（お知らせ・日報）は、**公開状態を維持したまま修正**することを基本とする。
これにより、以下のメリットがある:

1. **透明性**: 保護者が既に閲覧した内容を後から下書きに戻すことを防ぐ
2. **整合性**: 公開日時（publishedAt）を維持し、通知履歴との整合性を保つ
3. **操作の明確性**: 「公開」と「下書き」の状態遷移を一方向にし、UXを簡潔にする

### 11.2 例外ケース

公開済みコンテンツを下書きに戻す必要がある場合:
- 一覧画面から「アーカイブ」機能を使用
- アーカイブ後、必要に応じて新規作成で再作成

### 11.3 複数園児選択機能の制約事項

**編集時の制約:**
- グループレポート（GroupId != NULL）を編集する場合、園児構成は変更不可
- 園児を追加/削除したい場合は、新しいレポートを作成する必要がある
- この制約により、保護者が受け取ったレポートの整合性を保証

**理由:**
園児を途中で追加/削除すると、以下の問題が発生するため:
1. 既に通知を受けた保護者との整合性が取れなくなる
2. 一部の園児のレポートが途中で削除されると、保護者が混乱する
3. ParentAcknowledged（保護者確認）の管理が複雑になる

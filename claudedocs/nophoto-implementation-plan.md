# 撮影禁止(NoPhoto)機能 実装計画書

**作成日**: 2025-12-17
**対象バージョン**: React 19.1 + ASP.NET Core 8
**関連要件**: [docs/desktop/nophoto-feature-requirements.md](../docs/desktop/nophoto-feature-requirements.md)

---

## 実装概要

入園申込時および園児マスタ管理画面で撮影禁止設定を管理し、写真アップロード時に警告を表示する機能を実装します。

### 前提条件
- ✅ データベース変更済み (ユーザーが実施)
  - `ApplicationWorks.ChildNoPhoto` (BIT, DEFAULT 0)
  - `Children.NoPhoto` (BIT, DEFAULT 0, NOT NULL)

### 実装フェーズ
- **Phase 1**: バックエンドモデルとDTO更新
- **Phase 2**: 入園申込フォームUI実装
- **Phase 3**: 申込インポート時のデータ移行処理
- **Phase 4**: 園児マスタ管理画面UI実装
- **Phase 5**: 写真アップロード警告システム

---

## Phase 1: バックエンドモデルとDTO更新

### 1.1 ApplicationWorkモデル更新
**ファイル**: `ReactApp.Server/Models/ApplicationWork.cs`

**追加プロパティ**:
```csharp
/// <summary>
/// 撮影禁止フラグ (申込時)
/// True = 撮影禁止を希望, False = 撮影可 (デフォルト)
/// </summary>
public bool ChildNoPhoto { get; set; }
```

**理由**: 入園申込時に保護者が設定する撮影禁止フラグを保存

---

### 1.2 Childモデル更新
**ファイル**: `ReactApp.Server/Models/Child.cs` (または `Children.cs`)

**追加プロパティ**:
```csharp
/// <summary>
/// 撮影禁止フラグ (園児マスタ)
/// True = 撮影禁止, False = 撮影可 (デフォルト)
/// </summary>
public bool NoPhoto { get; set; }
```

**理由**: 園児マスタで管理する撮影禁止フラグ。入園後も編集可能。

---

### 1.3 DTOの更新

#### 1.3.1 ApplicationWorkDto
**ファイル**: `ReactApp.Server/DTOs/Desktop/ApplicationWorkDto.cs`

**ApplicationListItemDto に追加**:
```csharp
public bool ChildNoPhoto { get; set; }
```

**ApplicationDetailDto に追加**:
```csharp
public bool ChildNoPhoto { get; set; }
```

---

#### 1.3.2 ChildDto (要調査)
**ファイル**: `ReactApp.Server/DTOs/Desktop/ChildDto.cs` (推定)

**ChildListItemDto に追加**:
```csharp
public bool NoPhoto { get; set; }
```

**ChildDetailDto に追加**:
```csharp
public bool NoPhoto { get; set; }
```

---

#### 1.3.3 CreateApplicationDto / UpdateApplicationDto
**ファイル**: `ReactApp.Server/DTOs/ApplicationDto.cs` (推定)

**CreateApplicationDto に追加**:
```csharp
public bool ChildNoPhoto { get; set; } // デフォルトfalse
```

---

### 1.4 TypeScript型定義の更新

#### 1.4.1 ApplicationWork型定義
**ファイル**: `reactapp.client/src/types/desktopApplication.ts`

**ApplicationListItem に追加**:
```typescript
childNoPhoto: boolean;
```

**ApplicationDetail に追加**:
```typescript
childNoPhoto: boolean;
```

---

#### 1.4.2 Child型定義
**ファイル**: `reactapp.client/src/types/child.ts` (推定)

**Child型 に追加**:
```typescript
noPhoto: boolean;
```

---

## Phase 2: 入園申込フォームUI実装

### 2.1 申込フォームコンポーネント修正
**ファイル**: `reactapp.client/src/pages/ApplicationFormPage.tsx` (推定)

**実装内容**:

```tsx
// フォームステートに追加
const [formData, setFormData] = useState({
  // ... 既存のフィールド
  childNoPhoto: false, // デフォルトfalse (撮影・共有を許可)
});

// チェックボックス変更ハンドラー
const handleChildNoPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setFormData({ ...formData, childNoPhoto: e.target.checked });
};

// JSX (園児情報セクションに追加)
<div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
  <p className="text-sm text-gray-700 mb-2">
    📷 <strong>写真共有について</strong>
  </p>
  <p className="text-sm text-gray-600 mb-3">
    当園では、保育園での日常の様子や行事の写真を専用アプリを通じて保護者の皆様と共有しています。
    アプリは保護者のみがアクセス可能で、お子様の成長記録を安全にご覧いただけます。
    クラスの集合写真なども含まれますので、ぜひご活用ください。
  </p>

  <label className="flex items-start">
    <input
      type="checkbox"
      name="childNoPhoto"
      checked={formData.childNoPhoto}
      onChange={handleChildNoPhotoChange}
      className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
    />
    <span className="ml-2 text-sm text-gray-700">
      写真の撮影・共有を希望しない
      <span className="text-gray-500">
        （チェックを入れた場合、お子様が写った写真は共有されません）
      </span>
    </span>
  </label>
</div>
```

**デフォルト状態**: `checked={false}` (チェック無し - 撮影・共有を許可)

---

### 2.2 申込API呼び出し修正
**ファイル**: `reactapp.client/src/services/applicationService.ts` (推定)

**submitApplication関数に追加**:
```typescript
const applicationData = {
  // ... 既存のフィールド
  childNoPhoto: formData.childNoPhoto,
};

await api.post('/api/applications', applicationData);
```

---

## Phase 3: 申込インポート時のデータ移行処理

### 3.1 ApplicationServiceの修正
**ファイル**: `ReactApp.Server/Services/ApplicationService.cs`

**ImportApplicationAsync メソッドの修正**:

```csharp
// 園児データ作成時にNoPhotoフラグを移行
var child = new Child
{
    NurseryId = application.NurseryId,
    ParentId = parent.Id,
    Name = application.ChildName,
    NameKana = application.ChildNameKana,
    DateOfBirth = application.ChildDateOfBirth,
    Gender = application.ChildGender,

    // ✨ ChildNoPhoto → NoPhoto の移行
    NoPhoto = application.ChildNoPhoto,

    CreatedAt = DateTimeHelper.GetJstNow(),
    UpdatedAt = DateTimeHelper.GetJstNow()
};

_context.Children.Add(child);
```

**ImportApplicationResult DTO に追加** (表示用):
```csharp
public bool NoPhotoSet { get; set; }
```

**インポート結果メッセージに含める**:
```csharp
return new ImportApplicationResult
{
    // ... 既存のフィールド
    NoPhotoSet = application.ChildNoPhoto,
    Message = $"園児「{child.Name}」を登録しました。" +
              (application.ChildNoPhoto ? " ※撮影禁止設定: 有効" : "")
};
```

---

### 3.2 インポート結果表示の修正
**ファイル**: `reactapp.client/src/desktop/components/application/ImportApplicationModal.tsx`

**インポート結果表示に追加**:
```tsx
{result.noPhotoSet && (
  <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
    <p className="text-sm text-yellow-800 flex items-center">
      <svg className="w-4 h-4 mr-1" /* 警告アイコン */>⚠️</svg>
      撮影禁止設定が有効になりました
    </p>
  </div>
)}
```

---

## Phase 4: 園児マスタ管理画面UI実装

### 4.1 園児一覧画面の修正
**ファイル**: `reactapp.client/src/desktop/pages/ChildrenPage.tsx` (推定)

**一覧テーブルに列を追加**:
```tsx
<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
  撮影禁止
</th>

// データ行
<td className="px-6 py-4 whitespace-nowrap">
  {child.noPhoto ? (
    <span className="px-2 py-1 text-xs font-semibold rounded bg-yellow-100 text-yellow-800">
      🚫 禁止
    </span>
  ) : (
    <span className="px-2 py-1 text-xs font-semibold rounded bg-green-100 text-green-800">
      ✓ 許可
    </span>
  )}
</td>
```

---

### 4.2 園児編集フォームの修正
**ファイル**: `reactapp.client/src/desktop/components/children/ChildEditForm.tsx` (推定)

**NoPhotoチェックボックス追加**:
```tsx
<div className="mb-4">
  <label className="flex items-center">
    <input
      type="checkbox"
      name="noPhoto"
      checked={childData.noPhoto}
      onChange={(e) => setChildData({ ...childData, noPhoto: e.target.checked })}
      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
    />
    <span className="ml-2 text-sm font-medium text-gray-700">
      撮影禁止
    </span>
  </label>
  <p className="mt-1 text-xs text-gray-500">
    チェックを入れると、この園児が写った写真は共有されません
  </p>
</div>
```

---

### 4.3 園児詳細モーダルの修正
**ファイル**: `reactapp.client/src/desktop/components/children/ChildDetailModal.tsx` (推定)

**NoPhoto表示を追加**:
```tsx
<div className="mb-4">
  <h3 className="text-sm font-semibold text-gray-700 mb-1">撮影禁止設定</h3>
  {child.noPhoto ? (
    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
      🚫 撮影禁止
    </span>
  ) : (
    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
      ✓ 撮影・共有可
    </span>
  )}
</div>
```

---

## Phase 5: 写真アップロード警告システム

### 5.1 写真アップロード検証API (新規)
**ファイル**: `ReactApp.Server/Controllers/PhotoController.cs` (既存コントローラーに追加)

**新規エンドポイント**:
```csharp
[HttpPost("validate-children")]
public async Task<IActionResult> ValidateChildren([FromBody] ValidateChildrenRequest request)
{
    var noPhotoChildren = await _context.Children
        .Where(c => request.ChildIds.Contains(c.ChildId) && c.NoPhoto)
        .Select(c => new NoPhotoChildInfo
        {
            ChildId = c.ChildId,
            Name = c.Name
        })
        .ToListAsync();

    return Ok(new ValidateChildrenResponse
    {
        HasNoPhotoChildren = noPhotoChildren.Any(),
        NoPhotoChildren = noPhotoChildren
    });
}
```

**DTO定義**:
```csharp
public class ValidateChildrenRequest
{
    public List<int> ChildIds { get; set; }
}

public class ValidateChildrenResponse
{
    public bool HasNoPhotoChildren { get; set; }
    public List<NoPhotoChildInfo> NoPhotoChildren { get; set; }
}

public class NoPhotoChildInfo
{
    public int ChildId { get; set; }
    public string Name { get; set; }
}
```

---

### 5.2 写真アップロードコンポーネント修正
**ファイル**: `reactapp.client/src/desktop/components/photos/PhotoUploadForm.tsx` (推定)

**実装内容**:

```tsx
const [showNoPhotoWarning, setShowNoPhotoWarning] = useState(false);
const [noPhotoChildren, setNoPhotoChildren] = useState<NoPhotoChildInfo[]>([]);

// 園児選択後にバリデーション
const handleChildrenSelected = async (selectedChildIds: number[]) => {
  const response = await api.post('/api/photos/validate-children', {
    childIds: selectedChildIds
  });

  if (response.data.hasNoPhotoChildren) {
    setNoPhotoChildren(response.data.noPhotoChildren);
    setShowNoPhotoWarning(true);
  } else {
    setShowNoPhotoWarning(false);
  }
};

// 警告ダイアログ
{showNoPhotoWarning && (
  <div className="mb-4 p-4 bg-yellow-50 border-l-4 border-yellow-400">
    <div className="flex items-start">
      <svg className="w-6 h-6 text-yellow-400 mr-2 flex-shrink-0">⚠️</svg>
      <div>
        <h3 className="text-sm font-medium text-yellow-800 mb-2">
          撮影禁止設定の園児が含まれています
        </h3>
        <p className="text-sm text-yellow-700 mb-2">
          以下の園児は撮影禁止設定がされています：
        </p>
        <ul className="list-disc list-inside text-sm text-yellow-700">
          {noPhotoChildren.map(child => (
            <li key={child.childId}>{child.name}</li>
          ))}
        </ul>
        <p className="text-sm text-yellow-700 mt-2 font-medium">
          この写真には上記の園児が映っていないことを確認してください。
        </p>
      </div>
    </div>
  </div>
)}
```

---

### 5.3 写真アップロード確認ダイアログ修正

**確認ボタンの表示制御**:
```tsx
<button
  type="submit"
  disabled={showNoPhotoWarning && !confirmed}
  className={`px-4 py-2 rounded ${
    showNoPhotoWarning && !confirmed
      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
      : 'bg-blue-600 text-white hover:bg-blue-700'
  }`}
>
  {showNoPhotoWarning && !confirmed ? '確認してください' : 'アップロード'}
</button>

{showNoPhotoWarning && (
  <label className="flex items-center mt-2">
    <input
      type="checkbox"
      checked={confirmed}
      onChange={(e) => setConfirmed(e.target.checked)}
      className="h-4 w-4 text-blue-600"
    />
    <span className="ml-2 text-sm text-gray-700">
      撮影禁止の園児が映っていないことを確認しました
    </span>
  </label>
)}
```

---

## 影響範囲の整理

### 修正が必要なファイル一覧

#### バックエンド (7-8ファイル)
1. ✅ `ReactApp.Server/Models/ApplicationWork.cs` - ChildNoPhotoプロパティ追加
2. ✅ `ReactApp.Server/Models/Child.cs` (または Children.cs) - NoPhotoプロパティ追加
3. ✅ `ReactApp.Server/DTOs/Desktop/ApplicationWorkDto.cs` - DTO更新
4. 🔍 `ReactApp.Server/DTOs/Desktop/ChildDto.cs` (要調査) - DTO更新
5. 🔍 `ReactApp.Server/DTOs/ApplicationDto.cs` (要調査) - Create/Update DTO更新
6. ✅ `ReactApp.Server/Services/ApplicationService.cs` - インポート処理修正
7. ✅ `ReactApp.Server/Controllers/PhotoController.cs` - 検証エンドポイント追加
8. ✅ `ReactApp.Server/DTOs/PhotoDto.cs` (新規) - ValidateChildrenRequest/Response

#### フロントエンド (6-8ファイル)
1. ✅ `reactapp.client/src/types/desktopApplication.ts` - 型定義更新
2. 🔍 `reactapp.client/src/types/child.ts` (要調査) - 型定義更新
3. 🔍 `reactapp.client/src/pages/ApplicationFormPage.tsx` (要調査) - チェックボックス追加
4. �� `reactapp.client/src/services/applicationService.ts` (要調査) - API呼び出し修正
5. ✅ `reactapp.client/src/desktop/components/application/ImportApplicationModal.tsx` - 結果表示修正
6. 🔍 `reactapp.client/src/desktop/pages/ChildrenPage.tsx` (要調査) - 一覧表示修正
7. 🔍 `reactapp.client/src/desktop/components/children/ChildEditForm.tsx` (要調査) - 編集フォーム修正
8. 🔍 `reactapp.client/src/desktop/components/photos/PhotoUploadForm.tsx` (要調査) - 警告システム実装

**凡例**:
- ✅ = ファイル名確定
- 🔍 = ファイル名・パス要調査

---

## 実装の優先順位

### 優先度: 高 (Phase 1-3)
1. **Phase 1**: バックエンドモデル・DTO更新 (基盤実装)
2. **Phase 2**: 入園申込フォームUI (新規申込での入力)
3. **Phase 3**: インポート処理 (データ移行ロジック)

### 優先度: 中 (Phase 4)
4. **Phase 4**: 園児マスタ管理画面 (入園後の編集機能)

### 優先度: 低 (Phase 5)
5. **Phase 5**: 写真アップロード警告 (運用支援機能)

---

## 次のステップ

1. **ファイルパスの確認**:
   - 🔍マークのファイルの実際のパスを確認
   - 特に申込フォーム、園児管理画面、写真アップロードコンポーネント

2. **Phase 1から順次実装**:
   - バックエンドモデル更新から開始
   - DTO更新でフロントエンドとの連携を確保
   - 各Phaseごとに動作確認

3. **テスト実施**:
   - 各Phase完了後に該当機能のテスト
   - 要件定義書のテスト要件に従って検証

---

**実装準備完了**: すぐにPhase 1の実装を開始できます。

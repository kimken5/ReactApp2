# PhotoFunction機能 詳細実装計画

## 実施日時
**作成日**: 2025-12-22
**予定実装時間**: 約3-4時間

---

## 1. 実装概要

### 1.1 機能説明
Nurseriesテーブルに`PhotoFunction`カラムを追加し、保育園レベルで写真機能の有効/無効を制御します。

### 1.2 既存のNoPhoto機能との関係
- **PhotoFunction** (保育園レベル): 保育園全体の写真機能ON/OFF
- **NoPhoto** (園児レベル): 個別園児の撮影禁止設定

**優先順位ルール**:
```
1. PhotoFunction = false → 全ての写真機能無効（NoPhotoに関わらず）
2. PhotoFunction = true + NoPhoto = true → その園児のみ撮影禁止
3. PhotoFunction = true + NoPhoto = false → 写真機能有効
```

### 1.3 デフォルト値の設計思想
- **PhotoFunction**: `true` (デフォルト有効)
  - 理由: 既存保育園との後方互換性維持
  - 新規保育園も基本的に写真機能を有効にする
- **NoPhoto**: `false` (デフォルト撮影許可)
  - 理由: オプトアウト方式（前回実装で確定済み）

---

## 2. 実装フェーズ

### Phase 1: データベース・モデル層 (30分)

#### Task 1.1: Nursery.cs モデル更新
**ファイル**: `ReactApp.Server/Models/Nursery.cs`

**追加位置**: `CurrentAcademicYear`プロパティの後

```csharp
/// <summary>
/// 写真機能有効フラグ（必須）
/// true=写真機能有効、false=写真機能無効
/// デフォルト値: true（既存保育園との互換性維持）
/// </summary>
[Required]
public bool PhotoFunction { get; set; } = true;
```

**確認事項**:
- ✅ Nursery.csは既に存在
- ✅ 他のboolプロパティのパターン確認済み（IsLocked等）
- ✅ DateTimeHelper使用パターン確認済み

#### Task 1.2: KindergartenDbContext.cs 設定追加
**ファイル**: `ReactApp.Server/Data/KindergartenDbContext.cs`

**追加位置**: Nurseries設定ブロック内

```csharp
// PhotoFunction設定
entity.Property(e => e.PhotoFunction)
    .IsRequired()
    .HasDefaultValue(true);
```

#### Task 1.3: DatabaseSeeder.cs テストデータ更新
**ファイル**: `ReactApp.Server/Services/DatabaseSeeder.cs`

**既存のNurseryシードデータに追加**:
```csharp
PhotoFunction = true, // 写真機能有効
```

#### Task 1.4: Entity Frameworkマイグレーション作成

**コマンド**:
```bash
cd ReactApp.Server
dotnet ef migrations add AddPhotoFunctionToNurseries --context KindergartenDbContext
```

**期待されるマイグレーション内容**:
```csharp
protected override void Up(MigrationBuilder migrationBuilder)
{
    migrationBuilder.AddColumn<bool>(
        name: "PhotoFunction",
        table: "Nurseries",
        type: "bit",
        nullable: false,
        defaultValue: true);
}
```

**注意事項**:
- データベースには既にPhotoFunctionカラムが追加されている可能性あり
- その場合、マイグレーションは「既存カラムの認識」として機能

#### Task 1.5: ビルド確認
```bash
cd ReactApp.Server
dotnet build
```

---

### Phase 2: サービス層・バリデーション実装 (45分)

#### Task 2.1: IPhotoService インターフェース拡張
**ファイル**: `ReactApp.Server/Services/IPhotoService.cs`

**追加メソッド**:
```csharp
/// <summary>
/// 保育園の写真機能が有効かチェック
/// </summary>
/// <param name="nurseryId">保育園ID</param>
/// <returns>true=有効、false=無効</returns>
Task<bool> IsPhotoFunctionEnabledAsync(int nurseryId);

/// <summary>
/// 写真アップロード前の包括的バリデーション
/// PhotoFunctionとNoPhotoの両方をチェック
/// </summary>
/// <param name="nurseryId">保育園ID</param>
/// <param name="childIds">園児IDリスト</param>
/// <returns>バリデーション結果</returns>
Task<PhotoValidationResult> ValidatePhotoUploadAsync(int nurseryId, List<int> childIds);
```

#### Task 2.2: PhotoValidationResult DTO作成
**ファイル**: `ReactApp.Server/DTOs/PhotoValidationResult.cs` (新規)

```csharp
namespace ReactApp.Server.DTOs;

/// <summary>
/// 写真アップロードバリデーション結果
/// </summary>
public class PhotoValidationResult
{
    /// <summary>
    /// バリデーション成功フラグ
    /// </summary>
    public bool IsValid { get; set; }

    /// <summary>
    /// 写真機能が有効か
    /// </summary>
    public bool PhotoFunctionEnabled { get; set; }

    /// <summary>
    /// NoPhoto園児が含まれているか
    /// </summary>
    public bool HasNoPhotoChildren { get; set; }

    /// <summary>
    /// NoPhoto設定の園児リスト
    /// </summary>
    public List<NoPhotoChildInfo> NoPhotoChildren { get; set; } = new();

    /// <summary>
    /// エラーメッセージ
    /// </summary>
    public string? ErrorMessage { get; set; }

    /// <summary>
    /// 警告メッセージ
    /// </summary>
    public string? WarningMessage { get; set; }
}

/// <summary>
/// NoPhoto園児情報
/// </summary>
public class NoPhotoChildInfo
{
    public int ChildId { get; set; }
    public string Name { get; set; } = string.Empty;
}
```

#### Task 2.3: PhotoService.cs バリデーションロジック実装
**ファイル**: `ReactApp.Server/Services/PhotoService.cs`

**追加メソッド1: 写真機能チェック**
```csharp
/// <summary>
/// 保育園の写真機能が有効かチェック
/// </summary>
public async Task<bool> IsPhotoFunctionEnabledAsync(int nurseryId)
{
    var nursery = await _context.Nurseries
        .AsNoTracking()
        .Where(n => n.Id == nurseryId)
        .Select(n => n.PhotoFunction)
        .FirstOrDefaultAsync();

    return nursery; // デフォルトfalseは写真機能無効を意味する
}
```

**追加メソッド2: 包括的バリデーション**
```csharp
/// <summary>
/// 写真アップロード前の包括的バリデーション
/// PhotoFunctionとNoPhotoの両方をチェック
/// </summary>
public async Task<PhotoValidationResult> ValidatePhotoUploadAsync(
    int nurseryId,
    List<int> childIds)
{
    var result = new PhotoValidationResult
    {
        IsValid = true,
        PhotoFunctionEnabled = true
    };

    // 1. PhotoFunctionチェック（保育園レベル）
    var photoFunctionEnabled = await IsPhotoFunctionEnabledAsync(nurseryId);
    result.PhotoFunctionEnabled = photoFunctionEnabled;

    if (!photoFunctionEnabled)
    {
        result.IsValid = false;
        result.ErrorMessage = "この保育園では写真機能が無効になっています。写真のアップロードはできません。";
        return result;
    }

    // 2. NoPhotoチェック（園児レベル）
    var noPhotoChildren = await _context.Children
        .AsNoTracking()
        .Where(c => c.NurseryId == nurseryId
                 && childIds.Contains(c.ChildId)
                 && c.NoPhoto == true)
        .Select(c => new NoPhotoChildInfo
        {
            ChildId = c.ChildId,
            Name = c.Name
        })
        .ToListAsync();

    if (noPhotoChildren.Any())
    {
        result.HasNoPhotoChildren = true;
        result.NoPhotoChildren = noPhotoChildren;
        result.WarningMessage = "撮影禁止設定の園児が含まれています。該当園児が写っていないことを確認してください。";
        // 警告のみで IsValid = true を維持（アップロード可能）
    }

    return result;
}
```

**既存メソッド修正: UploadPhotoAsync**
```csharp
public async Task<PhotoDto> UploadPhotoAsync(int nurseryId, int staffId, PhotoUploadDto dto)
{
    // ★新規追加: 包括的バリデーション
    var validation = await ValidatePhotoUploadAsync(nurseryId, dto.ChildIds);

    if (!validation.IsValid)
    {
        throw new BusinessException(validation.ErrorMessage ?? "写真アップロードができません。");
    }

    // 既存のファイルバリデーション
    if (!await ValidatePhotoFileAsync(dto.PhotoFile))
    {
        throw new BusinessException("無効なファイル形式です。");
    }

    // ... 既存のアップロードロジック ...

    var photoDto = _mapper.Map<PhotoDto>(photo);

    // ★新規追加: バリデーション結果を含める
    photoDto.ValidationResult = validation;

    return photoDto;
}
```

#### Task 2.4: PhotoDto拡張
**ファイル**: `ReactApp.Server/DTOs/PhotoDto.cs`

**追加プロパティ**:
```csharp
/// <summary>
/// バリデーション結果（アップロード時のみ）
/// </summary>
public PhotoValidationResult? ValidationResult { get; set; }
```

---

### Phase 3: API層の実装 (30分)

#### Task 3.1: PhotosController 更新
**ファイル**: `ReactApp.Server/Controllers/PhotosController.cs`

**既存のアップロードエンドポイント確認・修正**:

現在の実装で`ValidatePhotoUploadAsync`が自動的に呼ばれるため、コントローラー側の変更は最小限。

**レスポンス形式の確認**:
```csharp
[HttpPost("upload")]
public async Task<IActionResult> UploadPhoto([FromForm] PhotoUploadDto dto)
{
    try
    {
        var result = await _photoService.UploadPhotoAsync(nurseryId, staffId, dto);

        // result.ValidationResultに警告情報が含まれる
        return Ok(new
        {
            success = true,
            data = result,
            // ValidationResultは自動的にシリアライズされる
        });
    }
    catch (BusinessException ex)
    {
        return BadRequest(new { success = false, message = ex.Message });
    }
}
```

#### Task 3.2: (オプション) 新規検証エンドポイント追加

フロントエンドが事前検証したい場合のエンドポイント:

```csharp
/// <summary>
/// 写真アップロード可否を事前チェック
/// </summary>
[HttpPost("validate")]
public async Task<IActionResult> ValidatePhotoUpload([FromBody] PhotoValidationRequest request)
{
    var result = await _photoService.ValidatePhotoUploadAsync(
        request.NurseryId,
        request.ChildIds);

    return Ok(new { success = true, data = result });
}

public class PhotoValidationRequest
{
    public int NurseryId { get; set; }
    public List<int> ChildIds { get; set; } = new();
}
```

---

### Phase 4: フロントエンド実装 (1-1.5時間)

#### Task 4.1: 写真アップロードコンポーネント特定

**検索コマンド**:
```bash
cd reactapp.client
grep -r "PhotoUpload" src/ --include="*.tsx"
grep -r "uploadPhoto" src/ --include="*.tsx" --include="*.ts"
```

**想定ファイル**:
- `src/components/staff/photos/PhotoUpload.tsx` (既存確認済み)

#### Task 4.2: PhotoUpload.tsx 更新

**状態管理追加**:
```typescript
const [photoFunctionEnabled, setPhotoFunctionEnabled] = useState<boolean>(true);
const [validationWarning, setValidationWarning] = useState<PhotoValidationResult | null>(null);
const [showWarningDialog, setShowWarningDialog] = useState(false);
```

**バリデーション結果の処理**:
```typescript
const handleUpload = async () => {
  try {
    const response = await uploadPhoto(formData);

    // バリデーション結果チェック
    if (response.data.validationResult) {
      const validation = response.data.validationResult;

      // PhotoFunction無効の場合
      if (!validation.photoFunctionEnabled) {
        setError(validation.errorMessage);
        return;
      }

      // NoPhoto警告の場合
      if (validation.hasNoPhotoChildren) {
        setValidationWarning(validation);
        setShowWarningDialog(true);
        // 警告ダイアログを表示するが、アップロード自体は成功
      }
    }

    setSuccess(true);
  } catch (error) {
    setError(error.message);
  }
};
```

**PhotoFunction無効時のUI**:
```tsx
{!photoFunctionEnabled && (
  <Alert severity="error" sx={{ mb: 2 }}>
    この保育園では写真機能が無効になっています。
    写真のアップロードや閲覧はできません。
  </Alert>
)}
```

**警告ダイアログ**:
```tsx
<Dialog open={showWarningDialog} onClose={() => setShowWarningDialog(false)}>
  <DialogTitle>
    <WarningIcon color="warning" sx={{ mr: 1 }} />
    撮影禁止設定の園児が含まれています
  </DialogTitle>
  <DialogContent>
    <Alert severity="warning" sx={{ mb: 2 }}>
      {validationWarning?.warningMessage}
    </Alert>
    <Typography variant="body2" gutterBottom>
      対象園児:
    </Typography>
    <List>
      {validationWarning?.noPhotoChildren.map((child) => (
        <ListItem key={child.childId}>• {child.name}</ListItem>
      ))}
    </List>
    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
      この写真には上記の園児が映っていないことを確認してください。
    </Typography>
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setShowWarningDialog(false)} color="primary">
      確認しました
    </Button>
  </DialogActions>
</Dialog>
```

#### Task 4.3: 保護者側写真閲覧画面の対応

**想定ファイル**:
- `src/components/parent/photos/PhotoGallery.tsx` (要調査)

**実装パターン**:
```tsx
const PhotoGallery = () => {
  const [photoFunctionEnabled, setPhotoFunctionEnabled] = useState(true);

  useEffect(() => {
    const checkPhotoFunction = async () => {
      const response = await api.get('/api/nursery/current');
      setPhotoFunctionEnabled(response.data.photoFunction);
    };
    checkPhotoFunction();
  }, []);

  if (!photoFunctionEnabled) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Alert severity="info">
          現在、写真機能は利用できません。
        </Alert>
      </Box>
    );
  }

  // 通常の写真ギャラリー表示
  return <div>...</div>;
};
```

#### Task 4.4: 多言語対応（i18n）

**ファイル**: `reactapp.client/src/locales/ja.json`

```json
{
  "photo": {
    "functionDisabled": {
      "staff": "この保育園では写真機能が無効になっています。写真のアップロードや閲覧はできません。",
      "parent": "現在、写真機能は利用できません。"
    },
    "validation": {
      "photoFunctionDisabled": "この保育園では写真機能が無効になっています。",
      "noPhotoWarningTitle": "撮影禁止設定の園児が含まれています",
      "noPhotoWarningMessage": "撮影禁止設定の園児が含まれています。該当園児が写っていないことを確認してください。",
      "childrenList": "対象園児:",
      "confirmation": "この写真には上記の園児が映っていないことを確認してください。"
    }
  }
}
```

---

### Phase 5: テスト・検証 (45分)

#### Task 5.1: 手動テストシナリオ

**シナリオ1: PhotoFunction無効の保育園**
1. Nurseriesテーブルで`PhotoFunction = false`に設定
2. スタッフログイン
3. 写真アップロード画面にアクセス
4. エラーメッセージ「写真機能が無効」が表示されることを確認
5. 保護者ログイン
6. 写真閲覧画面にアクセス
7. 「写真機能は利用できません」メッセージを確認

**シナリオ2: PhotoFunction有効 + NoPhoto園児あり**
1. Nurseriesテーブルで`PhotoFunction = true`に設定
2. 一部の園児で`NoPhoto = true`に設定
3. スタッフログイン
4. NoPhoto園児を選択して写真アップロード
5. 警告ダイアログが表示されることを確認
6. アップロードは成功することを確認

**シナリオ3: PhotoFunction有効 + NoPhoto園児なし**
1. 全園児で`NoPhoto = false`に設定
2. スタッフログイン
3. 通常通り写真アップロード
4. 警告なしでアップロード成功を確認

#### Task 5.2: APIテスト（Postman/Thunder Client）

**テストケース1**: GET /api/nursery/{id} - PhotoFunctionを含むか確認

**テストケース2**: POST /api/photos/upload - PhotoFunction=falseでエラー

**テストケース3**: POST /api/photos/upload - NoPhoto園児で警告

#### Task 5.3: データベース確認

```sql
-- PhotoFunctionカラムの確認
SELECT Id, Name, PhotoFunction FROM Nurseries;

-- NoPhotoとの組み合わせ確認
SELECT
    n.Name AS NurseryName,
    n.PhotoFunction,
    c.Name AS ChildName,
    c.NoPhoto
FROM Nurseries n
LEFT JOIN Children c ON n.Id = c.NurseryId
ORDER BY n.Id, c.ChildId;
```

---

## 3. リスク管理

### 3.1 技術的リスク

| リスク | 影響度 | 対策 |
|-------|--------|------|
| PhotoFunctionカラムが既に存在 | 低 | マイグレーション実行前にデータベーススキーマ確認 |
| 既存写真データの扱い | 低 | PhotoFunction=trueがデフォルトなので影響なし |
| フロントエンドコンポーネント未特定 | 中 | grep検索で事前調査済み |

### 3.2 データ整合性リスク

| リスク | 影響度 | 対策 |
|-------|--------|------|
| 既存保育園のデフォルト値 | 低 | マイグレーションでdefaultValue=trueを設定 |
| NoPhotoとの優先順位の誤解 | 中 | ドキュメントで明確化、バリデーションロジックでコメント追加 |

---

## 4. 実装順序（推奨）

### ステップ1: バックエンド基盤 (1時間)
1. Nursery.cs 更新
2. DbContext設定追加
3. マイグレーション作成・適用
4. ビルド確認

### ステップ2: サービス層 (45分)
1. DTOs作成（PhotoValidationResult）
2. IPhotoService拡張
3. PhotoService実装
4. PhotoDto拡張

### ステップ3: API層 (30分)
1. PhotosController確認・修正
2. レスポンス形式確認

### ステップ4: フロントエンド (1-1.5時間)
1. コンポーネント特定
2. PhotoUpload.tsx更新
3. 保護者側ギャラリー更新
4. 多言語対応

### ステップ5: テスト (45分)
1. 手動テスト実施
2. APIテスト実施
3. データベース確認

---

## 5. 完了基準

### 5.1 機能的完了基準
- [x] Nurseriesテーブルに`PhotoFunction`カラムが追加されている
- [ ] PhotoFunction=falseで写真アップロードがエラーになる
- [ ] PhotoFunction=trueでNoPhoto園児の警告が表示される
- [ ] 保護者側でPhotoFunction=falseの場合に適切なメッセージが表示される
- [ ] 既存保育園は全てPhotoFunction=trueで動作する

### 5.2 品質基準
- [ ] ビルドエラーなし
- [ ] 既存機能に影響なし（NoPhoto機能が正常動作）
- [ ] 全手動テストシナリオがパス
- [ ] APIテストがパス

### 5.3 ドキュメント基準
- [x] 要件定義書作成済み
- [x] 実装分析書作成済み
- [x] 詳細実装計画作成済み
- [ ] 作業ログ作成（実装完了後）

---

## 6. 既存NoPhoto機能との統合確認

### 6.1 NoPhotoValidationResult (既存)
**ファイル**: `ReactApp.Server/DTOs/NoPhotoValidationResult.cs` (既存確認済み)

既存のNoPhotoValidationResultは今回作成するPhotoValidationResultに統合されます。

### 6.2 ValidateNoPhotoChildren (既存)
**ファイル**: `ReactApp.Server/Services/PhotoService.cs`

既存メソッドは`ValidatePhotoUploadAsync`内で呼び出される形になります。
既存メソッドは残したまま、新しいメソッドでラップする形で実装します。

---

## 7. 次のステップ（実装完了後）

1. **Git コミット**
   ```bash
   git add .
   git commit -m "feat: PhotoFunction機能実装完了

   - Nurseries.PhotoFunctionプロパティ追加
   - 写真アップロード時のPhotoFunctionバリデーション実装
   - NoPhotoとPhotoFunctionの2層制御実装
   - スタッフ写真アップロード画面にエラー・警告表示追加
   - 保護者写真閲覧画面にPhotoFunction無効時メッセージ追加
   - テストシナリオ実施完了

   🤖 Generated with [Claude Code](https://claude.com/claude-code)

   Co-Authored-By: Claude <noreply@anthropic.com>"
   ```

2. **作業ログ作成**
   - `claude_logs/2025-12-22_photo_function.md` に詳細な実装記録を作成

3. **database-design.md更新**
   - Nurseriesテーブル定義にPhotoFunctionカラムを追加

---

## 付録A: ファイル修正一覧（予定）

### 新規作成ファイル (1件)
1. `ReactApp.Server/DTOs/PhotoValidationResult.cs`

### 修正ファイル (8-10件)
1. `ReactApp.Server/Models/Nursery.cs`
2. `ReactApp.Server/Data/KindergartenDbContext.cs`
3. `ReactApp.Server/Services/DatabaseSeeder.cs`
4. `ReactApp.Server/Services/IPhotoService.cs`
5. `ReactApp.Server/Services/PhotoService.cs`
6. `ReactApp.Server/DTOs/PhotoDto.cs`
7. `reactapp.client/src/components/staff/photos/PhotoUpload.tsx`
8. `reactapp.client/src/locales/ja.json`
9. (調査後) 保護者側写真ギャラリーコンポーネント
10. `docs/database-design.md`

### マイグレーションファイル (1件)
1. `ReactApp.Server/Migrations/YYYYMMDDHHMMSS_AddPhotoFunctionToNurseries.cs`

---

**作成日**: 2025-12-22
**作成者**: Claude Code
**ステータス**: 実装準備完了 - ユーザー承認待ち

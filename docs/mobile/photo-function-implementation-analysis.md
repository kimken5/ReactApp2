# PhotoFunction機能 実装修正箇所分析

## 実装日: 2025-12-18

## 1. 修正が必要な箇所の概要

PhotoFunction機能を実装するために、以下の箇所の修正が必要です:

### 1.1 影響範囲サマリー
| カテゴリ | 影響度 | ファイル数 | 説明 |
|---------|--------|----------|------|
| データベース | 🔴 高 | 3 | Nurseryモデル、DbContext、マイグレーション |
| バックエンドAPI | 🔴 高 | 3 | PhotoService, PhotosController, NurseryController |
| フロントエンド(スタッフ) | 🟡 中 | 1 | PhotoUpload.tsx |
| フロントエンド(保護者) | 🟡 中 | 調査必要 | 写真閲覧コンポーネント |
| DTO | 🟢 低 | 1 | NurseryDto |

---

## 2. データベース層の修正

### 2.1 Nursery.cs (モデル)
**ファイルパス**: `ReactApp.Server/Models/Nursery.cs`

**修正内容**:
```csharp
// 追加するプロパティ
/// <summary>
/// 写真機能の有効/無効（必須）
/// true=写真機能を使用、false=写真機能を使用しない
/// デフォルト値: true（既存保育園との互換性維持）
/// </summary>
[Required]
public bool PhotoFunction { get; set; } = true;
```

**影響度**: 🔴 高
**理由**: 全ての保育園に写真機能制御の基盤となるプロパティを追加

---

### 2.2 KindergartenDbContext.cs
**ファイルパス**: `ReactApp.Server/Data/KindergartenDbContext.cs`

**修正内容**:
```csharp
// OnModelCreating内のNurseryエンティティ設定に追加
// 現在はNurseryエンティティの明示的な設定が見当たらないため、
// 新規追加またはChild等の設定箇所に続けて追加

private void ConfigureNursery(ModelBuilder modelBuilder)
{
    modelBuilder.Entity<Nursery>(entity =>
    {
        entity.HasKey(e => e.Id);

        // PhotoFunctionのデフォルト値設定
        entity.Property(e => e.PhotoFunction)
            .IsRequired()
            .HasDefaultValue(true);
    });
}
```

**影響度**: 🔴 高
**理由**: データベーススキーマのデフォルト値設定、マイグレーション時の既存データ互換性確保

---

### 2.3 マイグレーション（新規作成）
**ファイルパス**: `ReactApp.Server/Migrations/[timestamp]_AddPhotoFunctionToNurseries.cs`

**作成内容**:
```csharp
public partial class AddPhotoFunctionToNurseries : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<bool>(
            name: "PhotoFunction",
            table: "Nurseries",
            type: "bit",
            nullable: false,
            defaultValue: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(
            name: "PhotoFunction",
            table: "Nurseries");
    }
}
```

**影響度**: 🔴 高
**理由**: データベース構造変更、既存データへのデフォルト値適用

---

## 3. DTO層の修正

### 3.1 NurseryDto.cs
**ファイルパス**: `ReactApp.Server/DTOs/NurseryDto.cs` (存在確認必要)

**修正内容**:
```csharp
/// <summary>
/// 写真機能の有効/無効
/// </summary>
public bool PhotoFunction { get; set; }
```

**影響度**: 🟢 低
**理由**: APIレスポンス/リクエストにPhotoFunction情報を含める

**注意**: NurseryDto.csが存在しない場合は新規作成が必要

---

## 4. バックエンドサービス層の修正

### 4.1 IPhotoService.cs
**ファイルパス**: `ReactApp.Server/Services/IPhotoService.cs`

**修正内容**:
```csharp
// 既存のインターフェースに追加
/// <summary>
/// 保育園の写真機能が有効かチェック
/// </summary>
Task<bool> IsPhotoFunctionEnabledAsync(int nurseryId);
```

**影響度**: 🟡 中
**理由**: 写真機能制御の基本メソッド追加

---

### 4.2 PhotoService.cs
**ファイルパス**: `ReactApp.Server/Services/PhotoService.cs`

**修正内容**:
```csharp
public async Task<bool> IsPhotoFunctionEnabledAsync(int nurseryId)
{
    var nursery = await _context.Nurseries
        .Where(n => n.Id == nurseryId)
        .Select(n => n.PhotoFunction)
        .FirstOrDefaultAsync();

    return nursery; // デフォルトfalseが返る場合も考慮
}

// 既存のUploadPhotoAsync, GetPhotosAsync等の冒頭に追加
public async Task<PhotoDto> UploadPhotoAsync(int nurseryId, int staffId, UploadPhotoDto dto)
{
    // PhotoFunctionチェックを最優先で実施
    if (!await IsPhotoFunctionEnabledAsync(nurseryId))
    {
        throw new InvalidOperationException("この保育園では写真機能が無効になっています");
    }

    // 既存のロジック...
}
```

**影響度**: 🔴 高
**理由**: 全ての写真関連操作の入り口でPhotoFunctionチェックを追加

---

## 5. バックエンドコントローラー層の修正

### 5.1 PhotosController.cs
**ファイルパス**: `ReactApp.Server/Controllers/PhotosController.cs`

**修正内容**:
```csharp
[HttpPost("upload")]
public async Task<IActionResult> UploadPhoto([FromForm] UploadPhotoDto dto)
{
    try
    {
        var nurseryId = GetNurseryIdFromContext();
        var staffId = GetStaffIdFromContext();

        // PhotoFunctionチェック（サービス層でも実施されるが、コントローラーでも明示的にチェック）
        if (!await _photoService.IsPhotoFunctionEnabledAsync(nurseryId))
        {
            return BadRequest(new { error = "この保育園では写真機能が無効になっています" });
        }

        // 既存のNoPhoto検証
        NoPhotoValidationResult? noPhotoValidation = null;
        if (dto.ChildIds != null && dto.ChildIds.Any())
        {
            noPhotoValidation = await _photoService.ValidateNoPhotoChildren(nurseryId, dto.ChildIds);
        }

        var photo = await _photoService.UploadPhotoAsync(nurseryId, staffId, dto);

        var response = new
        {
            Photo = photo,
            NoPhotoWarning = noPhotoValidation
        };

        return CreatedAtAction(nameof(GetPhotoById), new { id = photo.Id }, response);
    }
    catch (InvalidOperationException ex)
    {
        return BadRequest(new { error = ex.Message });
    }
}

[HttpGet]
public async Task<IActionResult> GetPhotos([FromQuery] PhotoQueryDto query)
{
    var nurseryId = GetNurseryIdFromContext();

    // PhotoFunctionチェック
    if (!await _photoService.IsPhotoFunctionEnabledAsync(nurseryId))
    {
        return BadRequest(new { error = "この保育園では写真機能が無効になっています" });
    }

    var photos = await _photoService.GetPhotosAsync(nurseryId, query);
    return Ok(photos);
}

// 他のGET, PUT, DELETE等のエンドポイントにも同様のチェックを追加
```

**影響度**: 🔴 高
**理由**: 全ての写真APIエンドポイントにPhotoFunctionチェックを追加

---

### 5.2 NurseryController.cs
**ファイルパス**: `ReactApp.Server/Controllers/NurseryController.cs` (存在確認必要)

**修正内容**:
```csharp
// 新規作成の場合
[ApiController]
[Route("api/[controller]")]
public class NurseryController : ControllerBase
{
    private readonly KindergartenDbContext _context;

    public NurseryController(KindergartenDbContext context)
    {
        _context = context;
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetNursery(int id)
    {
        var nursery = await _context.Nurseries.FindAsync(id);
        if (nursery == null)
            return NotFound();

        var dto = new NurseryDto
        {
            Id = nursery.Id,
            Name = nursery.Name,
            PhotoFunction = nursery.PhotoFunction,
            // 他のプロパティ
        };

        return Ok(dto);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateNursery(int id, NurseryDto dto)
    {
        // 権限チェック（管理者のみ）
        // ...

        var nursery = await _context.Nurseries.FindAsync(id);
        if (nursery == null)
            return NotFound();

        nursery.PhotoFunction = dto.PhotoFunction;
        // 他のプロパティ更新
        nursery.UpdatedAt = DateTimeHelper.GetJstNow();

        await _context.SaveChangesAsync();
        return Ok(dto);
    }
}
```

**影響度**: 🟡 中
**理由**: 保育園情報の取得・更新APIが必要（既存のコントローラーがあれば修正、なければ新規作成）

---

## 6. フロントエンド層の修正

### 6.1 PhotoUpload.tsx (スタッフ)
**ファイルパス**: `reactapp.client/src/components/staff/photos/PhotoUpload.tsx`

**修正内容**:
```typescript
// コンポーネントのstate追加
const [photoFunctionEnabled, setPhotoFunctionEnabled] = useState<boolean>(true);

// useEffect でPhotoFunctionチェック
useEffect(() => {
  const checkPhotoFunction = async () => {
    try {
      const response = await fetch('/api/nursery/current');
      const nursery = await response.json();
      setPhotoFunctionEnabled(nursery.photoFunction);
    } catch (error) {
      console.error('Failed to check photo function:', error);
      setPhotoFunctionEnabled(false);
    }
  };

  checkPhotoFunction();
}, []);

// JSX修正
return (
  <Box>
    {!photoFunctionEnabled ? (
      <Alert severity="info">
        この保育園では写真機能が無効になっています。
      </Alert>
    ) : (
      // 既存のアップロードUI
      <Box>
        {/* 既存のアップロードフォーム */}
      </Box>
    )}
  </Box>
);
```

**影響度**: 🟡 中
**理由**: スタッフ側の写真アップロードUIの表示制御

---

### 6.2 写真閲覧コンポーネント (保護者)
**ファイルパス**: 調査必要（`reactapp.client/src/components/parent/photos/` 配下と推定）

**修正内容**:
```typescript
// PhotoUpload.tsxと同様の修正
// 1. PhotoFunctionチェック
// 2. 無効時のメッセージ表示
// 3. メニュー/タブの非表示制御
```

**影響度**: 🟡 中
**理由**: 保護者側の写真閲覧UIの表示制御

**注意**: 該当コンポーネントの調査が必要

---

### 6.3 保育園管理画面（管理者）
**ファイルパス**: 調査必要（新規作成の可能性あり）

**修正内容**:
```typescript
// 保育園編集フォームにPhotoFunctionチェックボックスを追加
<FormControlLabel
  control={
    <Checkbox
      name="photoFunction"
      checked={formData.photoFunction}
      onChange={handlePhotoFunctionChange}
    />
  }
  label="写真機能を使用する"
/>
<Typography variant="caption" color="textSecondary">
  写真機能を有効にすると、スタッフが写真をアップロードし、保護者が閲覧できるようになります。
</Typography>
```

**影響度**: 🟡 中
**理由**: 管理者がPhotoFunctionを設定できるUIが必要

**注意**: 該当画面の調査が必要、存在しない場合は新規作成

---

## 7. 修正箇所一覧（優先順位順）

### 🔴 Phase 1: データベース・モデル層（必須）
1. ✅ `ReactApp.Server/Models/Nursery.cs` - PhotoFunctionプロパティ追加
2. ✅ `ReactApp.Server/Data/KindergartenDbContext.cs` - エンティティ設定追加
3. ✅ `ReactApp.Server/Migrations/[timestamp]_AddPhotoFunctionToNurseries.cs` - マイグレーション作成

### 🔴 Phase 2: バックエンドAPI層（必須）
4. ✅ `ReactApp.Server/Services/IPhotoService.cs` - IsPhotoFunctionEnabledAsync追加
5. ✅ `ReactApp.Server/Services/PhotoService.cs` - IsPhotoFunctionEnabledAsync実装、既存メソッドにチェック追加
6. ✅ `ReactApp.Server/Controllers/PhotosController.cs` - 全エンドポイントにPhotoFunctionチェック追加
7. ⚠️ `ReactApp.Server/DTOs/NurseryDto.cs` - PhotoFunctionプロパティ追加（ファイル存在確認必要）
8. ⚠️ `ReactApp.Server/Controllers/NurseryController.cs` - GET/PUT実装（ファイル存在確認必要）

### 🟡 Phase 3: フロントエンド（スタッフ）
9. ✅ `reactapp.client/src/components/staff/photos/PhotoUpload.tsx` - PhotoFunctionチェックとUI制御

### 🟡 Phase 4: フロントエンド（保護者）
10. ⚠️ 保護者向け写真閲覧コンポーネント - PhotoFunctionチェックとUI制御（コンポーネント調査必要）
11. ⚠️ 保護者向けメニュー/ナビゲーション - 写真タブの表示制御（コンポーネント調査必要）

### 🟡 Phase 5: 管理画面
12. ⚠️ 保育園管理画面 - PhotoFunctionチェックボックス追加（画面調査/新規作成必要）

---

## 8. 調査が必要な項目

### 8.1 既存ファイルの確認
- [ ] `ReactApp.Server/DTOs/NurseryDto.cs` の存在確認
- [ ] `ReactApp.Server/Controllers/NurseryController.cs` の存在確認
- [ ] 保護者向け写真閲覧コンポーネントの特定
- [ ] 保育園管理画面の存在確認

### 8.2 設計決定事項
- [ ] NurseryDto/NurseryControllerが存在しない場合の新規作成範囲
- [ ] PhotoFunctionの変更権限（管理者のみ or スーパーユーザーのみ）
- [ ] PhotoFunction変更時の既存写真データの扱い（削除 or 保持）
- [ ] PhotoFunction変更履歴のログ記録の要否

---

## 9. リスク分析

### 9.1 高リスク
- **既存データへの影響**: マイグレーション時のデフォルト値設定が重要
  - 対策: defaultValue: true を明示的に設定
- **既存機能の破壊**: PhotoFunctionチェックの追加による既存動作への影響
  - 対策: デフォルト値 true により既存保育園は影響なし

### 9.2 中リスク
- **保護者UIコンポーネントの未特定**: 修正箇所が不明確
  - 対策: フロントエンドのファイル構造を調査して特定
- **管理画面の未実装**: PhotoFunction設定UIが存在しない可能性
  - 対策: 新規作成またはSQL直接更新での運用も検討

### 9.3 低リスク
- **パフォーマンス**: PhotoFunctionチェックのオーバーヘッド
  - 対策: 単純なBOOLカラムの取得のみで影響は軽微

---

## 10. 次のステップ

### Step 1: 調査フェーズ
1. NurseryDto.cs, NurseryController.cs の存在確認
2. 保護者向け写真閲覧コンポーネントの特定
3. 保育園管理画面の存在確認

### Step 2: 設計レビュー
1. ユーザー様と設計決定事項の確認
2. 実装範囲の最終確認

### Step 3: 実装フェーズ
1. Phase 1: データベース・モデル層
2. Phase 2: バックエンドAPI層
3. Phase 3: フロントエンド（スタッフ）
4. Phase 4: フロントエンド（保護者）
5. Phase 5: 管理画面

### Step 4: テスト・デプロイ
1. 単体テスト実装
2. 統合テスト実施
3. E2Eテスト実施
4. マイグレーション実行

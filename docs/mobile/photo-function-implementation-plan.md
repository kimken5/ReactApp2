# PhotoFunction機能 実装計画書

## 作成日: 2025-12-18

## 1. 実装概要

### 1.1 実装目的
保育園マスタ(Nurseries)にPhotoFunction(写真機能)カラムを追加し、保育園ごとに写真機能の使用有無を制御できるようにする。

### 1.2 実装スコープ
- **Phase 1**: データベース・モデル層（必須）
- **Phase 2**: バックエンドAPI層（必須）
- **Phase 3**: フロントエンド - スタッフ画面
- **Phase 4**: フロントエンド - 保護者画面
- **Phase 5**: 管理画面

### 1.3 前提条件
- データベースにPhotoFunctionカラム追加済み（ユーザー様が手動で追加済みと想定）
- 既存のNoPhoto機能との併用を考慮
- デフォルト値は TRUE (写真機能を使用) とし、既存保育園への影響を最小化

---

## 2. Phase 1: データベース・モデル層

### 2.1 タスク一覧
| # | タスク | ファイル | 優先度 | 見積時間 |
|---|--------|---------|--------|---------|
| 1.1 | Nurseryモデルへのプロパティ追加 | Nursery.cs | 🔴 高 | 10分 |
| 1.2 | DbContextの設定追加 | KindergartenDbContext.cs | 🔴 高 | 15分 |
| 1.3 | マイグレーション作成・実行 | Migrations/[timestamp]_AddPhotoFunctionToNurseries.cs | 🔴 高 | 20分 |
| 1.4 | DatabaseSeederの更新（任意） | DatabaseSeeder.cs | 🟡 中 | 10分 |

### 2.2 実装詳細

#### Task 1.1: Nursery.cs
**ファイル**: `ReactApp.Server/Models/Nursery.cs`

```csharp
/// <summary>
/// 写真機能の有効/無効（必須）
/// true=写真機能を使用、false=写真機能を使用しない
/// デフォルト値: true（既存保育園との互換性維持）
/// </summary>
[Required]
public bool PhotoFunction { get; set; } = true;
```

**挿入位置**: CurrentAcademicYear プロパティの後ろ

---

#### Task 1.2: KindergartenDbContext.cs
**ファイル**: `ReactApp.Server/Data/KindergartenDbContext.cs`

**Option A**: 既存のConfigureメソッドに追加（推奨）
```csharp
// OnModelCreating内に追加
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

**Option B**: OnModelCreating内で直接設定
```csharp
protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    // 既存の設定...

    // Nurseryエンティティの設定
    modelBuilder.Entity<Nursery>(entity =>
    {
        entity.Property(e => e.PhotoFunction)
            .IsRequired()
            .HasDefaultValue(true);
    });

    base.OnModelCreating(modelBuilder);
}
```

---

#### Task 1.3: マイグレーション作成
**コマンド**:
```bash
cd ReactApp.Server
dotnet ef migrations add AddPhotoFunctionToNurseries
```

**期待される出力ファイル**:
- `Migrations/[timestamp]_AddPhotoFunctionToNurseries.cs`
- `Migrations/[timestamp]_AddPhotoFunctionToNurseries.Designer.cs`

**マイグレーションコード確認**:
```csharp
protected override void Up(MigrationBuilder migrationBuilder)
{
    migrationBuilder.AddColumn<bool>(
        name: "PhotoFunction",
        table: "Nurseries",
        type: "bit",
        nullable: false,
        defaultValue: true); // 重要: デフォルト値を true に設定
}
```

**マイグレーション実行**:
```bash
dotnet ef database update
```

---

#### Task 1.4: DatabaseSeeder.cs (任意)
**ファイル**: `ReactApp.Server/Services/DatabaseSeeder.cs`

**修正内容**:
```csharp
// Nurseryのシードデータに PhotoFunction を追加
var nurseries = new List<Nursery>
{
    new Nursery
    {
        Id = 1,
        Name = "さくら保育園",
        PhotoFunction = true, // 追加
        // その他のプロパティ...
    },
    new Nursery
    {
        Id = 2,
        Name = "もみじ保育園",
        PhotoFunction = false, // テスト用に1つはfalseに設定
        // その他のプロパティ...
    }
};
```

---

## 3. Phase 2: バックエンドAPI層

### 3.1 タスク一覧
| # | タスク | ファイル | 優先度 | 見積時間 |
|---|--------|---------|--------|---------|
| 2.1 | IPhotoServiceインターフェース拡張 | IPhotoService.cs | 🔴 高 | 5分 |
| 2.2 | PhotoService実装 | PhotoService.cs | 🔴 高 | 30分 |
| 2.3 | PhotosController修正 | PhotosController.cs | 🔴 高 | 30分 |
| 2.4 | NurseryDto作成/修正 | NurseryDto.cs | 🟡 中 | 10分 |
| 2.5 | NurseryController作成/修正 | NurseryController.cs | 🟡 中 | 20分 |

### 3.2 実装詳細

#### Task 2.1: IPhotoService.cs
**ファイル**: `ReactApp.Server/Services/IPhotoService.cs`

```csharp
/// <summary>
/// 保育園の写真機能が有効かチェック
/// </summary>
/// <param name="nurseryId">保育園ID</param>
/// <returns>true=写真機能有効、false=無効</returns>
Task<bool> IsPhotoFunctionEnabledAsync(int nurseryId);
```

---

#### Task 2.2: PhotoService.cs
**ファイル**: `ReactApp.Server/Services/PhotoService.cs`

**Step 1**: IsPhotoFunctionEnabledAsync 実装
```csharp
public async Task<bool> IsPhotoFunctionEnabledAsync(int nurseryId)
{
    var nursery = await _context.Nurseries
        .Where(n => n.Id == nurseryId)
        .Select(n => n.PhotoFunction)
        .FirstOrDefaultAsync();

    return nursery; // nullの場合はfalseが返る
}
```

**Step 2**: 既存メソッドにPhotoFunctionチェック追加

**UploadPhotoAsync**:
```csharp
public async Task<PhotoDto> UploadPhotoAsync(int nurseryId, int staffId, UploadPhotoDto dto)
{
    // Step 1: PhotoFunctionチェック（最優先）
    if (!await IsPhotoFunctionEnabledAsync(nurseryId))
    {
        throw new InvalidOperationException("この保育園では写真機能が無効になっています");
    }

    // Step 2: NoPhotoチェック（既存機能）
    // ...既存のロジック
}
```

**GetPhotosAsync** (他のGETメソッドも同様):
```csharp
public async Task<List<PhotoDto>> GetPhotosAsync(int nurseryId, PhotoQueryDto query)
{
    // PhotoFunctionチェック
    if (!await IsPhotoFunctionEnabledAsync(nurseryId))
    {
        throw new InvalidOperationException("この保育園では写真機能が無効になっています");
    }

    // ...既存のロジック
}
```

**修正対象メソッド一覧**:
- ✅ UploadPhotoAsync
- ✅ GetPhotosAsync
- ✅ GetPhotoByIdAsync
- ✅ UpdatePhotoAsync
- ✅ DeletePhotoAsync
- ✅ その他の写真関連メソッド

---

#### Task 2.3: PhotosController.cs
**ファイル**: `ReactApp.Server/Controllers/PhotosController.cs`

**POST /api/photos/upload**:
```csharp
[HttpPost("upload")]
public async Task<IActionResult> UploadPhoto([FromForm] UploadPhotoDto dto)
{
    try
    {
        var nurseryId = GetNurseryIdFromContext();
        var staffId = GetStaffIdFromContext();

        // PhotoFunctionチェック
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
```

**GET /api/photos**:
```csharp
[HttpGet]
public async Task<IActionResult> GetPhotos([FromQuery] PhotoQueryDto query)
{
    try
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
    catch (InvalidOperationException ex)
    {
        return BadRequest(new { error = ex.Message });
    }
}
```

**修正対象エンドポイント一覧**:
- ✅ POST /api/photos/upload
- ✅ GET /api/photos
- ✅ GET /api/photos/{id}
- ✅ PUT /api/photos/{id}
- ✅ DELETE /api/photos/{id}
- ✅ その他の写真関連エンドポイント

---

#### Task 2.4: NurseryDto.cs
**ファイル**: `ReactApp.Server/DTOs/NurseryDto.cs` (存在確認必要)

**新規作成の場合**:
```csharp
namespace ReactApp.Server.DTOs;

/// <summary>
/// 保育園DTO
/// </summary>
public class NurseryDto
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// 写真機能の有効/無効
    /// </summary>
    public bool PhotoFunction { get; set; }

    // その他必要なプロパティ
    public string Address { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
}
```

**既存ファイルへの追加の場合**:
```csharp
/// <summary>
/// 写真機能の有効/無効
/// </summary>
public bool PhotoFunction { get; set; }
```

---

#### Task 2.5: NurseryController.cs
**ファイル**: `ReactApp.Server/Controllers/NurseryController.cs` (存在確認必要)

**新規作成の場合**:
```csharp
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ReactApp.Server.Data;
using ReactApp.Server.DTOs;
using ReactApp.Server.Helpers;

namespace ReactApp.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class NurseryController : ControllerBase
{
    private readonly KindergartenDbContext _context;
    private readonly ILogger<NurseryController> _logger;

    public NurseryController(
        KindergartenDbContext context,
        ILogger<NurseryController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// 保育園情報取得
    /// </summary>
    [HttpGet("{id}")]
    public async Task<IActionResult> GetNursery(int id)
    {
        var nursery = await _context.Nurseries.FindAsync(id);
        if (nursery == null)
        {
            return NotFound(new { error = "保育園が見つかりません" });
        }

        var dto = new NurseryDto
        {
            Id = nursery.Id,
            Name = nursery.Name,
            PhotoFunction = nursery.PhotoFunction,
            Address = nursery.Address,
            PhoneNumber = nursery.PhoneNumber,
            Email = nursery.Email
        };

        return Ok(dto);
    }

    /// <summary>
    /// 現在ログイン中の保育園情報取得
    /// </summary>
    [HttpGet("current")]
    public async Task<IActionResult> GetCurrentNursery()
    {
        // TODO: 認証コンテキストからnurseryIdを取得
        var nurseryId = 1; // 仮の値、実際は認証コンテキストから取得

        var nursery = await _context.Nurseries.FindAsync(nurseryId);
        if (nursery == null)
        {
            return NotFound(new { error = "保育園が見つかりません" });
        }

        var dto = new NurseryDto
        {
            Id = nursery.Id,
            Name = nursery.Name,
            PhotoFunction = nursery.PhotoFunction,
            Address = nursery.Address,
            PhoneNumber = nursery.PhoneNumber,
            Email = nursery.Email
        };

        return Ok(dto);
    }

    /// <summary>
    /// 保育園情報更新
    /// </summary>
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateNursery(int id, NurseryDto dto)
    {
        // TODO: 権限チェック（管理者のみ）

        var nursery = await _context.Nurseries.FindAsync(id);
        if (nursery == null)
        {
            return NotFound(new { error = "保育園が見つかりません" });
        }

        // PhotoFunctionの更新
        nursery.PhotoFunction = dto.PhotoFunction;
        nursery.UpdatedAt = DateTimeHelper.GetJstNow();

        await _context.SaveChangesAsync();

        _logger.LogInformation(
            "保育園情報更新: NurseryId={NurseryId}, PhotoFunction={PhotoFunction}",
            id, dto.PhotoFunction);

        return Ok(dto);
    }
}
```

---

## 4. Phase 3: フロントエンド - スタッフ画面

### 4.1 タスク一覧
| # | タスク | ファイル | 優先度 | 見積時間 |
|---|--------|---------|--------|---------|
| 3.1 | PhotoUpload.tsxの修正 | PhotoUpload.tsx | 🟡 中 | 30分 |

### 4.2 実装詳細

#### Task 3.1: PhotoUpload.tsx
**ファイル**: `reactapp.client/src/components/staff/photos/PhotoUpload.tsx`

**Step 1**: state追加
```typescript
const [photoFunctionEnabled, setPhotoFunctionEnabled] = useState<boolean>(true);
const [isLoadingPhotoFunction, setIsLoadingPhotoFunction] = useState<boolean>(true);
```

**Step 2**: useEffectでPhotoFunctionチェック
```typescript
useEffect(() => {
  const checkPhotoFunction = async () => {
    setIsLoadingPhotoFunction(true);
    try {
      const response = await fetch('/api/nursery/current', {
        headers: {
          'Authorization': `Bearer ${authToken}`, // 認証トークン
        },
      });

      if (!response.ok) {
        throw new Error('保育園情報の取得に失敗しました');
      }

      const nursery = await response.json();
      setPhotoFunctionEnabled(nursery.photoFunction);
    } catch (error) {
      console.error('Failed to check photo function:', error);
      setPhotoFunctionEnabled(false); // エラー時は無効として扱う
    } finally {
      setIsLoadingPhotoFunction(false);
    }
  };

  checkPhotoFunction();
}, []);
```

**Step 3**: JSX修正
```typescript
return (
  <Box sx={{ p: 3 }}>
    <Typography variant="h5" gutterBottom>
      写真アップロード
    </Typography>

    {isLoadingPhotoFunction ? (
      <CircularProgress />
    ) : !photoFunctionEnabled ? (
      <Alert severity="info" sx={{ mt: 2 }}>
        この保育園では写真機能が無効になっています。
      </Alert>
    ) : (
      // 既存のアップロードUI
      <Box>
        {/* ファイル選択 */}
        {/* 園児選択 */}
        {/* アップロードボタン */}
      </Box>
    )}
  </Box>
);
```

---

## 5. Phase 4: フロントエンド - 保護者画面

### 5.1 タスク一覧
| # | タスク | ファイル | 優先度 | 見積時間 |
|---|--------|---------|--------|---------|
| 4.1 | 保護者向け写真閲覧コンポーネント調査 | - | 🟡 中 | 30分 |
| 4.2 | 写真閲覧コンポーネントの修正 | (調査後決定) | 🟡 中 | 30分 |
| 4.3 | ナビゲーション/メニューの修正 | (調査後決定) | 🟡 中 | 20分 |

### 5.2 実装詳細

**Task 4.1**: 調査対象
- `reactapp.client/src/components/parent/**/*.tsx`
- `reactapp.client/src/pages/parent/**/*.tsx`
- ナビゲーション/メニューコンポーネント

**Task 4.2**: 写真閲覧コンポーネント（仮）
```typescript
// PhotoUpload.tsxと同様の実装パターン
const [photoFunctionEnabled, setPhotoFunctionEnabled] = useState<boolean>(true);

useEffect(() => {
  // PhotoFunctionチェック
}, []);

return (
  <Box>
    {!photoFunctionEnabled ? (
      <Alert severity="info">
        この保育園では写真機能が利用できません。
      </Alert>
    ) : (
      // 既存の写真閲覧UI
    )}
  </Box>
);
```

**Task 4.3**: ナビゲーション/メニュー（仮）
```typescript
{nursery.photoFunction && (
  <Tab label="写真" value="photos" />
)}
```

---

## 6. Phase 5: 管理画面

### 6.1 タスク一覧
| # | タスク | ファイル | 優先度 | 見積時間 |
|---|--------|---------|--------|---------|
| 5.1 | 保育園管理画面の調査 | - | 🟢 低 | 30分 |
| 5.2 | PhotoFunction設定UIの追加 | (調査後決定) | 🟢 低 | 40分 |

### 6.2 実装詳細

**Task 5.1**: 調査対象
- 既存の保育園管理画面の有無
- 管理者権限の実装状況

**Task 5.2**: PhotoFunction設定UI（仮）
```typescript
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
<Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
  写真機能を有効にすると、スタッフが写真をアップロードし、保護者が閲覧できるようになります。
  無効にすると、写真のアップロードと閲覧が完全に停止します。
</Typography>
```

---

## 7. テスト計画

### 7.1 単体テスト
```csharp
[Fact]
public async Task IsPhotoFunctionEnabledAsync_ReturnsTrue_WhenEnabled()
{
    // Arrange
    var nursery = new Nursery { Id = 1, PhotoFunction = true };
    _context.Nurseries.Add(nursery);
    await _context.SaveChangesAsync();

    // Act
    var result = await _photoService.IsPhotoFunctionEnabledAsync(1);

    // Assert
    Assert.True(result);
}

[Fact]
public async Task IsPhotoFunctionEnabledAsync_ReturnsFalse_WhenDisabled()
{
    // Arrange
    var nursery = new Nursery { Id = 1, PhotoFunction = false };
    _context.Nurseries.Add(nursery);
    await _context.SaveChangesAsync();

    // Act
    var result = await _photoService.IsPhotoFunctionEnabledAsync(1);

    // Assert
    Assert.False(result);
}
```

### 7.2 統合テスト
- PhotoFunction = false の場合、写真アップロードAPIがエラーを返すことを確認
- PhotoFunction = true の場合、既存機能が正常に動作することを確認

### 7.3 E2Eテスト
- スタッフ画面でPhotoFunction = false の場合、アップロードUIが非表示になることを確認
- 保護者画面でPhotoFunction = false の場合、写真メニューが非表示になることを確認

---

## 8. デプロイ計画

### 8.1 ステージング環境
1. マイグレーション実行
2. PhotoFunction = true でデフォルト設定されることを確認
3. 既存の写真機能が正常動作することを確認

### 8.2 本番環境
1. **事前確認**: 既存保育園データの確認
2. **マイグレーション実行**: `dotnet ef database update`
3. **動作確認**: 既存機能が正常動作することを確認
4. **ロールバック準備**: 問題発生時のロールバックスクリプト準備

---

## 9. リスク管理

### 9.1 高リスク項目
| リスク | 影響 | 対策 |
|--------|------|------|
| マイグレーション失敗 | 🔴 本番DB破損 | ステージング環境で事前テスト、バックアップ取得 |
| 既存機能の破壊 | 🔴 既存保育園が使えなくなる | デフォルト値 true により影響なし、段階的デプロイ |

### 9.2 中リスク項目
| リスク | 影響 | 対策 |
|--------|------|------|
| 保護者UIコンポーネント未特定 | 🟡 Phase 4実装遅延 | 早期調査、最悪の場合はAPI側のみ実装 |

---

## 10. 成功基準

### 10.1 必須要件
- ✅ マイグレーション成功
- ✅ 既存保育園の写真機能が正常動作
- ✅ PhotoFunction = false の保育園で写真アップロードがブロックされる
- ✅ PhotoFunction = false の保育園で写真閲覧がブロックされる

### 10.2 推奨要件
- ✅ スタッフUIで適切なメッセージが表示される
- ✅ 保護者UIで適切なメッセージが表示される
- ✅ 管理画面でPhotoFunctionを設定できる

---

## 11. スケジュール見積もり

| Phase | タスク数 | 見積時間 | 優先度 |
|-------|---------|---------|--------|
| Phase 1 | 4 | 55分 | 🔴 高 |
| Phase 2 | 5 | 95分 | 🔴 高 |
| Phase 3 | 1 | 30分 | 🟡 中 |
| Phase 4 | 3 | 80分 | 🟡 中 |
| Phase 5 | 2 | 70分 | 🟢 低 |
| **合計** | **15** | **330分 (5.5時間)** | - |

**注**: 調査時間やテスト時間は別途必要

---

## 12. 次のアクション

### 即座に実施可能
1. ✅ Phase 1の実装開始（データベース・モデル層）
2. ✅ Phase 2の実装開始（バックエンドAPI層）

### 調査後に実施
3. ⚠️ Phase 4の詳細計画（保護者UIコンポーネント調査必要）
4. ⚠️ Phase 5の詳細計画（管理画面調査必要）

### ユーザー確認が必要
- PhotoFunction変更権限の決定
- 管理画面の実装範囲の確認
- デプロイスケジュールの調整

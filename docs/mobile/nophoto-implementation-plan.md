# 撮影禁止(NoPhoto)機能 実装計画

## 1. 実装概要

### 1.1 目的
撮影禁止(NoPhoto)機能の要件定義に基づき、バックエンド・フロントエンドの実装を段階的に進める。

### 1.2 実装方針
- **段階的実装**: バックエンド → フロントエンド の順で実装
- **既存パターン踏襲**: プロジェクトの既存コーディング規約・パターンに従う
- **テスト駆動**: 各実装後に動作確認を実施
- **ドキュメント更新**: 実装と並行してドキュメントを更新

## 2. 実装タスク一覧

### Phase 1: データモデル・DTO更新 (1-2時間)
- [ ] Task 1.1: ApplicationWork.cs モデル更新
- [ ] Task 1.2: Child.cs モデル更新
- [ ] Task 1.3: ApplicationWorkDto.cs 更新
- [ ] Task 1.4: ChildDto.cs 更新
- [ ] Task 1.5: マイグレーションファイル作成
- [ ] Task 1.6: ビルド確認

### Phase 2: データベース設定・シーダー更新 (30分-1時間)
- [ ] Task 2.1: KindergartenDbContext.cs 更新
- [ ] Task 2.2: DatabaseSeeder.cs 更新（テストデータ追加）
- [ ] Task 2.3: database-design.md 更新

### Phase 3: バックエンドAPI実装 (2-3時間)
- [ ] Task 3.1: 写真アップロード検証ロジック実装
- [ ] Task 3.2: ApplicationWorksController 確認・更新
- [ ] Task 3.3: ChildrenController 確認・更新
- [ ] Task 3.4: PhotoController 更新（警告情報追加）

### Phase 4: フロントエンド実装 (3-4時間)
- [ ] Task 4.1: 入園申込フォームコンポーネント特定・更新
- [ ] Task 4.2: 園児登録・編集コンポーネント特定・更新
- [ ] Task 4.3: 写真アップロードコンポーネント特定・更新
- [ ] Task 4.4: 警告ダイアログコンポーネント作成
- [ ] Task 4.5: 多言語対応（i18n）の確認・追加

### Phase 5: テスト・検証 (2-3時間)
- [ ] Task 5.1: バックエンド単体テスト作成・実行
- [ ] Task 5.2: API統合テスト実行
- [ ] Task 5.3: フロントエンドE2Eテスト作成・実行
- [ ] Task 5.4: 手動テスト（各画面の動作確認）

### Phase 6: ドキュメント・仕上げ (1時間)
- [ ] Task 6.1: 作業ログ作成（claude_logs/2025-12-17.md）
- [ ] Task 6.2: Git コミット・プッシュ
- [ ] Task 6.3: 実装完了報告

**総見積もり時間**: 10-14時間

## 3. 詳細実装計画

### Phase 1: データモデル・DTO更新

#### Task 1.1: ApplicationWork.cs モデル更新
**ファイル**: `ReactApp.Server/Models/ApplicationWork.cs`

**追加コード**:
```csharp
/// <summary>
/// 撮影禁止フラグ（申込時）
/// true=撮影禁止を希望、false=撮影可（デフォルト）
/// デフォルト値: false（基本的に撮影・共有を許可）
/// </summary>
[Required]
public bool ChildNoPhoto { get; set; } = false;
```

**確認事項**:
- 既存のApplicationWorkモデルの構造を確認
- 他のboolプロパティの命名規則を確認
- CreatedAt/UpdatedAtプロパティの存在確認

#### Task 1.2: Child.cs モデル更新
**ファイル**: `ReactApp.Server/Models/Child.cs`

**追加コード**:
```csharp
/// <summary>
/// 撮影禁止フラグ（園児マスタ）
/// true=撮影禁止、false=撮影可
/// デフォルト値: false（既存データとの互換性維持）
/// </summary>
[Required]
public bool NoPhoto { get; set; } = false;
```

**確認事項**:
- 既存のChildモデルの構造を確認
- 複合主キー (NurseryId, ChildId) の確認
- Navigation propertiesの確認

#### Task 1.3: ApplicationWorkDto.cs 更新
**ファイル**: `ReactApp.Server/DTOs/ApplicationWorkDto.cs` (要確認)

**追加コード**:
```csharp
/// <summary>
/// 撮影禁止フラグ（デフォルト: false - 撮影・共有を許可）
/// </summary>
public bool ChildNoPhoto { get; set; } = false;
```

**確認事項**:
- DTOファイルの存在確認（存在しない場合は新規作成を検討）
- 既存のDTOパターンの確認

#### Task 1.4: ChildDto.cs 更新
**ファイル**: `ReactApp.Server/DTOs/ChildDto.cs` (既存確認済み)

**追加コード**:
```csharp
/// <summary>
/// 撮影禁止フラグ
/// </summary>
public bool NoPhoto { get; set; }
```

#### Task 1.5: マイグレーションファイル作成
**コマンド**:
```bash
cd ReactApp.Server
dotnet ef migrations add AddNoPhotoFieldsToApplicationWorkAndChild --context KindergartenDbContext
```

**マイグレーション内容**:
- ApplicationWorks.ChildNoPhoto 追加（BIT, NOT NULL, DEFAULT 0）
- Children.NoPhoto 追加（BIT, NOT NULL, DEFAULT 0）

**注意事項**:
- データベースはすでに更新済みのため、マイグレーションはC#コードとの同期目的
- 実際のデータベースには適用しない（ドキュメント・追跡用）

#### Task 1.6: ビルド確認
```bash
cd ReactApp.Server
dotnet build
```

### Phase 2: データベース設定・シーダー更新

#### Task 2.1: KindergartenDbContext.cs 更新
**ファイル**: `ReactApp.Server/Data/KindergartenDbContext.cs`

**追加コード（ApplicationWorks設定）**:
```csharp
entity.Property(e => e.ChildNoPhoto)
    .IsRequired()
    .HasDefaultValue(false);
```

**追加コード（Children設定）**:
```csharp
entity.Property(e => e.NoPhoto)
    .IsRequired()
    .HasDefaultValue(false);
```

**確認事項**:
- OnModelCreatingメソッド内の既存設定パターンを確認
- 他のboolプロパティの設定方法を確認

#### Task 2.2: DatabaseSeeder.cs 更新
**ファイル**: `ReactApp.Server/Services/DatabaseSeeder.cs`

**更新箇所**:
1. SeedApplicationWorksAsync メソッド（要確認・存在する場合）
   - ChildNoPhoto = true/false のテストデータを追加
   - 複数パターンを用意（false: 3件 - 大多数, true: 2件 - 少数）

2. SeedChildrenAsync メソッド
   - NoPhoto = true/false のテストデータを追加
   - 既存の8園児に対してNoPhotoフラグを設定（false: 6件, true: 2件）

**サンプルコード**:
```csharp
// SeedChildrenAsync内
new Child
{
    NurseryId = 1,
    ChildId = 1,
    Name = "田中太郎",
    // ... 他のプロパティ
    NoPhoto = true, // 撮影禁止
    CreatedAt = DateTimeHelper.GetJstNow()
},
new Child
{
    NurseryId = 1,
    ChildId = 2,
    Name = "佐藤花子",
    // ... 他のプロパティ
    NoPhoto = false, // 撮影可
    CreatedAt = DateTimeHelper.GetJstNow()
}
```

#### Task 2.3: database-design.md 更新
**ファイル**: `docs/database-design.md`

**更新箇所**:
1. ApplicationWorksテーブル定義
   - ChildNoPhoto カラム追加

2. Childrenテーブル定義
   - NoPhoto カラム追加

**フォーマット**:
```markdown
| カラム名 | データ型 | NULL | デフォルト | 説明 |
|---------|---------|------|-----------|------|
| ChildNoPhoto | BIT | NOT NULL | 0 | 撮影禁止フラグ（申込時・デフォルトで撮影許可） |
| NoPhoto | BIT | NOT NULL | 0 | 撮影禁止フラグ（園児マスタ） |
```

### Phase 3: バックエンドAPI実装

#### Task 3.1: 写真アップロード検証ロジック実装
**実装場所**: `ReactApp.Server/Services/PhotoService.cs`

**新規メソッド追加**:
```csharp
/// <summary>
/// 選択された園児の中にNoPhoto設定の園児がいるかチェック
/// </summary>
/// <param name="nurseryId">保育園ID</param>
/// <param name="childIds">園児IDリスト</param>
/// <returns>NoPhoto園児の情報</returns>
public async Task<NoPhotoValidationResult> ValidateNoPhotoChildren(
    int nurseryId,
    List<int> childIds)
{
    var noPhotoChildren = await _context.Children
        .Where(c => c.NurseryId == nurseryId
                 && childIds.Contains(c.ChildId)
                 && c.NoPhoto == true)
        .Select(c => new NoPhotoChildInfo
        {
            ChildId = c.ChildId,
            Name = c.Name
        })
        .ToListAsync();

    return new NoPhotoValidationResult
    {
        HasNoPhotoChildren = noPhotoChildren.Any(),
        NoPhotoChildren = noPhotoChildren
    };
}
```

**新規DTO追加**:
```csharp
// ReactApp.Server/DTOs/NoPhotoValidationResult.cs
public class NoPhotoValidationResult
{
    public bool HasNoPhotoChildren { get; set; }
    public List<NoPhotoChildInfo> NoPhotoChildren { get; set; } = new();
}

public class NoPhotoChildInfo
{
    public int ChildId { get; set; }
    public string Name { get; set; } = string.Empty;
}
```

#### Task 3.2: ApplicationWorksController 確認・更新
**ファイル**: `ReactApp.Server/Controllers/ApplicationWorksController.cs` (要確認)

**確認事項**:
- 申込作成APIエンドポイントの存在確認
- ChildNoPhotoプロパティがリクエストボディから正しくマッピングされるか確認
- 特別な処理が不要であれば、モデル更新のみで対応可能

#### Task 3.3: ChildrenController 確認・更新
**ファイル**: `ReactApp.Server/Controllers/ChildrenController.cs` (要確認)

**確認事項**:
- 園児作成・更新APIエンドポイントの存在確認
- NoPhotoプロパティがリクエストボディから正しくマッピングされるか確認
- 特別な処理が不要であれば、モデル更新のみで対応可能

#### Task 3.4: PhotoController 更新
**ファイル**: `ReactApp.Server/Controllers/PhotoController.cs` (既存確認済み)

**更新方法（オプションA）**: 既存のUploadPhotoエンドポイント内で検証
```csharp
[HttpPost("upload")]
public async Task<IActionResult> UploadPhoto([FromForm] PhotoUploadRequest request)
{
    // NoPhotoチェック追加
    var validation = await _photoService.ValidateNoPhotoChildren(
        request.NurseryId,
        request.ChildIds
    );

    // 既存のアップロード処理
    var result = await _photoService.UploadPhotoAsync(request);

    // レスポンスに警告情報を追加
    return Ok(new
    {
        PhotoId = result.PhotoId,
        // ... 他のレスポンス項目
        NoPhotoWarning = validation // 警告情報を追加
    });
}
```

**更新方法（オプションB）**: 新規検証エンドポイント作成
```csharp
[HttpPost("validate-children")]
public async Task<IActionResult> ValidateNoPhotoChildren(
    [FromBody] NoPhotoValidationRequest request)
{
    var result = await _photoService.ValidateNoPhotoChildren(
        request.NurseryId,
        request.ChildIds
    );

    return Ok(result);
}
```

**推奨**: オプションA（既存エンドポイント拡張）がシンプルで効率的

### Phase 4: フロントエンド実装

#### Task 4.1: 入園申込フォームコンポーネント特定・更新
**調査**: 入園申込関連のコンポーネントファイルを特定

**検索コマンド**:
```bash
cd reactapp.client
grep -r "application" src/ --include="*.tsx" --include="*.ts"
grep -r "ApplicationWork" src/ --include="*.tsx" --include="*.ts"
```

**実装パターン**:
```tsx
const [formData, setFormData] = useState({
  // ... 他のフィールド
  childNoPhoto: false, // デフォルトでfalse（撮影・共有を許可）
});

{/* 写真共有に関する説明文 */}
<Box sx={{ mb: 2, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
  <Typography variant="body2">
    {t('application.photoSharing.description')}
  </Typography>
</Box>

{/* 撮影禁止チェックボックス */}
<FormControlLabel
  control={
    <Checkbox
      name="childNoPhoto"
      checked={formData.childNoPhoto}
      onChange={(e) => setFormData({
        ...formData,
        childNoPhoto: e.target.checked
      })}
    />
  }
  label={t('application.childNoPhoto.label')} // i18n対応
/>
```

#### Task 4.2: 園児登録・編集コンポーネント特定・更新
**調査**: 園児管理関連のコンポーネントファイルを特定

**検索コマンド**:
```bash
cd reactapp.client
grep -r "child" src/ --include="*.tsx" --include="*.ts"
grep -r "Child" src/ --include="*.tsx" --include="*.ts"
```

**実装パターン**:
```tsx
const [childData, setChildData] = useState({
  // ... 他のフィールド
  noPhoto: false,
});

<FormControlLabel
  control={
    <Checkbox
      name="noPhoto"
      checked={childData.noPhoto}
      onChange={(e) => setChildData({
        ...childData,
        noPhoto: e.target.checked
      })}
    />
  }
  label={t('child.noPhoto.label')} // i18n対応
/>
```

#### Task 4.3: 写真アップロードコンポーネント特定・更新
**調査**: 写真アップロード関連のコンポーネントファイルを特定

**検索コマンド**:
```bash
cd reactapp.client
grep -r "photo" src/ --include="*.tsx" --include="*.ts"
grep -r "upload" src/ --include="*.tsx" --include="*.ts"
```

**実装パターン**:
```tsx
const handleUpload = async () => {
  // 写真アップロード実行
  const response = await uploadPhoto(formData);

  // NoPhoto警告チェック
  if (response.noPhotoWarning?.hasNoPhotoChildren) {
    setShowNoPhotoWarning(true);
    setNoPhotoChildren(response.noPhotoWarning.noPhotoChildren);
    // 警告ダイアログ表示
  }
};
```

#### Task 4.4: 警告ダイアログコンポーネント作成
**新規ファイル**: `reactapp.client/src/components/NoPhotoWarningDialog.tsx`

**実装コード**:
```tsx
import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  List,
  ListItem,
  Alert
} from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import { useTranslation } from 'react-i18next';

interface NoPhotoChild {
  childId: number;
  name: string;
}

interface NoPhotoWarningDialogProps {
  open: boolean;
  noPhotoChildren: NoPhotoChild[];
  onCancel: () => void;
  onContinue: () => void;
}

const NoPhotoWarningDialog: React.FC<NoPhotoWarningDialogProps> = ({
  open,
  noPhotoChildren,
  onCancel,
  onContinue
}) => {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="sm" fullWidth>
      <DialogTitle>
        <WarningIcon color="warning" sx={{ mr: 1, verticalAlign: 'middle' }} />
        {t('photo.noPhotoWarning.title')}
      </DialogTitle>
      <DialogContent>
        <Alert severity="warning" sx={{ mb: 2 }}>
          {t('photo.noPhotoWarning.message')}
        </Alert>
        <Typography variant="body2" gutterBottom>
          {t('photo.noPhotoWarning.childrenList')}
        </Typography>
        <List>
          {noPhotoChildren.map((child) => (
            <ListItem key={child.childId}>
              • {child.name}
            </ListItem>
          ))}
        </List>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          {t('photo.noPhotoWarning.confirmation')}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} color="inherit">
          {t('common.cancel')}
        </Button>
        <Button onClick={onContinue} color="primary" variant="contained">
          {t('photo.noPhotoWarning.continue')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NoPhotoWarningDialog;
```

#### Task 4.5: 多言語対応（i18n）の確認・追加
**ファイル**: `reactapp.client/src/locales/ja.json` (要確認)

**追加翻訳キー**:
```json
{
  "application": {
    "photoSharing": {
      "description": "当園では、保育園での日常の様子や行事の写真を専用アプリを通じて保護者の皆様と共有しています。アプリは保護者のみがアクセス可能で、お子様の成長記録を安全にご覧いただけます。クラスの集合写真なども含まれますので、ぜひご活用ください。"
    },
    "childNoPhoto": {
      "label": "写真の撮影・共有を希望しない（チェックを入れた場合、お子様が写った写真は共有されません）"
    }
  },
  "child": {
    "noPhoto": {
      "label": "撮影禁止"
    }
  },
  "photo": {
    "noPhotoWarning": {
      "title": "撮影禁止設定の園児が含まれています",
      "message": "以下の園児は撮影禁止設定がされています。",
      "childrenList": "対象園児:",
      "confirmation": "この写真には上記の園児が映っていないことを確認してください。このままアップロードしますか？",
      "continue": "アップロード"
    }
  },
  "common": {
    "cancel": "キャンセル"
  }
}
```

**他言語対応**: 英語(en.json)、中国語(zh.json)、韓国語(ko.json)にも追加

### Phase 5: テスト・検証

#### Task 5.1: バックエンド単体テスト作成・実行
**テストファイル**: `ReactApp.Server.Tests/Services/PhotoServiceTests.cs` (新規作成)

**テストケース**:
1. ValidateNoPhotoChildren - NoPhoto園児が含まれる場合
2. ValidateNoPhotoChildren - NoPhoto園児が含まれない場合
3. ValidateNoPhotoChildren - 全園児がNoPhoto=trueの場合
4. ValidateNoPhotoChildren - 空のchildIdsリストの場合

**サンプルテスト**:
```csharp
[Fact]
public async Task ValidateNoPhotoChildren_ShouldReturnNoPhotoChildren()
{
    // Arrange
    var nurseryId = 1;
    var childIds = new List<int> { 1, 2, 3 };

    // Act
    var result = await _photoService.ValidateNoPhotoChildren(nurseryId, childIds);

    // Assert
    Assert.True(result.HasNoPhotoChildren);
    Assert.NotEmpty(result.NoPhotoChildren);
}
```

#### Task 5.2: API統合テスト実行
**テストツール**: Postman または Thunder Client

**テストケース**:
1. POST /api/applications - ChildNoPhoto=false (デフォルト) で申込作成
2. POST /api/applications - ChildNoPhoto=true (チェック有り) で申込作成
3. PUT /api/children/{id} - NoPhoto=true に更新
4. PUT /api/children/{id} - NoPhoto=false に更新
5. POST /api/photos/upload - NoPhoto園児を含む写真アップロード

#### Task 5.3: フロントエンドE2Eテスト作成・実行
**テストファイル**: `reactapp.client/tests/e2e/noPhoto.spec.ts` (新規作成)

**テストケース**:
1. 入園申込フォームで写真共有の説明文が表示される
2. 入園申込フォームでchildNoPhotoチェックボックスがデフォルトで**チェック無し**
3. childNoPhotoチェックを入れて申込が正常に送信される
4. childNoPhotoチェック無しのまま申込が正常に送信される
5. 園児編集画面でNoPhotoチェックボックスが正しく表示される
6. NoPhoto=trueに変更して保存が成功する
7. NoPhoto園児を選択して写真アップロード時に警告ダイアログが表示される
8. 警告ダイアログでキャンセルを選択するとアップロードが中止される
9. 警告ダイアログで続行を選択するとアップロードが実行される

#### Task 5.4: 手動テスト
**テストシナリオ**:
1. 入園申込フォーム
   - 写真共有の説明文が表示される
   - デフォルトでチェックボックスが**OFF**（チェック無し）
   - チェックを入れて申込
   - データベースでChildNoPhoto=1を確認
   - チェック無しのまま申込
   - データベースでChildNoPhoto=0を確認

2. 園児編集画面
   - NoPhotoチェックボックスが表示される
   - ONにして保存
   - データベースでNoPhoto=1を確認

3. 写真アップロード
   - NoPhoto=trueの園児を選択
   - 警告ダイアログが表示される
   - 園児名リストが正しく表示される
   - キャンセル・続行ボタンが機能する

### Phase 6: ドキュメント・仕上げ

#### Task 6.1: 作業ログ作成
**ファイル**: `claude_logs/2025-12-17.md`

**記載内容**:
- 実装概要
- 変更ファイル一覧
- データベース変更内容
- テスト結果
- 残課題・今後の拡張

#### Task 6.2: Git コミット・プッシュ
**コマンド**:
```bash
git status
git add .
git commit -m "feat: 撮影禁止(NoPhoto)機能の実装

- ApplicationWorks.ChildNoPhoto プロパティ追加
- Children.NoPhoto プロパティ追加
- 写真アップロード時のNoPhoto検証ロジック実装
- 入園申込フォームに撮影禁止チェックボックス追加
- 園児編集画面に撮影禁止チェックボックス追加
- NoPhoto警告ダイアログコンポーネント実装
- テストケース追加と実行
- ドキュメント更新（要件定義、実装計画、データベース設計）

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
git push origin main
```

#### Task 6.3: 実装完了報告
ユーザーに実装完了を報告し、動作確認を依頼。

## 4. リスク管理

### 4.1 技術的リスク
| リスク | 影響度 | 対策 |
|-------|--------|------|
| ApplicationWorksコントローラー・フォームが存在しない | 高 | 調査後、存在しない場合は新規作成または別の実装方法を検討 |
| 既存の写真アップロードロジックとの競合 | 中 | 既存コードを慎重に確認し、影響を最小限に |
| フロントエンドのコンポーネント構造が不明 | 中 | 段階的に調査し、既存パターンに従う |

### 4.2 スケジュールリスク
| リスク | 影響度 | 対策 |
|-------|--------|------|
| フロントエンドコンポーネント特定に時間がかかる | 中 | grep検索とファイル構造の事前確認 |
| テスト作成・実行に予想以上の時間 | 低 | 優先度の高いテストケースに絞る |

## 5. 前提条件

### 5.1 環境
- .NET 8 SDK インストール済み
- Node.js 20.x インストール済み
- Visual Studio または VS Code
- SQL Server 接続可能

### 5.2 データベース
- ApplicationWorks.ChildNoPhoto カラムが追加済み
- Children.NoPhoto カラムが追加済み
- dbo.GetJstDateTime() 関数が作成済み

### 5.3 既存機能
- 入園申込機能が実装済み
- 園児マスタ管理機能が実装済み
- 写真アップロード機能が実装済み

## 6. 成功基準

### 6.1 機能的成功基準
- [ ] 入園申込時にChildNoPhotoが正しく保存される
- [ ] 園児マスタでNoPhotoが編集可能
- [ ] NoPhoto=trueの園児を含む写真アップロード時に警告が表示される
- [ ] 警告ダイアログで正しい園児名が表示される
- [ ] キャンセル・続行が正しく動作する

### 6.2 品質基準
- [ ] すべての単体テストがパスする
- [ ] API統合テストがパスする
- [ ] E2Eテストがパスする
- [ ] ビルドエラーがない
- [ ] ESLintエラーがない

### 6.3 ドキュメント基準
- [ ] 要件定義書が完成している
- [ ] 実装計画書が完成している
- [ ] データベース設計書が更新されている
- [ ] 作業ログが記録されている

## 7. 次のステップ

実装計画承認後、以下の順序で実装を開始します：

1. **Phase 1開始**: ApplicationWork.cs と Child.cs モデル更新
2. **ビルド確認**: 各Phase完了後に動作確認
3. **段階的コミット**: 各Phase完了後にGitコミット
4. **ユーザー確認**: Phase 3, 4完了後に中間確認

---

**作成日**: 2025-12-17
**作成者**: Claude Code
**承認待ち**: ユーザー確認後、実装開始

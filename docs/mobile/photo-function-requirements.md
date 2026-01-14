# 写真機能制御(PhotoFunction) 要件定義書

## 1. 機能概要

### 1.1 目的
保育園ごとに写真機能の使用有無を制御する設定を提供する。これにより、写真機能を利用しない保育園は写真アップロード・閲覧機能を無効化でき、システムの柔軟性を向上させる。

### 1.2 対象範囲
- 保育園マスタでの写真機能ON/OFF設定
- スタッフによる写真アップロード機能の制御
- 保護者による写真閲覧機能の制御
- 既存のNoPhoto(撮影禁止)機能との併用

### 1.3 NoPhoto機能との関係
```
保育園レベル: PhotoFunction (保育園全体で写真機能を使うか)
    ↓ PhotoFunction = true の場合のみ
園児レベル: NoPhoto (個別の園児の撮影禁止設定)
```

**優先順位**:
1. `PhotoFunction = false` → 保育園全体で写真機能が無効(NoPhotoの値に関わらず全て無効)
2. `PhotoFunction = true` かつ `NoPhoto = false` → 写真機能が有効
3. `PhotoFunction = true` かつ `NoPhoto = true` → その園児のみ撮影禁止

## 2. データベーススキーマ

### 2.1 Nurseriesテーブル
| カラム名 | データ型 | NULL許可 | デフォルト値 | 説明 |
|---------|---------|----------|-------------|------|
| PhotoFunction | BIT | NOT NULL | 1 | 写真機能の有効/無効<br>1=写真機能を使用、0=写真機能を使用しない |

**設計意図**:
- デフォルト値を `1` (TRUE) に設定することで、既存の保育園は写真機能が有効な状態を維持
- 新規登録時も基本的には写真機能を有効にする
- 保育園の利用開始時に初期設定として設定
- 運用中でも変更可能（管理者権限）

**既存データへの影響**:
- マイグレーション時に既存のNurseriesレコードには `PhotoFunction = 1` (有効) を自動設定
- 既存の保育園の動作に影響を与えない

## 3. ビジネスルール

### 3.1 保育園登録・初期設定時
- 保育園登録時にPhotoFunctionのデフォルト値は `true` (写真機能を使用)
- 管理画面で初期設定として変更可能
- 一度設定後も変更可能（管理者権限が必要）

### 3.2 写真アップロード時の制御
**PhotoFunction = false の場合**:
- スタッフによる写真アップロード機能が完全に無効化
- アップロードボタン・UIが非表示または無効状態
- APIリクエストもバリデーションエラーを返す

**PhotoFunction = true の場合**:
- 従来どおり写真アップロード機能が有効
- NoPhoto設定に基づく個別園児の撮影禁止チェックを実施

### 3.3 写真閲覧時の制御
**PhotoFunction = false の場合**:
- 保護者アプリでの写真閲覧機能が完全に無効化
- 写真メニュー・タブが非表示
- APIリクエストもバリデーションエラーを返す

**PhotoFunction = true の場合**:
- 従来どおり写真閲覧機能が有効
- 個別のアクセス権限チェックを実施

### 3.4 NoPhoto機能との併用
```
if (Nursery.PhotoFunction == false) {
    // 保育園全体で写真機能無効
    return "写真機能は無効です";
}

if (Child.NoPhoto == true) {
    // この園児は撮影禁止
    return "撮影禁止の園児が含まれています";
}

// 写真機能が有効
```

## 4. UI要件

### 4.1 保育園管理画面（管理者用）
**場所**: 保育園マスタ管理画面（要調査・新規作成の可能性あり）

**追加要素**:
```tsx
<FormControlLabel
  control={
    <Checkbox
      name="photoFunction"
      checked={nurseryData.photoFunction}
      onChange={handlePhotoFunctionChange}
    />
  }
  label="写真機能を使用する"
/>
```

**説明文**:
```
写真機能を有効にすると、スタッフが写真をアップロードし、保護者が閲覧できるようになります。
写真機能を使用しない場合は、チェックを外してください。
```

### 4.2 スタッフ - 写真アップロード画面
**場所**: `reactapp.client/src/components/staff/photos/PhotoUpload.tsx`

**変更内容**:
1. コンポーネントのマウント時にPhotoFunctionをチェック
2. PhotoFunction = false の場合、アップロードUIを非表示にし、メッセージを表示

```tsx
{!nursery.photoFunction ? (
  <Alert severity="info">
    この保育園では写真機能が無効になっています。
  </Alert>
) : (
  // 既存のアップロードUI
)}
```

### 4.3 保護者アプリ - 写真閲覧画面
**場所**: 保護者向け写真閲覧コンポーネント（要調査）

**変更内容**:
1. 写真メニュー/タブの表示制御
2. PhotoFunction = false の場合、メニュー自体を非表示
3. または無効メッセージを表示

```tsx
{nursery.photoFunction && (
  <Tab label="写真" value="photos" />
)}
```

## 5. API要件

### 5.1 保育園情報取得API
**エンドポイント**: `GET /api/nurseries/{id}`

**レスポンスボディ追加項目**:
```json
{
  "id": 1,
  "name": "さくら保育園",
  "photoFunction": true
}
```

### 5.2 保育園情報更新API
**エンドポイント**: `PUT /api/nurseries/{id}`

**リクエストボディ追加項目**:
```json
{
  "photoFunction": true
}
```

### 5.3 写真アップロードAPI
**エンドポイント**: `POST /api/photos/upload`

**バリデーション追加**:
```csharp
// PhotoFunction チェックを最優先で実施
var nursery = await _context.Nurseries.FindAsync(nurseryId);
if (nursery?.PhotoFunction == false)
{
    return BadRequest(new { error = "この保育園では写真機能が無効になっています" });
}

// 既存のNoPhotoチェック
if (noPhotoValidation.HasNoPhotoChildren)
{
    // 警告を返す
}
```

### 5.4 写真閲覧API
**エンドポイント**: `GET /api/photos`, `GET /api/photos/{id}`

**バリデーション追加**:
```csharp
var nursery = await _context.Nurseries.FindAsync(nurseryId);
if (nursery?.PhotoFunction == false)
{
    return BadRequest(new { error = "この保育園では写真機能が無効になっています" });
}
```

## 6. セキュリティ・プライバシー考慮事項

### 6.1 アクセス制御
- PhotoFunction設定の閲覧: 管理者、保育園スタッフ
- PhotoFunction設定の変更: 管理者のみ（またはシステム管理者）
- 変更ログの記録: 推奨（誰がいつ変更したか）

### 6.2 データ保護
- PhotoFunction = false に変更しても、既存の写真データは削除しない
- 再度 true に変更すれば、過去の写真も閲覧可能になる
- 写真データの完全削除が必要な場合は別途削除操作が必要

## 7. テスト要件

### 7.1 単体テスト
- Nursery モデルの PhotoFunction プロパティのデフォルト値検証
- PhotoFunction = false の場合のバリデーションロジック検証

### 7.2 統合テスト
- 保育園登録API: PhotoFunction = 1 (デフォルト) でデータが保存されることを確認
- 保育園更新API: PhotoFunction の更新が正しく反映されることを確認
- 写真アップロードAPI: PhotoFunction = false の場合、エラーが返ることを確認
- 写真閲覧API: PhotoFunction = false の場合、エラーが返ることを確認

### 7.3 E2Eテスト
- 保育園管理画面でPhotoFunctionのチェックボックスが表示されることを確認
- PhotoFunction = false に設定後、スタッフ画面で写真アップロードUIが非表示になることを確認
- PhotoFunction = false に設定後、保護者アプリで写真メニューが非表示になることを確認
- PhotoFunction = true に戻した後、写真機能が正常に動作することを確認

## 8. 非機能要件

### 8.1 パフォーマンス
- PhotoFunctionチェックは高速に実行（Nurseriesテーブルから1レコード取得のみ）
- 頻繁にアクセスされる場合はキャッシュを検討

### 8.2 ユーザビリティ
- PhotoFunction = false の場合、明確なメッセージでユーザーに通知
- 管理者がPhotoFunctionを変更する際、影響範囲を説明

### 8.3 保守性
- PhotoFunctionの変更履歴を記録（推奨）
- 将来的な機能拡張を考慮（部分的な写真機能の制御など）

## 9. 制約事項

### 9.1 技術的制約
- データベースにPhotoFunctionカラムを追加する必要あり（マイグレーション）
- 既存の写真データには影響を与えない

### 9.2 運用上の制約
- PhotoFunction = false に変更しても、既存の写真は削除されない
- 写真データの完全削除が必要な場合は、別途手動で削除操作が必要

## 10. 移行計画

### 10.1 既存データの扱い
- マイグレーション実行時、既存のNurseriesレコードに `PhotoFunction = 1` を設定
- 既存の保育園の動作に影響なし

### 10.2 段階的展開
1. フェーズ1: データベースマイグレーション実施
2. フェーズ2: バックエンドAPIのバリデーション追加
3. フェーズ3: スタッフUIの制御実装
4. フェーズ4: 保護者UIの制御実装
5. フェーズ5: 管理画面でのPhotoFunction設定UI追加

## 11. NoPhoto機能との統合

### 11.1 機能の階層構造
```
Level 1: PhotoFunction (保育園レベル) - 保育園全体で写真機能を使うか
    ↓
Level 2: NoPhoto (園児レベル) - 個別の園児の撮影禁止
```

### 11.2 判定フロー
```typescript
function canUploadPhoto(nurseryId: number, childIds: number[]): boolean {
  const nursery = getNursery(nurseryId);

  // Step 1: 保育園全体のPhotoFunctionチェック
  if (!nursery.photoFunction) {
    throw new Error("この保育園では写真機能が無効になっています");
  }

  // Step 2: 個別園児のNoPhotoチェック
  const noPhotoChildren = getChildren(childIds).filter(c => c.noPhoto);
  if (noPhotoChildren.length > 0) {
    // 警告を表示して確認を求める
    showWarning(noPhotoChildren);
  }

  return true;
}
```

### 11.3 ユーザーへのメッセージ
- **PhotoFunction = false**: 「この保育園では写真機能が無効になっています」
- **PhotoFunction = true, NoPhoto = true**: 「撮影禁止設定の園児が含まれています」

## 12. 今後の拡張可能性

- 写真機能の部分的制御（アップロードのみ無効、閲覧のみ無効など）
- 期間限定での写真機能無効化（一時的な制御）
- クラスレベルでの写真機能制御
- 写真機能の利用統計・レポート

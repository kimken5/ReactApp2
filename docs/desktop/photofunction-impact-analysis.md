# PhotoFunction機能影響範囲分析

## 概要

NurseriesテーブルにPhotoFunction（写真機能フラグ）が追加されました。このフィールドがFalseの場合、対象の保育園では写真関連機能を非表示または無効化する必要があります。

**仕様**:
- **フィールド名**: PhotoFunction (boolean)
- **目的**: 保育園ごとの写真機能利用可否を制御
- **デフォルト値**: True（写真機能有効）
- **設定方法**: 運営側でのみ変更可能（デスクトップアプリでは変更不可）
- **影響**: PhotoFunction = Falseの場合、写真関連のUI要素と機能を非表示/無効化

---

## 1. 保護者向けアプリケーション（Public Application）

### 1.1 入園申込フォーム

**ファイル**: [reactapp.client/src/pages/ApplicationFormPage.tsx](../../../reactapp.client/src/pages/ApplicationFormPage.tsx)

#### 影響箇所

**入力画面: Lines 786-816**
```tsx
{/* 写真共有に関する説明と撮影禁止チェックボックス */}
<div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
  <p className="text-sm text-gray-700 mb-2 flex items-start">
    <svg className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" ...>
      {/* カメラアイコン */}
    </svg>
    <span>
      <strong>写真共有について</strong>
    </span>
  </p>
  <p className="text-sm text-gray-600 mb-3 ml-7">
    当園では、保育園での日常の様子や行事の写真を専用アプリを通じて保護者の皆様と共有しています。
    アプリは保護者のみがアクセス可能で、お子様の成長記録を安全にご覧いただけます。
    クラスの集合写真なども含まれますので、ぜひご活用ください。
  </p>

  <label className="flex items-start cursor-pointer ml-7">
    <input
      type="checkbox"
      {...register(`children.${index}.childNoPhoto`)}
      className="mt-1 h-4 w-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
    />
    <span className="ml-2 text-sm text-gray-700">
      写真の撮影・共有を希望しない
      <span className="block text-xs text-gray-500 mt-1">
        （チェックを入れた場合、お子様が写った写真は共有されません）
      </span>
    </span>
  </label>
</div>
```

**確認画面: NoPhotoフィールドは表示されていない（内部データとしてのみ処理）**

#### 必要な対応

**PhotoFunction = Falseの場合**:
1. ✅ **写真共有説明セクション全体を非表示**（Lines 786-816）
2. ✅ **childNoPhotoチェックボックスを非表示**
3. ✅ **フォームスキーマからchildNoPhotoを削除** (Line 37)
4. ✅ **送信データからchildNoPhotoを除外** (Line 219)

#### 実装方針
- NurseryInfoDtoにPhotoFunctionフィールド追加
- 申込キー検証時にPhotoFunctionを取得
- 条件付きレンダリング: `{photoFunctionEnabled && <写真共有セクション>}`

---

## 2. デスクトップアプリ（Staff Desktop App）

### 2.1 ナビゲーションメニュー

**ファイル**: [reactapp.client/src/desktop/components/layout/DashboardLayout.tsx:97](../../../reactapp.client/src/desktop/components/layout/DashboardLayout.tsx#L97)

#### 影響箇所

**通常メニュー: Line 97**
```tsx
{ path: '/desktop/photos', label: '写真管理', icon: 'camera' },
```

#### 必要な対応

**PhotoFunction = Falseの場合**:
1. ✅ **「写真管理」メニュー項目を非表示**

#### 実装方針
- 認証時にPhotoFunctionをDesktopAuthContextに保存
- メニュー生成時にフィルタリング: `normalMenuItems.filter(item => item.path !== '/desktop/photos' || photoFunctionEnabled)`

---

### 2.2 写真アップロードページ

**ファイル**: [reactapp.client/src/desktop/pages/PhotoUploadPage.tsx](../../../reactapp.client/src/desktop/pages/PhotoUploadPage.tsx)

#### 必要な対応

**PhotoFunction = Falseの場合**:
1. ✅ **ページ全体へのアクセスを制限**
2. ✅ **アクセス時にエラーメッセージを表示**
   ```tsx
   if (!photoFunctionEnabled) {
     return (
       <DashboardLayout>
         <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-md">
           <p className="text-gray-700">写真機能は現在ご利用いただけません。</p>
         </div>
       </DashboardLayout>
     );
   }
   ```

---

### 2.3 写真一覧ページ

**ファイル**: [reactapp.client/src/desktop/pages/PhotosPage.tsx](../../../reactapp.client/src/desktop/pages/PhotosPage.tsx)

#### 必要な対応

**PhotoFunction = Falseの場合**:
1. ✅ **ページ全体へのアクセスを制限**（PhotoUploadPageと同様）
2. ✅ **エラーメッセージ表示**

---

### 2.4 写真詳細ページ・モーダル

**ファイル**:
- [reactapp.client/src/desktop/pages/PhotoDetailPage.tsx](../../../reactapp.client/src/desktop/pages/PhotoDetailPage.tsx)
- [reactapp.client/src/desktop/components/common/PhotoDetailModal.tsx](../../../reactapp.client/src/desktop/components/common/PhotoDetailModal.tsx)

#### 必要な対応

**PhotoFunction = Falseの場合**:
1. ✅ **ページ/モーダルへのアクセスを制限**
2. ✅ **エラーメッセージ表示**

---

### 2.5 日報（レポート）機能の写真アップロード

**ファイル**: [reactapp.client/src/desktop/components/DailyReportPhotoUpload.tsx](../../../reactapp.client/src/desktop/components/DailyReportPhotoUpload.tsx)

#### 影響箇所

**コンポーネント全体（写真アップロード機能）**

使用箇所:
- [reactapp.client/src/desktop/pages/DailyReportFormPage.tsx](../../../reactapp.client/src/desktop/pages/DailyReportFormPage.tsx)
- [reactapp.client/src/desktop/components/DailyReportEditModal.tsx](../../../reactapp.client/src/desktop/components/DailyReportEditModal.tsx)

#### 必要な対応

**PhotoFunction = Falseの場合**:
1. ✅ **DailyReportPhotoUploadコンポーネント全体を非表示**
2. ✅ **条件付きレンダリング**:
   ```tsx
   {photoFunctionEnabled && (
     <DailyReportPhotoUpload
       uploadedPhotos={uploadedPhotos}
       onPhotosChange={setUploadedPhotos}
     />
   )}
   ```

---

### 2.6 日報詳細・表示ページ

**ファイル**:
- [reactapp.client/src/desktop/pages/DailyReportDetailPage.tsx](../../../reactapp.client/src/desktop/pages/DailyReportDetailPage.tsx)
- [reactapp.client/src/desktop/components/DailyReportDetailModal.tsx](../../../reactapp.client/src/desktop/components/DailyReportDetailModal.tsx)

#### 必要な対応

**PhotoFunction = Falseの場合**:
1. ✅ **既存日報に添付された写真の表示を非表示**
2. ✅ **写真ギャラリーセクションを条件付きレンダリング**

**注意**: 過去にアップロードされた写真データは削除せず、単に表示しない

---

### 2.7 園児管理ページ

**ファイル**:
- [reactapp.client/src/desktop/pages/ChildrenPage.tsx](../../../reactapp.client/src/desktop/pages/ChildrenPage.tsx)
- [reactapp.client/src/desktop/components/children/ChildEditModal.tsx:41](../../../reactapp.client/src/desktop/components/children/ChildEditModal.tsx#L41)

#### 影響箇所

**ChildEditModal: Line 41**
```tsx
noPhoto: false, // 撮影禁止フラグ
```

#### 必要な対応

**PhotoFunction = Falseの場合**:
1. ⚠️ **NoPhotoフィールドの扱いを検討**
   - **オプション1**: NoPhotoフィールドを表示せず、編集不可
   - **オプション2**: NoPhotoフィールドを残し、将来的な写真機能有効化に備える（推奨）

#### 推奨実装
- NoPhotoフィールドは残すが、説明文を追加:
  ```tsx
  {!photoFunctionEnabled && (
    <p className="text-xs text-gray-500">
      ※現在、写真機能は利用できません
    </p>
  )}
  ```

---

### 2.8 入園申込管理・インポート

**ファイル**:
- [reactapp.client/src/desktop/components/application/ApplicationDetailModal.tsx](../../../reactapp.client/src/desktop/components/application/ApplicationDetailModal.tsx)
- [reactapp.client/src/desktop/components/application/ImportApplicationModal.tsx](../../../reactapp.client/src/desktop/components/application/ImportApplicationModal.tsx)

#### 影響箇所

申込データに含まれる`childNoPhoto`フィールドの表示

#### 必要な対応

**PhotoFunction = Falseの場合**:
1. ✅ **NoPhoto情報の表示を非表示**
2. ✅ **インポート時のNoPhotoフィールド処理を継続**（データ保持のため）

---

### 2.9 ダッシュボード

**ファイル**: [reactapp.client/src/desktop/pages/DashboardPage.tsx](../../../reactapp.client/src/desktop/pages/DashboardPage.tsx)

#### 影響箇所

現時点では写真関連の統計情報は表示されていない

#### 必要な対応

**PhotoFunction = Falseの場合**: 対応不要（写真統計がないため）

**将来的な拡張時の注意**:
- 写真統計（承認待ち写真数など）を追加する場合は、PhotoFunction条件付き表示が必要

---

## 3. バックエンド（ASP.NET Core Web API）

### 3.1 DTO（Data Transfer Objects）

#### 3.1.1 NurseryDto

**ファイル**:
- [ReactApp.Server/DTOs/Desktop/NurseryDto.cs](../../../ReactApp.Server/DTOs/Desktop/NurseryDto.cs)

#### 必要な対応

1. ✅ **PhotoFunctionプロパティを追加**
   ```csharp
   /// <summary>
   /// 写真機能の利用可否（True: 利用可, False: 利用不可）
   /// </summary>
   public bool PhotoFunction { get; set; } = true;
   ```

---

#### 3.1.2 NurseryInfoDto

**ファイル**: [ReactApp.Server/DTOs/Desktop/DesktopLoginResponseDto.cs:32](../../../ReactApp.Server/DTOs/Desktop/DesktopLoginResponseDto.cs#L32)

#### 必要な対応

1. ✅ **PhotoFunctionプロパティを追加**
   ```csharp
   /// <summary>
   /// 写真機能の利用可否
   /// </summary>
   public bool PhotoFunction { get; set; }
   ```

**理由**: ログイン時にフロントエンドが写真機能の利用可否を即座に判定できるようにする

---

#### 3.1.3 公開申込用DTO

**場所**: 申込キー検証APIのレスポンス

#### 必要な対応

1. ✅ **ValidateApplicationKeyResponseDtoにPhotoFunctionを追加**
   ```csharp
   public class ValidateApplicationKeyResponseDto
   {
       public bool IsValid { get; set; }
       public string? NurseryName { get; set; }
       public bool PhotoFunction { get; set; } // 新規追加
   }
   ```

**理由**: 保護者が申込フォームにアクセスした時点で写真機能の利用可否を取得

---

### 3.2 サービス層

#### 3.2.1 DesktopAuthenticationService

**必要な対応**:
1. ✅ **ログインレスポンスにPhotoFunctionを含める**
2. ✅ **Nurseriesテーブルからphoto_functionカラムを取得**

#### 3.2.2 PublicApplicationService

**必要な対応**:
1. ✅ **申込キー検証時にPhotoFunctionを取得**
2. ✅ **レスポンスに含めて返す**

---

### 3.3 データベースマイグレーション

**注意**: ユーザー側でNurseriesテーブルに`PhotoFunction`カラムを追加済み

#### 確認事項
- カラム名: `PhotoFunction` (boolean型)
- デフォルト値: True
- Null許容: NOT NULL

**マイグレーション不要**（ユーザー側で手動実施済み）

---

## 4. 実装優先順位

### Phase 1: バックエンド対応（高優先度）

1. ✅ **NurseryDtoにPhotoFunctionプロパティ追加**
2. ✅ **NurseryInfoDtoにPhotoFunctionプロパティ追加**
3. ✅ **ValidateApplicationKeyResponseDtoにPhotoFunction追加**
4. ✅ **DesktopAuthenticationServiceでPhotoFunctionを取得・返却**
5. ✅ **PublicApplicationServiceでPhotoFunctionを取得・返却**

**影響ファイル**:
- `ReactApp.Server/DTOs/Desktop/NurseryDto.cs`
- `ReactApp.Server/DTOs/Desktop/DesktopLoginResponseDto.cs`
- `ReactApp.Server/DTOs/PublicApplicationDto.cs`（新規または既存）
- `ReactApp.Server/Services/DesktopAuthenticationService.cs`
- `ReactApp.Server/Services/PublicApplicationService.cs`

---

### Phase 2: デスクトップアプリ対応（中優先度）

#### 2.1 認証コンテキスト
1. ✅ **DesktopAuthContextにphotoFunctionEnabledを追加**
2. ✅ **ログイン時にPhotoFunctionを保存**

**影響ファイル**:
- `reactapp.client/src/desktop/contexts/DesktopAuthContext.tsx`

#### 2.2 ナビゲーション
1. ✅ **DashboardLayoutで写真管理メニューを条件付き表示**

**影響ファイル**:
- `reactapp.client/src/desktop/components/layout/DashboardLayout.tsx`

#### 2.3 写真ページ
1. ✅ **PhotoUploadPageにアクセス制限追加**
2. ✅ **PhotosPageにアクセス制限追加**
3. ✅ **PhotoDetailPageにアクセス制限追加**

**影響ファイル**:
- `reactapp.client/src/desktop/pages/PhotoUploadPage.tsx`
- `reactapp.client/src/desktop/pages/PhotosPage.tsx`
- `reactapp.client/src/desktop/pages/PhotoDetailPage.tsx`

#### 2.4 日報機能
1. ✅ **DailyReportPhotoUploadコンポーネントを条件付きレンダリング**
2. ✅ **DailyReportFormPageで写真セクション非表示**
3. ✅ **DailyReportEditModalで写真セクション非表示**
4. ✅ **DailyReportDetailPageで写真表示を条件付き**

**影響ファイル**:
- `reactapp.client/src/desktop/pages/DailyReportFormPage.tsx`
- `reactapp.client/src/desktop/components/DailyReportEditModal.tsx`
- `reactapp.client/src/desktop/pages/DailyReportDetailPage.tsx`
- `reactapp.client/src/desktop/components/DailyReportDetailModal.tsx`

---

### Phase 3: 公開申込フォーム対応（中優先度）

1. ✅ **ApplicationFormPageで申込キー検証時にPhotoFunction取得**
2. ✅ **写真共有セクションを条件付きレンダリング**
3. ✅ **childNoPhotoフィールドを条件付きで含める**

**影響ファイル**:
- `reactapp.client/src/pages/ApplicationFormPage.tsx`
- `reactapp.client/src/types/publicApplication.ts`

---

### Phase 4: 園児管理・申込管理（低優先度）

#### 4.1 園児管理
1. ⚠️ **ChildEditModalでNoPhotoフィールドの説明文追加**

**影響ファイル**:
- `reactapp.client/src/desktop/components/children/ChildEditModal.tsx`

#### 4.2 申込管理
1. ✅ **ApplicationDetailModalでNoPhoto情報の表示を条件付き**
2. ✅ **ImportApplicationModalでNoPhoto情報の表示を条件付き**

**影響ファイル**:
- `reactapp.client/src/desktop/components/application/ApplicationDetailModal.tsx`
- `reactapp.client/src/desktop/components/application/ImportApplicationModal.tsx`

---

## 5. テスト項目

### 5.1 機能テスト

#### PhotoFunction = True（写真機能有効）の場合
- [ ] 全ての写真関連機能が正常に動作すること
- [ ] 申込フォームで写真共有セクションが表示されること
- [ ] デスクトップアプリで写真管理メニューが表示されること
- [ ] 日報に写真をアップロードできること

#### PhotoFunction = False（写真機能無効）の場合
- [ ] 申込フォームで写真共有セクションが非表示になること
- [ ] デスクトップアプリで写真管理メニューが非表示になること
- [ ] 写真アップロードページにアクセスできないこと
- [ ] 日報作成/編集時に写真アップロードセクションが非表示になること
- [ ] 既存日報の写真が非表示になること

### 5.2 データ整合性テスト

- [ ] PhotoFunction = Falseでも既存の写真データが削除されないこと
- [ ] PhotoFunction = Falseでも園児のNoPhotoフラグが保持されること
- [ ] PhotoFunctionをTrue→False→Trueと変更しても既存データが保持されること

### 5.3 API テスト

- [ ] ログインAPIレスポンスにPhotoFunctionが含まれること
- [ ] 申込キー検証APIレスポンスにPhotoFunctionが含まれること
- [ ] PhotoFunction = Falseの場合、写真関連APIが適切にエラーを返すこと（任意）

---

## 6. 既知の制約・注意事項

### 6.1 データ保持ポリシー

**重要**: PhotoFunction = Falseでも、既存の写真データやNoPhotoフラグは削除せず、非表示とするのみ

**理由**:
- 契約変更により再度写真機能を有効化する可能性がある
- データの完全性を保つため
- 将来的な監査対応のため

### 6.2 NoPhotoフィールドの扱い

**PhotoFunction = Falseの場合でも、NoPhotoフラグは引き続き保存される**

**理由**:
- 将来的に写真機能を有効化した際、過去の保護者の意向を尊重するため
- データモデルの一貫性を保つため

### 6.3 パフォーマンス

**PhotoFunctionチェックの負荷**:
- フロントエンドでの条件分岐のため、パフォーマンス影響はほぼなし
- APIレスポンスへの1フィールド追加のみ

---

## 7. まとめ

### 影響を受けるコンポーネント数

**フロントエンド**: 13ファイル
- 公開申込フォーム: 1ファイル
- デスクトップアプリ: 12ファイル

**バックエンド**: 5ファイル
- DTO: 3ファイル
- サービス: 2ファイル

**合計**: 18ファイル

### 推定工数

- **Phase 1 (バックエンド)**: 2-3時間
- **Phase 2 (デスクトップアプリ)**: 4-5時間
- **Phase 3 (公開申込フォーム)**: 2-3時間
- **Phase 4 (園児管理・申込管理)**: 1-2時間
- **テスト**: 3-4時間

**合計推定工数**: 12-17時間

---

## 8. 参考資料

- [NoPhoto機能要件](./nophoto-feature-requirements.md)
- [RequiresConsent削除作業ログ](../../claude_logs/2025-12-18.md)
- [園児テーブル拡張](./parents-table-enhancement.md)

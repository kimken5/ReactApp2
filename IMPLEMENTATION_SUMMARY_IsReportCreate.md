# IsReportCreate Feature Implementation Summary

**Date**: 2025-11-14
**Feature**: Separate report photos from photo management photos using `IsReportCreate` flag

## Overview

Implemented a feature to distinguish between photos uploaded during daily report creation and photos uploaded through the photo management screen. Photos uploaded during report creation are marked with `IsReportCreate=true` and are excluded from the photo management screen listing.

## Database Changes

### Photos Table
Added new column:
- **Column Name**: `IsReportCreate`
- **Type**: `bit` (boolean)
- **Default**: `CONVERT(bit, 0)` (false)
- **Nullable**: `NOT NULL`
- **Migration Script**: `add_is_report_create.sql`

**Note**: User has already manually applied this column to the database.

## Backend Changes

### 1. Photo.cs (Model)
**File**: `ReactApp.Server/Models/Photo.cs`

Added new property to the Photo entity:

```csharp
/// <summary>
/// レポート作成フラグ(必須)
/// デフォルト: false
/// 日報作成時にアップロードされた写真の場合はtrue
/// 写真管理画面からアップロードされた写真の場合はfalse
/// </summary>
[Required]
public bool IsReportCreate { get; set; } = false;
```

**Line**: 96-102

### 2. PhotoDto.cs (DTO)
**File**: `ReactApp.Server/DTOs/Desktop/PhotoDto.cs`

Added `IsReportCreate` property to `UploadPhotoRequestDto`:

```csharp
// レポート作成フラグ(デフォルト: false)
// 日報作成時にアップロードする場合はtrue、写真管理画面からアップロードする場合はfalse
public bool IsReportCreate { get; set; } = false;
```

**Lines**: 90-92

### 3. DesktopPhotoService.cs (Service Layer)
**File**: `ReactApp.Server/Services/DesktopPhotoService.cs`

#### Change 1: Filter Logic in GetPhotosAsync
**Lines**: 28-33

**Before**:
```csharp
var query = _context.Photos
    .Where(p => p.UploadedByStaffNurseryId == nurseryId && p.IsActive);
```

**After**:
```csharp
// 写真管理画面では、IsReportCreate=falseの写真のみを表示
// 日報専用写真(IsReportCreate=true)は除外
var query = _context.Photos
    .Where(p => p.UploadedByStaffNurseryId == nurseryId && p.IsActive && !p.IsReportCreate);
```

**Purpose**: Exclude report photos (`IsReportCreate=true`) from the photo management screen listing.

#### Change 2: Upload Logic in UploadPhotoAsync
**Line**: 157

**Before**:
```csharp
var photo = new Photo
{
    // ... other properties
    UploadedByAdminUser = true,
    IsActive = true
};
```

**After**:
```csharp
var photo = new Photo
{
    // ... other properties
    UploadedByAdminUser = true,
    IsReportCreate = request.IsReportCreate, // 日報作成フラグ
    IsActive = true
};
```

**Purpose**: Set the `IsReportCreate` flag from the DTO request when uploading photos.

## Frontend Changes

### DailyReportFormPage.tsx
**File**: `reactapp.client/src/desktop/pages/DailyReportFormPage.tsx`

**Line**: 271

Added `IsReportCreate` flag to FormData when uploading photos from daily report form:

```typescript
try {
  const formData = new FormData();
  formData.append('File', photo);  // Desktop用は'File'
  formData.append('StaffId', staffId.toString());  // 必須フィールド
  formData.append('Description', '日報写真');
  formData.append('PublishedAt', new Date().toISOString());
  formData.append('VisibilityLevel', 'class');
  formData.append('Status', 'published');
  formData.append('IsReportCreate', 'true');  // 日報作成フラグ: 写真管理画面には表示されない
```

**Purpose**: Mark photos uploaded from the daily report form as report photos (`IsReportCreate=true`).

## Behavior Summary

### Photo Upload from Daily Report
1. User uploads photo during daily report creation
2. Frontend sends `IsReportCreate=true` in the upload request
3. Backend saves photo with `IsReportCreate=true`
4. **Result**: Photo is saved but will NOT appear in photo management screen

### Photo Upload from Photo Management Screen
1. User uploads photo from photo management screen
2. Frontend sends `IsReportCreate=false` (default value)
3. Backend saves photo with `IsReportCreate=false`
4. **Result**: Photo appears in photo management screen listing

### Photo Management Screen Display
1. Backend filters photos with `!p.IsReportCreate` (only `IsReportCreate=false`)
2. **Result**: Only photos uploaded from photo management screen are displayed
3. **Result**: Report photos (`IsReportCreate=true`) are excluded from the listing

## Testing Checklist

- [ ] Verify `IsReportCreate` column exists in Photos table
- [ ] Test photo upload from daily report form → `IsReportCreate=true`
- [ ] Test photo upload from photo management screen → `IsReportCreate=false`
- [ ] Verify photo management screen shows only `IsReportCreate=false` photos
- [ ] Verify report photos are still visible within the report details view
- [ ] Check database records to confirm correct flag values

## Development Server Status

✅ **Frontend**: Running on `https://localhost:5176`
✅ **Backend**: Running on `https://localhost:7118` and `http://localhost:5131`
✅ **Code Changes**: Complete and deployed
⏳ **Database Migration**: User has already applied the column manually

## Files Modified

1. `ReactApp.Server/Models/Photo.cs`
2. `ReactApp.Server/DTOs/Desktop/PhotoDto.cs`
3. `ReactApp.Server/Services/DesktopPhotoService.cs`
4. `reactapp.client/src/desktop/pages/DailyReportFormPage.tsx`

## Files Created

1. `add_is_report_create.sql` - SQL migration script (for reference)
2. `IMPLEMENTATION_SUMMARY_IsReportCreate.md` - This document

## Notes

- The implementation follows the existing pattern of using boolean flags for photo categorization
- The filter is applied at the service layer (`DesktopPhotoService.GetPhotosAsync`)
- The flag is set during photo upload based on the upload context (report vs. photo management)
- No changes were needed to the photo management frontend component as filtering happens server-side
- Report photos remain accessible within their respective reports (different API endpoint)

## Next Steps

1. **Test the implementation** by uploading photos from both contexts
2. **Verify database values** to ensure `IsReportCreate` is being set correctly
3. **Confirm photo management screen** displays only non-report photos
4. **Consider adding** explicit API documentation for the `IsReportCreate` field

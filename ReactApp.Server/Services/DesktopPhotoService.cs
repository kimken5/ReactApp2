using Microsoft.EntityFrameworkCore;
using ReactApp.Server.Data;
using ReactApp.Server.DTOs.Desktop;
using ReactApp.Server.Models;

namespace ReactApp.Server.Services
{
    /// <summary>
    /// デスクトップアプリ用写真管理サービス実装クラス
    /// 写真のCRUD操作、フィルタ検索、園児・クラス別取得機能を提供
    /// </summary>
    public class DesktopPhotoService : IDesktopPhotoService
    {
        private readonly KindergartenDbContext _context;
        private readonly IPhotoStorageService _photoStorageService;
        private readonly ILogger<DesktopPhotoService> _logger;

        public DesktopPhotoService(
            KindergartenDbContext context,
            IPhotoStorageService photoStorageService,
            ILogger<DesktopPhotoService> logger)
        {
            _context = context;
            _photoStorageService = photoStorageService;
            _logger = logger;
        }

        public async Task<List<PhotoDto>> GetPhotosAsync(int nurseryId, PhotoFilterDto filter)
        {
            // 写真管理画面では、IsReportCreate=falseの写真のみを表示
            // 日報専用写真（IsReportCreate=true）は除外
            var query = _context.Photos
                .Where(p => p.UploadedByStaffNurseryId == nurseryId && p.IsActive && !p.IsReportCreate);

            // フィルタ適用
            if (filter.ChildId.HasValue)
            {
                query = query.Where(p => _context.PhotoChildren
                    .Any(pc => pc.PhotoId == p.Id && pc.NurseryId == nurseryId && pc.ChildId == filter.ChildId.Value && pc.IsActive));
            }

            if (!string.IsNullOrEmpty(filter.ClassId))
            {
                query = query.Where(p => p.TargetClassId == filter.ClassId);
            }

            if (filter.StaffId.HasValue)
            {
                query = query.Where(p => p.UploadedByStaffId == filter.StaffId.Value);
            }

            if (filter.StartDate.HasValue)
            {
                query = query.Where(p => p.PublishedAt >= filter.StartDate.Value);
            }

            if (filter.EndDate.HasValue)
            {
                // 終了日の23:59:59まで含める（翌日の00:00:00未満）
                var endDateInclusive = filter.EndDate.Value.AddDays(1);
                query = query.Where(p => p.PublishedAt < endDateInclusive);
            }

            if (!string.IsNullOrEmpty(filter.VisibilityLevel))
            {
                query = query.Where(p => p.VisibilityLevel == filter.VisibilityLevel);
            }

            if (!string.IsNullOrEmpty(filter.Status))
            {
                query = query.Where(p => p.Status == filter.Status);
            }

            if (filter.RequiresConsent.HasValue)
            {
                query = query.Where(p => p.RequiresConsent == filter.RequiresConsent.Value);
            }

            if (!string.IsNullOrEmpty(filter.SearchKeyword))
            {
                query = query.Where(p =>
                    (p.Description != null && p.Description.Contains(filter.SearchKeyword)) ||
                    (p.OriginalFileName != null && p.OriginalFileName.Contains(filter.SearchKeyword)));
            }

            var photos = await query
                .OrderByDescending(p => p.PublishedAt)
                .ToListAsync();

            // PhotoDtoに変換（手動マッピング）
            var photoDtos = new List<PhotoDto>();
            foreach (var photo in photos)
            {
                var photoDto = await MapToPhotoDtoAsync(nurseryId, photo);
                photoDtos.Add(photoDto);
            }

            return photoDtos;
        }

        public async Task<PhotoDto?> GetPhotoByIdAsync(int nurseryId, int photoId)
        {
            var photo = await _context.Photos
                .FirstOrDefaultAsync(p => p.Id == photoId && p.UploadedByStaffNurseryId == nurseryId && p.IsActive);

            if (photo == null)
            {
                return null;
            }

            return await MapToPhotoDtoAsync(nurseryId, photo);
        }

        public async Task<PhotoDto> UploadPhotoAsync(int nurseryId, UploadPhotoRequestDto request)
        {
            // スタッフ存在確認
            var staff = await _context.Staff
                .FirstOrDefaultAsync(s => s.NurseryId == nurseryId && s.StaffId == request.StaffId && s.IsActive);

            if (staff == null)
            {
                throw new InvalidOperationException($"スタッフが見つかりません: StaffId={request.StaffId}");
            }

            // ファイル名生成
            var fileName = $"{Guid.NewGuid()}{Path.GetExtension(request.File.FileName)}";

            // ファイルアップロード（IPhotoStorageServiceを使用）
            var photoUrl = await _photoStorageService.UploadPhotoAsync(request.File, fileName, true);

            // サムネイルパス（IPhotoStorageServiceが自動生成）
            var thumbnailPath = _photoStorageService.GetPhotoUrl(fileName, false);

            // 画像サイズ取得
            using var imageStream = request.File.OpenReadStream();
            var (width, height) = GetImageDimensions(imageStream);

            // Photoエンティティ作成
            var photo = new Photo
            {
                FileName = fileName,
                FilePath = photoUrl,
                ThumbnailPath = thumbnailPath,
                OriginalFileName = request.File.FileName,
                FileSize = request.File.Length,
                MimeType = request.File.ContentType,
                Width = width,
                Height = height,
                Description = request.Description,
                UploadedByStaffNurseryId = nurseryId,
                UploadedByStaffId = request.StaffId,
                UploadedAt = DateTime.UtcNow,
                PublishedAt = request.PublishedAt,
                VisibilityLevel = request.VisibilityLevel,
                TargetClassId = request.TargetClassId,
                Status = request.Status,
                RequiresConsent = request.RequiresConsent,
                UploadedByAdminUser = true, // デスクトップアプリからのアップロードはtrue
                IsReportCreate = request.IsReportCreate, // 日報作成フラグ
                IsActive = true
            };

            _context.Photos.Add(photo);
            await _context.SaveChangesAsync();

            // PhotoChild関連付け作成
            if (request.ChildIds.Any())
            {
                foreach (var childId in request.ChildIds)
                {
                    var photoChild = new PhotoChild
                    {
                        PhotoId = photo.Id,
                        NurseryId = nurseryId,
                        ChildId = childId,
                        IsPrimarySubject = request.PrimaryChildId.HasValue && request.PrimaryChildId.Value == childId,
                        AddedAt = DateTime.UtcNow,
                        IsActive = true
                    };

                    _context.PhotoChildren.Add(photoChild);
                }

                await _context.SaveChangesAsync();
            }

            return await MapToPhotoDtoAsync(nurseryId, photo);
        }

        public async Task<PhotoDto> UpdatePhotoAsync(int nurseryId, int photoId, UpdatePhotoRequestDto request)
        {
            var photo = await _context.Photos
                .FirstOrDefaultAsync(p => p.Id == photoId && p.UploadedByStaffNurseryId == nurseryId && p.IsActive);

            if (photo == null)
            {
                throw new InvalidOperationException($"写真が見つかりません: PhotoId={photoId}");
            }

            // メタデータ更新
            photo.Description = request.Description;
            photo.PublishedAt = request.PublishedAt;
            photo.VisibilityLevel = request.VisibilityLevel;
            photo.TargetClassId = request.TargetClassId;
            photo.Status = request.Status;
            photo.RequiresConsent = request.RequiresConsent;
            photo.UpdatedAt = DateTime.UtcNow;

            // ChildIds更新（指定がある場合）
            if (request.ChildIds != null)
            {
                // 既存のPhotoChild関連を削除
                var existingPhotoChildren = await _context.PhotoChildren
                    .Where(pc => pc.PhotoId == photoId && pc.NurseryId == nurseryId)
                    .ToListAsync();

                _context.PhotoChildren.RemoveRange(existingPhotoChildren);

                // 新しいPhotoChild関連を作成
                foreach (var childId in request.ChildIds)
                {
                    var photoChild = new PhotoChild
                    {
                        PhotoId = photoId,
                        NurseryId = nurseryId,
                        ChildId = childId,
                        IsPrimarySubject = request.PrimaryChildId.HasValue && request.PrimaryChildId.Value == childId,
                        AddedAt = DateTime.UtcNow,
                        IsActive = true
                    };

                    _context.PhotoChildren.Add(photoChild);
                }
            }

            await _context.SaveChangesAsync();

            return await MapToPhotoDtoAsync(nurseryId, photo);
        }

        public async Task DeletePhotoAsync(int nurseryId, int photoId)
        {
            var photo = await _context.Photos
                .FirstOrDefaultAsync(p => p.Id == photoId && p.UploadedByStaffNurseryId == nurseryId && p.IsActive);

            if (photo == null)
            {
                throw new InvalidOperationException($"写真が見つかりません: PhotoId={photoId}");
            }

            // ビジネスルール: 公開済み写真は削除不可
            if (photo.Status == "published")
            {
                throw new InvalidOperationException("公開済み写真は削除できません");
            }

            // 論理削除
            photo.IsActive = false;
            photo.DeletedAt = DateTime.UtcNow;
            photo.UpdatedAt = DateTime.UtcNow;

            // 関連PhotoChildも論理削除
            var photoChildren = await _context.PhotoChildren
                .Where(pc => pc.PhotoId == photoId && pc.NurseryId == nurseryId)
                .ToListAsync();

            foreach (var pc in photoChildren)
            {
                pc.IsActive = false;
            }

            await _context.SaveChangesAsync();
        }

        public async Task<List<PhotoDto>> GetPhotosByChildAsync(int nurseryId, int childId)
        {
            var photoIds = await _context.PhotoChildren
                .Where(pc => pc.NurseryId == nurseryId && pc.ChildId == childId && pc.IsActive)
                .Select(pc => pc.PhotoId)
                .ToListAsync();

            var photos = await _context.Photos
                .Where(p => photoIds.Contains(p.Id) && p.UploadedByStaffNurseryId == nurseryId && p.IsActive)
                .OrderByDescending(p => p.PublishedAt)
                .ToListAsync();

            var photoDtos = new List<PhotoDto>();
            foreach (var photo in photos)
            {
                var photoDto = await MapToPhotoDtoAsync(nurseryId, photo);
                photoDtos.Add(photoDto);
            }

            return photoDtos;
        }

        public async Task<List<PhotoDto>> GetPhotosByClassAsync(int nurseryId, string classId)
        {
            var photos = await _context.Photos
                .Where(p => p.UploadedByStaffNurseryId == nurseryId && p.TargetClassId == classId && p.IsActive)
                .OrderByDescending(p => p.PublishedAt)
                .ToListAsync();

            var photoDtos = new List<PhotoDto>();
            foreach (var photo in photos)
            {
                var photoDto = await MapToPhotoDtoAsync(nurseryId, photo);
                photoDtos.Add(photoDto);
            }

            return photoDtos;
        }

        // ===== プライベートヘルパーメソッド =====

        /// <summary>
        /// PhotoエンティティをPhotoDtoにマッピング（手動結合）
        /// </summary>
        private async Task<PhotoDto> MapToPhotoDtoAsync(int nurseryId, Photo photo)
        {
            // スタッフ情報取得（手動結合）
            var staff = await _context.Staff
                .FirstOrDefaultAsync(s => s.NurseryId == photo.UploadedByStaffNurseryId && s.StaffId == photo.UploadedByStaffId);

            // クラス情報取得（手動結合）
            string? targetClassName = null;
            if (!string.IsNullOrEmpty(photo.TargetClassId))
            {
                var targetClass = await _context.Classes
                    .FirstOrDefaultAsync(c => c.NurseryId == nurseryId && c.ClassId == photo.TargetClassId);
                targetClassName = targetClass?.Name;
            }

            // 関連園児情報取得（手動結合）
            var photoChildren = await _context.PhotoChildren
                .Where(pc => pc.PhotoId == photo.Id && pc.NurseryId == nurseryId && pc.IsActive)
                .ToListAsync();

            var childInfos = new List<PhotoChildInfoDto>();
            foreach (var pc in photoChildren)
            {
                var child = await _context.Children
                    .FirstOrDefaultAsync(c => c.NurseryId == pc.NurseryId && c.ChildId == pc.ChildId);

                if (child != null)
                {
                    string? className = null;
                    if (!string.IsNullOrEmpty(child.ClassId))
                    {
                        var childClass = await _context.Classes
                            .FirstOrDefaultAsync(c => c.NurseryId == child.NurseryId && c.ClassId == child.ClassId);
                        className = childClass?.Name;
                    }

                    childInfos.Add(new PhotoChildInfoDto
                    {
                        ChildId = child.ChildId,
                        ChildName = child.Name,
                        ClassName = className,
                        IsPrimarySubject = pc.IsPrimarySubject
                    });
                }
            }

            return new PhotoDto
            {
                Id = photo.Id,
                FileName = photo.FileName,
                FilePath = photo.FilePath,
                ThumbnailPath = photo.ThumbnailPath,
                OriginalFileName = photo.OriginalFileName,
                FileSize = photo.FileSize,
                MimeType = photo.MimeType,
                Width = photo.Width,
                Height = photo.Height,
                Description = photo.Description,
                UploadedByStaffId = photo.UploadedByStaffId,
                UploadedByStaffName = staff?.Name ?? "不明",
                UploadedAt = photo.UploadedAt,
                PublishedAt = photo.PublishedAt,
                VisibilityLevel = photo.VisibilityLevel,
                TargetClassId = photo.TargetClassId,
                TargetClassName = targetClassName,
                Status = photo.Status,
                RequiresConsent = photo.RequiresConsent,
                ViewCount = photo.ViewCount,
                DownloadCount = photo.DownloadCount,
                IsActive = photo.IsActive,
                UploadedByAdminUser = photo.UploadedByAdminUser,
                UpdatedAt = photo.UpdatedAt,
                Children = childInfos
            };
        }

        /// <summary>
        /// 画像ストリームから幅・高さを取得
        /// </summary>
        private (int width, int height) GetImageDimensions(Stream imageStream)
        {
            try
            {
                using var image = System.Drawing.Image.FromStream(imageStream);
                return (image.Width, image.Height);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "画像サイズ取得失敗、デフォルト値を使用");
                return (800, 600); // デフォルト値
            }
        }
    }
}

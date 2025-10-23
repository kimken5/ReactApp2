using AutoMapper;
using Microsoft.EntityFrameworkCore;
using ReactApp.Server.Data;
using ReactApp.Server.DTOs;
using ReactApp.Server.Models;
using ReactApp.Server.Exceptions;
using ReactApp.Server.Helpers;
using System.Drawing;
using System.Drawing.Imaging;

namespace ReactApp.Server.Services
{
    /// <summary>
    /// 写真管理サービス実装クラス
    /// 写真アップロード・ギャラリー表示・アクセス制御の業務ロジックを提供
    /// 保護者同意管理とセキュアな写真共有を実現
    /// </summary>
    public class PhotoService : IPhotoService
    {
        // 依存サービス
        private readonly KindergartenDbContext _context;       // データベースコンテキスト
        private readonly IMapper _mapper;                      // オブジェクトマッピングサービス
        private readonly ILogger<PhotoService> _logger;        // ログ出力サービス
        private readonly IPhotoStorageService _photoStorageService; // 写真ストレージサービス
        private readonly IConfiguration _configuration;        // アプリケーション設定
        private readonly TranslationHelper _translationHelper; // 翻訳ヘルパー

        // 写真ファイル制約設定
        private readonly string[] _allowedExtensions = { ".jpg", ".jpeg", ".png", ".gif", ".bmp" }; // 許可ファイル拡張子
        private readonly string[] _allowedMimeTypes = { "image/jpeg", "image/png", "image/gif", "image/bmp" }; // 許可メディアタイプ
        private const int MaxFileSizeBytes = 10 * 1024 * 1024; // 最大ファイルサイズ: 10MB
        private const int ThumbnailWidth = 300;                // サムネイル幅
        private const int ThumbnailHeight = 300;               // サムネイル高さ

        public PhotoService(
            KindergartenDbContext context,
            IMapper mapper,
            ILogger<PhotoService> logger,
            IPhotoStorageService photoStorageService,
            IConfiguration configuration,
            TranslationHelper translationHelper)
        {
            _context = context;
            _mapper = mapper;
            _logger = logger;
            _photoStorageService = photoStorageService;
            _configuration = configuration;
            _translationHelper = translationHelper;
        }

        public async Task<PhotoDto> UploadPhotoAsync(int nurseryId, int staffId, PhotoUploadDto dto)
        {
            if (!await ValidatePhotoFileAsync(dto.PhotoFile))
            {
                throw new BusinessException("無効なファイル形式です。");
            }

            var staff = await _context.Staff.FindAsync(nurseryId, staffId);
            if (staff == null)
            {
                throw new BusinessException("スタッフが見つかりません。");
            }

            // Validate child access
            foreach (var childId in dto.ChildIds)
            {
                var child = await _context.Children.FindAsync(nurseryId, childId);
                if (child == null)
                {
                    throw new BusinessException($"園児ID {childId} が見つかりません。");
                }
            }

            var fileName = await GenerateUniqueFileNameAsync(dto.PhotoFile.FileName);

            // Upload original file to Azure Blob Storage
            var photoUrl = await _photoStorageService.UploadPhotoAsync(dto.PhotoFile, fileName, true);

            // Get image dimensions from stream
            using var imageStream = dto.PhotoFile.OpenReadStream();
            var (width, height) = GetImageDimensions(imageStream);

            // Create photo record
            var photo = new Photo
            {
                FileName = fileName,
                FilePath = photoUrl,
                ThumbnailPath = _photoStorageService.GetPhotoUrl(fileName, false),
                OriginalFileName = dto.PhotoFile.FileName,
                FileSize = dto.PhotoFile.Length,
                MimeType = dto.PhotoFile.ContentType,
                Width = width,
                Height = height,
                Description = dto.Description,
                UploadedByStaffId = staffId,
                UploadedByStaffNurseryId = nurseryId,
                UploadedAt = DateTime.UtcNow,
                PublishedAt = dto.PublishedAt ?? DateTime.UtcNow,
                VisibilityLevel = dto.VisibilityLevel,
                TargetClassId = dto.TargetClassId,
                RequiresConsent = dto.RequiresConsent,
                Status = "published"
            };

            _context.Photos.Add(photo);
            await _context.SaveChangesAsync();

            // Add photo-child relationships
            foreach (var childId in dto.ChildIds)
            {
                var photoChild = new PhotoChild
                {
                    PhotoId = photo.Id,
                    ChildId = childId,
                    IsPrimarySubject = dto.ChildIds.Count == 1,
                    AddedByStaffId = staffId,
                    AddedAt = DateTime.UtcNow
                };

                _context.PhotoChildren.Add(photoChild);
            }

            await _context.SaveChangesAsync();

            // Generate thumbnail asynchronously
            _ = Task.Run(async () => await ProcessPhotoThumbnailAsync(photo.Id));

            // Request consent if required
            if (dto.RequiresConsent)
            {
                await RequestConsentsForPhotoAsync(photo.Id, dto.ChildIds);
            }

            var result = await GetPhotoWithDetailsAsync(photo.Id, staffId);
            _logger.LogInformation("Photo uploaded: {PhotoId} by staff {StaffId}", photo.Id, staffId);

            return result!;
        }

        public async Task<PhotoGalleryResponseDto> GetPhotosAsync(int parentId, PhotoSearchDto searchDto)
        {
            // 保護者の言語設定を取得
            var targetLanguage = await _translationHelper.GetParentLanguageAsync(parentId);

            _logger.LogInformation("GetPhotosAsync: ParentId={ParentId}, Language={Language}", parentId, targetLanguage);

            var query = _context.Photos
                .Include(p => p.PhotoChildren)
                .Where(p => p.Status == "published" && p.IsActive);

            // 保護者のアクセス可能な子供とクラス情報を取得
            var accessibleChildIds = await GetAccessibleChildrenForParentAsync(parentId);

            _logger.LogWarning($"GetPhotosAsync: ParentId={parentId}, AccessibleChildIds=[{string.Join(",", accessibleChildIds)}]");

            // 保護者の子供が所属するクラスIDを取得
            var parentClassIds = await _context.Children
                .Where(c => accessibleChildIds.Contains(c.ChildId))
                .Select(c => c.ClassId)
                .Distinct()
                .ToListAsync();

            _logger.LogWarning($"GetPhotosAsync: ParentClassIds=[{string.Join(",", parentClassIds)}]");

            // 保護者の子供が所属するクラスの学年情報を取得
            var parentClasses = await _context.Classes
                .Where(c => parentClassIds.Contains(c.ClassId))
                .Select(c => new { c.ClassId, c.AgeGroupMin, c.AgeGroupMax })
                .ToListAsync();

            // 同じ学年の全クラスIDを取得（年齢範囲が同じクラスを検索）
            var sameGradeClassIds = new List<string>();

            // 各クラスの年齢範囲に一致するクラスを検索
            foreach (var parentClass in parentClasses.Select(c => new { c.AgeGroupMin, c.AgeGroupMax }).Distinct())
            {
                var matchingClassIds = await _context.Classes
                    .Where(c => c.AgeGroupMin == parentClass.AgeGroupMin && c.AgeGroupMax == parentClass.AgeGroupMax)
                    .Select(c => c.ClassId)
                    .ToListAsync();

                sameGradeClassIds.AddRange(matchingClassIds);
            }

            // 重複を除去
            sameGradeClassIds = sameGradeClassIds.Distinct().ToList();

            _logger.LogWarning($"GetPhotosAsync: SameGradeClassIds=[{string.Join(",", sameGradeClassIds)}]");

            // VisibilityLevelに応じたフィルタリング
            query = query.Where(p =>
                p.VisibilityLevel == "all" || // 全体公開
                (p.VisibilityLevel == "individual" && p.PhotoChildren.Any(pc => accessibleChildIds.Contains(pc.ChildId))) || // 個別指定
                (p.VisibilityLevel == "class" && parentClassIds.Contains(p.TargetClassId)) || // クラス限定
                (p.VisibilityLevel == "grade" && sameGradeClassIds.Contains(p.TargetClassId)) // 学年限定
            );

            // Apply filters
            if (searchDto.ChildId.HasValue)
            {
                query = query.Where(p => p.PhotoChildren.Any(pc => pc.ChildId == searchDto.ChildId.Value));
            }

            if (searchDto.FromDate.HasValue)
            {
                query = query.Where(p => p.PublishedAt >= searchDto.FromDate.Value);
            }

            if (searchDto.ToDate.HasValue)
            {
                query = query.Where(p => p.PublishedAt <= searchDto.ToDate.Value);
            }

            if (!string.IsNullOrEmpty(searchDto.VisibilityLevel))
            {
                query = query.Where(p => p.VisibilityLevel == searchDto.VisibilityLevel);
            }

            if (!string.IsNullOrEmpty(searchDto.TargetClassId))
            {
                query = query.Where(p => p.TargetClassId == searchDto.TargetClassId);
            }

            // Apply sorting
            query = searchDto.SortBy?.ToLower() switch
            {
                "filename" => searchDto.SortOrder == "desc" ? query.OrderByDescending(p => p.FileName) : query.OrderBy(p => p.FileName),
                "uploadedAt" => searchDto.SortOrder == "desc" ? query.OrderByDescending(p => p.UploadedAt) : query.OrderBy(p => p.UploadedAt),
                _ => searchDto.SortOrder == "desc" ? query.OrderByDescending(p => p.PublishedAt) : query.OrderBy(p => p.PublishedAt)
            };

            var totalCount = await query.CountAsync();
            var totalPages = (int)Math.Ceiling((double)totalCount / searchDto.PageSize);

            var photos = await query
                .Skip((searchDto.PageNumber - 1) * searchDto.PageSize)
                .Take(searchDto.PageSize)
                .ToListAsync();

            var photoDtos = new List<PhotoDto>();

            // スタッフIDからスタッフ名をまとめて取得
            var staffIds = photos.Select(p => p.UploadedByStaffId).Distinct().ToList();
            var staffDict = await _context.Staff
                .Where(s => s.NurseryId == 1 && staffIds.Contains(s.StaffId))
                .Select(s => new { s.StaffId, s.Name })
                .ToDictionaryAsync(s => s.StaffId, s => s.Name);

            foreach (var photo in photos)
            {
                var photoDto = _mapper.Map<PhotoDto>(photo);
                photoDto.UploadedByStaffName = staffDict.ContainsKey(photo.UploadedByStaffId)
                    ? staffDict[photo.UploadedByStaffId]
                    : "不明";
                photoDto.CanView = await CanParentViewPhotoAsync(parentId, photo.Id);
                photoDto.CanDownload = await CanParentDownloadPhotoAsync(parentId, photo.Id);
                photoDto.HasConsent = await HasPhotoConsentAsync(photo.Id, parentId);

                // 写真の説明を翻訳
                await _translationHelper.TranslatePropertyAsync(photoDto, "Description", targetLanguage);

                photoDtos.Add(photoDto);
            }

            return new PhotoGalleryResponseDto
            {
                Photos = photoDtos,
                TotalCount = totalCount,
                PageNumber = searchDto.PageNumber,
                PageSize = searchDto.PageSize,
                TotalPages = totalPages,
                HasNextPage = searchDto.PageNumber < totalPages,
                HasPreviousPage = searchDto.PageNumber > 1
            };
        }

        public async Task<PhotoDto?> GetPhotoByIdAsync(int photoId, int parentId)
        {
            if (!await CanParentViewPhotoAsync(parentId, photoId))
            {
                return null;
            }

            var photo = await GetPhotoWithDetailsAsync(photoId, parentId);
            if (photo != null)
            {
                // Log access
                await LogPhotoAccessAsync(photoId, parentId, "view", null, null);

                // Increment view count
                var photoEntity = await _context.Photos.FindAsync(photoId);
                if (photoEntity != null)
                {
                    photoEntity.ViewCount++;
                    await _context.SaveChangesAsync();
                }
            }

            return photo;
        }

        public async Task<bool> UpdatePhotoAsync(int photoId, int nurseryId, int staffId, UpdatePhotoDto dto)
        {
            var photo = await _context.Photos.FindAsync(photoId);
            if (photo == null || !photo.IsActive)
            {
                return false;
            }

            // Check staff permission
            if (photo.UploadedByStaffId != staffId)
            {
                var staff = await _context.Staff.FindAsync(nurseryId, staffId);
                if (staff?.Role != "admin" && staff?.Role != "principal")
                {
                    throw new UnauthorizedException("この写真を編集する権限がありません。");
                }
            }

            if (dto.Description != null)
                photo.Description = dto.Description;
            if (dto.VisibilityLevel != null)
                photo.VisibilityLevel = dto.VisibilityLevel;
            if (dto.TargetClassId != null)
                photo.TargetClassId = dto.TargetClassId;
            if (dto.PublishedAt.HasValue)
                photo.PublishedAt = dto.PublishedAt.Value;
            if (dto.RequiresConsent.HasValue)
                photo.RequiresConsent = dto.RequiresConsent.Value;
            if (dto.Status != null)
                photo.Status = dto.Status;

            photo.UpdatedAt = DateTime.UtcNow;

            // Update child associations if provided
            if (dto.ChildIds != null)
            {
                var existingChildren = await _context.PhotoChildren
                    .Where(pc => pc.PhotoId == photoId)
                    .ToListAsync();

                _context.PhotoChildren.RemoveRange(existingChildren);

                foreach (var childId in dto.ChildIds)
                {
                    var photoChild = new PhotoChild
                    {
                        PhotoId = photoId,
                        ChildId = childId,
                        IsPrimarySubject = dto.ChildIds.Count == 1,
                        AddedByStaffId = staffId,
                        AddedAt = DateTime.UtcNow
                    };

                    _context.PhotoChildren.Add(photoChild);
                }
            }

            await _context.SaveChangesAsync();

            _logger.LogInformation("Photo updated: {PhotoId} by staff {StaffId}", photoId, staffId);
            return true;
        }

        public async Task<bool> DeletePhotoAsync(int photoId, int nurseryId, int staffId)
        {
            var photo = await _context.Photos.FindAsync(photoId);
            if (photo == null)
            {
                return false;
            }

            // Check staff permission
            if (photo.UploadedByStaffId != staffId)
            {
                var staff = await _context.Staff.FindAsync(nurseryId, staffId);
                if (staff?.Role != "admin" && staff?.Role != "principal")
                {
                    throw new UnauthorizedException("この写真を削除する権限がありません。");
                }
            }

            photo.IsActive = false;
            photo.DeletedAt = DateTime.UtcNow;
            photo.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Delete physical files
            _ = Task.Run(async () => await DeletePhotoFilesAsync(photoId));

            _logger.LogInformation("Photo deleted: {PhotoId} by staff {StaffId}", photoId, staffId);
            return true;
        }

        public async Task<bool> ArchivePhotoAsync(int photoId, int nurseryId, int staffId)
        {
            var photo = await _context.Photos.FindAsync(photoId);
            if (photo == null || !photo.IsActive)
            {
                return false;
            }

            photo.Status = "archived";
            photo.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Photo archived: {PhotoId} by staff {StaffId}", photoId, staffId);
            return true;
        }

        public async Task<bool> CanParentViewPhotoAsync(int parentId, int photoId)
        {
            _logger.LogWarning($"CanParentViewPhotoAsync: Checking access for ParentId={parentId}, PhotoId={photoId}");

            var photo = await _context.Photos
                .Include(p => p.PhotoChildren)
                .FirstOrDefaultAsync(p => p.Id == photoId && p.IsActive && p.Status == "published");

            if (photo == null)
            {
                _logger.LogWarning($"CanParentViewPhotoAsync: Photo not found or not published. PhotoId={photoId}");

                // デバッグ用: 写真が存在するか確認
                var photoExists = await _context.Photos.FirstOrDefaultAsync(p => p.Id == photoId);
                if (photoExists != null)
                {
                    _logger.LogWarning($"CanParentViewPhotoAsync: Photo exists but Status='{photoExists.Status}', IsActive={photoExists.IsActive}");
                }

                return false;
            }

            _logger.LogWarning($"CanParentViewPhotoAsync: Photo found. PhotoChildren count={photo.PhotoChildren.Count}, VisibilityLevel={photo.VisibilityLevel}");

            // 全体公開の場合は全員閲覧可能
            if (photo.VisibilityLevel == "all")
            {
                _logger.LogWarning($"CanParentViewPhotoAsync: Photo is 'all' visibility, access granted");
                return true;
            }

            var accessibleChildIds = await GetAccessibleChildrenForParentAsync(parentId);
            _logger.LogWarning($"CanParentViewPhotoAsync: Accessible children for ParentId={parentId}: [{string.Join(",", accessibleChildIds)}]");

            // クラス限定・学年限定の場合は保護者のクラス情報で判定
            if (photo.VisibilityLevel == "class" || photo.VisibilityLevel == "grade")
            {
                var parentClassIds = await _context.Children
                    .Where(c => accessibleChildIds.Contains(c.ChildId))
                    .Select(c => c.ClassId)
                    .Distinct()
                    .ToListAsync();

                _logger.LogWarning($"CanParentViewPhotoAsync: ParentClassIds=[{string.Join(",", parentClassIds)}], TargetClassId={photo.TargetClassId}");

                if (photo.VisibilityLevel == "class")
                {
                    // クラス限定: 保護者の子供のクラスに写真のTargetClassIdが含まれるか
                    if (parentClassIds.Contains(photo.TargetClassId))
                    {
                        _logger.LogWarning($"CanParentViewPhotoAsync: Parent is in target class, access granted");
                        return true;
                    }
                }
                else // grade
                {
                    // 学年限定: 保護者の子供が同じ学年に所属しているか
                    var parentClasses = await _context.Classes
                        .Where(c => parentClassIds.Contains(c.ClassId))
                        .Select(c => new { c.ClassId, c.AgeGroupMin, c.AgeGroupMax })
                        .ToListAsync();

                    var targetClass = await _context.Classes
                        .Where(c => c.ClassId == photo.TargetClassId)
                        .Select(c => new { c.AgeGroupMin, c.AgeGroupMax })
                        .FirstOrDefaultAsync();

                    if (targetClass != null && parentClasses.Any(pc => pc.AgeGroupMin == targetClass.AgeGroupMin && pc.AgeGroupMax == targetClass.AgeGroupMax))
                    {
                        _logger.LogWarning($"CanParentViewPhotoAsync: Parent is in same grade, access granted");
                        return true;
                    }
                }

                _logger.LogWarning($"CanParentViewPhotoAsync: Parent not in target class/grade");
                return false;
            }

            // 個別指定の場合は子供がタグ付けされているか確認
            var hasAccessToAnyChild = photo.PhotoChildren.Any(pc => accessibleChildIds.Contains(pc.ChildId));
            _logger.LogWarning($"CanParentViewPhotoAsync: hasAccessToAnyChild={hasAccessToAnyChild}");

            if (!hasAccessToAnyChild)
            {
                _logger.LogWarning($"CanParentViewPhotoAsync: Parent has no access to any child in photo");
                return false;
            }

            // Check consent if required
            // TODO: 写真同意機能は現在無効化されています（RequiresConsentのチェックをスキップ）
            // if (photo.RequiresConsent)
            // {
            //     _logger.LogWarning($"CanParentViewPhotoAsync: Photo requires consent, checking...");
            //     var hasConsent = await HasPhotoConsentAsync(photoId, parentId);
            //     _logger.LogWarning($"CanParentViewPhotoAsync: hasConsent={hasConsent}");
            //     return hasConsent;
            // }

            _logger.LogWarning($"CanParentViewPhotoAsync: Access granted for ParentId={parentId}, PhotoId={photoId}");
            return true;
        }

        public async Task<bool> CanParentDownloadPhotoAsync(int parentId, int photoId)
        {
            return await CanParentViewPhotoAsync(parentId, photoId);
        }

        public async Task<Stream?> GetPhotoStreamAsync(int photoId, int parentId)
        {
            if (!await CanParentViewPhotoAsync(parentId, photoId))
            {
                return null;
            }

            var photo = await _context.Photos.FindAsync(photoId);
            if (photo == null)
            {
                return null;
            }

            // Get photo stream from Azure Blob Storage
            var stream = await _photoStorageService.GetPhotoStreamAsync(photo.FileName, true);
            if (stream == null)
            {
                return null;
            }

            // Log download access
            await LogPhotoAccessAsync(photoId, parentId, "download", null, null);

            // Increment download count
            photo.DownloadCount++;
            await _context.SaveChangesAsync();

            return stream;
        }

        public async Task<Stream?> GetThumbnailStreamAsync(int photoId, int parentId)
        {
            if (!await CanParentViewPhotoAsync(parentId, photoId))
            {
                return null;
            }

            var photo = await _context.Photos.FindAsync(photoId);
            if (photo == null)
            {
                return null;
            }

            // Try to get thumbnail from Azure Blob Storage
            var thumbnailStream = await _photoStorageService.GetPhotoStreamAsync(photo.FileName, false);
            if (thumbnailStream == null)
            {
                // Generate thumbnail if it doesn't exist
                await ProcessPhotoThumbnailAsync(photoId);
                thumbnailStream = await _photoStorageService.GetPhotoStreamAsync(photo.FileName, false);
            }

            return thumbnailStream;
        }

        public async Task<bool> LogPhotoAccessAsync(int photoId, int parentId, string accessType, string? ipAddress, string? userAgent)
        {
            var accessLog = new PhotoAccess
            {
                PhotoId = photoId,
                ParentId = parentId,
                AccessType = accessType,
                AccessedAt = DateTime.UtcNow,
                IpAddress = ipAddress,
                UserAgent = userAgent,
                IsSuccessful = true
            };

            _context.PhotoAccesses.Add(accessLog);
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<IEnumerable<PhotoConsentDto>> GetPhotoConsentsAsync(int parentId)
        {
            var consents = await _context.PhotoConsents
                .Include(pc => pc.Photo)
                .Include(pc => pc.Child)
                .Include(pc => pc.Parent)
                .Where(pc => pc.ParentId == parentId && pc.IsActive)
                .OrderByDescending(pc => pc.RequestedAt)
                .ToListAsync();

            return _mapper.Map<IEnumerable<PhotoConsentDto>>(consents);
        }

        public async Task<IEnumerable<PhotoConsentDto>> GetPendingConsentsForPhotoAsync(int photoId)
        {
            var consents = await _context.PhotoConsents
                .Include(pc => pc.Photo)
                .Include(pc => pc.Child)
                .Include(pc => pc.Parent)
                .Where(pc => pc.PhotoId == photoId && pc.ConsentStatus == "pending" && pc.IsActive)
                .OrderBy(pc => pc.RequestedAt)
                .ToListAsync();

            return _mapper.Map<IEnumerable<PhotoConsentDto>>(consents);
        }

        public async Task<bool> UpdatePhotoConsentAsync(int consentId, int parentId, UpdatePhotoConsentDto dto)
        {
            var consent = await _context.PhotoConsents
                .FirstOrDefaultAsync(pc => pc.Id == consentId && pc.ParentId == parentId);

            if (consent == null || consent.ConsentStatus != "pending")
            {
                return false;
            }

            consent.ConsentStatus = dto.ConsentStatus;
            consent.Notes = dto.Notes;
            consent.RespondedAt = DateTime.UtcNow;
            consent.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Photo consent updated: {ConsentId} by parent {ParentId} - Status: {Status}",
                consentId, parentId, dto.ConsentStatus);

            return true;
        }

        public async Task<bool> RequestPhotoConsentAsync(int photoId, int childId, int parentId)
        {
            var existingConsent = await _context.PhotoConsents
                .FirstOrDefaultAsync(pc => pc.PhotoId == photoId && pc.ChildId == childId && pc.ParentId == parentId);

            if (existingConsent != null)
            {
                return false; // Consent already exists
            }

            var consent = new PhotoConsent
            {
                PhotoId = photoId,
                ChildId = childId,
                ParentId = parentId,
                ConsentStatus = "pending",
                RequestedAt = DateTime.UtcNow,
                IsActive = true
            };

            _context.PhotoConsents.Add(consent);
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<PhotoStatsDto> GetPhotoStatsAsync(int? staffId = null)
        {
            var query = _context.Photos.Where(p => p.IsActive);

            if (staffId.HasValue)
            {
                query = query.Where(p => p.UploadedByStaffId == staffId.Value);
            }

            var stats = new PhotoStatsDto
            {
                TotalPhotos = await query.CountAsync(),
                PublishedPhotos = await query.CountAsync(p => p.Status == "published"),
                DraftPhotos = await query.CountAsync(p => p.Status == "draft"),
                ArchivedPhotos = await query.CountAsync(p => p.Status == "archived"),
                TotalViews = await query.SumAsync(p => p.ViewCount),
                TotalDownloads = await query.SumAsync(p => p.DownloadCount),
                TotalStorageUsed = await query.SumAsync(p => p.FileSize),
                PendingConsents = await _context.PhotoConsents.CountAsync(pc => pc.ConsentStatus == "pending" && pc.IsActive)
            };

            var recentPhotos = await query
                .Include(p => p.PhotoChildren)
                .OrderByDescending(p => p.UploadedAt)
                .Take(5)
                .ToListAsync();

            // スタッフ名を取得
            var recentStaffIds = recentPhotos.Select(p => p.UploadedByStaffId).Distinct().ToList();
            var recentStaffDict = await _context.Staff
                .Where(s => s.NurseryId == 1 && recentStaffIds.Contains(s.StaffId))
                .Select(s => new { s.StaffId, s.Name })
                .ToDictionaryAsync(s => s.StaffId, s => s.Name);

            stats.RecentPhotos = _mapper.Map<List<PhotoDto>>(recentPhotos);
            foreach (var photoDto in stats.RecentPhotos)
            {
                var photo = recentPhotos.First(p => p.Id == photoDto.Id);
                photoDto.UploadedByStaffName = recentStaffDict.ContainsKey(photo.UploadedByStaffId)
                    ? recentStaffDict[photo.UploadedByStaffId]
                    : "不明";
            }

            return stats;
        }

        public async Task<IEnumerable<PhotoAccessDto>> GetPhotoAccessLogsAsync(int photoId)
        {
            var accessLogs = await _context.PhotoAccesses
                .Include(pa => pa.Photo)
                .Include(pa => pa.Parent)
                .Where(pa => pa.PhotoId == photoId)
                .OrderByDescending(pa => pa.AccessedAt)
                .Take(100)
                .ToListAsync();

            return _mapper.Map<IEnumerable<PhotoAccessDto>>(accessLogs);
        }

        public async Task<bool> ProcessPhotoThumbnailAsync(int photoId)
        {
            try
            {
                var photo = await _context.Photos.FindAsync(photoId);
                if (photo == null)
                {
                    return false;
                }

                // Get original photo stream from Azure Blob Storage
                using var originalStream = await _photoStorageService.GetPhotoStreamAsync(photo.FileName, true);
                if (originalStream == null)
                {
                    return false;
                }

                // Generate thumbnail
                using var image = Image.FromStream(originalStream);
                using var thumbnail = ResizeImage(image, ThumbnailWidth, ThumbnailHeight);

                // Convert thumbnail to byte array
                using var thumbnailStream = new MemoryStream();
                thumbnail.Save(thumbnailStream, ImageFormat.Jpeg);
                var thumbnailData = thumbnailStream.ToArray();

                // Upload thumbnail to Azure Blob Storage
                await _photoStorageService.UploadPhotoAsync(thumbnailData, photo.FileName, "image/jpeg", false);

                _logger.LogInformation("Thumbnail generated and uploaded for photo {PhotoId}", photoId);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to generate thumbnail for photo {PhotoId}", photoId);
                return false;
            }
        }

        public async Task<bool> ValidatePhotoFileAsync(IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return false;
            }

            if (file.Length > MaxFileSizeBytes)
            {
                return false;
            }

            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!_allowedExtensions.Contains(extension))
            {
                return false;
            }

            if (!_allowedMimeTypes.Contains(file.ContentType))
            {
                return false;
            }

            return await Task.FromResult(true);
        }

        public async Task<string> GenerateUniqueFileNameAsync(string originalFileName)
        {
            var extension = Path.GetExtension(originalFileName);
            var uniqueName = $"{Guid.NewGuid():N}{extension}";

            var existingPhoto = await _context.Photos.FirstOrDefaultAsync(p => p.FileName == uniqueName);
            while (existingPhoto != null)
            {
                uniqueName = $"{Guid.NewGuid():N}{extension}";
                existingPhoto = await _context.Photos.FirstOrDefaultAsync(p => p.FileName == uniqueName);
            }

            return uniqueName;
        }

        public async Task<bool> DeletePhotoFilesAsync(int photoId)
        {
            try
            {
                var photo = await _context.Photos.FindAsync(photoId);
                if (photo == null)
                {
                    return false;
                }

                // Delete original photo from Azure Blob Storage
                var originalDeleted = await _photoStorageService.DeletePhotoAsync(photo.FileName, true);

                // Delete thumbnail from Azure Blob Storage
                var thumbnailDeleted = await _photoStorageService.DeletePhotoAsync(photo.FileName, false);

                _logger.LogInformation("Photo files deleted for photo {PhotoId} - Original: {OriginalDeleted}, Thumbnail: {ThumbnailDeleted}",
                    photoId, originalDeleted, thumbnailDeleted);

                return originalDeleted; // Return true if at least original was deleted
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to delete photo files for photo {PhotoId}", photoId);
                return false;
            }
        }

        private async Task<PhotoDto?> GetPhotoWithDetailsAsync(int photoId, int requesterId)
        {
            var photo = await _context.Photos
                .Include(p => p.PhotoChildren)
                .FirstOrDefaultAsync(p => p.Id == photoId && p.IsActive);

            if (photo == null)
            {
                return null;
            }

            // スタッフ名を取得
            var staff = await _context.Staff
                .Where(s => s.NurseryId == 1 && s.StaffId == photo.UploadedByStaffId)
                .Select(s => s.Name)
                .FirstOrDefaultAsync();

            var photoDto = _mapper.Map<PhotoDto>(photo);
            photoDto.UploadedByStaffName = staff ?? "不明";
            photoDto.CanView = await CanParentViewPhotoAsync(requesterId, photoId);
            photoDto.CanDownload = await CanParentDownloadPhotoAsync(requesterId, photoId);
            photoDto.HasConsent = await HasPhotoConsentAsync(photoId, requesterId);

            // Azure Blob Storage URLを設定
            var blobBaseUrl = _configuration["AzureBlobStorage:BaseUrl"];
            var containerName = _configuration["AzureBlobStorage:ContainerName"];
            if (!string.IsNullOrEmpty(blobBaseUrl) && !string.IsNullOrEmpty(containerName))
            {
                photoDto.FileUrl = $"{blobBaseUrl}/{containerName}/{photo.FileName}";
                if (!string.IsNullOrEmpty(photo.ThumbnailPath))
                {
                    photoDto.ThumbnailUrl = $"{blobBaseUrl}/{containerName}/{Path.GetFileName(photo.ThumbnailPath)}";
                }
            }

            // 園児情報を手動で設定（PhotoChild.Childナビゲーションプロパティが無視されているため）
            var childKeys = photo.PhotoChildren.Select(pc => new { pc.NurseryId, pc.ChildId }).ToList();
            if (childKeys.Any())
            {
                var children = await _context.Children
                    .Where(c => childKeys.Select(ck => ck.NurseryId).Contains(c.NurseryId) &&
                                childKeys.Select(ck => ck.ChildId).Contains(c.ChildId))
                    .Select(c => new { c.NurseryId, c.ChildId, c.Name })
                    .ToListAsync();

                var childDictionary = children.ToDictionary(c => new { c.NurseryId, c.ChildId }, c => c.Name);

                photoDto.Children = photo.PhotoChildren.Select(pc => new PhotoChildDto
                {
                    ChildId = pc.ChildId,
                    ChildName = childDictionary.TryGetValue(new { pc.NurseryId, pc.ChildId }, out var name) ? name : "不明",
                    IsPrimarySubject = pc.IsPrimarySubject,
                    AddedAt = pc.AddedAt
                }).ToList();
            }

            return photoDto;
        }

        private async Task<IEnumerable<int>> GetAccessibleChildrenForParentAsync(int parentId)
        {
            return await _context.ParentChildRelationships
                .Where(pcr => pcr.ParentId == parentId && pcr.IsActive)
                .Select(pcr => pcr.ChildId)
                .ToListAsync();
        }

        private async Task<bool> HasPhotoConsentAsync(int photoId, int parentId)
        {
            var accessibleChildIds = await GetAccessibleChildrenForParentAsync(parentId);

            var requiredConsents = await _context.PhotoChildren
                .Where(pc => pc.PhotoId == photoId && accessibleChildIds.Contains(pc.ChildId))
                .Select(pc => pc.ChildId)
                .ToListAsync();

            if (!requiredConsents.Any())
            {
                return false;
            }

            var grantedConsents = await _context.PhotoConsents
                .Where(pc => pc.PhotoId == photoId && pc.ParentId == parentId &&
                           pc.ConsentStatus == "granted" && pc.IsActive &&
                           requiredConsents.Contains(pc.ChildId))
                .CountAsync();

            return grantedConsents == requiredConsents.Count;
        }

        private async Task RequestConsentsForPhotoAsync(int photoId, IEnumerable<int> childIds)
        {
            foreach (var childId in childIds)
            {
                var parents = await _context.ParentChildRelationships
                    .Where(pcr => pcr.ChildId == childId && pcr.IsActive)
                    .Select(pcr => pcr.ParentId)
                    .ToListAsync();

                foreach (var parentId in parents)
                {
                    await RequestPhotoConsentAsync(photoId, childId, parentId);
                }
            }
        }

        private static (int width, int height) GetImageDimensions(Stream imageStream)
        {
            using var image = Image.FromStream(imageStream);
            return (image.Width, image.Height);
        }

        private static Image ResizeImage(Image image, int maxWidth, int maxHeight)
        {
            var ratioX = (double)maxWidth / image.Width;
            var ratioY = (double)maxHeight / image.Height;
            var ratio = Math.Min(ratioX, ratioY);

            var width = (int)(image.Width * ratio);
            var height = (int)(image.Height * ratio);

            var destRect = new Rectangle(0, 0, width, height);
            var destImage = new Bitmap(width, height);

            destImage.SetResolution(image.HorizontalResolution, image.VerticalResolution);

            using var graphics = Graphics.FromImage(destImage);
            graphics.CompositingMode = System.Drawing.Drawing2D.CompositingMode.SourceCopy;
            graphics.CompositingQuality = System.Drawing.Drawing2D.CompositingQuality.HighQuality;
            graphics.InterpolationMode = System.Drawing.Drawing2D.InterpolationMode.HighQualityBicubic;
            graphics.SmoothingMode = System.Drawing.Drawing2D.SmoothingMode.HighQuality;
            graphics.PixelOffsetMode = System.Drawing.Drawing2D.PixelOffsetMode.HighQuality;

            using var wrapMode = new System.Drawing.Imaging.ImageAttributes();
            wrapMode.SetWrapMode(System.Drawing.Drawing2D.WrapMode.TileFlipXY);
            graphics.DrawImage(image, destRect, 0, 0, image.Width, image.Height, GraphicsUnit.Pixel, wrapMode);

            return destImage;
        }
    }
}
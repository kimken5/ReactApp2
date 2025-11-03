using Microsoft.EntityFrameworkCore;
using ReactApp.Server.Data;
using ReactApp.Server.DTOs;
using ReactApp.Server.Models;
using System.Text.Json;

namespace ReactApp.Server.Services
{
    /// <summary>
    /// デスクトップアプリ用お知らせ管理サービス実装
    /// </summary>
    public class DesktopAnnouncementService : IDesktopAnnouncementService
    {
        private readonly KindergartenDbContext _context;
        private readonly ILogger<DesktopAnnouncementService> _logger;

        public DesktopAnnouncementService(
            KindergartenDbContext context,
            ILogger<DesktopAnnouncementService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<List<AnnouncementDto>> GetAnnouncementsAsync(int nurseryId, AnnouncementFilterDto? filter = null)
        {
            try
            {
                var query = _context.Announcements
                    .Where(a => a.NurseryId == nurseryId);

                if (filter != null)
                {
                    if (!string.IsNullOrWhiteSpace(filter.Category))
                    {
                        query = query.Where(a => a.Category == filter.Category);
                    }

                    if (!string.IsNullOrWhiteSpace(filter.TargetAudience))
                    {
                        query = query.Where(a => a.TargetScope == filter.TargetAudience);
                    }

                    if (!string.IsNullOrWhiteSpace(filter.Status))
                    {
                        query = query.Where(a => a.Status == filter.Status);
                    }

                    if (!string.IsNullOrWhiteSpace(filter.StartDate) && DateTime.TryParse(filter.StartDate, out var startDate))
                    {
                        query = query.Where(a => a.CreatedAt >= startDate);
                    }

                    if (!string.IsNullOrWhiteSpace(filter.EndDate) && DateTime.TryParse(filter.EndDate, out var endDate))
                    {
                        query = query.Where(a => a.CreatedAt <= endDate);
                    }

                    if (!string.IsNullOrWhiteSpace(filter.SearchKeyword))
                    {
                        var keyword = filter.SearchKeyword.ToLower();
                        query = query.Where(a => a.Title.ToLower().Contains(keyword) || a.Content.ToLower().Contains(keyword));
                    }
                }

                var announcements = await query
                    .OrderByDescending(a => a.CreatedAt)
                    .ToListAsync();

                var staffIds = announcements.Select(a => a.StaffId).Distinct().ToList();
                var staffNames = await _context.Staff
                    .Where(s => staffIds.Contains(s.StaffId))
                    .ToDictionaryAsync(s => s.StaffId, s => s.Name);

                var announcementDtos = new List<AnnouncementDto>();

                foreach (var announcement in announcements)
                {
                    var readCount = await _context.NotificationLogs
                        .CountAsync(nl => nl.RelatedEntityType == "Announcement" && nl.RelatedEntityId == announcement.Id && nl.ReadAt != null);

                    // コメント数は現在未実装のため0固定
                    var commentCount = 0;

                    announcementDtos.Add(MapToDto(announcement, staffNames.GetValueOrDefault(announcement.StaffId, "不明"), readCount, commentCount));
                }

                return announcementDtos;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "お知らせ一覧の取得に失敗しました。NurseryId: {NurseryId}", nurseryId);
                throw;
            }
        }

        public async Task<AnnouncementDto?> GetAnnouncementByIdAsync(int nurseryId, int announcementId)
        {
            try
            {
                var announcement = await _context.Announcements
                    .Where(a => a.NurseryId == nurseryId && a.Id == announcementId)
                    .FirstOrDefaultAsync();

                if (announcement == null)
                {
                    return null;
                }

                var staff = await _context.Staff.FindAsync(announcement.StaffId);
                var staffName = staff?.Name ?? "不明";

                var readCount = await _context.NotificationLogs
                    .CountAsync(nl => nl.RelatedEntityType == "Announcement" && nl.RelatedEntityId == announcementId && nl.ReadAt != null);
                var commentCount = 0; // コメント機能は未実装

                return MapToDto(announcement, staffName, readCount, commentCount);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "お知らせ詳細の取得に失敗しました。AnnouncementId: {AnnouncementId}", announcementId);
                throw;
            }
        }

        public async Task<AnnouncementDto> CreateAnnouncementAsync(int nurseryId, int staffId, CreateAnnouncementDto request)
        {
            try
            {
                var announcement = new Announcement
                {
                    NurseryId = nurseryId,
                    StaffId = staffId,
                    Title = request.Title,
                    Content = request.Content,
                    Category = request.Category,
                    TargetScope = request.TargetScope,
                    TargetClassId = request.TargetClassIds.FirstOrDefault(),
                    TargetChildId = request.TargetChildIds.FirstOrDefault() != null ? int.Parse(request.TargetChildIds.First()) : (int?)null,
                    Attachments = request.Attachments.Any() ? JsonSerializer.Serialize(request.Attachments) : null,
                    Status = request.Status,
                    AllowComments = request.AllowComments,
                    ScheduledAt = request.ScheduledAt,
                    PublishedAt = request.Status == "published" ? DateTime.UtcNow : (DateTime?)null,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Announcements.Add(announcement);
                await _context.SaveChangesAsync();

                _logger.LogInformation("お知らせを作成しました。AnnouncementId: {AnnouncementId}", announcement.Id);

                var staff = await _context.Staff.FindAsync(staffId);
                return MapToDto(announcement, staff?.Name ?? "不明", 0, 0);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "お知らせの作成に失敗しました。");
                throw;
            }
        }

        public async Task<AnnouncementDto> UpdateAnnouncementAsync(int nurseryId, int announcementId, UpdateAnnouncementDto request)
        {
            try
            {
                var announcement = await _context.Announcements
                    .Where(a => a.NurseryId == nurseryId && a.Id == announcementId)
                    .FirstOrDefaultAsync();

                if (announcement == null)
                {
                    throw new KeyNotFoundException($"お知らせが見つかりません。ID: {announcementId}");
                }

                announcement.Title = request.Title;
                announcement.Content = request.Content;
                announcement.Category = request.Category;
                announcement.TargetScope = request.TargetScope;
                announcement.TargetClassId = request.TargetClassIds.FirstOrDefault();
                announcement.TargetChildId = request.TargetChildIds.FirstOrDefault() != null ? int.Parse(request.TargetChildIds.First()) : (int?)null;
                announcement.Attachments = request.Attachments.Any() ? JsonSerializer.Serialize(request.Attachments) : null;
                announcement.Status = request.Status;
                announcement.AllowComments = request.AllowComments;
                announcement.ScheduledAt = request.ScheduledAt;
                announcement.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                _logger.LogInformation("お知らせを更新しました。AnnouncementId: {AnnouncementId}", announcementId);

                var staff = await _context.Staff.FindAsync(announcement.StaffId);
                var readCount = await _context.NotificationLogs
                    .CountAsync(nl => nl.RelatedEntityType == "Announcement" && nl.RelatedEntityId == announcementId && nl.ReadAt != null);
                var commentCount = 0; // コメント機能は未実装

                return MapToDto(announcement, staff?.Name ?? "不明", readCount, commentCount);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "お知らせの更新に失敗しました。AnnouncementId: {AnnouncementId}", announcementId);
                throw;
            }
        }

        public async Task DeleteAnnouncementAsync(int nurseryId, int announcementId)
        {
            try
            {
                var announcement = await _context.Announcements
                    .Where(a => a.NurseryId == nurseryId && a.Id == announcementId)
                    .FirstOrDefaultAsync();

                if (announcement == null)
                {
                    throw new KeyNotFoundException($"お知らせが見つかりません。ID: {announcementId}");
                }

                _context.Announcements.Remove(announcement);
                await _context.SaveChangesAsync();

                _logger.LogInformation("お知らせを削除しました。AnnouncementId: {AnnouncementId}", announcementId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "お知らせの削除に失敗しました。AnnouncementId: {AnnouncementId}", announcementId);
                throw;
            }
        }

        public async Task<AnnouncementDto> PublishAnnouncementAsync(int nurseryId, int announcementId)
        {
            try
            {
                var announcement = await _context.Announcements
                    .Where(a => a.NurseryId == nurseryId && a.Id == announcementId)
                    .FirstOrDefaultAsync();

                if (announcement == null)
                {
                    throw new KeyNotFoundException($"お知らせが見つかりません。ID: {announcementId}");
                }

                announcement.Status = "published";
                announcement.PublishedAt = DateTime.UtcNow;
                announcement.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                _logger.LogInformation("お知らせを公開しました。AnnouncementId: {AnnouncementId}", announcementId);

                var staff = await _context.Staff.FindAsync(announcement.StaffId);
                var readCount = await _context.NotificationLogs
                    .CountAsync(nl => nl.RelatedEntityType == "Announcement" && nl.RelatedEntityId == announcementId && nl.ReadAt != null);
                var commentCount = 0; // コメント機能は未実装

                return MapToDto(announcement, staff?.Name ?? "不明", readCount, commentCount);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "お知らせの公開に失敗しました。AnnouncementId: {AnnouncementId}", announcementId);
                throw;
            }
        }

        public async Task<List<UnreadParentDto>> GetUnreadParentsAsync(int nurseryId, int announcementId)
        {
            try
            {
                var announcement = await _context.Announcements
                    .Where(a => a.NurseryId == nurseryId && a.Id == announcementId)
                    .FirstOrDefaultAsync();

                if (announcement == null)
                {
                    throw new KeyNotFoundException($"お知らせが見つかりません。ID: {announcementId}");
                }

                // Get target parents based on target scope
                var targetParentIds = new List<int>();

                if (announcement.TargetScope == "all")
                {
                    // 全保護者を取得（NurseryIdフィルタは子供経由で行う）
                    var allChildrenIds = await _context.Children
                        .Where(c => c.NurseryId == nurseryId)
                        .Select(c => c.ChildId)
                        .ToListAsync();
                    
                    targetParentIds = await _context.ParentChildRelationships
                        .Where(pcr => allChildrenIds.Contains(pcr.ChildId))
                        .Select(pcr => pcr.ParentId)
                        .Distinct()
                        .ToListAsync();
                }
                else if (announcement.TargetScope == "class" && !string.IsNullOrEmpty(announcement.TargetClassId))
                {
                    var childrenInTargetClass = await _context.Children
                        .Where(c => c.ClassId == announcement.TargetClassId)
                        .Select(c => c.ChildId)
                        .ToListAsync();

                    targetParentIds = await _context.ParentChildRelationships
                        .Where(pcr => childrenInTargetClass.Contains(pcr.ChildId))
                        .Select(pcr => pcr.ParentId)
                        .Distinct()
                        .ToListAsync();
                }
                else if (announcement.TargetScope == "individual" && announcement.TargetChildId.HasValue)
                {
                    targetParentIds = await _context.ParentChildRelationships
                        .Where(pcr => pcr.ChildId == announcement.TargetChildId.Value)
                        .Select(pcr => pcr.ParentId)
                        .Distinct()
                        .ToListAsync();
                }

                // Get parents who have read the announcement
                var readParentIds = await _context.NotificationLogs
                    .Where(nl => nl.RelatedEntityType == "Announcement" && nl.RelatedEntityId == announcementId && nl.ReadAt != null)
                    .Select(nl => int.Parse(nl.ParentId.ToString()))
                    .Distinct()
                    .ToListAsync();

                // Unread parents = target parents - read parents
                var unreadParentIds = targetParentIds.Except(readParentIds).ToList();

                var unreadParents = await _context.Parents
                    .Where(p => unreadParentIds.Contains(p.Id))
                    .ToListAsync();

                var unreadParentDtos = new List<UnreadParentDto>();

                foreach (var parent in unreadParents)
                {
                    var child = await _context.ParentChildRelationships
                        .Where(pcr => pcr.ParentId == parent.Id)
                        .Join(_context.Children, pcr => pcr.ChildId, c => c.ChildId, (pcr, c) => c)
                        .FirstOrDefaultAsync();

                    var className = child != null ? (await _context.Classes.FindAsync(child.ClassId))?.Name ?? "不明" : "不明";

                    unreadParentDtos.Add(new UnreadParentDto
                    {
                        ParentId = parent.Id,
                        ParentName = parent.Name,
                        PhoneNumber = parent.PhoneNumber,
                        ChildName = child?.Name ?? "不明",
                        ClassName = className
                    });
                }

                return unreadParentDtos;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "未読保護者リストの取得に失敗しました。AnnouncementId: {AnnouncementId}", announcementId);
                throw;
            }
        }

        public async Task<List<ReadParentDto>> GetReadParentsAsync(int nurseryId, int announcementId)
        {
            try
            {
                var readLogs = await _context.NotificationLogs
                    .Where(nl => nl.RelatedEntityType == "Announcement" && nl.RelatedEntityId == announcementId && nl.ReadAt != null)
                    .ToListAsync();

                var readParentIds = readLogs.Select(rl => int.Parse(rl.ParentId.ToString())).Distinct().ToList();

                var readParents = await _context.Parents
                    .Where(p => readParentIds.Contains(p.Id))
                    .ToListAsync();

                var readParentDtos = new List<ReadParentDto>();

                foreach (var parent in readParents)
                {
                    var readLog = readLogs.First(rl => int.Parse(rl.ParentId.ToString()) == parent.Id);
                    var child = await _context.ParentChildRelationships
                        .Where(pcr => pcr.ParentId == parent.Id)
                        .Join(_context.Children, pcr => pcr.ChildId, c => c.ChildId, (pcr, c) => c)
                        .FirstOrDefaultAsync();

                    var className = child != null ? (await _context.Classes.FindAsync(child.ClassId))?.Name ?? "不明" : "不明";

                    readParentDtos.Add(new ReadParentDto
                    {
                        ParentId = parent.Id,
                        ParentName = parent.Name,
                        PhoneNumber = parent.PhoneNumber,
                        ChildName = child?.Name ?? "不明",
                        ClassName = className,
                        ReadAt = readLog.ReadAt ?? DateTime.UtcNow
                    });
                }

                return readParentDtos;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "既読保護者リストの取得に失敗しました。AnnouncementId: {AnnouncementId}", announcementId);
                throw;
            }
        }

        private AnnouncementDto MapToDto(Announcement announcement, string staffName, int readCount, int commentCount)
        {
            var targetClassIds = new List<string>();
            var targetChildIds = new List<string>();
            var attachments = new List<AttachmentDto>();

            // 実テーブルは単一値なので、配列に変換
            if (!string.IsNullOrEmpty(announcement.TargetClassId))
            {
                targetClassIds.Add(announcement.TargetClassId);
            }

            if (announcement.TargetChildId.HasValue)
            {
                targetChildIds.Add(announcement.TargetChildId.Value.ToString());
            }

            if (!string.IsNullOrEmpty(announcement.Attachments))
            {
                attachments = JsonSerializer.Deserialize<List<AttachmentDto>>(announcement.Attachments) ?? new List<AttachmentDto>();
            }

            return new AnnouncementDto
            {
                Id = announcement.Id,
                NurseryId = announcement.NurseryId,
                StaffId = announcement.StaffId,
                StaffName = staffName,
                Title = announcement.Title,
                Content = announcement.Content,
                ContentPreview = announcement.Content.Length > 100 ? announcement.Content.Substring(0, 100) + "..." : announcement.Content,
                Category = announcement.Category,
                TargetScope = announcement.TargetScope,
                TargetClassIds = targetClassIds,
                TargetChildIds = targetChildIds,
                Attachments = attachments,
                Status = announcement.Status,
                Priority = "", // 実テーブルにはPriorityカラムが無いので空文字列
                AllowComments = announcement.AllowComments,
                PublishedAt = announcement.PublishedAt,
                ScheduledAt = announcement.ScheduledAt,
                CreatedAt = announcement.CreatedAt,
                UpdatedAt = announcement.UpdatedAt,
                ReadCount = readCount,
                CommentCount = commentCount
            };
        }
    }
}

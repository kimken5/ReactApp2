using Microsoft.EntityFrameworkCore;
using ReactApp.Server.Data;
using ReactApp.Server.DTOs;
using ReactApp.Server.DTOs.Desktop;

namespace ReactApp.Server.Services
{
    /// <summary>
    /// デスクトップダッシュボード用統計サービス実装
    /// </summary>
    public class DesktopDashboardService : IDesktopDashboardService
    {
        private readonly KindergartenDbContext _context;
        private readonly ILogger<DesktopDashboardService> _logger;

        public DesktopDashboardService(
            KindergartenDbContext context,
            ILogger<DesktopDashboardService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<List<ClassContactStatisticsDto>> GetClassContactStatisticsAsync(int nurseryId, DateTime date)
        {
            try
            {
                var classes = await _context.Classes
                    .Where(c => c.NurseryId == nurseryId && c.IsActive)
                    .OrderBy(c => c.ClassId)
                    .ToListAsync();

                var statistics = new List<ClassContactStatisticsDto>();

                foreach (var cls in classes)
                {
                    // Get children in this class (複合主キーを考慮)
                    var childrenIds = await _context.Children
                        .Where(c => c.NurseryId == nurseryId && c.ClassId == cls.ClassId)
                        .Select(c => c.ChildId)
                        .ToListAsync();

                    // Count notifications for today
                    var absenceCount = 0;
                    var lateCount = 0;
                    var pickupCount = 0;

                    if (childrenIds.Any())
                    {
                        absenceCount = await _context.AbsenceNotifications
                            .CountAsync(an => childrenIds.Contains(an.ChildId) &&
                                             an.Ymd.Date == date.Date &&
                                             an.NotificationType == "absence");

                        lateCount = await _context.AbsenceNotifications
                            .CountAsync(an => childrenIds.Contains(an.ChildId) &&
                                             an.Ymd.Date == date.Date &&
                                             an.NotificationType == "lateness");

                        pickupCount = await _context.AbsenceNotifications
                            .CountAsync(an => childrenIds.Contains(an.ChildId) &&
                                             an.Ymd.Date == date.Date &&
                                             an.NotificationType == "pickup");
                    }

                    statistics.Add(new ClassContactStatisticsDto
                    {
                        ClassId = cls.ClassId,
                        ClassName = cls.Name,
                        AbsenceCount = absenceCount,
                        LateCount = lateCount,
                        PickupCount = pickupCount
                    });
                }

                return statistics;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "クラス別連絡通知統計の取得に失敗しました");
                throw;
            }
        }

        public async Task<List<RecentDailyReportDto>> GetRecentDailyReportsAsync(int nurseryId, int limit = 5)
        {
            try
            {
                var reports = await _context.DailyReports
                    .Where(dr => dr.NurseryId == nurseryId)
                    .OrderByDescending(dr => dr.CreatedAt)
                    .Take(limit)
                    .ToListAsync();

                var recentReports = new List<RecentDailyReportDto>();

                foreach (var report in reports)
                {
                    // ChildテーブルはNurseryIdとChildIdの複合キーを持つため、両方を指定する必要がある
                    var child = await _context.Children
                        .FirstOrDefaultAsync(c => c.NurseryId == nurseryId && c.ChildId == report.ChildId);

                    var className = "不明";
                    if (child != null)
                    {
                        var classEntity = await _context.Classes
                            .FirstOrDefaultAsync(c => c.NurseryId == child.NurseryId && c.ClassId == child.ClassId);
                        className = classEntity?.Name ?? "不明";
                    }

                    var statusDisplay = report.Status switch
                    {
                        "draft" => "下書き",
                        "published" => "公開済み",
                        _ => "不明"
                    };

                    var timeSpan = DateTime.UtcNow - report.CreatedAt;
                    var timeAgo = timeSpan.TotalMinutes < 60
                        ? $"{(int)timeSpan.TotalMinutes}分前"
                        : timeSpan.TotalHours < 24
                            ? $"{(int)timeSpan.TotalHours}時間前"
                            : $"{(int)timeSpan.TotalDays}日前";

                    recentReports.Add(new RecentDailyReportDto
                    {
                        ReportId = report.Id,
                        ClassName = className,
                        ChildName = child?.Name ?? "不明",
                        Status = report.Status,
                        StatusDisplay = statusDisplay,
                        CreatedAt = report.CreatedAt,
                        TimeAgo = timeAgo
                    });
                }

                return recentReports;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "最近の日報一覧の取得に失敗しました");
                throw;
            }
        }

        public async Task<List<TodayEventDto>> GetTodayEventsAsync(int nurseryId)
        {
            try
            {
                var today = DateTime.UtcNow.Date;
                var events = await _context.Events
                    .Where(e => e.NurseryId == nurseryId &&
                                e.StartDateTime.Date == today)
                    .OrderBy(e => e.StartDateTime)
                    .ToListAsync();

                var todayEvents = new List<TodayEventDto>();

                foreach (var evt in events)
                {
                    var timeRange = evt.IsAllDay
                        ? "終日"
                        : $"{evt.StartDateTime:HH:mm} - {evt.EndDateTime:HH:mm}";

                    var eventTypeDisplay = evt.Category switch
                    {
                        "general_announcement" => "全体",
                        "general_event" => "イベント",
                        "nursery_holiday" => "休園",
                        "class_activity" => "クラス",
                        "grade_activity" => "学年",
                        _ => "その他"
                    };

                    todayEvents.Add(new TodayEventDto
                    {
                        EventId = evt.Id,
                        Title = evt.Title,
                        TimeRange = timeRange,
                        EventType = evt.Category,
                        EventTypeDisplay = eventTypeDisplay
                    });
                }

                return todayEvents;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "今日のイベント一覧の取得に失敗しました");
                throw;
            }
        }

        public async Task<DashboardSummaryDto> GetDashboardSummaryAsync(int nurseryId)
        {
            try
            {
                var totalChildren = await _context.Children
                    .CountAsync(c => c.NurseryId == nurseryId && c.IsActive);

                var totalStaff = await _context.Staff
                    .CountAsync(s => s.NurseryId == nurseryId && s.IsActive);

                var totalClasses = await _context.Classes
                    .CountAsync(c => c.NurseryId == nurseryId && c.IsActive);

                var today = DateTime.UtcNow.Date;
                var todayAbsenceCount = await _context.AbsenceNotifications
                    .CountAsync(an => an.NurseryId == nurseryId &&
                                     an.Ymd.Date == today &&
                                     an.NotificationType == "absence");

                var unacknowledgedNotificationCount = await _context.AbsenceNotifications
                    .CountAsync(an => an.NurseryId == nurseryId &&
                                     an.Status == "submitted");

                var draftReportCount = await _context.DailyReports
                    .CountAsync(dr => dr.NurseryId == nurseryId &&
                                     dr.Status == "draft");

                return new DashboardSummaryDto
                {
                    TotalChildren = totalChildren,
                    TotalStaff = totalStaff,
                    TotalClasses = totalClasses,
                    TodayAbsenceCount = todayAbsenceCount,
                    UnacknowledgedNotificationCount = unacknowledgedNotificationCount,
                    DraftReportCount = draftReportCount
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "ダッシュボードサマリーの取得に失敗しました");
                throw;
            }
        }
    }
}

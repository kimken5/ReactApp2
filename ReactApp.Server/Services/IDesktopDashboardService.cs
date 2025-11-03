using ReactApp.Server.DTOs;
using ReactApp.Server.DTOs.Desktop;

namespace ReactApp.Server.Services
{
    /// <summary>
    /// デスクトップダッシュボード用統計サービスインターフェース
    /// </summary>
    public interface IDesktopDashboardService
    {
        /// <summary>
        /// クラス別連絡通知統計を取得
        /// </summary>
        /// <param name="nurseryId">保育園ID</param>
        /// <param name="date">対象日付</param>
        /// <returns>クラス別連絡通知統計一覧</returns>
        Task<List<ClassContactStatisticsDto>> GetClassContactStatisticsAsync(int nurseryId, DateTime date);

        /// <summary>
        /// 最近の日報一覧を取得
        /// </summary>
        /// <param name="nurseryId">保育園ID</param>
        /// <param name="limit">取得件数</param>
        /// <returns>最近の日報一覧</returns>
        Task<List<RecentDailyReportDto>> GetRecentDailyReportsAsync(int nurseryId, int limit = 5);

        /// <summary>
        /// 今日のカレンダーイベント一覧を取得
        /// </summary>
        /// <param name="nurseryId">保育園ID</param>
        /// <returns>今日のイベント一覧</returns>
        Task<List<TodayEventDto>> GetTodayEventsAsync(int nurseryId);

        /// <summary>
        /// ダッシュボードサマリー統計を取得
        /// </summary>
        /// <param name="nurseryId">保育園ID</param>
        /// <returns>ダッシュボードサマリー</returns>
        Task<DashboardSummaryDto> GetDashboardSummaryAsync(int nurseryId);
    }

    /// <summary>
    /// クラス別連絡通知統計DTO
    /// </summary>
    public class ClassContactStatisticsDto
    {
        public string ClassId { get; set; } = string.Empty;
        public string ClassName { get; set; } = string.Empty;
        public int AbsenceCount { get; set; }
        public int LateCount { get; set; }
        public int PickupCount { get; set; }
    }

    /// <summary>
    /// 最近の日報DTO
    /// </summary>
    public class RecentDailyReportDto
    {
        public int ReportId { get; set; }
        public string ClassName { get; set; } = string.Empty;
        public string ChildName { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string StatusDisplay { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public string TimeAgo { get; set; } = string.Empty;
    }

    /// <summary>
    /// 今日のイベントDTO
    /// </summary>
    public class TodayEventDto
    {
        public int EventId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string TimeRange { get; set; } = string.Empty;
        public string EventType { get; set; } = string.Empty;
        public string EventTypeDisplay { get; set; } = string.Empty;
    }

    /// <summary>
    /// ダッシュボードサマリーDTO
    /// </summary>
    public class DashboardSummaryDto
    {
        public int TotalChildren { get; set; }
        public int TotalStaff { get; set; }
        public int TotalClasses { get; set; }
        public int TodayAbsenceCount { get; set; }
        public int UnacknowledgedNotificationCount { get; set; }
        public int DraftReportCount { get; set; }
    }
}

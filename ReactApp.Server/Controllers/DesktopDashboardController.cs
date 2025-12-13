using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ReactApp.Server.DTOs;
using ReactApp.Server.DTOs.Desktop;
using ReactApp.Server.Services;
using ReactApp.Server.Helpers;

namespace ReactApp.Server.Controllers
{
    /// <summary>
    /// デスクトップダッシュボード用統計コントローラー
    /// </summary>
    [Authorize]
    [ApiController]
    [Route("api/desktop/dashboard")]
    public class DesktopDashboardController : ControllerBase
    {
        private readonly IDesktopDashboardService _dashboardService;
        private readonly ILogger<DesktopDashboardController> _logger;

        public DesktopDashboardController(
            IDesktopDashboardService dashboardService,
            ILogger<DesktopDashboardController> logger)
        {
            _dashboardService = dashboardService;
            _logger = logger;
        }

        private int GetNurseryId()
        {
            var nurseryIdClaim = User.FindFirst("NurseryId")?.Value;
            if (string.IsNullOrEmpty(nurseryIdClaim) || !int.TryParse(nurseryIdClaim, out var nurseryId))
            {
                throw new UnauthorizedAccessException("保育園IDが取得できません");
            }
            return nurseryId;
        }

        /// <summary>
        /// クラス別連絡通知統計を取得
        /// GET /api/desktop/dashboard/class-contact-statistics
        /// </summary>
        [HttpGet("class-contact-statistics")]
        public async Task<ActionResult<ApiResponse<List<ClassContactStatisticsDto>>>> GetClassContactStatistics([FromQuery] DateTime? date)
        {
            try
            {
                var nurseryId = GetNurseryId();
                var targetDate = date ?? DateTimeHelper.GetJstNow();
                var statistics = await _dashboardService.GetClassContactStatisticsAsync(nurseryId, targetDate);

                return Ok(new ApiResponse<List<ClassContactStatisticsDto>>
                {
                    Success = true,
                    Data = statistics
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "クラス別連絡通知統計の取得中にエラーが発生しました");
                return StatusCode(500, new ApiResponse<List<ClassContactStatisticsDto>>
                {
                    Success = false,
                    Error = new ApiError { Code = "SERVER_ERROR", Message = "サーバーエラーが発生しました" }
                });
            }
        }

        /// <summary>
        /// 最近の日報一覧を取得
        /// GET /api/desktop/dashboard/recent-reports
        /// </summary>
        [HttpGet("recent-reports")]
        public async Task<ActionResult<ApiResponse<List<RecentDailyReportDto>>>> GetRecentDailyReports([FromQuery] int limit = 5)
        {
            try
            {
                var nurseryId = GetNurseryId();
                var reports = await _dashboardService.GetRecentDailyReportsAsync(nurseryId, limit);

                return Ok(new ApiResponse<List<RecentDailyReportDto>>
                {
                    Success = true,
                    Data = reports
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "最近の日報一覧の取得中にエラーが発生しました");
                return StatusCode(500, new ApiResponse<List<RecentDailyReportDto>>
                {
                    Success = false,
                    Error = new ApiError { Code = "SERVER_ERROR", Message = "サーバーエラーが発生しました" }
                });
            }
        }

        /// <summary>
        /// 今日のカレンダーイベント一覧を取得
        /// GET /api/desktop/dashboard/today-events
        /// </summary>
        [HttpGet("today-events")]
        public async Task<ActionResult<ApiResponse<List<TodayEventDto>>>> GetTodayEvents()
        {
            try
            {
                var nurseryId = GetNurseryId();
                var events = await _dashboardService.GetTodayEventsAsync(nurseryId);

                return Ok(new ApiResponse<List<TodayEventDto>>
                {
                    Success = true,
                    Data = events
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "今日のイベント一覧の取得中にエラーが発生しました");
                return StatusCode(500, new ApiResponse<List<TodayEventDto>>
                {
                    Success = false,
                    Error = new ApiError { Code = "SERVER_ERROR", Message = "サーバーエラーが発生しました" }
                });
            }
        }

        /// <summary>
        /// ダッシュボードサマリー統計を取得
        /// GET /api/desktop/dashboard/summary
        /// </summary>
        [HttpGet("summary")]
        public async Task<ActionResult<ApiResponse<DashboardSummaryDto>>> GetDashboardSummary()
        {
            try
            {
                var nurseryId = GetNurseryId();
                var summary = await _dashboardService.GetDashboardSummaryAsync(nurseryId);

                return Ok(new ApiResponse<DashboardSummaryDto>
                {
                    Success = true,
                    Data = summary
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "ダッシュボードサマリーの取得中にエラーが発生しました");
                return StatusCode(500, new ApiResponse<DashboardSummaryDto>
                {
                    Success = false,
                    Error = new ApiError { Code = "SERVER_ERROR", Message = "サーバーエラーが発生しました" }
                });
            }
        }
    }
}

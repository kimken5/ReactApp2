using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ReactApp.Server.DTOs;
using ReactApp.Server.Services;

namespace ReactApp.Server.Controllers
{
    /// <summary>
    /// 出席統計APIコントローラー
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class AttendanceStatisticsController : ControllerBase
    {
        private readonly IAttendanceStatisticsService _statisticsService;
        private readonly ILogger<AttendanceStatisticsController> _logger;

        public AttendanceStatisticsController(
            IAttendanceStatisticsService statisticsService,
            ILogger<AttendanceStatisticsController> logger)
        {
            _statisticsService = statisticsService;
            _logger = logger;
        }

        /// <summary>
        /// 出席統計レポートを取得
        /// </summary>
        /// <param name="request">統計リクエスト</param>
        /// <returns>統計レポート</returns>
        [HttpPost("report")]
        [ProducesResponseType(typeof(AttendanceStatisticsResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<AttendanceStatisticsResponseDto>> GetAttendanceStatistics(
            [FromBody] AttendanceStatisticsRequestDto request)
        {
            try
            {
                _logger.LogInformation(
                    "出席統計レポートAPI呼び出し: NurseryId={NurseryId}, DateFrom={DateFrom}, DateTo={DateTo}",
                    request.NurseryId, request.DateFrom, request.DateTo);

                // バリデーション
                if (request.DateFrom > request.DateTo)
                {
                    return BadRequest(new { error = "開始日は終了日より前である必要があります" });
                }

                var result = await _statisticsService.GetAttendanceStatisticsAsync(request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "出席統計レポート取得エラー");
                return StatusCode(500, new { error = "統計レポートの取得に失敗しました" });
            }
        }

        /// <summary>
        /// 月別出席統計を取得（グラフ表示用）
        /// </summary>
        /// <param name="nurseryId">保育園ID</param>
        /// <param name="dateFrom">開始日</param>
        /// <param name="dateTo">終了日</param>
        /// <param name="classIds">クラスIDリスト（カンマ区切り、省略時は全クラス）</param>
        /// <returns>月別統計リスト</returns>
        [HttpGet("monthly")]
        [ProducesResponseType(typeof(List<MonthlyAttendanceStatsDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<List<MonthlyAttendanceStatsDto>>> GetMonthlyStatistics(
            [FromQuery] int nurseryId,
            [FromQuery] DateTime dateFrom,
            [FromQuery] DateTime dateTo,
            [FromQuery] string? classIds = null)
        {
            try
            {
                _logger.LogInformation(
                    "月別統計API呼び出し: NurseryId={NurseryId}, DateFrom={DateFrom}, DateTo={DateTo}, ClassIds={ClassIds}",
                    nurseryId, dateFrom, dateTo, classIds ?? "全クラス");

                // バリデーション
                if (dateFrom > dateTo)
                {
                    return BadRequest(new { error = "開始日は終了日より前である必要があります" });
                }

                // classIdsをリストに変換
                List<string>? classIdList = null;
                if (!string.IsNullOrWhiteSpace(classIds))
                {
                    classIdList = classIds.Split(',', StringSplitOptions.RemoveEmptyEntries).ToList();
                }

                var result = await _statisticsService.GetMonthlyStatisticsAsync(
                    nurseryId, dateFrom, dateTo, classIdList);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "月別統計取得エラー");
                return StatusCode(500, new { error = "月別統計の取得に失敗しました" });
            }
        }
    }
}

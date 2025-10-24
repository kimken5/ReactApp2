using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ReactApp.Server.DTOs;
using ReactApp.Server.Services;
using System.Security.Claims;

namespace ReactApp.Server.Controllers
{
    /// <summary>
    /// デスクトップアプリ用日報管理コントローラー
    /// 日報のCRUD操作、公開、フィルタ検索機能を提供
    /// </summary>
    [ApiController]
    [Route("api/desktop/dailyreports")]
    [Authorize]
    public class DesktopDailyReportController : ControllerBase
    {
        private readonly IDesktopDailyReportService _dailyReportService;
        private readonly ILogger<DesktopDailyReportController> _logger;

        public DesktopDailyReportController(
            IDesktopDailyReportService dailyReportService,
            ILogger<DesktopDailyReportController> logger)
        {
            _dailyReportService = dailyReportService;
            _logger = logger;
        }

        /// <summary>
        /// 日報一覧取得（フィルタ対応）
        /// </summary>
        /// <param name="filter">フィルタ条件</param>
        /// <returns>日報一覧</returns>
        [HttpGet]
        public async Task<ActionResult<ApiResponse<List<DailyReportDto>>>> GetDailyReports([FromQuery] DailyReportFilterDto filter)
        {
            try
            {
                var nurseryId = GetNurseryId();
                var reports = await _dailyReportService.GetDailyReportsAsync(nurseryId, filter);

                return Ok(new ApiResponse<List<DailyReportDto>>
                {
                    Success = true,
                    Data = reports,
                    Message = "日報一覧取得成功"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "日報一覧取得エラー");
                return StatusCode(500, new ApiResponse<List<DailyReportDto>>
                {
                    Success = false,
                    Message = "日報一覧取得に失敗しました"
                });
            }
        }

        /// <summary>
        /// 日報詳細取得
        /// </summary>
        /// <param name="id">日報ID</param>
        /// <returns>日報詳細</returns>
        [HttpGet("{id}")]
        public async Task<ActionResult<ApiResponse<DailyReportDto>>> GetDailyReport(int id)
        {
            try
            {
                var nurseryId = GetNurseryId();
                var report = await _dailyReportService.GetDailyReportByIdAsync(nurseryId, id);

                if (report == null)
                {
                    return NotFound(new ApiResponse<DailyReportDto>
                    {
                        Success = false,
                        Message = "日報が見つかりません"
                    });
                }

                return Ok(new ApiResponse<DailyReportDto>
                {
                    Success = true,
                    Data = report,
                    Message = "日報詳細取得成功"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "日報詳細取得エラー: ReportId={ReportId}", id);
                return StatusCode(500, new ApiResponse<DailyReportDto>
                {
                    Success = false,
                    Message = "日報詳細取得に失敗しました"
                });
            }
        }

        /// <summary>
        /// 日報作成
        /// </summary>
        /// <param name="request">日報作成リクエスト</param>
        /// <returns>作成された日報</returns>
        [HttpPost]
        public async Task<ActionResult<ApiResponse<DailyReportDto>>> CreateDailyReport(
            [FromBody] CreateDailyReportRequestDto request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(new ApiResponse<DailyReportDto>
                    {
                        Success = false,
                        Message = "入力データが不正です"
                    });
                }

                var nurseryId = GetNurseryId();
                var report = await _dailyReportService.CreateDailyReportAsync(nurseryId, request);

                return CreatedAtAction(
                    nameof(GetDailyReport),
                    new { id = report.Id },
                    new ApiResponse<DailyReportDto>
                    {
                        Success = true,
                        Data = report,
                        Message = "日報作成成功"
                    });
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "日報作成バリデーションエラー");
                return BadRequest(new ApiResponse<DailyReportDto>
                {
                    Success = false,
                    Message = ex.Message
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "日報作成エラー");
                return StatusCode(500, new ApiResponse<DailyReportDto>
                {
                    Success = false,
                    Message = "日報作成に失敗しました"
                });
            }
        }

        /// <summary>
        /// 日報更新
        /// </summary>
        /// <param name="id">日報ID</param>
        /// <param name="request">日報更新リクエスト</param>
        /// <returns>更新された日報</returns>
        [HttpPut("{id}")]
        public async Task<ActionResult<ApiResponse<DailyReportDto>>> UpdateDailyReport(
            int id,
            [FromBody] UpdateDailyReportRequestDto request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(new ApiResponse<DailyReportDto>
                    {
                        Success = false,
                        Message = "入力データが不正です"
                    });
                }

                var nurseryId = GetNurseryId();
                var report = await _dailyReportService.UpdateDailyReportAsync(nurseryId, id, request);

                return Ok(new ApiResponse<DailyReportDto>
                {
                    Success = true,
                    Data = report,
                    Message = "日報更新成功"
                });
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "日報更新バリデーションエラー: ReportId={ReportId}", id);
                return BadRequest(new ApiResponse<DailyReportDto>
                {
                    Success = false,
                    Message = ex.Message
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "日報更新エラー: ReportId={ReportId}", id);
                return StatusCode(500, new ApiResponse<DailyReportDto>
                {
                    Success = false,
                    Message = "日報更新に失敗しました"
                });
            }
        }

        /// <summary>
        /// 日報削除
        /// </summary>
        /// <param name="id">日報ID</param>
        /// <returns>削除結果</returns>
        [HttpDelete("{id}")]
        public async Task<ActionResult<ApiResponse<object>>> DeleteDailyReport(int id)
        {
            try
            {
                var nurseryId = GetNurseryId();
                await _dailyReportService.DeleteDailyReportAsync(nurseryId, id);

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "日報削除成功"
                });
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "日報削除バリデーションエラー: ReportId={ReportId}", id);
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = ex.Message
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "日報削除エラー: ReportId={ReportId}", id);
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "日報削除に失敗しました"
                });
            }
        }

        /// <summary>
        /// 日報公開
        /// </summary>
        /// <param name="id">日報ID</param>
        /// <returns>公開された日報</returns>
        [HttpPost("{id}/publish")]
        public async Task<ActionResult<ApiResponse<DailyReportDto>>> PublishDailyReport(int id)
        {
            try
            {
                var nurseryId = GetNurseryId();
                var report = await _dailyReportService.PublishDailyReportAsync(nurseryId, id);

                return Ok(new ApiResponse<DailyReportDto>
                {
                    Success = true,
                    Data = report,
                    Message = "日報公開成功"
                });
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "日報公開バリデーションエラー: ReportId={ReportId}", id);
                return BadRequest(new ApiResponse<DailyReportDto>
                {
                    Success = false,
                    Message = ex.Message
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "日報公開エラー: ReportId={ReportId}", id);
                return StatusCode(500, new ApiResponse<DailyReportDto>
                {
                    Success = false,
                    Message = "日報公開に失敗しました"
                });
            }
        }

        /// <summary>
        /// 下書き日報一覧取得
        /// </summary>
        /// <param name="staffId">職員ID</param>
        /// <returns>下書き日報一覧</returns>
        [HttpGet("drafts")]
        public async Task<ActionResult<ApiResponse<List<DailyReportDto>>>> GetDraftReports([FromQuery] int staffId)
        {
            try
            {
                if (staffId <= 0)
                {
                    return BadRequest(new ApiResponse<List<DailyReportDto>>
                    {
                        Success = false,
                        Message = "職員IDは必須です"
                    });
                }

                var nurseryId = GetNurseryId();
                var reports = await _dailyReportService.GetDraftReportsAsync(nurseryId, staffId);

                return Ok(new ApiResponse<List<DailyReportDto>>
                {
                    Success = true,
                    Data = reports,
                    Message = "下書き日報一覧取得成功"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "下書き日報一覧取得エラー: StaffId={StaffId}", staffId);
                return StatusCode(500, new ApiResponse<List<DailyReportDto>>
                {
                    Success = false,
                    Message = "下書き日報一覧取得に失敗しました"
                });
            }
        }

        /// <summary>
        /// 日付別日報一覧取得
        /// </summary>
        /// <param name="date">日付</param>
        /// <returns>指定日の日報一覧</returns>
        [HttpGet("by-date")]
        public async Task<ActionResult<ApiResponse<List<DailyReportDto>>>> GetReportsByDate([FromQuery] DateTime date)
        {
            try
            {
                var nurseryId = GetNurseryId();
                var reports = await _dailyReportService.GetReportsByDateAsync(nurseryId, date);

                return Ok(new ApiResponse<List<DailyReportDto>>
                {
                    Success = true,
                    Data = reports,
                    Message = "日付別日報一覧取得成功"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "日付別日報一覧取得エラー: Date={Date}", date);
                return StatusCode(500, new ApiResponse<List<DailyReportDto>>
                {
                    Success = false,
                    Message = "日付別日報一覧取得に失敗しました"
                });
            }
        }

        /// <summary>
        /// JWT ClaimからNurseryIdを取得
        /// </summary>
        /// <returns>保育園ID</returns>
        private int GetNurseryId()
        {
            var nurseryIdClaim = User.FindFirst("NurseryId")?.Value;
            if (string.IsNullOrEmpty(nurseryIdClaim) || !int.TryParse(nurseryIdClaim, out var nurseryId))
            {
                throw new UnauthorizedAccessException("保育園IDが取得できません");
            }
            return nurseryId;
        }
    }
}

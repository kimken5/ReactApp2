using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ReactApp.Server.DTOs.Desktop;
using ReactApp.Server.Services;
using System.Security.Claims;

namespace ReactApp.Server.Controllers
{
    /// <summary>
    /// デスクトップアプリ用出欠表管理コントローラー
    /// 出欠状況の取得、更新、一括登録機能を提供
    /// </summary>
    [ApiController]
    [Route("api/desktop/attendance")]
    [Authorize]
    public class DesktopAttendanceController : ControllerBase
    {
        private readonly IDesktopAttendanceService _attendanceService;
        private readonly ILogger<DesktopAttendanceController> _logger;

        public DesktopAttendanceController(
            IDesktopAttendanceService attendanceService,
            ILogger<DesktopAttendanceController> logger)
        {
            _attendanceService = attendanceService;
            _logger = logger;
        }

        /// <summary>
        /// 指定日・クラスの出欠状況取得
        /// </summary>
        /// <param name="classId">クラスID</param>
        /// <param name="date">日付</param>
        /// <returns>出欠状況一覧</returns>
        [HttpGet("{classId}/{date}")]
        public async Task<ActionResult<ApiResponse<List<AttendanceDto>>>> GetAttendanceByClassAndDate(
            string classId,
            DateTime date)
        {
            try
            {
                var nurseryId = GetNurseryId();
                var attendances = await _attendanceService.GetAttendanceByClassAndDateAsync(nurseryId, classId, date);

                return Ok(new ApiResponse<List<AttendanceDto>>
                {
                    Success = true,
                    Data = attendances,
                    Message = "出欠状況取得成功"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "出欠状況取得エラー: ClassId={ClassId}, Date={Date}", classId, date);
                return StatusCode(500, new ApiResponse<List<AttendanceDto>>
                {
                    Success = false,
                    Message = "出欠状況取得に失敗しました"
                });
            }
        }

        /// <summary>
        /// 出欠履歴取得
        /// </summary>
        /// <param name="classId">クラスID</param>
        /// <param name="startDate">開始日</param>
        /// <param name="endDate">終了日</param>
        /// <param name="childId">園児ID（オプション）</param>
        /// <returns>出欠履歴と集計情報</returns>
        [HttpGet("{classId}/history")]
        public async Task<ActionResult<ApiResponse<AttendanceHistoryResponseDto>>> GetAttendanceHistory(
            string classId,
            [FromQuery] DateTime startDate,
            [FromQuery] DateTime endDate,
            [FromQuery] int? childId = null)
        {
            try
            {
                var nurseryId = GetNurseryId();
                var (attendances, summary) = await _attendanceService.GetAttendanceHistoryAsync(
                    nurseryId, classId, startDate, endDate, childId);

                var response = new AttendanceHistoryResponseDto
                {
                    Attendances = attendances,
                    Summary = summary
                };

                return Ok(new ApiResponse<AttendanceHistoryResponseDto>
                {
                    Success = true,
                    Data = response,
                    Message = "出欠履歴取得成功"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "出欠履歴取得エラー: ClassId={ClassId}, StartDate={StartDate}, EndDate={EndDate}, ChildId={ChildId}",
                    classId, startDate, endDate, childId);
                return StatusCode(500, new ApiResponse<AttendanceHistoryResponseDto>
                {
                    Success = false,
                    Message = "出欠履歴取得に失敗しました"
                });
            }
        }

        /// <summary>
        /// 出欠ステータス更新
        /// </summary>
        /// <param name="childId">園児ID</param>
        /// <param name="date">日付</param>
        /// <param name="request">更新内容</param>
        /// <returns>更新後の出欠情報</returns>
        [HttpPut("{childId}/{date}")]
        public async Task<ActionResult<ApiResponse<AttendanceDto>>> UpdateAttendance(
            int childId,
            DateTime date,
            [FromBody] UpdateAttendanceRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(new ApiResponse<AttendanceDto>
                    {
                        Success = false,
                        Message = "入力データが不正です"
                    });
                }

                var nurseryId = GetNurseryId();
                var attendance = await _attendanceService.UpdateAttendanceAsync(nurseryId, childId, date, request);

                return Ok(new ApiResponse<AttendanceDto>
                {
                    Success = true,
                    Data = attendance,
                    Message = "出欠ステータス更新成功"
                });
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "出欠ステータス更新バリデーションエラー: ChildId={ChildId}, Date={Date}", childId, date);
                return BadRequest(new ApiResponse<AttendanceDto>
                {
                    Success = false,
                    Message = ex.Message
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "出欠ステータス更新エラー: ChildId={ChildId}, Date={Date}", childId, date);
                return StatusCode(500, new ApiResponse<AttendanceDto>
                {
                    Success = false,
                    Message = "出欠ステータス更新に失敗しました"
                });
            }
        }

        /// <summary>
        /// 備考更新
        /// </summary>
        /// <param name="childId">園児ID</param>
        /// <param name="date">日付</param>
        /// <param name="request">更新内容（備考のみ）</param>
        /// <returns>更新後の出欠情報</returns>
        [HttpPut("{childId}/{date}/notes")]
        public async Task<ActionResult<ApiResponse<AttendanceDto>>> UpdateAttendanceNotes(
            int childId,
            DateTime date,
            [FromBody] UpdateAttendanceNotesRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    var errors = string.Join(", ", ModelState.Values
                        .SelectMany(v => v.Errors)
                        .Select(e => e.ErrorMessage));
                    _logger.LogWarning("備考更新バリデーションエラー: {Errors}", errors);
                    return BadRequest(new ApiResponse<AttendanceDto>
                    {
                        Success = false,
                        Message = $"入力データが不正です: {errors}"
                    });
                }

                var nurseryId = GetNurseryId();
                var attendance = await _attendanceService.UpdateAttendanceNotesAsync(nurseryId, childId, date, request);

                return Ok(new ApiResponse<AttendanceDto>
                {
                    Success = true,
                    Data = attendance,
                    Message = "備考更新成功"
                });
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "備考更新バリデーションエラー: ChildId={ChildId}, Date={Date}", childId, date);
                return BadRequest(new ApiResponse<AttendanceDto>
                {
                    Success = false,
                    Message = ex.Message
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "備考更新エラー: ChildId={ChildId}, Date={Date}", childId, date);
                return StatusCode(500, new ApiResponse<AttendanceDto>
                {
                    Success = false,
                    Message = "備考更新に失敗しました"
                });
            }
        }

        /// <summary>
        /// クラス全員を一括で出席に登録
        /// </summary>
        /// <param name="request">一括登録リクエスト</param>
        /// <returns>登録結果</returns>
        [HttpPost("bulk-present")]
        public async Task<ActionResult<ApiResponse<BulkPresentResponse>>> BulkPresent(
            [FromBody] BulkPresentRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(new ApiResponse<BulkPresentResponse>
                    {
                        Success = false,
                        Message = "入力データが不正です"
                    });
                }

                var result = await _attendanceService.BulkPresentAsync(request);

                return Ok(new ApiResponse<BulkPresentResponse>
                {
                    Success = true,
                    Data = result,
                    Message = "一括出席登録成功"
                });
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "一括出席登録バリデーションエラー: ClassId={ClassId}, Date={Date}",
                    request.ClassId, request.Date);
                return BadRequest(new ApiResponse<BulkPresentResponse>
                {
                    Success = false,
                    Message = ex.Message
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "一括出席登録エラー: ClassId={ClassId}, Date={Date}",
                    request.ClassId, request.Date);
                return StatusCode(500, new ApiResponse<BulkPresentResponse>
                {
                    Success = false,
                    Message = "一括出席登録に失敗しました"
                });
            }
        }

        /// <summary>
        /// 認証済みユーザーの保育園IDを取得
        /// </summary>
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

    /// <summary>
    /// 出欠履歴レスポンス用DTO
    /// </summary>
    public class AttendanceHistoryResponseDto
    {
        public List<AttendanceDto> Attendances { get; set; } = new();
        public AttendanceHistorySummaryDto Summary { get; set; } = new();
    }
}

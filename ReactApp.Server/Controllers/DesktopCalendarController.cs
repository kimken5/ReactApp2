using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ReactApp.Server.DTOs.Desktop;
using ReactApp.Server.Services;

namespace ReactApp.Server.Controllers;

/// <summary>
/// デスクトップアプリ用カレンダー管理コントローラー
/// </summary>
[Authorize]
[ApiController]
[Route("api/desktop/calendar")]
public class DesktopCalendarController : ControllerBase
{
    private readonly IDesktopCalendarService _calendarService;
    private readonly ILogger<DesktopCalendarController> _logger;

    public DesktopCalendarController(
        IDesktopCalendarService calendarService,
        ILogger<DesktopCalendarController> logger)
    {
        _calendarService = calendarService;
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

    private string GetStaffName()
    {
        return User.FindFirst("Name")?.Value ?? "管理者";
    }

    /// <summary>
    /// イベント一覧取得
    /// GET /api/desktop/calendar?startDate=2025-01-01&endDate=2025-01-31
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<CalendarEventDto>>>> GetEvents(
        [FromQuery] DateTime startDate,
        [FromQuery] DateTime endDate)
    {
        try
        {
            var nurseryId = GetNurseryId();
            var events = await _calendarService.GetEventsAsync(nurseryId, startDate, endDate);

            return Ok(new ApiResponse<List<CalendarEventDto>>
            {
                Success = true,
                Data = events
            });
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "認証エラー");
            return Unauthorized(new ApiResponse<List<CalendarEventDto>>
            {
                Success = false,
                Error = new ApiError { Code = "UNAUTHORIZED", Message = ex.Message }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "イベント一覧取得エラー");
            return StatusCode(500, new ApiResponse<List<CalendarEventDto>>
            {
                Success = false,
                Error = new ApiError { Code = "SERVER_ERROR", Message = "サーバーエラーが発生しました" }
            });
        }
    }

    /// <summary>
    /// イベント詳細取得
    /// GET /api/desktop/calendar/{id}
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<CalendarEventDto>>> GetEvent(int id)
    {
        try
        {
            var nurseryId = GetNurseryId();
            var eventDto = await _calendarService.GetEventByIdAsync(nurseryId, id);

            if (eventDto == null)
            {
                return NotFound(new ApiResponse<CalendarEventDto>
                {
                    Success = false,
                    Error = new ApiError { Code = "EVENT_NOT_FOUND", Message = "イベントが見つかりません" }
                });
            }

            return Ok(new ApiResponse<CalendarEventDto>
            {
                Success = true,
                Data = eventDto
            });
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "認証エラー");
            return Unauthorized(new ApiResponse<CalendarEventDto>
            {
                Success = false,
                Error = new ApiError { Code = "UNAUTHORIZED", Message = ex.Message }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "イベント詳細取得エラー (EventId={EventId})", id);
            return StatusCode(500, new ApiResponse<CalendarEventDto>
            {
                Success = false,
                Error = new ApiError { Code = "SERVER_ERROR", Message = "サーバーエラーが発生しました" }
            });
        }
    }

    /// <summary>
    /// イベント作成
    /// POST /api/desktop/calendar
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<ApiResponse<CalendarEventDto>>> CreateEvent(
        [FromBody] CreateCalendarEventRequestDto request)
    {
        try
        {
            var nurseryId = GetNurseryId();
            var staffName = GetStaffName();
            var eventDto = await _calendarService.CreateEventAsync(nurseryId, request, staffName);

            return CreatedAtAction(
                nameof(GetEvent),
                new { id = eventDto.Id },
                new ApiResponse<CalendarEventDto>
                {
                    Success = true,
                    Data = eventDto
                });
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "認証エラー");
            return Unauthorized(new ApiResponse<CalendarEventDto>
            {
                Success = false,
                Error = new ApiError { Code = "UNAUTHORIZED", Message = ex.Message }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "イベント作成エラー");
            return StatusCode(500, new ApiResponse<CalendarEventDto>
            {
                Success = false,
                Error = new ApiError { Code = "SERVER_ERROR", Message = "サーバーエラーが発生しました" }
            });
        }
    }

    /// <summary>
    /// イベント更新
    /// PUT /api/desktop/calendar/{id}
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<CalendarEventDto>>> UpdateEvent(
        int id,
        [FromBody] UpdateCalendarEventRequestDto request)
    {
        try
        {
            var nurseryId = GetNurseryId();
            var eventDto = await _calendarService.UpdateEventAsync(nurseryId, id, request);

            return Ok(new ApiResponse<CalendarEventDto>
            {
                Success = true,
                Data = eventDto
            });
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogWarning(ex, "イベントが見つかりません (EventId={EventId})", id);
            return NotFound(new ApiResponse<CalendarEventDto>
            {
                Success = false,
                Error = new ApiError { Code = "EVENT_NOT_FOUND", Message = ex.Message }
            });
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "認証エラー");
            return Unauthorized(new ApiResponse<CalendarEventDto>
            {
                Success = false,
                Error = new ApiError { Code = "UNAUTHORIZED", Message = ex.Message }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "イベント更新エラー (EventId={EventId})", id);
            return StatusCode(500, new ApiResponse<CalendarEventDto>
            {
                Success = false,
                Error = new ApiError { Code = "SERVER_ERROR", Message = "サーバーエラーが発生しました" }
            });
        }
    }

    /// <summary>
    /// イベント削除
    /// DELETE /api/desktop/calendar/{id}
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<object>>> DeleteEvent(int id)
    {
        try
        {
            var nurseryId = GetNurseryId();
            var deleted = await _calendarService.DeleteEventAsync(nurseryId, id);

            if (!deleted)
            {
                return NotFound(new ApiResponse<object>
                {
                    Success = false,
                    Error = new ApiError { Code = "EVENT_NOT_FOUND", Message = "イベントが見つかりません" }
                });
            }

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Data = new { message = "イベントを削除しました" }
            });
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "認証エラー");
            return Unauthorized(new ApiResponse<object>
            {
                Success = false,
                Error = new ApiError { Code = "UNAUTHORIZED", Message = ex.Message }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "イベント削除エラー (EventId={EventId})", id);
            return StatusCode(500, new ApiResponse<object>
            {
                Success = false,
                Error = new ApiError { Code = "SERVER_ERROR", Message = "サーバーエラーが発生しました" }
            });
        }
    }
}

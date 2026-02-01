using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ReactApp.Server.DTOs.Desktop;
using ReactApp.Server.Services;

namespace ReactApp.Server.Controllers;

/// <summary>
/// 休園日・休日保育管理コントローラー
/// </summary>
[Authorize]
[ApiController]
[Route("api/desktop/nursery-day-types")]
public class NurseryDayTypeController : ControllerBase
{
    private readonly INurseryDayTypeService _nurseryDayTypeService;
    private readonly ILogger<NurseryDayTypeController> _logger;

    public NurseryDayTypeController(
        INurseryDayTypeService nurseryDayTypeService,
        ILogger<NurseryDayTypeController> logger)
    {
        _nurseryDayTypeService = nurseryDayTypeService;
        _logger = logger;
    }

    private string GetNurseryId()
    {
        var nurseryIdClaim = User.FindFirst("NurseryId")?.Value;
        if (string.IsNullOrEmpty(nurseryIdClaim))
        {
            throw new UnauthorizedAccessException("保育園IDが取得できません");
        }
        return nurseryIdClaim;
    }

    private int GetUserId()
    {
        // Desktop users use NurseryId as userId
        var userIdClaim = User.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier")?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
        {
            throw new UnauthorizedAccessException("ユーザーIDが取得できません");
        }
        return userId;
    }

    /// <summary>
    /// 休園日・休日保育一覧取得
    /// GET /api/desktop/nursery-day-types?startDate=2025-01-01&endDate=2025-01-31
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<NurseryDayTypeDto>>>> GetNurseryDayTypes(
        [FromQuery] string startDate,
        [FromQuery] string endDate)
    {
        try
        {
            var nurseryId = GetNurseryId();

            if (!DateOnly.TryParse(startDate, out var start) || !DateOnly.TryParse(endDate, out var end))
            {
                return BadRequest(new ApiResponse<List<NurseryDayTypeDto>>
                {
                    Success = false,
                    Error = new ApiError { Code = "INVALID_DATE", Message = "無効な日付形式です" }
                });
            }

            var nurseryDayTypes = await _nurseryDayTypeService.GetNurseryDayTypesAsync(nurseryId, start, end);

            return Ok(new ApiResponse<List<NurseryDayTypeDto>>
            {
                Success = true,
                Data = nurseryDayTypes
            });
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "認証エラー");
            return Unauthorized(new ApiResponse<List<NurseryDayTypeDto>>
            {
                Success = false,
                Error = new ApiError { Code = "UNAUTHORIZED", Message = ex.Message }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "休園日・休日保育一覧取得エラー");
            return StatusCode(500, new ApiResponse<List<NurseryDayTypeDto>>
            {
                Success = false,
                Error = new ApiError { Code = "SERVER_ERROR", Message = "サーバーエラーが発生しました" }
            });
        }
    }

    /// <summary>
    /// 特定日付の休園日・休日保育取得
    /// GET /api/desktop/nursery-day-types/{date}
    /// </summary>
    [HttpGet("{date}")]
    public async Task<ActionResult<ApiResponse<NurseryDayTypeDto>>> GetNurseryDayTypeByDate(string date)
    {
        try
        {
            var nurseryId = GetNurseryId();

            if (!DateOnly.TryParse(date, out var parsedDate))
            {
                return BadRequest(new ApiResponse<NurseryDayTypeDto>
                {
                    Success = false,
                    Error = new ApiError { Code = "INVALID_DATE", Message = "無効な日付形式です" }
                });
            }

            var nurseryDayType = await _nurseryDayTypeService.GetNurseryDayTypeByDateAsync(nurseryId, parsedDate);

            if (nurseryDayType == null)
            {
                return NotFound(new ApiResponse<NurseryDayTypeDto>
                {
                    Success = false,
                    Error = new ApiError { Code = "NOT_FOUND", Message = "指定日付のデータが見つかりません" }
                });
            }

            return Ok(new ApiResponse<NurseryDayTypeDto>
            {
                Success = true,
                Data = nurseryDayType
            });
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "認証エラー");
            return Unauthorized(new ApiResponse<NurseryDayTypeDto>
            {
                Success = false,
                Error = new ApiError { Code = "UNAUTHORIZED", Message = ex.Message }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "休園日・休日保育取得エラー: Date={Date}", date);
            return StatusCode(500, new ApiResponse<NurseryDayTypeDto>
            {
                Success = false,
                Error = new ApiError { Code = "SERVER_ERROR", Message = "サーバーエラーが発生しました" }
            });
        }
    }

    /// <summary>
    /// 休園日・休日保育作成
    /// POST /api/desktop/nursery-day-types
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<ApiResponse<NurseryDayTypeDto>>> CreateNurseryDayType(
        [FromBody] CreateNurseryDayTypeRequestDto request)
    {
        try
        {
            var nurseryId = GetNurseryId();
            var userId = GetUserId();

            var nurseryDayType = await _nurseryDayTypeService.CreateNurseryDayTypeAsync(nurseryId, request, userId);

            return Ok(new ApiResponse<NurseryDayTypeDto>
            {
                Success = true,
                Data = nurseryDayType
            });
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "認証エラー");
            return Unauthorized(new ApiResponse<NurseryDayTypeDto>
            {
                Success = false,
                Error = new ApiError { Code = "UNAUTHORIZED", Message = ex.Message }
            });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "休園日・休日保育作成エラー: 重複");
            return BadRequest(new ApiResponse<NurseryDayTypeDto>
            {
                Success = false,
                Error = new ApiError { Code = "DUPLICATE", Message = ex.Message }
            });
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "休園日・休日保育作成エラー: 無効な入力");
            return BadRequest(new ApiResponse<NurseryDayTypeDto>
            {
                Success = false,
                Error = new ApiError { Code = "INVALID_INPUT", Message = ex.Message }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "休園日・休日保育作成エラー");
            return StatusCode(500, new ApiResponse<NurseryDayTypeDto>
            {
                Success = false,
                Error = new ApiError { Code = "SERVER_ERROR", Message = "サーバーエラーが発生しました" }
            });
        }
    }

    /// <summary>
    /// 休園日・休日保育更新
    /// PUT /api/desktop/nursery-day-types/{id}
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<NurseryDayTypeDto>>> UpdateNurseryDayType(
        int id,
        [FromBody] UpdateNurseryDayTypeRequestDto request)
    {
        try
        {
            var nurseryId = GetNurseryId();

            var nurseryDayType = await _nurseryDayTypeService.UpdateNurseryDayTypeAsync(nurseryId, id, request);

            return Ok(new ApiResponse<NurseryDayTypeDto>
            {
                Success = true,
                Data = nurseryDayType
            });
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "認証エラー");
            return Unauthorized(new ApiResponse<NurseryDayTypeDto>
            {
                Success = false,
                Error = new ApiError { Code = "UNAUTHORIZED", Message = ex.Message }
            });
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogWarning(ex, "休園日・休日保育更新エラー: 未発見");
            return NotFound(new ApiResponse<NurseryDayTypeDto>
            {
                Success = false,
                Error = new ApiError { Code = "NOT_FOUND", Message = ex.Message }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "休園日・休日保育更新エラー: Id={Id}", id);
            return StatusCode(500, new ApiResponse<NurseryDayTypeDto>
            {
                Success = false,
                Error = new ApiError { Code = "SERVER_ERROR", Message = "サーバーエラーが発生しました" }
            });
        }
    }

    /// <summary>
    /// 休園日・休日保育削除
    /// DELETE /api/desktop/nursery-day-types/{id}
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteNurseryDayType(int id)
    {
        try
        {
            var nurseryId = GetNurseryId();

            var result = await _nurseryDayTypeService.DeleteNurseryDayTypeAsync(nurseryId, id);

            if (!result)
            {
                return NotFound(new ApiResponse<bool>
                {
                    Success = false,
                    Error = new ApiError { Code = "NOT_FOUND", Message = "指定されたデータが見つかりません" }
                });
            }

            return Ok(new ApiResponse<bool>
            {
                Success = true,
                Data = true
            });
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "認証エラー");
            return Unauthorized(new ApiResponse<bool>
            {
                Success = false,
                Error = new ApiError { Code = "UNAUTHORIZED", Message = ex.Message }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "休園日・休日保育削除エラー: Id={Id}", id);
            return StatusCode(500, new ApiResponse<bool>
            {
                Success = false,
                Error = new ApiError { Code = "SERVER_ERROR", Message = "サーバーエラーが発生しました" }
            });
        }
    }
}

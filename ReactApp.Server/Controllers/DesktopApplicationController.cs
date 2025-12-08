using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ReactApp.Server.DTOs;
using ReactApp.Server.DTOs.Desktop;
using ReactApp.Server.Services;
using System.Security.Claims;

namespace ReactApp.Server.Controllers;

/// <summary>
/// デスクトップアプリ入園申込管理コントローラー
/// 申込一覧、詳細、取込、却下を提供
/// JWT認証必須
/// </summary>
[ApiController]
[Route("api/desktop/application")]
[Authorize]
public class DesktopApplicationController : ControllerBase
{
    private readonly IApplicationService _applicationService;
    private readonly ILogger<DesktopApplicationController> _logger;

    public DesktopApplicationController(
        IApplicationService applicationService,
        ILogger<DesktopApplicationController> logger)
    {
        _applicationService = applicationService;
        _logger = logger;
    }

    /// <summary>
    /// 入園申込一覧取得
    /// </summary>
    /// <param name="status">申込状態フィルター（オプション）</param>
    /// <param name="startDate">申込開始日フィルター（オプション）</param>
    /// <param name="endDate">申込終了日フィルター（オプション）</param>
    /// <param name="page">ページ番号（デフォルト: 1）</param>
    /// <param name="pageSize">1ページあたりの件数（デフォルト: 20）</param>
    /// <returns>ページネーション済み申込一覧</returns>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<PaginatedResult<ApplicationListItemDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetList(
        [FromQuery] string? status = null,
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        try
        {
            var nurseryId = GetNurseryId();

            var result = await _applicationService.GetApplicationListAsync(
                nurseryId, status, startDate, endDate, page, pageSize);

            return Ok(new ApiResponse<PaginatedResult<ApplicationListItemDto>>
            {
                Success = true,
                Data = result
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "入園申込一覧取得エラー");
            return StatusCode(StatusCodes.Status500InternalServerError, new ApiResponse<object>
            {
                Success = false,
                Error = new ApiError
                {
                    Code = "SERVER_ERROR",
                    Message = "一覧取得中にエラーが発生しました"
                }
            });
        }
    }

    /// <summary>
    /// 入園申込詳細取得
    /// </summary>
    /// <param name="id">申込ID</param>
    /// <returns>申込詳細情報</returns>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(ApiResponse<ApplicationWorkDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetDetail(int id)
    {
        try
        {
            var nurseryId = GetNurseryId();

            var application = await _applicationService.GetApplicationDetailAsync(id, nurseryId);

            if (application == null)
            {
                return NotFound(new ApiResponse<object>
                {
                    Success = false,
                    Error = new ApiError
                    {
                        Code = "NOT_FOUND",
                        Message = "入園申込が見つかりません。"
                    }
                });
            }

            return Ok(new ApiResponse<ApplicationWorkDto>
            {
                Success = true,
                Data = application
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "入園申込詳細取得エラー: Id={Id}", id);
            return StatusCode(StatusCodes.Status500InternalServerError, new ApiResponse<object>
            {
                Success = false,
                Error = new ApiError
                {
                    Code = "SERVER_ERROR",
                    Message = "詳細取得中にエラーが発生しました"
                }
            });
        }
    }

    /// <summary>
    /// 入園申込取込
    /// </summary>
    /// <param name="id">申込ID</param>
    /// <param name="request">取込リクエスト</param>
    /// <returns>取込結果</returns>
    [HttpPost("{id}/import")]
    [ProducesResponseType(typeof(ApiResponse<ImportApplicationResult>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Import(int id, [FromBody] ImportApplicationRequest request)
    {
        try
        {
            var nurseryId = GetNurseryId();
            var userId = GetUserId();

            var result = await _applicationService.ImportApplicationAsync(id, nurseryId, request, userId);

            _logger.LogInformation(
                "入園申込を取り込みました。ApplicationId: {Id}, ParentId: {ParentId}, ChildId: {ChildId}",
                id, result.ParentId, result.ChildId);

            return Ok(new ApiResponse<ImportApplicationResult>
            {
                Success = true,
                Data = result
            });
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("見つかりません"))
        {
            return NotFound(new ApiResponse<object>
            {
                Success = false,
                Error = new ApiError
                {
                    Code = "NOT_FOUND",
                    Message = ex.Message
                }
            });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "入園申込取込失敗: Id={Id}", id);
            return BadRequest(new ApiResponse<object>
            {
                Success = false,
                Error = new ApiError
                {
                    Code = "INVALID_OPERATION",
                    Message = ex.Message
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "入園申込取込エラー: Id={Id}", id);
            return StatusCode(StatusCodes.Status409Conflict, new ApiResponse<object>
            {
                Success = false,
                Error = new ApiError
                {
                    Code = "IMPORT_FAILED",
                    Message = "取込処理中にエラーが発生しました"
                }
            });
        }
    }

    /// <summary>
    /// 入園申込却下
    /// </summary>
    /// <param name="id">申込ID</param>
    /// <param name="request">却下リクエスト</param>
    /// <returns>処理結果</returns>
    [HttpPost("{id}/reject")]
    [ProducesResponseType(typeof(ApiResponse<RejectApplicationResult>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Reject(int id, [FromBody] RejectApplicationRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Error = new ApiError
                    {
                        Code = "VALIDATION_ERROR",
                        Message = "入力内容に誤りがあります。",
                        Details = ModelState.Values
                            .SelectMany(v => v.Errors)
                            .Select(e => e.ErrorMessage)
                            .ToList()
                    }
                });
            }

            var nurseryId = GetNurseryId();

            await _applicationService.RejectApplicationAsync(id, nurseryId, request);

            _logger.LogInformation(
                "入園申込を却下しました。ApplicationId: {Id}, Reason: {Reason}",
                id, request.RejectionReason);

            return Ok(new ApiResponse<RejectApplicationResult>
            {
                Success = true,
                Data = new RejectApplicationResult
                {
                    Message = "入園申込を却下しました。"
                }
            });
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("見つかりません"))
        {
            return NotFound(new ApiResponse<object>
            {
                Success = false,
                Error = new ApiError
                {
                    Code = "NOT_FOUND",
                    Message = ex.Message
                }
            });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "入園申込却下失敗: Id={Id}", id);
            return BadRequest(new ApiResponse<object>
            {
                Success = false,
                Error = new ApiError
                {
                    Code = "INVALID_OPERATION",
                    Message = ex.Message
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "入園申込却下エラー: Id={Id}", id);
            return StatusCode(StatusCodes.Status500InternalServerError, new ApiResponse<object>
            {
                Success = false,
                Error = new ApiError
                {
                    Code = "SERVER_ERROR",
                    Message = "却下処理中にエラーが発生しました"
                }
            });
        }
    }

    #region プライベートメソッド

    /// <summary>
    /// JWTトークンから保育園IDを取得
    /// </summary>
    private int GetNurseryId()
    {
        var nurseryIdClaim = User.FindFirst("NurseryId")?.Value;
        if (nurseryIdClaim == null || !int.TryParse(nurseryIdClaim, out var nurseryId))
        {
            throw new UnauthorizedAccessException("保育園IDが見つかりません。");
        }
        return nurseryId;
    }

    /// <summary>
    /// JWTトークンからユーザーIDを取得
    /// </summary>
    private int GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userIdClaim == null || !int.TryParse(userIdClaim, out var userId))
        {
            throw new UnauthorizedAccessException("ユーザーIDが見つかりません。");
        }
        return userId;
    }

    #endregion
}

/// <summary>
/// 却下処理結果DTO
/// </summary>
public class RejectApplicationResult
{
    public string Message { get; set; } = string.Empty;
}

/// <summary>
/// API統一レスポンス形式（既存DTOを参照）
/// </summary>
file class ApiResponse<T>
{
    public bool Success { get; set; }
    public T? Data { get; set; }
    public ApiError? Error { get; set; }
}

/// <summary>
/// APIエラー情報（既存DTOを参照）
/// </summary>
file class ApiError
{
    public string Code { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public List<string>? Details { get; set; }
}

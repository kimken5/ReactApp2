using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using ReactApp.Server.DTOs;
using ReactApp.Server.Services;
using System.Security.Claims;

namespace ReactApp.Server.Controllers;

/// <summary>
/// 入退管理コントローラー
/// 保護者の入退ログの作成、取得、削除を提供
/// デスクトップアプリからのアクセスにも対応
/// </summary>
[ApiController]
[Route("api/entry-exit-logs")]
[Authorize(Roles = "EntryExit,Desktop,Admin")]
[EnableRateLimiting("general")]
public class EntryExitController : ControllerBase
{
    private readonly IEntryExitService _entryExitService;
    private readonly ILogger<EntryExitController> _logger;

    public EntryExitController(
        IEntryExitService entryExitService,
        ILogger<EntryExitController> logger)
    {
        _entryExitService = entryExitService;
        _logger = logger;
    }

    /// <summary>
    /// 入退ログ作成
    /// バーコードスキャン時に呼び出され、保護者の入退記録を登録
    /// </summary>
    /// <param name="request">入退ログ作成リクエスト</param>
    /// <returns>作成された入退ログ情報</returns>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<EntryExitLogDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> CreateLog([FromBody] CreateEntryExitLogRequest request)
    {
        try
        {
            // JWTトークンから保育園IDを取得
            var nurseryIdClaim = User.FindFirst("NurseryId")?.Value;
            if (string.IsNullOrEmpty(nurseryIdClaim) || !int.TryParse(nurseryIdClaim, out var tokenNurseryId))
            {
                return Unauthorized(new ApiResponse<object>
                {
                    Success = false,
                    Error = new ApiError
                    {
                        Code = "AUTH_INVALID_TOKEN",
                        Message = "無効なトークンです"
                    }
                });
            }

            // リクエストの保育園IDとトークンの保育園IDが一致するか検証
            if (request.NurseryId != tokenNurseryId)
            {
                return Unauthorized(new ApiResponse<object>
                {
                    Success = false,
                    Error = new ApiError
                    {
                        Code = "AUTH_NURSERY_MISMATCH",
                        Message = "保育園IDが一致しません"
                    }
                });
            }

            var log = await _entryExitService.CreateLogAsync(request);

            _logger.LogInformation("Entry/Exit log created: LogId={LogId}, ParentId={ParentId}, EntryType={EntryType}",
                log.Id, log.ParentId, log.EntryType);

            return StatusCode(StatusCodes.Status201Created, new ApiResponse<EntryExitLogDto>
            {
                Success = true,
                Data = log
            });
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Invalid entry/exit log creation request");
            return BadRequest(new ApiResponse<object>
            {
                Success = false,
                Error = new ApiError
                {
                    Code = "VALIDATION_ERROR",
                    Message = ex.Message
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating entry/exit log");
            return StatusCode(StatusCodes.Status500InternalServerError, new ApiResponse<object>
            {
                Success = false,
                Error = new ApiError
                {
                    Code = "SERVER_ERROR",
                    Message = "入退ログの作成中にエラーが発生しました"
                }
            });
        }
    }

    /// <summary>
    /// 入退ログ一覧取得
    /// フィルタリング・ページネーション対応で入退ログを取得
    /// </summary>
    /// <param name="fromDate">開始日時（オプション）</param>
    /// <param name="toDate">終了日時（オプション）</param>
    /// <param name="parentName">保護者名（部分一致検索、オプション）</param>
    /// <param name="entryType">入退種別（Entry/Exit、オプション）</param>
    /// <param name="page">ページ番号（デフォルト: 1）</param>
    /// <param name="pageSize">ページサイズ（デフォルト: 50）</param>
    /// <returns>入退ログ一覧と総件数</returns>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<EntryExitLogListResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetLogs(
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        [FromQuery] string? parentName = null,
        [FromQuery] string? entryType = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        try
        {
            // JWTトークンから保育園IDを取得
            var nurseryIdClaim = User.FindFirst("NurseryId")?.Value;
            if (string.IsNullOrEmpty(nurseryIdClaim) || !int.TryParse(nurseryIdClaim, out var nurseryId))
            {
                return Unauthorized(new ApiResponse<object>
                {
                    Success = false,
                    Error = new ApiError
                    {
                        Code = "AUTH_INVALID_TOKEN",
                        Message = "無効なトークンです"
                    }
                });
            }

            var (logs, totalCount) = await _entryExitService.GetLogsAsync(
                nurseryId, fromDate, toDate, parentName, entryType, page, pageSize);

            return Ok(new ApiResponse<EntryExitLogListResponse>
            {
                Success = true,
                Data = new EntryExitLogListResponse
                {
                    Logs = logs,
                    TotalCount = totalCount,
                    Page = page,
                    PageSize = pageSize
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving entry/exit logs");
            return StatusCode(StatusCodes.Status500InternalServerError, new ApiResponse<object>
            {
                Success = false,
                Error = new ApiError
                {
                    Code = "SERVER_ERROR",
                    Message = "入退ログの取得中にエラーが発生しました"
                }
            });
        }
    }

    /// <summary>
    /// 入退ログ削除
    /// 指定されたログIDの入退ログを削除
    /// </summary>
    /// <param name="id">削除対象のログID</param>
    /// <returns>削除結果</returns>
    [HttpDelete("{id}")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> DeleteLog(int id)
    {
        try
        {
            // JWTトークンから保育園IDを取得
            var nurseryIdClaim = User.FindFirst("NurseryId")?.Value;
            if (string.IsNullOrEmpty(nurseryIdClaim) || !int.TryParse(nurseryIdClaim, out var nurseryId))
            {
                return Unauthorized(new ApiResponse<object>
                {
                    Success = false,
                    Error = new ApiError
                    {
                        Code = "AUTH_INVALID_TOKEN",
                        Message = "無効なトークンです"
                    }
                });
            }

            await _entryExitService.DeleteLogAsync(id, nurseryId);

            _logger.LogInformation("Entry/Exit log deleted: LogId={LogId}", id);

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Data = new { Message = "入退ログを削除しました" }
            });
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogWarning(ex, "Entry/Exit log not found: LogId={LogId}", id);
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
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting entry/exit log: LogId={LogId}", id);
            return StatusCode(StatusCodes.Status500InternalServerError, new ApiResponse<object>
            {
                Success = false,
                Error = new ApiError
                {
                    Code = "SERVER_ERROR",
                    Message = "入退ログの削除中にエラーが発生しました"
                }
            });
        }
    }
}

/// <summary>
/// 入退ログ一覧レスポンスDTO
/// </summary>
public class EntryExitLogListResponse
{
    public List<EntryExitLogDto> Logs { get; set; } = new List<EntryExitLogDto>();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}

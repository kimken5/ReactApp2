using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using ReactApp.Server.DTOs.Desktop;
using ReactApp.Server.Services;

namespace ReactApp.Server.Controllers;

/// <summary>
/// 入園申込コントローラー（保護者向けWeb申込）
/// ApplicationKey検証、入園申込送信を提供
/// 認証不要（公開API）
/// </summary>
[ApiController]
[Route("api/application")]
[AllowAnonymous]
public class ApplicationController : ControllerBase
{
    private readonly IApplicationService _applicationService;
    private readonly ILogger<ApplicationController> _logger;

    public ApplicationController(
        IApplicationService applicationService,
        ILogger<ApplicationController> logger)
    {
        _applicationService = applicationService;
        _logger = logger;
    }

    /// <summary>
    /// ApplicationKey検証
    /// </summary>
    /// <param name="request">検証リクエスト</param>
    /// <returns>検証結果</returns>
    [HttpPost("validate-key")]
    [ProducesResponseType(typeof(ApiResponse<ValidateApplicationKeyResult>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ValidateKey([FromBody] ValidateApplicationKeyRequest request)
    {
        try
        {
            var result = await _applicationService.ValidateApplicationKeyAsync(request.ApplicationKey);

            if (!result.IsValid)
            {
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Error = new ApiError
                    {
                        Code = "INVALID_APPLICATION_KEY",
                        Message = "無効な申込キーです。"
                    }
                });
            }

            return Ok(new ApiResponse<ValidateApplicationKeyResult>
            {
                Success = true,
                Data = result
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "ApplicationKey検証エラー: {Key}", request.ApplicationKey);
            return StatusCode(StatusCodes.Status500InternalServerError, new ApiResponse<object>
            {
                Success = false,
                Error = new ApiError
                {
                    Code = "SERVER_ERROR",
                    Message = "検証処理中にエラーが発生しました"
                }
            });
        }
    }

    /// <summary>
    /// 入園申込送信
    /// </summary>
    /// <param name="request">申込情報</param>
    /// <param name="key">申込キー（クエリパラメータ）</param>
    /// <returns>作成された申込ID</returns>
    [HttpPost("submit")]
    [EnableRateLimiting("application-submit")]
    [ProducesResponseType(typeof(ApiResponse<ApplicationSubmitResult>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status429TooManyRequests)]
    public async Task<IActionResult> Submit([FromBody] CreateApplicationRequest request, [FromQuery] string key)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(key))
            {
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Error = new ApiError
                    {
                        Code = "MISSING_APPLICATION_KEY",
                        Message = "申込キーが指定されていません。"
                    }
                });
            }

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

            var applicationId = await _applicationService.CreateApplicationAsync(request, key);

            _logger.LogInformation(
                "入園申込を受け付けました。ApplicationId: {Id}, ChildName: {ChildName}",
                applicationId, request.ChildName);

            return CreatedAtAction(
                nameof(Submit),
                new { id = applicationId },
                new ApiResponse<ApplicationSubmitResult>
                {
                    Success = true,
                    Data = new ApplicationSubmitResult
                    {
                        ApplicationId = applicationId,
                        Message = "入園申込を受け付けました。保育園からの連絡をお待ちください。"
                    }
                });
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("無効"))
        {
            _logger.LogWarning(ex, "無効なApplicationKeyによる申込: {Key}", key);
            return NotFound(new ApiResponse<object>
            {
                Success = false,
                Error = new ApiError
                {
                    Code = "INVALID_APPLICATION_KEY",
                    Message = ex.Message
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "入園申込送信エラー: {Key}", key);
            return StatusCode(StatusCodes.Status500InternalServerError, new ApiResponse<object>
            {
                Success = false,
                Error = new ApiError
                {
                    Code = "SERVER_ERROR",
                    Message = "申込処理中にエラーが発生しました"
                }
            });
        }
    }
}

/// <summary>
/// 申込送信結果DTO
/// </summary>
public class ApplicationSubmitResult
{
    public int ApplicationId { get; set; }
    public string Message { get; set; } = string.Empty;
}

/// <summary>
/// API統一レスポンス形式（file-scoped）
/// </summary>
file class ApiResponse<T>
{
    public bool Success { get; set; }
    public T? Data { get; set; }
    public ApiError? Error { get; set; }
}

/// <summary>
/// APIエラー情報（file-scoped）
/// </summary>
file class ApiError
{
    public string Code { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public List<string>? Details { get; set; }
}

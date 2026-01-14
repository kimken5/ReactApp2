using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using ReactApp.Server.DTOs;
using ReactApp.Server.DTOs.Desktop;
using ReactApp.Server.Services;
using System.Security.Claims;

namespace ReactApp.Server.Controllers;

/// <summary>
/// デスクトップアプリ認証コントローラー
/// ログインID・パスワード認証、トークン管理、パスワード変更、入退管理用認証を提供
/// </summary>
[ApiController]
[Route("api/desktop/auth")]
[EnableRateLimiting("auth")]
public class DesktopAuthController : ControllerBase
{
    private readonly IDesktopAuthenticationService _authService;
    private readonly IAuthenticationService _mobileAuthService;
    private readonly ILogger<DesktopAuthController> _logger;

    public DesktopAuthController(
        IDesktopAuthenticationService authService,
        IAuthenticationService mobileAuthService,
        ILogger<DesktopAuthController> logger)
    {
        _authService = authService;
        _mobileAuthService = mobileAuthService;
        _logger = logger;
    }

    /// <summary>
    /// ログイン
    /// </summary>
    /// <param name="request">ログインリクエスト</param>
    /// <returns>JWTトークンと保育園情報</returns>
    [HttpPost("login")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<DesktopLoginResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status423Locked)]
    public async Task<IActionResult> Login([FromBody] DesktopLoginRequestDto request)
    {
        try
        {
            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
            var userAgent = Request.Headers["User-Agent"].ToString();

            var response = await _authService.LoginAsync(request, ipAddress, userAgent);

            _logger.LogInformation("Desktop login successful for LoginId: {LoginId}", request.LoginId);

            return Ok(new ApiResponse<DesktopLoginResponseDto>
            {
                Success = true,
                Data = response
            });
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Desktop login failed for LoginId: {LoginId}", request.LoginId);
            return Unauthorized(new ApiResponse<object>
            {
                Success = false,
                Error = new ApiError
                {
                    Code = "AUTH_INVALID_CREDENTIALS",
                    Message = ex.Message
                }
            });
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("ロック"))
        {
            _logger.LogWarning(ex, "Desktop login failed: Account locked for LoginId: {LoginId}", request.LoginId);
            return StatusCode(StatusCodes.Status423Locked, new ApiResponse<object>
            {
                Success = false,
                Error = new ApiError
                {
                    Code = "AUTH_ACCOUNT_LOCKED",
                    Message = ex.Message
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Desktop login error for LoginId: {LoginId}", request.LoginId);
            return StatusCode(StatusCodes.Status500InternalServerError, new ApiResponse<object>
            {
                Success = false,
                Error = new ApiError
                {
                    Code = "SERVER_ERROR",
                    Message = "ログイン処理中にエラーが発生しました"
                }
            });
        }
    }

    /// <summary>
    /// リフレッシュトークン
    /// </summary>
    /// <param name="request">リフレッシュトークンリクエスト</param>
    /// <returns>新しいJWTトークン</returns>
    [HttpPost("refresh")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<DesktopLoginResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequestDto request)
    {
        try
        {
            var response = await _authService.RefreshTokenAsync(request);

            _logger.LogInformation("Token refreshed successfully");

            return Ok(new ApiResponse<DesktopLoginResponseDto>
            {
                Success = true,
                Data = response
            });
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Token refresh failed");
            return Unauthorized(new ApiResponse<object>
            {
                Success = false,
                Error = new ApiError
                {
                    Code = "AUTH_TOKEN_EXPIRED",
                    Message = ex.Message
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Token refresh error");
            return StatusCode(StatusCodes.Status500InternalServerError, new ApiResponse<object>
            {
                Success = false,
                Error = new ApiError
                {
                    Code = "SERVER_ERROR",
                    Message = "トークン更新中にエラーが発生しました"
                }
            });
        }
    }

    /// <summary>
    /// ログアウト
    /// </summary>
    /// <param name="request">リフレッシュトークンリクエスト</param>
    /// <returns>成功メッセージ</returns>
    [HttpPost("logout")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Logout([FromBody] RefreshTokenRequestDto request)
    {
        try
        {
            await _authService.LogoutAsync(request.RefreshToken);

            _logger.LogInformation("Logout successful");

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "ログアウトしました"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Logout error");
            return StatusCode(StatusCodes.Status500InternalServerError, new ApiResponse<object>
            {
                Success = false,
                Error = new ApiError
                {
                    Code = "SERVER_ERROR",
                    Message = "ログアウト処理中にエラーが発生しました"
                }
            });
        }
    }

    /// <summary>
    /// パスワード変更
    /// </summary>
    /// <param name="request">パスワード変更リクエスト</param>
    /// <returns>成功メッセージ</returns>
    [HttpPut("change-password")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequestDto request)
    {
        try
        {
            var nurseryIdClaim = User.FindFirst("NurseryId")?.Value;
            if (string.IsNullOrEmpty(nurseryIdClaim) || !int.TryParse(nurseryIdClaim, out var nurseryId))
            {
                return Unauthorized(new ApiResponse<object>
                {
                    Success = false,
                    Error = new ApiError
                    {
                        Code = "AUTH_TOKEN_INVALID",
                        Message = "認証トークンが無効です"
                    }
                });
            }

            await _authService.ChangePasswordAsync(nurseryId, request);

            _logger.LogInformation("Password changed successfully for NurseryId: {NurseryId}", nurseryId);

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "パスワードを変更しました"
            });
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Password change failed: Invalid current password");
            return Unauthorized(new ApiResponse<object>
            {
                Success = false,
                Error = new ApiError
                {
                    Code = "AUTH_INVALID_PASSWORD",
                    Message = ex.Message
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Password change error");
            return StatusCode(StatusCodes.Status500InternalServerError, new ApiResponse<object>
            {
                Success = false,
                Error = new ApiError
                {
                    Code = "SERVER_ERROR",
                    Message = "パスワード変更中にエラーが発生しました"
                }
            });
        }
    }

    /// <summary>
    /// アカウントロック状態確認
    /// </summary>
    /// <param name="nurseryId">保育園ID</param>
    /// <returns>ロック状態</returns>
    [HttpGet("lock-status/{nurseryId}")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetLockStatus(int nurseryId)
    {
        try
        {
            var (isLocked, lockedUntil) = await _authService.CheckAccountLockStatusAsync(nurseryId);

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Data = new
                {
                    IsLocked = isLocked,
                    LockedUntil = lockedUntil
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking lock status for NurseryId: {NurseryId}", nurseryId);
            return StatusCode(StatusCodes.Status500InternalServerError, new ApiResponse<object>
            {
                Success = false,
                Error = new ApiError
                {
                    Code = "SERVER_ERROR",
                    Message = "ロック状態確認中にエラーが発生しました"
                }
            });
        }
    }

    /// <summary>
    /// アカウントロック解除（管理者用）
    /// </summary>
    /// <param name="nurseryId">保育園ID</param>
    /// <returns>成功メッセージ</returns>
    [HttpPost("unlock/{nurseryId}")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> UnlockAccount(int nurseryId)
    {
        try
        {
            await _authService.UnlockAccountAsync(nurseryId);

            _logger.LogInformation("Account unlocked for NurseryId: {NurseryId}", nurseryId);

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "アカウントのロックを解除しました"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error unlocking account for NurseryId: {NurseryId}", nurseryId);
            return StatusCode(StatusCodes.Status500InternalServerError, new ApiResponse<object>
            {
                Success = false,
                Error = new ApiError
                {
                    Code = "SERVER_ERROR",
                    Message = "アカウントロック解除中にエラーが発生しました"
                }
            });
        }
    }

    /// <summary>
    /// 入退管理用ログイン
    /// タブレット端末から入退管理画面へのログインを処理
    /// </summary>
    /// <param name="request">入退管理用ログインリクエスト</param>
    /// <returns>JWTトークンと保育園情報</returns>
    [HttpPost("entry-exit-login")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<EntryExitLoginResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> EntryExitLogin([FromBody] EntryExitLoginRequest request)
    {
        try
        {
            var response = await _mobileAuthService.EntryExitLoginAsync(request);

            _logger.LogInformation("Entry/Exit login successful for NurseryId: {NurseryId}", response.NurseryId);

            return Ok(new ApiResponse<EntryExitLoginResponse>
            {
                Success = true,
                Data = response
            });
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Entry/Exit login failed for LoginId: {LoginId}", request.LoginId);
            return Unauthorized(new ApiResponse<object>
            {
                Success = false,
                Error = new ApiError
                {
                    Code = "AUTH_INVALID_CREDENTIALS",
                    Message = ex.Message
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Entry/Exit login error for LoginId: {LoginId}", request.LoginId);
            return StatusCode(StatusCodes.Status500InternalServerError, new ApiResponse<object>
            {
                Success = false,
                Error = new ApiError
                {
                    Code = "SERVER_ERROR",
                    Message = "ログイン処理中にエラーが発生しました"
                }
            });
        }
    }

    /// <summary>
    /// ハートビート（トークン更新）
    /// 入退管理画面のセッション維持用に定期的にトークンを更新
    /// </summary>
    /// <returns>新しいJWTトークンと有効期限</returns>
    [HttpPost("heartbeat")]
    [Authorize(Roles = "EntryExit")]
    [EnableRateLimiting("heartbeat")]
    [ProducesResponseType(typeof(ApiResponse<HeartbeatResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Heartbeat()
    {
        try
        {
            // Authorizationヘッダーからトークンを取得
            var authHeader = Request.Headers["Authorization"].ToString();
            if (string.IsNullOrEmpty(authHeader) || !authHeader.StartsWith("Bearer "))
            {
                return Unauthorized(new ApiResponse<object>
                {
                    Success = false,
                    Error = new ApiError
                    {
                        Code = "AUTH_TOKEN_MISSING",
                        Message = "認証トークンが見つかりません"
                    }
                });
            }

            var currentToken = authHeader.Substring("Bearer ".Length).Trim();
            var response = await _mobileAuthService.HeartbeatAsync(currentToken);

            _logger.LogDebug("Heartbeat successful, token refreshed");

            return Ok(new ApiResponse<HeartbeatResponse>
            {
                Success = true,
                Data = response
            });
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Heartbeat failed: Invalid token");
            return Unauthorized(new ApiResponse<object>
            {
                Success = false,
                Error = new ApiError
                {
                    Code = "AUTH_TOKEN_INVALID",
                    Message = ex.Message
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Heartbeat error");
            return StatusCode(StatusCodes.Status500InternalServerError, new ApiResponse<object>
            {
                Success = false,
                Error = new ApiError
                {
                    Code = "SERVER_ERROR",
                    Message = "ハートビート処理中にエラーが発生しました"
                }
            });
        }
    }
}

/// <summary>
/// API統一レスポンス形式
/// </summary>
public class ApiResponse<T>
{
    public bool Success { get; set; }
    public T? Data { get; set; }
    public string? Message { get; set; }
    public ApiError? Error { get; set; }
}

/// <summary>
/// APIエラー情報
/// </summary>
public class ApiError
{
    public string Code { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public List<string>? Details { get; set; }
}

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using ReactApp.Server.Data;
using ReactApp.Server.DTOs.Desktop;
using ReactApp.Server.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using ReactApp.Server.Helpers;

namespace ReactApp.Server.Services;

/// <summary>
/// デスクトップアプリ専用認証サービス実装
/// ログインID・パスワード認証、JWT トークン管理、アカウントロック機能を提供
/// </summary>
public class DesktopAuthenticationService : IDesktopAuthenticationService
{
    private readonly KindergartenDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly ILogger<DesktopAuthenticationService> _logger;

    private const int MaxLoginAttempts = 5;
    private const int LockoutMinutes = 30;
    private const int AccessTokenExpiryHours = 1;
    private const int RefreshTokenExpiryDays = 7;

    public DesktopAuthenticationService(
        KindergartenDbContext context,
        IConfiguration configuration,
        ILogger<DesktopAuthenticationService> logger)
    {
        _context = context;
        _configuration = configuration;
        _logger = logger;
    }

    /// <summary>
    /// ログインID・パスワードでログイン
    /// </summary>
    public async Task<DesktopLoginResponseDto> LoginAsync(
        DesktopLoginRequestDto request,
        string? ipAddress,
        string? userAgent)
    {
        _logger.LogInformation("Desktop login attempt for LoginId: {LoginId} from IP: {IpAddress}",
            request.LoginId, ipAddress);

        // 保育園を検索
        var nursery = await _context.Nurseries
            .FirstOrDefaultAsync(n => n.LoginId == request.LoginId);

        if (nursery == null)
        {
            _logger.LogWarning("Login failed: Nursery not found for LoginId: {LoginId}", request.LoginId);
            throw new UnauthorizedAccessException("ログインIDまたはパスワードが正しくありません");
        }

        // アカウントロック状態を確認
        if (nursery.IsLocked && nursery.LockedUntil.HasValue && nursery.LockedUntil.Value > DateTimeHelper.GetJstNow())
        {
            var remainingMinutes = (int)(nursery.LockedUntil.Value - DateTimeHelper.GetJstNow()).TotalMinutes;
            _logger.LogWarning("Login failed: Account locked for NurseryId: {NurseryId}, remaining: {Minutes} minutes",
                nursery.Id, remainingMinutes);
            throw new InvalidOperationException($"アカウントがロックされています。{remainingMinutes}分後に再試行してください");
        }

        // ロック期限が過ぎている場合はロック解除
        if (nursery.IsLocked && nursery.LockedUntil.HasValue && nursery.LockedUntil.Value <= DateTimeHelper.GetJstNow())
        {
            nursery.IsLocked = false;
            nursery.LockedUntil = null;
            nursery.LoginAttempts = 0;
            await _context.SaveChangesAsync();
            _logger.LogInformation("Account lock expired and reset for NurseryId: {NurseryId}", nursery.Id);
        }

        // パスワード検証（平文比較）
        _logger.LogInformation("DEBUG: Verifying password for NurseryId: {NurseryId}, InputPassword: {InputPassword}, StoredPassword: {StoredPassword}",
            nursery.Id, request.Password, nursery.Password);
        
        if (string.IsNullOrEmpty(nursery.Password) || nursery.Password != request.Password)
        {
            // ログイン試行回数を増やす
            nursery.LoginAttempts++;

            // 最大試行回数に達した場合はアカウントをロック
            if (nursery.LoginAttempts >= MaxLoginAttempts)
            {
                nursery.IsLocked = true;
                nursery.LockedUntil = DateTimeHelper.GetJstNow().AddMinutes(LockoutMinutes);
                await _context.SaveChangesAsync();

                _logger.LogWarning("Account locked due to max login attempts for NurseryId: {NurseryId}", nursery.Id);
                throw new InvalidOperationException($"ログイン試行回数が上限に達しました。{LockoutMinutes}分後に再試行してください");
            }

            await _context.SaveChangesAsync();

            var remainingAttempts = MaxLoginAttempts - nursery.LoginAttempts;
            _logger.LogWarning("Login failed: Invalid password for NurseryId: {NurseryId}, remaining attempts: {Remaining}",
                nursery.Id, remainingAttempts);
            throw new UnauthorizedAccessException($"ログインIDまたはパスワードが正しくありません（残り試行回数: {remainingAttempts}回）");
        }

        // ログイン成功 - 試行回数をリセット
        nursery.LoginAttempts = 0;
        nursery.LastLoginAt = DateTimeHelper.GetJstNow();
        await _context.SaveChangesAsync();

        _logger.LogInformation("Login successful for NurseryId: {NurseryId}", nursery.Id);

        // JWTトークン生成
        var accessToken = GenerateAccessToken(nursery);
        var refreshToken = await GenerateAndSaveRefreshTokenAsync(nursery.Id, ipAddress, userAgent);

        // 監査ログ記録
        await CreateAuditLogAsync(nursery.Id, "Login", "Nursery", nursery.Id.ToString(), null, null, ipAddress, userAgent);

        return new DesktopLoginResponseDto
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            ExpiresIn = AccessTokenExpiryHours * 3600,
            Nursery = new NurseryInfoDto
            {
                Id = nursery.Id,
                Name = nursery.Name,
                LogoUrl = nursery.LogoUrl,
                CurrentAcademicYear = nursery.CurrentAcademicYear
            }
        };
    }

    /// <summary>
    /// リフレッシュトークンで新しいアクセストークンを発行
    /// </summary>
    public async Task<DesktopLoginResponseDto> RefreshTokenAsync(RefreshTokenRequestDto request)
    {
        _logger.LogInformation("Refresh token request received");

        var storedToken = await _context.RefreshTokens
            .FirstOrDefaultAsync(rt => rt.Token == request.RefreshToken
                && !rt.IsRevoked
                && rt.ExpiresAt > DateTimeHelper.GetJstNow());

        if (storedToken == null)
        {
            _logger.LogWarning("Refresh token invalid or expired");
            throw new UnauthorizedAccessException("リフレッシュトークンが無効または期限切れです");
        }

        // 保育園情報を取得
        var nursery = await _context.Nurseries.FindAsync(storedToken.ParentId);
        if (nursery == null)
        {
            _logger.LogWarning("Nursery not found for refresh token");
            throw new UnauthorizedAccessException("保育園が見つかりません");
        }

        // 新しいアクセストークンを生成
        var newAccessToken = GenerateAccessToken(nursery);
        var newRefreshToken = await GenerateAndSaveRefreshTokenAsync(
            nursery.Id,
            storedToken.ClientIpAddress,
            storedToken.UserAgent);

        // 古いリフレッシュトークンを無効化
        storedToken.IsRevoked = true;
        storedToken.RevokedAt = DateTimeHelper.GetJstNow();
        await _context.SaveChangesAsync();

        _logger.LogInformation("Token refreshed successfully for NurseryId: {NurseryId}", nursery.Id);

        return new DesktopLoginResponseDto
        {
            AccessToken = newAccessToken,
            RefreshToken = newRefreshToken,
            ExpiresIn = AccessTokenExpiryHours * 3600,
            Nursery = new NurseryInfoDto
            {
                Id = nursery.Id,
                Name = nursery.Name,
                LogoUrl = nursery.LogoUrl,
                CurrentAcademicYear = nursery.CurrentAcademicYear
            }
        };
    }

    /// <summary>
    /// ログアウト（リフレッシュトークンを無効化）
    /// </summary>
    public async Task LogoutAsync(string refreshToken)
    {
        _logger.LogInformation("Logout request received");

        var storedToken = await _context.RefreshTokens
            .FirstOrDefaultAsync(rt => rt.Token == refreshToken && !rt.IsRevoked);

        if (storedToken != null)
        {
            storedToken.IsRevoked = true;
            storedToken.RevokedAt = DateTimeHelper.GetJstNow();
            await _context.SaveChangesAsync();

            _logger.LogInformation("Logout successful for NurseryId: {NurseryId}", storedToken.ParentId);

            // 監査ログ記録
            await CreateAuditLogAsync(storedToken.ParentId ?? 0, "Logout", "Nursery",
                storedToken.ParentId?.ToString() ?? "", null, null, null, null);
        }
    }

    /// <summary>
    /// パスワード変更
    /// </summary>
    public async Task ChangePasswordAsync(int nurseryId, ChangePasswordRequestDto request)
    {
        _logger.LogInformation("Password change request for NurseryId: {NurseryId}", nurseryId);

        var nursery = await _context.Nurseries.FindAsync(nurseryId);
        if (nursery == null)
        {
            throw new InvalidOperationException("保育園が見つかりません");
        }

        // 現在のパスワードを検証（平文比較）
        if (string.IsNullOrEmpty(nursery.Password) || nursery.Password != request.CurrentPassword)
        {
            _logger.LogWarning("Password change failed: Invalid current password for NurseryId: {NurseryId}", nurseryId);
            throw new UnauthorizedAccessException("現在のパスワードが正しくありません");
        }

        // 新しいパスワードを平文で保存
        nursery.Password = request.NewPassword;
        nursery.UpdatedAt = DateTimeHelper.GetJstNow();
        await _context.SaveChangesAsync();

        _logger.LogInformation("Password changed successfully for NurseryId: {NurseryId}", nurseryId);

        // 監査ログ記録
        await CreateAuditLogAsync(nurseryId, "ChangePassword", "Nursery", nurseryId.ToString(), null, null, null, null);
    }

    /// <summary>
    /// アカウントロック状態を確認
    /// </summary>
    public async Task<(bool IsLocked, DateTime? LockedUntil)> CheckAccountLockStatusAsync(int nurseryId)
    {
        var nursery = await _context.Nurseries.FindAsync(nurseryId);
        if (nursery == null)
        {
            throw new InvalidOperationException("保育園が見つかりません");
        }

        return (nursery.IsLocked, nursery.LockedUntil);
    }

    /// <summary>
    /// ログイン試行回数をリセット
    /// </summary>
    public async Task ResetLoginAttemptsAsync(int nurseryId)
    {
        var nursery = await _context.Nurseries.FindAsync(nurseryId);
        if (nursery != null)
        {
            nursery.LoginAttempts = 0;
            await _context.SaveChangesAsync();
            _logger.LogInformation("Login attempts reset for NurseryId: {NurseryId}", nurseryId);
        }
    }

    /// <summary>
    /// アカウントロックを解除
    /// </summary>
    public async Task UnlockAccountAsync(int nurseryId)
    {
        var nursery = await _context.Nurseries.FindAsync(nurseryId);
        if (nursery != null)
        {
            nursery.IsLocked = false;
            nursery.LockedUntil = null;
            nursery.LoginAttempts = 0;
            await _context.SaveChangesAsync();
            _logger.LogInformation("Account unlocked for NurseryId: {NurseryId}", nurseryId);

            // 監査ログ記録
            await CreateAuditLogAsync(nurseryId, "UnlockAccount", "Nursery", nurseryId.ToString(), null, null, null, null);
        }
    }

    // ===== プライベートヘルパーメソッド =====

    /// <summary>
    /// JWTアクセストークンを生成
    /// </summary>
    private string GenerateAccessToken(Nursery nursery)
    {
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, nursery.Id.ToString()),
            new Claim(ClaimTypes.Name, nursery.Name),
            new Claim("NurseryId", nursery.Id.ToString()),
            new Claim("LoginId", nursery.LoginId ?? ""),
            new Claim("UserType", "Desktop"),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(
            _configuration["Jwt:SecretKey"] ?? throw new InvalidOperationException("JWT SecretKey not configured")));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: claims,
            expires: DateTimeHelper.GetJstNow().AddHours(AccessTokenExpiryHours),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    /// <summary>
    /// リフレッシュトークンを生成してデータベースに保存
    /// </summary>
    private async Task<string> GenerateAndSaveRefreshTokenAsync(int nurseryId, string? ipAddress, string? userAgent)
    {
        var refreshToken = new RefreshToken
        {
            Token = GenerateSecureToken(),
            JwtId = Guid.NewGuid().ToString(),
            ParentId = nurseryId,
            CreatedAt = DateTimeHelper.GetJstNow(),
            ExpiresAt = DateTimeHelper.GetJstNow().AddDays(RefreshTokenExpiryDays),
            IsRevoked = false,
            ClientIpAddress = ipAddress,
            UserAgent = userAgent
        };

        _context.RefreshTokens.Add(refreshToken);
        await _context.SaveChangesAsync();

        return refreshToken.Token;
    }

    /// <summary>
    /// 安全なランダムトークンを生成
    /// </summary>
    private static string GenerateSecureToken()
    {
        var randomBytes = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomBytes);
        return Convert.ToBase64String(randomBytes);
    }

    /// <summary>
    /// 監査ログを作成
    /// </summary>
    private async Task CreateAuditLogAsync(
        int nurseryId,
        string action,
        string entityType,
        string entityId,
        string? beforeValue,
        string? afterValue,
        string? ipAddress,
        string? userAgent)
    {
        var auditLog = new AuditLog
        {
            NurseryId = nurseryId,
            UserId = nurseryId,
            UserName = "Desktop Admin",
            Action = action,
            EntityType = entityType,
            EntityId = entityId,
            BeforeValue = beforeValue,
            AfterValue = afterValue,
            IpAddress = ipAddress,
            UserAgent = userAgent,
            Timestamp = DateTimeHelper.GetJstNow()
        };

        _context.AuditLogs.Add(auditLog);
        await _context.SaveChangesAsync();
    }
}

using ReactApp.Server.DTOs.Desktop;

namespace ReactApp.Server.Services;

/// <summary>
/// デスクトップアプリ専用認証サービスインターフェース
/// ログインID・パスワード認証、JWT トークン管理、アカウントロック機能を提供
/// </summary>
public interface IDesktopAuthenticationService
{
    /// <summary>
    /// ログインID・パスワードでログイン
    /// </summary>
    /// <param name="request">ログインリクエスト</param>
    /// <param name="ipAddress">IPアドレス</param>
    /// <param name="userAgent">ユーザーエージェント</param>
    /// <returns>ログインレスポンス (JWTトークン含む)</returns>
    Task<DesktopLoginResponseDto> LoginAsync(
        DesktopLoginRequestDto request,
        string? ipAddress,
        string? userAgent);

    /// <summary>
    /// リフレッシュトークンで新しいアクセストークンを発行
    /// </summary>
    /// <param name="request">リフレッシュトークンリクエスト</param>
    /// <returns>新しいトークンペア</returns>
    Task<DesktopLoginResponseDto> RefreshTokenAsync(RefreshTokenRequestDto request);

    /// <summary>
    /// ログアウト（リフレッシュトークンを無効化）
    /// </summary>
    /// <param name="refreshToken">リフレッシュトークン</param>
    /// <returns></returns>
    Task LogoutAsync(string refreshToken);

    /// <summary>
    /// パスワード変更
    /// </summary>
    /// <param name="nurseryId">保育園ID</param>
    /// <param name="request">パスワード変更リクエスト</param>
    /// <returns></returns>
    Task ChangePasswordAsync(int nurseryId, ChangePasswordRequestDto request);

    /// <summary>
    /// アカウントロック状態を確認
    /// </summary>
    /// <param name="nurseryId">保育園ID</param>
    /// <returns>ロック中の場合true、ロック解除時刻</returns>
    Task<(bool IsLocked, DateTime? LockedUntil)> CheckAccountLockStatusAsync(int nurseryId);

    /// <summary>
    /// ログイン試行回数をリセット
    /// </summary>
    /// <param name="nurseryId">保育園ID</param>
    /// <returns></returns>
    Task ResetLoginAttemptsAsync(int nurseryId);

    /// <summary>
    /// アカウントロックを解除
    /// </summary>
    /// <param name="nurseryId">保育園ID</param>
    /// <returns></returns>
    Task UnlockAccountAsync(int nurseryId);
}

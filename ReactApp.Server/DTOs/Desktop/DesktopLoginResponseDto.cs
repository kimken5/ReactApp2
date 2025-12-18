namespace ReactApp.Server.DTOs.Desktop;

/// <summary>
/// デスクトップアプリログインレスポンスDTO
/// </summary>
public class DesktopLoginResponseDto
{
    /// <summary>
    /// JWTアクセストークン (1時間有効)
    /// </summary>
    public string AccessToken { get; set; } = string.Empty;

    /// <summary>
    /// リフレッシュトークン (7日間有効)
    /// </summary>
    public string RefreshToken { get; set; } = string.Empty;

    /// <summary>
    /// トークン有効期限 (秒)
    /// </summary>
    public int ExpiresIn { get; set; }

    /// <summary>
    /// 保育園情報
    /// </summary>
    public NurseryInfoDto Nursery { get; set; } = null!;
}

/// <summary>
/// 保育園情報DTO
/// </summary>
public class NurseryInfoDto
{
    /// <summary>
    /// 保育園ID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// 保育園名
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// 現在の年度
    /// </summary>
    public int CurrentAcademicYear { get; set; }

    /// <summary>
    /// 写真機能の利用可否（True: 利用可, False: 利用不可）
    /// </summary>
    public bool PhotoFunction { get; set; }
}

using System.ComponentModel.DataAnnotations;

namespace ReactApp.Server.DTOs.Desktop;

/// <summary>
/// リフレッシュトークンリクエストDTO
/// </summary>
public class RefreshTokenRequestDto
{
    /// <summary>
    /// リフレッシュトークン
    /// </summary>
    [Required(ErrorMessage = "リフレッシュトークンは必須です")]
    public string RefreshToken { get; set; } = string.Empty;
}

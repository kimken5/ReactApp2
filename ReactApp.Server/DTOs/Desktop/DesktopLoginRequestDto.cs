using System.ComponentModel.DataAnnotations;

namespace ReactApp.Server.DTOs.Desktop;

/// <summary>
/// デスクトップアプリログインリクエストDTO
/// </summary>
public class DesktopLoginRequestDto
{
    /// <summary>
    /// ログインID
    /// </summary>
    [Required(ErrorMessage = "ログインIDは必須です")]
    [StringLength(50, ErrorMessage = "ログインIDは50文字以内で入力してください")]
    public string LoginId { get; set; } = string.Empty;

    /// <summary>
    /// パスワード
    /// </summary>
    [Required(ErrorMessage = "パスワードは必須です")]
    [StringLength(255, MinimumLength = 8, ErrorMessage = "パスワードは8文字以上で入力してください")]
    public string Password { get; set; } = string.Empty;
}

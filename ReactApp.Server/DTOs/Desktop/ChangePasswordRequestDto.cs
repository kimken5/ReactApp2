using System.ComponentModel.DataAnnotations;

namespace ReactApp.Server.DTOs.Desktop;

/// <summary>
/// パスワード変更リクエストDTO
/// </summary>
public class ChangePasswordRequestDto
{
    /// <summary>
    /// 現在のパスワード
    /// </summary>
    [Required(ErrorMessage = "現在のパスワードは必須です")]
    public string CurrentPassword { get; set; } = string.Empty;

    /// <summary>
    /// 新しいパスワード
    /// </summary>
    [Required(ErrorMessage = "新しいパスワードは必須です")]
    [StringLength(255, MinimumLength = 8, ErrorMessage = "新しいパスワードは8文字以上で入力してください")]
    [RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$",
        ErrorMessage = "パスワードは大文字・小文字・数字を含む8文字以上で設定してください")]
    public string NewPassword { get; set; } = string.Empty;
}

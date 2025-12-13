using System.ComponentModel.DataAnnotations;

namespace ReactApp.Server.DTOs.Desktop;

/// <summary>
/// キーロックコード検証リクエストDTO
/// </summary>
public class VerifyKeyLockCodeRequestDto
{
    /// <summary>
    /// 入力された4桁のコード
    /// </summary>
    [Required(ErrorMessage = "コードは必須です")]
    [StringLength(4, MinimumLength = 4, ErrorMessage = "コードは4桁である必要があります")]
    [RegularExpression(@"^\d{4}$", ErrorMessage = "コードは4桁の数字である必要があります")]
    public string Code { get; set; } = string.Empty;
}

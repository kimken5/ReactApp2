using System.ComponentModel.DataAnnotations;

namespace ReactApp.Server.DTOs;

/// <summary>
/// 年度スライド実行リクエストDTO
/// </summary>
public class YearSlideRequestDto
{
    /// <summary>
    /// 保育園ID
    /// </summary>
    [Required(ErrorMessage = "保育園IDは必須です")]
    public int NurseryId { get; set; }

    /// <summary>
    /// スライド先の年度（新年度）
    /// </summary>
    [Required(ErrorMessage = "対象年度は必須です")]
    [Range(2000, 2100, ErrorMessage = "年度は2000年から2100年の範囲で指定してください")]
    public int TargetYear { get; set; }

    /// <summary>
    /// 実行確認フラグ（安全のため必須）
    /// </summary>
    [Required(ErrorMessage = "確認フラグは必須です")]
    public bool Confirmed { get; set; }

    /// <summary>
    /// 実行者ユーザーID
    /// </summary>
    public int ExecutedByUserId { get; set; }

    /// <summary>
    /// 備考
    /// </summary>
    [MaxLength(500, ErrorMessage = "備考は500文字以内で入力してください")]
    public string? Notes { get; set; }
}

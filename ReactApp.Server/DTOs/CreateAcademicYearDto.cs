using System.ComponentModel.DataAnnotations;

namespace ReactApp.Server.DTOs;

/// <summary>
/// 新規年度作成リクエストDTO
/// </summary>
public class CreateAcademicYearDto
{
    /// <summary>
    /// 保育園ID
    /// </summary>
    [Required(ErrorMessage = "保育園IDは必須です")]
    public int NurseryId { get; set; }

    /// <summary>
    /// 年度（西暦）
    /// </summary>
    [Required(ErrorMessage = "年度は必須です")]
    [Range(2000, 2100, ErrorMessage = "年度は2000年から2100年の範囲で指定してください")]
    public int Year { get; set; }

    /// <summary>
    /// 年度開始日（省略時は自動設定: 4月1日）
    /// </summary>
    public DateOnly? StartDate { get; set; }

    /// <summary>
    /// 年度終了日（省略時は自動設定: 翌年3月31日）
    /// </summary>
    public DateOnly? EndDate { get; set; }

    /// <summary>
    /// 未来年度として作成するか
    /// </summary>
    public bool IsFuture { get; set; } = false;

    /// <summary>
    /// 備考
    /// </summary>
    [MaxLength(500, ErrorMessage = "備考は500文字以内で入力してください")]
    public string? Notes { get; set; }
}

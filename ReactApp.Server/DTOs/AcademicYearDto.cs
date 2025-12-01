namespace ReactApp.Server.DTOs;

/// <summary>
/// 年度情報のDTO
/// </summary>
public class AcademicYearDto
{
    /// <summary>
    /// 保育園ID
    /// </summary>
    public int NurseryId { get; set; }

    /// <summary>
    /// 年度（西暦）
    /// </summary>
    public int Year { get; set; }

    /// <summary>
    /// 年度開始日
    /// </summary>
    public DateOnly StartDate { get; set; }

    /// <summary>
    /// 年度終了日
    /// </summary>
    public DateOnly EndDate { get; set; }

    /// <summary>
    /// 現在年度フラグ
    /// </summary>
    public bool IsCurrent { get; set; }

    /// <summary>
    /// 未来年度フラグ
    /// </summary>
    public bool IsFuture { get; set; }

    /// <summary>
    /// 備考
    /// </summary>
    public string? Notes { get; set; }

    /// <summary>
    /// 作成日時
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// 更新日時
    /// </summary>
    public DateTime? UpdatedAt { get; set; }
}

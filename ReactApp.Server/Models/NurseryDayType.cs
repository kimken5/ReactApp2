using System.ComponentModel.DataAnnotations;

namespace ReactApp.Server.Models;

/// <summary>
/// 休園日・休日保育管理エンティティ
/// 休園日と休日保育の日付を一元管理するデータモデル
/// </summary>
public class NurseryDayType
{
    /// <summary>
    /// ID（主キー、自動採番）
    /// </summary>
    [Key]
    public int Id { get; set; }

    /// <summary>
    /// 保育園ID（必須）
    /// </summary>
    [Required]
    [MaxLength(50)]
    public string NurseryId { get; set; } = string.Empty;

    /// <summary>
    /// 日付（必須）
    /// </summary>
    [Required]
    public DateOnly Date { get; set; }

    /// <summary>
    /// 日付種別（必須）
    /// ClosedDay: 休園日
    /// HolidayCare: 休日保育
    /// </summary>
    [Required]
    [MaxLength(20)]
    public string DayType { get; set; } = string.Empty;

    /// <summary>
    /// 作成者ID（必須）
    /// </summary>
    [Required]
    public int CreatedBy { get; set; }

    /// <summary>
    /// 作成日時（必須）
    /// </summary>
    [Required]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// 更新日時（必須）
    /// </summary>
    [Required]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

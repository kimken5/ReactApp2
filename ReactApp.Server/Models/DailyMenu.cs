using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ReactApp.Server.Models;

/// <summary>
/// 日別献立
/// </summary>
[Table("DailyMenus")]
public class DailyMenu
{
    /// <summary>
    /// 日別献立ID
    /// </summary>
    [Key]
    public int Id { get; set; }

    /// <summary>
    /// 保育園ID
    /// </summary>
    [Required]
    public int NurseryId { get; set; }

    /// <summary>
    /// 提供日
    /// </summary>
    [Required]
    [Column(TypeName = "date")]
    public DateTime MenuDate { get; set; }

    /// <summary>
    /// 種類（Lunch/MorningSnack/AfternoonSnack）
    /// </summary>
    [Required]
    [MaxLength(50)]
    public string MenuType { get; set; } = string.Empty;

    /// <summary>
    /// 献立マスターID
    /// </summary>
    [Required]
    public int MenuMasterId { get; set; }

    /// <summary>
    /// 表示順（同じ日・種類内での並び順）
    /// </summary>
    [Required]
    public int SortOrder { get; set; }

    /// <summary>
    /// 当日の特記事項
    /// </summary>
    [MaxLength(500)]
    public string? Notes { get; set; }

    /// <summary>
    /// 作成日時
    /// </summary>
    [Required]
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// 更新日時
    /// </summary>
    [Required]
    public DateTime UpdatedAt { get; set; }
}

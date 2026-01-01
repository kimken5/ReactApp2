using System.ComponentModel.DataAnnotations;

namespace ReactApp.Server.DTOs.Desktop;

/// <summary>
/// 日別献立一括作成DTO
/// </summary>
public class BulkCreateDailyMenusDto
{
    /// <summary>
    /// 提供日
    /// </summary>
    [Required(ErrorMessage = "提供日は必須です")]
    public DateTime MenuDate { get; set; }

    /// <summary>
    /// 午前のおやつ
    /// </summary>
    public List<DailyMenuItemDto> MorningSnacks { get; set; } = new();

    /// <summary>
    /// 給食
    /// </summary>
    public List<DailyMenuItemDto> Lunches { get; set; } = new();

    /// <summary>
    /// 午後のおやつ
    /// </summary>
    public List<DailyMenuItemDto> AfternoonSnacks { get; set; } = new();
}

/// <summary>
/// 日別献立項目DTO
/// </summary>
public class DailyMenuItemDto
{
    /// <summary>
    /// 献立マスターID
    /// </summary>
    [Required(ErrorMessage = "献立マスターIDは必須です")]
    public int MenuMasterId { get; set; }

    /// <summary>
    /// 表示順
    /// </summary>
    public int SortOrder { get; set; }

    /// <summary>
    /// 当日の特記事項
    /// </summary>
    [MaxLength(500, ErrorMessage = "特記事項は500文字以内で入力してください")]
    public string? Notes { get; set; }
}

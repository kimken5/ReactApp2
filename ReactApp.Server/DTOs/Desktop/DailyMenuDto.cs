namespace ReactApp.Server.DTOs.Desktop;

/// <summary>
/// 日別献立DTO
/// </summary>
public class DailyMenuDto
{
    /// <summary>
    /// 日別献立ID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// 保育園ID
    /// </summary>
    public int NurseryId { get; set; }

    /// <summary>
    /// 提供日
    /// </summary>
    public DateTime MenuDate { get; set; }

    /// <summary>
    /// 種類（Lunch/MorningSnack/AfternoonSnack）
    /// </summary>
    public string MenuType { get; set; } = string.Empty;

    /// <summary>
    /// 献立マスターID
    /// </summary>
    public int MenuMasterId { get; set; }

    /// <summary>
    /// 献立名（MenuMasterから取得）
    /// </summary>
    public string MenuName { get; set; } = string.Empty;

    /// <summary>
    /// 食材名（MenuMasterから取得）
    /// </summary>
    public string? IngredientName { get; set; }

    /// <summary>
    /// アレルゲンID（MenuMasterから取得、カンマ区切りID：例：3,28）
    /// </summary>
    public string? Allergens { get; set; }

    /// <summary>
    /// アレルゲン名（表示用、カンマ区切り：例：小麦, ゼラチン）
    /// </summary>
    public string? AllergenNames { get; set; }

    /// <summary>
    /// 説明・備考（MenuMasterから取得）
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// 表示順（同じ日・種類内での並び順）
    /// </summary>
    public int SortOrder { get; set; }

    /// <summary>
    /// 当日の特記事項
    /// </summary>
    public string? Notes { get; set; }

    /// <summary>
    /// 作成日時
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// 更新日時
    /// </summary>
    public DateTime UpdatedAt { get; set; }
}

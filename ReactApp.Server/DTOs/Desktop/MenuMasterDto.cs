namespace ReactApp.Server.DTOs.Desktop;

/// <summary>
/// 献立マスターDTO
/// </summary>
public class MenuMasterDto
{
    /// <summary>
    /// 献立ID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// 保育園ID
    /// </summary>
    public int NurseryId { get; set; }

    /// <summary>
    /// 献立名
    /// </summary>
    public string MenuName { get; set; } = string.Empty;

    /// <summary>
    /// 食材名（例：豚肉、じゃがいも、カレールウ）
    /// </summary>
    public string? IngredientName { get; set; }

    /// <summary>
    /// アレルゲン（カンマ区切りID：例：3,28）
    /// </summary>
    public string? Allergens { get; set; }

    /// <summary>
    /// アレルゲン名（表示用、カンマ区切り：例：小麦, ゼラチン）
    /// </summary>
    public string? AllergenNames { get; set; }

    /// <summary>
    /// 説明・備考
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// 作成日時
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// 更新日時
    /// </summary>
    public DateTime UpdatedAt { get; set; }
}

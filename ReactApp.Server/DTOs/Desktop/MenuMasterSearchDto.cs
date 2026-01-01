namespace ReactApp.Server.DTOs.Desktop;

/// <summary>
/// 献立マスター検索結果DTO（オートコンプリート用）
/// </summary>
public class MenuMasterSearchDto
{
    /// <summary>
    /// 献立ID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// 献立名
    /// </summary>
    public string MenuName { get; set; } = string.Empty;

    /// <summary>
    /// 食材名
    /// </summary>
    public string? IngredientName { get; set; }

    /// <summary>
    /// アレルゲンID（カンマ区切り）
    /// </summary>
    public string? Allergens { get; set; }

    /// <summary>
    /// アレルゲン名（表示用）
    /// </summary>
    public string? AllergenNames { get; set; }

    /// <summary>
    /// 説明・備考
    /// </summary>
    public string? Description { get; set; }
}

namespace ReactApp.Server.DTOs.Desktop;

/// <summary>
/// 食材DTO
/// </summary>
public class IngredientDto
{
    /// <summary>
    /// 食材ID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// 食材名
    /// </summary>
    public string IngredientName { get; set; } = string.Empty;

    /// <summary>
    /// アレルゲン（カンマ区切り）
    /// </summary>
    public string? Allergens { get; set; }

    /// <summary>
    /// 主要食材フラグ
    /// </summary>
    public bool IsMainIngredient { get; set; }

    /// <summary>
    /// 表示順
    /// </summary>
    public int SortOrder { get; set; }
}

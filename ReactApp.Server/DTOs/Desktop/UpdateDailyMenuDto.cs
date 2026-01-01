using System.ComponentModel.DataAnnotations;

namespace ReactApp.Server.DTOs.Desktop;

/// <summary>
/// 日別献立更新DTO
/// </summary>
public class UpdateDailyMenuDto
{
    /// <summary>
    /// 表示順
    /// </summary>
    public int? SortOrder { get; set; }

    /// <summary>
    /// 特記事項
    /// </summary>
    [MaxLength(500, ErrorMessage = "特記事項は500文字以内で入力してください")]
    public string? Notes { get; set; }

    /// <summary>
    /// カスタム献立名（マスター未使用時）
    /// </summary>
    [MaxLength(50, ErrorMessage = "献立名は50文字以内で入力してください")]
    public string? CustomMenuName { get; set; }

    /// <summary>
    /// 食材名
    /// </summary>
    [MaxLength(200, ErrorMessage = "食材名は200文字以内で入力してください")]
    public string? IngredientName { get; set; }

    /// <summary>
    /// アレルゲン（カンマ区切り）
    /// </summary>
    [MaxLength(200, ErrorMessage = "アレルゲンは200文字以内で入力してください")]
    public string? Allergens { get; set; }

    /// <summary>
    /// 説明・備考
    /// </summary>
    [MaxLength(500, ErrorMessage = "説明は500文字以内で入力してください")]
    public string? Description { get; set; }
}

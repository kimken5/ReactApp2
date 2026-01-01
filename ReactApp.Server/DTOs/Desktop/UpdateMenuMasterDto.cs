using System.ComponentModel.DataAnnotations;

namespace ReactApp.Server.DTOs.Desktop;

/// <summary>
/// 献立マスター更新DTO
/// </summary>
public class UpdateMenuMasterDto
{
    /// <summary>
    /// 献立名
    /// </summary>
    [Required(ErrorMessage = "献立名は必須です")]
    [MaxLength(200, ErrorMessage = "献立名は200文字以内で入力してください")]
    public string MenuName { get; set; } = string.Empty;

    /// <summary>
    /// 食材名（例：豚肉、じゃがいも、カレールウ）
    /// </summary>
    [MaxLength(200, ErrorMessage = "食材名は200文字以内で入力してください")]
    public string? IngredientName { get; set; }

    /// <summary>
    /// アレルゲン（カンマ区切りID：例：3,28）
    /// </summary>
    [MaxLength(200, ErrorMessage = "アレルゲンは200文字以内で入力してください")]
    public string? Allergens { get; set; }

    /// <summary>
    /// 説明・備考
    /// </summary>
    [MaxLength(500, ErrorMessage = "説明は500文字以内で入力してください")]
    public string? Description { get; set; }
}

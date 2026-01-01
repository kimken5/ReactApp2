using System.ComponentModel.DataAnnotations;

namespace ReactApp.Server.DTOs.Desktop;

/// <summary>
/// 日別献立作成DTO
/// </summary>
public class CreateDailyMenuDto
{
    /// <summary>
    /// 提供日
    /// </summary>
    [Required(ErrorMessage = "提供日は必須です")]
    public DateTime MenuDate { get; set; }

    /// <summary>
    /// 種類（Lunch/MorningSnack/AfternoonSnack）
    /// </summary>
    [Required(ErrorMessage = "献立の種類は必須です")]
    [RegularExpression("^(Lunch|MorningSnack|AfternoonSnack)$", ErrorMessage = "献立の種類が不正です")]
    public string MenuType { get; set; } = string.Empty;

    /// <summary>
    /// 献立マスターID（マスターから選択した場合）
    /// </summary>
    [Required(ErrorMessage = "献立マスターIDは必須です")]
    public int MenuMasterId { get; set; }

    /// <summary>
    /// 表示順
    /// </summary>
    [Required(ErrorMessage = "表示順は必須です")]
    public int SortOrder { get; set; }

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
    /// 食材名（カスタム献立の場合）
    /// </summary>
    [MaxLength(200, ErrorMessage = "食材名は200文字以内で入力してください")]
    public string? IngredientName { get; set; }

    /// <summary>
    /// アレルゲン（カンマ区切り、カスタム献立の場合）
    /// </summary>
    [MaxLength(200, ErrorMessage = "アレルゲンは200文字以内で入力してください")]
    public string? Allergens { get; set; }

    /// <summary>
    /// 説明・備考
    /// </summary>
    [MaxLength(500, ErrorMessage = "説明は500文字以内で入力してください")]
    public string? Description { get; set; }
}

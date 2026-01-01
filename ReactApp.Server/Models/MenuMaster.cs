using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ReactApp.Server.Models;

/// <summary>
/// 献立マスター
/// </summary>
[Table("MenuMaster")]
public class MenuMaster
{
    /// <summary>
    /// 献立ID
    /// </summary>
    [Key]
    public int Id { get; set; }

    /// <summary>
    /// 保育園ID
    /// </summary>
    [Required]
    public int NurseryId { get; set; }

    /// <summary>
    /// 献立名（例：カレーライス、白身魚のフライ、みかん）
    /// </summary>
    [Required]
    [MaxLength(200)]
    public string MenuName { get; set; } = string.Empty;

    /// <summary>
    /// 食材名（例：豚肉、じゃがいも、カレールウ）
    /// </summary>
    [MaxLength(200)]
    public string? IngredientName { get; set; }

    /// <summary>
    /// アレルゲン（カンマ区切りID：例：3,28）
    /// </summary>
    [MaxLength(200)]
    public string? Allergens { get; set; }

    /// <summary>
    /// 説明・備考
    /// </summary>
    [MaxLength(500)]
    public string? Description { get; set; }

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

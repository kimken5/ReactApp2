using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ReactApp.Server.Models;

/// <summary>
/// アレルゲンマスターエンティティ
/// 28項目の特定原材料・特定原材料に準ずるものを管理するデータモデル
/// </summary>
[Table("AllergenMaster")]
public class AllergenMaster
{
    /// <summary>
    /// アレルゲンID（主キー）
    /// </summary>
    [Key]
    public int Id { get; set; }

    /// <summary>
    /// アレルゲン名（必須）
    /// 例：卵、牛乳・乳製品、小麦
    /// 最大50文字
    /// </summary>
    [Required]
    [StringLength(50)]
    public string AllergenName { get; set; } = string.Empty;

    /// <summary>
    /// 表示順（必須）
    /// チェックボックスUIでの表示順序
    /// </summary>
    [Required]
    public int SortOrder { get; set; }

    /// <summary>
    /// 作成日時（必須）
    /// </summary>
    [Required]
    public DateTime CreatedAt { get; set; }
}

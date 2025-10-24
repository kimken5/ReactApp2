using System.ComponentModel.DataAnnotations;

namespace ReactApp.Server.Models;

/// <summary>
/// 進級履歴エンティティ
/// 園児の進級履歴を記録するデータモデル
/// 年度ごとのクラス移動を追跡
/// </summary>
public class PromotionHistory
{
    /// <summary>
    /// 進級履歴ID（主キー）
    /// </summary>
    [Key]
    public int Id { get; set; }

    /// <summary>
    /// 保育園ID（必須）
    /// </summary>
    [Required]
    public int NurseryId { get; set; }

    /// <summary>
    /// 園児ID（必須）
    /// </summary>
    [Required]
    public int ChildId { get; set; }

    /// <summary>
    /// 進級元年度（必須）
    /// 西暦年度（例: 2024）
    /// </summary>
    [Required]
    public int FromAcademicYear { get; set; }

    /// <summary>
    /// 進級先年度（必須）
    /// 西暦年度（例: 2025）
    /// </summary>
    [Required]
    public int ToAcademicYear { get; set; }

    /// <summary>
    /// 進級元クラスID（必須）
    /// 最大50文字
    /// </summary>
    [Required]
    [StringLength(50)]
    public string FromClassId { get; set; } = string.Empty;

    /// <summary>
    /// 進級先クラスID（必須）
    /// 最大50文字
    /// </summary>
    [Required]
    [StringLength(50)]
    public string ToClassId { get; set; } = string.Empty;

    /// <summary>
    /// 進級実行日時（必須）
    /// デフォルト: 現在時刻（UTC）
    /// </summary>
    [Required]
    public DateTime PromotedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// 進級処理実行者ID（任意）
    /// 管理者またはスタッフのID
    /// </summary>
    public int? PromotedByUserId { get; set; }

    /// <summary>
    /// 備考（任意）
    /// 最大200文字
    /// </summary>
    [StringLength(200)]
    public string? Notes { get; set; }

    /// <summary>
    /// 作成日時（必須）
    /// </summary>
    [Required]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

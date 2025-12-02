using System.ComponentModel.DataAnnotations;

namespace ReactApp.Server.Models;

/// <summary>
/// 園児クラス所属履歴エンティティ
/// 園児のクラス所属を年度別に管理（過去・現在・未来）
/// 年度スライド機能のコアテーブル
/// 複合主キー: (AcademicYear, NurseryId, ChildId)
/// </summary>
public class ChildClassAssignment
{
    /// <summary>
    /// 年度(西暦)(複合主キー 1/3)(必須)
    /// 例: 2025
    /// </summary>
    [Required]
    public int AcademicYear { get; set; }

    /// <summary>
    /// 保育園ID(複合主キー 2/3)(必須)
    /// </summary>
    [Required]
    public int NurseryId { get; set; }

    /// <summary>
    /// 園児ID(複合主キー 3/3)(必須)
    /// </summary>
    [Required]
    public int ChildId { get; set; }

    /// <summary>
    /// 所属クラスID（必須）
    /// </summary>
    [Required]
    [MaxLength(50)]
    public string ClassId { get; set; } = string.Empty;

    /// <summary>
    /// 現在年度フラグ（必須）
    /// デフォルト: false
    /// 現在年度のクラス所属を示す
    /// </summary>
    [Required]
    public bool IsCurrent { get; set; } = false;

    /// <summary>
    /// 未来年度フラグ（必須）
    /// デフォルト: false
    /// 未来年度の事前設定を示す
    /// 年度スライド時に IsFuture=true → IsCurrent=true に変更される
    /// </summary>
    [Required]
    public bool IsFuture { get; set; } = false;

    /// <summary>
    /// 割り当て日時（必須）
    /// このクラス所属が設定された日時
    /// </summary>
    [Required]
    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// 割り当て実行者ID（任意）
    /// このクラス所属を設定したユーザーのID
    /// </summary>
    public int? AssignedByUserId { get; set; }

    /// <summary>
    /// 作成日時（必須）
    /// </summary>
    [Required]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// 更新日時（任意）
    /// </summary>
    public DateTime? UpdatedAt { get; set; }
}

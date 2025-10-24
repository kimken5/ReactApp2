using System.ComponentModel.DataAnnotations;

namespace ReactApp.Server.Models;

/// <summary>
/// 年度管理エンティティ
/// 保育園の年度情報を管理するデータモデル
/// 年度の定義、年度切り替え履歴の管理を担当
/// </summary>
public class AcademicYear
{
    /// <summary>
    /// 年度ID（主キー）
    /// </summary>
    [Key]
    public int Id { get; set; }

    /// <summary>
    /// 保育園ID（必須）
    /// </summary>
    [Required]
    public int NurseryId { get; set; }

    /// <summary>
    /// 年度（西暦）（必須）
    /// 例: 2025
    /// </summary>
    [Required]
    public int Year { get; set; }

    /// <summary>
    /// 年度開始日（必須）
    /// 通常は4月1日
    /// </summary>
    [Required]
    public DateTime StartDate { get; set; }

    /// <summary>
    /// 年度終了日（必須）
    /// 通常は3月31日
    /// </summary>
    [Required]
    public DateTime EndDate { get; set; }

    /// <summary>
    /// 現在年度フラグ（必須）
    /// デフォルト: false
    /// 1つの保育園につき1つのみがtrueになる
    /// </summary>
    [Required]
    public bool IsCurrent { get; set; } = false;

    /// <summary>
    /// アーカイブ済みフラグ（必須）
    /// デフォルト: false
    /// 年度終了後にtrueに設定される
    /// </summary>
    [Required]
    public bool IsArchived { get; set; } = false;

    /// <summary>
    /// アーカイブ日時（任意）
    /// 年度がアーカイブされた日時
    /// </summary>
    public DateTime? ArchivedAt { get; set; }

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

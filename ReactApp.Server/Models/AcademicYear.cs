using System.ComponentModel.DataAnnotations;
using ReactApp.Server.Helpers;

namespace ReactApp.Server.Models;

/// <summary>
/// 年度管理エンティティ
/// 保育園の年度情報を管理するデータモデル
/// 年度の定義、年度切り替え履歴の管理を担当
/// 複合主キー: (NurseryId, Year)
/// </summary>
public class AcademicYear
{
    /// <summary>
    /// 保育園ID(複合主キー 1/2)(必須)
    /// </summary>
    [Required]
    public int NurseryId { get; set; }

    /// <summary>
    /// 年度(西暦)(複合主キー 2/2)(必須)
    /// 例: 2025
    /// </summary>
    [Required]
    public int Year { get; set; }

    /// <summary>
    /// 年度開始日（必須）
    /// 通常は4月1日
    /// </summary>
    [Required]
    public DateOnly StartDate { get; set; }

    /// <summary>
    /// 年度終了日（必須）
    /// 通常は3月31日
    /// </summary>
    [Required]
    public DateOnly EndDate { get; set; }

    /// <summary>
    /// 現在年度フラグ（必須）
    /// デフォルト: false
    /// 1つの保育園につき1つのみがtrueになる
    /// </summary>
    [Required]
    public bool IsCurrent { get; set; } = false;

    /// <summary>
    /// 未来年度フラグ（必須）
    /// デフォルト: false
    /// 次年度準備用の年度に設定される
    /// </summary>
    [Required]
    public bool IsFuture { get; set; } = false;

    /// <summary>
    /// アーカイブ済みフラグ（必須）
    /// デフォルト: false
    /// 年度終了後にtrueに設定される
    /// </summary>
    [Required]
    public bool IsArchived { get; set; } = false;

    /// <summary>
    /// 備考（任意）
    /// 年度に関する追加情報
    /// </summary>
    [MaxLength(500)]
    public string? Notes { get; set; }

    /// <summary>
    /// アーカイブ日時（任意）
    /// 年度がアーカイブされた日時
    /// </summary>
    public DateTime? ArchivedAt { get; set; }

    /// <summary>
    /// 作成日時（必須）
    /// </summary>
    [Required]
    public DateTime CreatedAt { get; set; } = DateTimeHelper.GetJstNow();

    /// <summary>
    /// 更新日時（任意）
    /// </summary>
    public DateTime? UpdatedAt { get; set; }
}

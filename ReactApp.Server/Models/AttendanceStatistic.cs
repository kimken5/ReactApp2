using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ReactApp.Server.Models;

/// <summary>
/// 出席統計キャッシュエンティティ
/// 出席状況レポートのパフォーマンス向上のため、日次・月次集計データをキャッシュ
/// 動的計算の代わりに事前集計したデータを保持
/// </summary>
public class AttendanceStatistic
{
    /// <summary>
    /// 統計ID（主キー）
    /// </summary>
    [Key]
    public int Id { get; set; }

    /// <summary>
    /// 保育園ID（必須）
    /// </summary>
    [Required]
    public int NurseryId { get; set; }

    /// <summary>
    /// 園児ID（任意）
    /// 園児別統計の場合はChildId、クラス別統計の場合はNULL
    /// </summary>
    public int? ChildId { get; set; }

    /// <summary>
    /// クラスID（任意）
    /// 最大50文字
    /// クラス別統計の場合はClassId、園児別統計の場合はNULL
    /// </summary>
    [StringLength(50)]
    public string? ClassId { get; set; }

    /// <summary>
    /// 年度（必須）
    /// 西暦年度（例: 2025）
    /// </summary>
    [Required]
    public int AcademicYear { get; set; }

    /// <summary>
    /// 月（任意）
    /// 1-12の範囲、年度全体の場合はNULL
    /// </summary>
    public int? Month { get; set; }

    /// <summary>
    /// 日付（任意）
    /// 月次・年度全体の場合はNULL
    /// </summary>
    public DateTime? Date { get; set; }

    /// <summary>
    /// 集計種別（必須）
    /// 最大20文字
    /// "Daily", "Monthly", "Yearly"
    /// </summary>
    [Required]
    [StringLength(20)]
    public string StatisticType { get; set; } = string.Empty;

    /// <summary>
    /// 総日数（必須）
    /// デフォルト: 0
    /// </summary>
    [Required]
    public int TotalDays { get; set; } = 0;

    /// <summary>
    /// 出席日数（必須）
    /// デフォルト: 0
    /// </summary>
    [Required]
    public int PresentDays { get; set; } = 0;

    /// <summary>
    /// 欠席日数（必須）
    /// デフォルト: 0
    /// </summary>
    [Required]
    public int AbsentDays { get; set; } = 0;

    /// <summary>
    /// 遅刻日数（必須）
    /// デフォルト: 0
    /// </summary>
    [Required]
    public int TardyDays { get; set; } = 0;

    /// <summary>
    /// 出席率（必須）
    /// デフォルト: 0.00
    /// パーセンテージ（0.00 - 100.00）
    /// </summary>
    [Required]
    [Column(TypeName = "DECIMAL(5,2)")]
    public decimal AttendanceRate { get; set; } = 0.00m;

    /// <summary>
    /// 最終計算日時（必須）
    /// デフォルト: 現在時刻（UTC）
    /// </summary>
    [Required]
    public DateTime LastCalculatedAt { get; set; } = DateTime.UtcNow;

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

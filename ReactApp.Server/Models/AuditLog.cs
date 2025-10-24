using System.ComponentModel.DataAnnotations;

namespace ReactApp.Server.Models;

/// <summary>
/// 監査ログエンティティ
/// 管理画面での操作ログを記録するデータモデル
/// セキュリティ、トレーサビリティ、コンプライアンス対応
/// </summary>
public class AuditLog
{
    /// <summary>
    /// ログID（主キー）
    /// BIGINT型（大量のログデータに対応）
    /// </summary>
    [Key]
    public long Id { get; set; }

    /// <summary>
    /// 保育園ID（必須）
    /// </summary>
    [Required]
    public int NurseryId { get; set; }

    /// <summary>
    /// 操作者ID（任意）
    /// Nursery.Idを想定
    /// </summary>
    public int? UserId { get; set; }

    /// <summary>
    /// 操作者名（任意）
    /// 最大100文字
    /// </summary>
    [StringLength(100)]
    public string? UserName { get; set; }

    /// <summary>
    /// 操作種別（必須）
    /// 最大50文字
    /// 例: "Create", "Update", "Delete", "Login", "Logout"
    /// </summary>
    [Required]
    [StringLength(50)]
    public string Action { get; set; } = string.Empty;

    /// <summary>
    /// 対象エンティティ種別（必須）
    /// 最大50文字
    /// 例: "Child", "Staff", "Class", "DailyReport"
    /// </summary>
    [Required]
    [StringLength(50)]
    public string EntityType { get; set; } = string.Empty;

    /// <summary>
    /// 対象エンティティID（任意）
    /// 最大50文字
    /// </summary>
    [StringLength(50)]
    public string? EntityId { get; set; }

    /// <summary>
    /// 変更前の値（任意）
    /// JSON形式で保存
    /// </summary>
    public string? BeforeValue { get; set; }

    /// <summary>
    /// 変更後の値（任意）
    /// JSON形式で保存
    /// </summary>
    public string? AfterValue { get; set; }

    /// <summary>
    /// IPアドレス（任意）
    /// 最大45文字（IPv6対応）
    /// </summary>
    [StringLength(45)]
    public string? IpAddress { get; set; }

    /// <summary>
    /// ユーザーエージェント（任意）
    /// 最大500文字
    /// </summary>
    [StringLength(500)]
    public string? UserAgent { get; set; }

    /// <summary>
    /// 操作日時（必須）
    /// デフォルト: 現在時刻（UTC）
    /// </summary>
    [Required]
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

using System.ComponentModel.DataAnnotations;

namespace ReactApp.Server.Models;

/// <summary>
/// 欠席・遅刻連絡エンティティ
/// 保護者が園児の欠席または遅刻を連絡するためのデータモデル
/// スタッフが確認・返信できる連絡管理システム
/// </summary>
public class AbsenceNotification
{
    public int Id { get; set; }
    
    [Required]
    public int ParentId { get; set; }
    public Parent Parent { get; set; } = null!;

    [Required]
    public int NurseryId { get; set; }

    [Required]
    public int ChildId { get; set; }
    public Child Child { get; set; } = null!;

    [Required]
    [StringLength(20)]
    public string NotificationType { get; set; } = string.Empty; // "absence" or "lateness" or "pickup"

    [Required]
    public DateTime Ymd { get; set; } // 日付（DATETIME2型）

    public TimeSpan? ExpectedArrivalTime { get; set; } // 遅刻・お迎えの予定時刻（TIME型）
    
    [Required]
    [StringLength(50)]
    public string Reason { get; set; } = string.Empty; // "illness", "appointment", "family_event", "other"
    
    [StringLength(200)]
    public string? AdditionalNotes { get; set; }
    
    [Required]
    public DateTime SubmittedAt { get; set; }
    
    [Required]
    [StringLength(20)]
    public string Status { get; set; } = "submitted"; // "submitted", "acknowledged", "processed"
    
    [StringLength(500)]
    public string? StaffResponse { get; set; }
    
    public DateTime? AcknowledgedAt { get; set; }

    public int? AcknowledgedBy { get; set; } // スタッフID（将来の実装用）

    // ===== デスクトップアプリ用追加プロパティ =====

    /// <summary>
    /// 管理者による確認フラグ（必須）
    /// デフォルト: false
    /// </summary>
    [Required]
    public bool AcknowledgedByAdminUser { get; set; } = false;

    /// <summary>
    /// 対応したスタッフID（任意）
    /// 管理者が代理で対応した場合に記録
    /// </summary>
    public int? RespondedByStaffId { get; set; }

    /// <summary>
    /// 管理者確認日時（任意）
    /// 管理者が確認した日時
    /// </summary>
    public DateTime? AcknowledgedByAdminAt { get; set; }
}
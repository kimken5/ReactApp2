using System.ComponentModel.DataAnnotations;

namespace ReactApp.Server.Models;

/// <summary>
/// イベントエンティティ
/// 保育園の行事、クラス活動、日課、休日等のイベント情報を管理するデータモデル
/// </summary>
public class Event
{
    // プロパティの順序はデータベーススキーマに合わせています

    public int Id { get; set; }

    [Required]
    public int NurseryId { get; set; }

    public int? TargetGradeLevel { get; set; } // 特定学年向けの場合（1=年少, 2=年中, 3=年長）

    [StringLength(50)]
    public string? TargetClassId { get; set; } // 特定クラス向けの場合（例: "1-A", "2-B"）

    [Required]
    [StringLength(200)]
    public string Title { get; set; } = string.Empty;

    [StringLength(1000)]
    public string? Description { get; set; }

    [Required]
    [StringLength(50)]
    public string Category { get; set; } = string.Empty; // "general_announcement", "general_event", "nursery_holiday", "class_activity", "grade_activity", etc.

    [Required]
    public DateTime StartDateTime { get; set; }

    [Required]
    public DateTime EndDateTime { get; set; }

    [Required]
    public bool IsAllDay { get; set; } = false;

    [Required]
    [StringLength(20)]
    public string RecurrencePattern { get; set; } = "none"; // "none", "daily", "weekly", "monthly"

    [Required]
    [StringLength(20)]
    public string TargetAudience { get; set; } = "all"; // "all", "specific_class", "specific_child"

    [Required]
    public bool RequiresPreparation { get; set; } = false;

    [StringLength(500)]
    public string? PreparationInstructions { get; set; }

    [Required]
    public bool IsActive { get; set; } = true;

    [Required]
    [StringLength(100)]
    public string CreatedBy { get; set; } = string.Empty; // スタッフ名またはシステム

    [Required]
    public DateTime CreatedAt { get; set; }

    [Required]
    public DateTime LastModified { get; set; }
}
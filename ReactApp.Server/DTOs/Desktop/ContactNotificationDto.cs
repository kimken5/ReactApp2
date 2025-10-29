using System.ComponentModel.DataAnnotations;

namespace ReactApp.Server.DTOs.Desktop
{
    /// <summary>
    /// 連絡通知情報DTO（デスクトップアプリ用）
    /// </summary>
    public class ContactNotificationDto
    {
        public int Id { get; set; }
        public int ParentId { get; set; }
        public string ParentName { get; set; } = string.Empty;
        public int NurseryId { get; set; }
        public int ChildId { get; set; }
        public string ChildName { get; set; } = string.Empty;
        public string? ClassName { get; set; }
        public string NotificationType { get; set; } = string.Empty; // "absence", "lateness", "pickup"
        public DateTime Ymd { get; set; }
        public TimeSpan? ExpectedArrivalTime { get; set; }
        public string Reason { get; set; } = string.Empty; // "illness", "appointment", "family_event", "other"
        public string? AdditionalNotes { get; set; }
        public DateTime SubmittedAt { get; set; }
        public string Status { get; set; } = string.Empty; // "submitted", "acknowledged", "processed"
        public string? StaffResponse { get; set; }
        public DateTime? AcknowledgedAt { get; set; }
        public int? AcknowledgedBy { get; set; }
        public bool AcknowledgedByAdminUser { get; set; }
        public int? RespondedByStaffId { get; set; }
        public string? RespondedByStaffName { get; set; }
        public DateTime? AcknowledgedByAdminAt { get; set; }

        // 返信情報（最新の返信のみ）
        public ContactNotificationResponseDto? LatestResponse { get; set; }
    }

    /// <summary>
    /// 連絡通知返信情報DTO
    /// </summary>
    public class ContactNotificationResponseDto
    {
        public int Id { get; set; }
        public int AbsenceNotificationId { get; set; }
        public int NurseryId { get; set; }
        public int StaffId { get; set; }
        public string StaffName { get; set; } = string.Empty;
        public string ResponseType { get; set; } = string.Empty; // "acknowledged", "approved", "rejected", "requires_clarification"
        public string? ResponseMessage { get; set; }
        public DateTime ResponseAt { get; set; }
        public bool IsActive { get; set; }
    }

    /// <summary>
    /// 連絡通知一覧フィルタDTO
    /// </summary>
    public class ContactNotificationFilterDto
    {
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string? NotificationType { get; set; } // "absence", "lateness", "pickup"
        public string? Status { get; set; } // "submitted", "acknowledged", "processed"
        public int? ChildId { get; set; }
        public string? ClassId { get; set; }
        public string? SearchKeyword { get; set; }
        public bool? AcknowledgedByAdminUser { get; set; }
    }

    /// <summary>
    /// 連絡通知返信作成リクエストDTO
    /// </summary>
    public class CreateResponseRequestDto
    {
        [Required(ErrorMessage = "返信タイプは必須です")]
        [StringLength(20)]
        public string ResponseType { get; set; } = string.Empty; // "acknowledged", "approved", "rejected", "requires_clarification"

        [StringLength(500, ErrorMessage = "返信メッセージは500文字以内で入力してください")]
        public string? ResponseMessage { get; set; }

        [Required(ErrorMessage = "スタッフIDは必須です")]
        public int StaffId { get; set; }
    }

    /// <summary>
    /// 連絡通知確認更新リクエストDTO
    /// </summary>
    public class AcknowledgeNotificationRequestDto
    {
        public int? RespondedByStaffId { get; set; }
        public string? StaffResponse { get; set; }
    }
}

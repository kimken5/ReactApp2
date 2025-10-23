using System.ComponentModel.DataAnnotations;

namespace ReactApp.Server.DTOs
{
    /// <summary>
    /// 通知設定DTO
    /// 保護者の通知設定情報をクライアントとサーバー間で伝送するためのデータ転送オブジェクト
    /// </summary>
    public class NotificationSettingsDto
    {
        public int Id { get; set; }
        public int ParentId { get; set; }
        public bool PushNotificationsEnabled { get; set; }
        public bool AbsenceConfirmationEnabled { get; set; }
        public bool DailyReportEnabled { get; set; }
        public bool EventNotificationEnabled { get; set; }
        public bool AnnouncementEnabled { get; set; }
        public bool SmsNotificationsEnabled { get; set; }
        public bool EmailNotificationsEnabled { get; set; }
        public string? DeviceToken { get; set; }
        public string? DevicePlatform { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    public class UpdateNotificationSettingsDto
    {
        public bool? PushNotificationsEnabled { get; set; }
        public bool? AbsenceConfirmationEnabled { get; set; }
        public bool? DailyReportEnabled { get; set; }
        public bool? EventNotificationEnabled { get; set; }
        public bool? AnnouncementEnabled { get; set; }
        public bool? SmsNotificationsEnabled { get; set; }
        public bool? EmailNotificationsEnabled { get; set; }

        [StringLength(500)]
        public string? DeviceToken { get; set; }

        [StringLength(50)]
        public string? DevicePlatform { get; set; }
    }

    public class NotificationLogDto
    {
        public int Id { get; set; }
        public int ParentId { get; set; }
        public string ParentName { get; set; } = string.Empty;
        public string NotificationType { get; set; } = string.Empty;
        public string DeliveryMethod { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string? ErrorMessage { get; set; }
        public int? RelatedEntityId { get; set; }
        public string? RelatedEntityType { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? SentAt { get; set; }
        public DateTime? DeliveredAt { get; set; }
        public DateTime? ReadAt { get; set; }
        public int RetryCount { get; set; }
    }

    public class SendNotificationDto
    {
        [Required]
        public List<int> ParentIds { get; set; } = new List<int>();

        [Required]
        [StringLength(50)]
        public string NotificationType { get; set; } = string.Empty;

        [Required]
        [StringLength(200)]
        public string Title { get; set; } = string.Empty;

        [Required]
        [StringLength(1000)]
        public string Content { get; set; } = string.Empty;

        [StringLength(50)]
        public string DeliveryMethod { get; set; } = "push";

        public int? RelatedEntityId { get; set; }

        [StringLength(50)]
        public string? RelatedEntityType { get; set; }

        public bool IsUrgent { get; set; } = false;
    }
}
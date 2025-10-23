using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ReactApp.Server.Models
{
    /// <summary>
    /// Azure Notification Hub通知送信ログエンティティ
    /// プッシュ通知の送信履歴とステータスを管理
    /// </summary>
    [Table("AzureNotificationLogs")]
    public class AzureNotificationLog
    {
        /// <summary>
        /// 通知ログID（主キー）
        /// </summary>
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        /// <summary>
        /// デバイスID
        /// 通知対象のデバイス固有識別子
        /// </summary>
        [Required]
        [StringLength(255)]
        public string DeviceId { get; set; } = string.Empty;

        /// <summary>
        /// 通知種別（general/absence/report）
        /// 通知の分類を示す
        /// </summary>
        [Required]
        [StringLength(50)]
        public string NotificationType { get; set; } = string.Empty;

        /// <summary>
        /// 通知タイトル
        /// 表示される通知のタイトル
        /// </summary>
        [Required]
        [StringLength(200)]
        public string Title { get; set; } = string.Empty;

        /// <summary>
        /// 通知本文
        /// 表示される通知の本文内容
        /// </summary>
        [Required]
        [StringLength(1000)]
        public string Body { get; set; } = string.Empty;

        /// <summary>
        /// JSON通知ペイロード
        /// Azure Notification Hubに送信された実際のJSONデータ
        /// </summary>
        [Column(TypeName = "NVARCHAR(MAX)")]
        public string? JsonPayload { get; set; }

        /// <summary>
        /// プラットフォーム（Android/iOS/Web）
        /// 通知送信先のプラットフォーム
        /// </summary>
        [Required]
        [StringLength(20)]
        public string Platform { get; set; } = string.Empty;

        /// <summary>
        /// 通知状態（pending/sent/failed/delivered）
        /// 通知の配信状況
        /// </summary>
        [StringLength(50)]
        public string? NotificationState { get; set; }

        /// <summary>
        /// 送信日時
        /// Azure Notification Hubへの送信完了日時
        /// </summary>
        public DateTime? SentAt { get; set; }

        /// <summary>
        /// 送信予定日時
        /// 将来の送信予約がある場合の予定日時
        /// </summary>
        public DateTime? ScheduledAt { get; set; }

        /// <summary>
        /// 作成日時
        /// ログエントリの作成日時
        /// </summary>
        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
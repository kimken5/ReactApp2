using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ReactApp.Server.Models
{
    /// <summary>
    /// 通知ログエンティティ
    /// すべての通知の送信履歴と配信状況を記録
    /// 送信状態、エラー情報、再送制御などを包括的に管理
    /// </summary>
    public class NotificationLog
    {
        /// <summary>
        /// 通知ログID（主キー）
        /// システム内の通知ログ一意識別子
        /// </summary>
        [Key]
        public int Id { get; set; }

        /// <summary>
        /// 保護者ID（必須、外部キー）
        /// 通知の宛先保護者を特定
        /// </summary>
        [Required]
        public int ParentId { get; set; }

        /// <summary>
        /// 保護者ナビゲーションプロパティ
        /// 宛先保護者エンティティへの参照
        /// </summary>
        [ForeignKey("ParentId")]
        public virtual Parent Parent { get; set; } = null!;

        /// <summary>
        /// 通知タイプ（必須、50文字以内）
        /// 通知の種類を識別
        /// "absence", "report", "event", "announcement"
        /// </summary>
        [Required]
        [StringLength(50)]
        public string NotificationType { get; set; } = string.Empty;

        /// <summary>
        /// 配信方法（必須、50文字以内）
        /// 通知の配信チャネルを指定
        /// "push", "sms", "email"
        /// </summary>
        [Required]
        [StringLength(50)]
        public string DeliveryMethod { get; set; } = string.Empty;

        /// <summary>
        /// 通知タイトル（必須、200文字以内）
        /// 通知の件名または表題
        /// </summary>
        [Required]
        [StringLength(200)]
        public string Title { get; set; } = string.Empty;

        /// <summary>
        /// 通知内容（必須、1000文字以内）
        /// 通知の詳細メッセージ本文
        /// </summary>
        [Required]
        [StringLength(1000)]
        public string Content { get; set; } = string.Empty;

        /// <summary>
        /// 配信状況（50文字以内）
        /// 通知の現在の配信状態
        /// "pending", "sent", "delivered", "failed", "read"
        /// </summary>
        [StringLength(50)]
        public string Status { get; set; } = "pending";

        /// <summary>
        /// エラーメッセージ（任意、500文字以内）
        /// 配信失敗時の詳細エラー情報
        /// </summary>
        [StringLength(500)]
        public string? ErrorMessage { get; set; }

        /// <summary>
        /// 関連エンティティID（任意）
        /// 通知の元となった欠席、日報、イベントなどのID
        /// </summary>
        public int? RelatedEntityId { get; set; }

        /// <summary>
        /// 関連エンティティタイプ（任意、50文字以内）
        /// 関連するエンティティの種類
        /// </summary>
        [StringLength(50)]
        public string? RelatedEntityType { get; set; }

        /// <summary>
        /// 作成日時
        /// 通知ログが作成された日時（UTC）
        /// </summary>
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// 送信日時（任意）
        /// 通知が送信された日時（UTC）
        /// </summary>
        public DateTime? SentAt { get; set; }

        /// <summary>
        /// 配信日時（任意）
        /// 通知が実際に配信された日時（UTC）
        /// </summary>
        public DateTime? DeliveredAt { get; set; }

        /// <summary>
        /// 既読日時（任意）
        /// 通知が既読となった日時（UTC）
        /// </summary>
        public DateTime? ReadAt { get; set; }

        /// <summary>
        /// 再送回数
        /// 配信失敗時の再送試行回数
        /// </summary>
        public int RetryCount { get; set; } = 0;

        /// <summary>
        /// 次回再送日時（任意）
        /// 次回の再送予定日時（UTC）
        /// </summary>
        public DateTime? NextRetryAt { get; set; }
    }
}
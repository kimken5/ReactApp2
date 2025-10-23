using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ReactApp.Server.Models
{
    /// <summary>
    /// 通知設定エンティティ
    /// 保護者ごとの通知設定とデバイス情報を管理
    /// プッシュ通知、SMS、メール配信設定とカテゴリ別通知制御を実現
    /// </summary>
    public class NotificationSettings
    {
        /// <summary>
        /// 通知設定ID（主キー）
        /// システム内の通知設定一意識別子
        /// </summary>
        [Key]
        public int Id { get; set; }

        /// <summary>
        /// 保護者ID（必須、外部キー）
        /// 通知設定を所有する保護者を特定
        /// </summary>
        [Required]
        public int ParentId { get; set; }

        /// <summary>
        /// 保護者ナビゲーションプロパティ
        /// 設定所有者保護者エンティティへの参照
        /// </summary>
        [ForeignKey("ParentId")]
        public virtual Parent Parent { get; set; } = null!;

        /// <summary>
        /// プッシュ通知有効化フラグ
        /// プッシュ通知の全体的な有効・無効設定
        /// </summary>
        public bool PushNotificationsEnabled { get; set; } = true;

        /// <summary>
        /// 欠席確認通知有効化フラグ
        /// 欠席・遅刻通知の受信可否設定
        /// </summary>
        public bool AbsenceConfirmationEnabled { get; set; } = true;

        /// <summary>
        /// 日報通知有効化フラグ
        /// 日報関連通知の受信可否設定
        /// </summary>
        public bool DailyReportEnabled { get; set; } = true;

        /// <summary>
        /// イベント通知有効化フラグ
        /// イベント関連通知の受信可否設定
        /// </summary>
        public bool EventNotificationEnabled { get; set; } = true;

        /// <summary>
        /// お知らせ通知有効化フラグ
        /// 一般的なお知らせ通知の受信可否設定
        /// </summary>
        public bool AnnouncementEnabled { get; set; } = true;

        /// <summary>
        /// SMS通知有効化フラグ
        /// SMS通知の受信可否設定
        /// </summary>
        public bool SmsNotificationsEnabled { get; set; } = false;

        /// <summary>
        /// メール通知有効化フラグ
        /// メール通知の受信可否設定
        /// </summary>
        public bool EmailNotificationsEnabled { get; set; } = false;

        /// <summary>
        /// デバイストークン（任意、500文字以内）
        /// プッシュ通知送信用のデバイス固有識別子
        /// </summary>
        [StringLength(500)]
        public string? DeviceToken { get; set; }

        /// <summary>
        /// デバイスプラットフォーム（任意、50文字以内）
        /// デバイスのOS種類
        /// "ios", "android", "web"
        /// </summary>
        [StringLength(50)]
        public string? DevicePlatform { get; set; }

        /// <summary>
        /// 作成日時
        /// 通知設定が作成された日時（UTC）
        /// </summary>
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// 更新日時（任意）
        /// 通知設定が最後に更新された日時
        /// </summary>
        public DateTime? UpdatedAt { get; set; }
    }
}
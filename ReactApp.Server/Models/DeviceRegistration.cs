using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using ReactApp.Server.Helpers;

namespace ReactApp.Server.Models
{
    /// <summary>
    /// デバイス登録管理エンティティ
    /// プッシュ通知配信用のデバイス情報を管理
    /// </summary>
    [Table("DeviceRegistrations")]
    public class DeviceRegistration
    {
        /// <summary>
        /// デバイス登録ID（主キー）
        /// </summary>
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        /// <summary>
        /// デバイス固有ID（UUID）
        /// アプリ初回起動時に生成される一意識別子
        /// </summary>
        [Required]
        [StringLength(255)]
        [Column("DeviceId")]
        public string DeviceId { get; set; } = string.Empty;

        /// <summary>
        /// ユーザーID
        /// デバイスに関連付けられたユーザーの識別子
        /// </summary>
        [Required]
        public int UserId { get; set; }

        /// <summary>
        /// ユーザー種別（parent/staff）
        /// デバイス利用者の区分
        /// </summary>
        [Required]
        [StringLength(20)]
        public string UserType { get; set; } = string.Empty;

        /// <summary>
        /// プラットフォーム（Android/iOS/Web）
        /// デバイスのOSプラットフォーム
        /// </summary>
        [Required]
        [StringLength(20)]
        public string Platform { get; set; } = string.Empty;

        /// <summary>
        /// Androidフラグ
        /// プラットフォーム判定の高速化用フラグ
        /// </summary>
        [Required]
        public bool IsAndroid { get; set; }

        /// <summary>
        /// プッシュ通知トークン
        /// FCM/APNSから取得したデバイス固有トークン
        /// </summary>
        [StringLength(1000)]
        public string? PushToken { get; set; }

        /// <summary>
        /// Azure Notification Hub登録ID
        /// Azure Notification Hubでの登録識別子
        /// </summary>
        [StringLength(500)]
        public string? RegistrationId { get; set; }

        /// <summary>
        /// デバイス情報（JSON）
        /// デバイスの詳細情報をJSON形式で保存
        /// </summary>
        [StringLength(1000)]
        public string? DeviceInfo { get; set; }

        /// <summary>
        /// アプリバージョン
        /// 通知対象のアプリケーションバージョン
        /// </summary>
        [StringLength(50)]
        public string? AppVersion { get; set; }

        /// <summary>
        /// アクティブフラグ
        /// デバイスが通知配信対象かどうかを示す
        /// </summary>
        [Required]
        public bool IsActive { get; set; } = true;

        /// <summary>
        /// 最終ログイン日時
        /// デバイスからの最後のアクセス日時
        /// </summary>
        [Required]
        public DateTime LastLoginAt { get; set; } = DateTimeHelper.GetJstNow();

        /// <summary>
        /// 作成日時
        /// デバイス登録の初回作成日時
        /// </summary>
        [Required]
        public DateTime CreatedAt { get; set; } = DateTimeHelper.GetJstNow();

        /// <summary>
        /// 更新日時
        /// デバイス情報の最終更新日時
        /// </summary>
        [Required]
        public DateTime UpdatedAt { get; set; } = DateTimeHelper.GetJstNow();
    }
}

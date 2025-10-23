namespace ReactApp.Server.DTOs
{
    /// <summary>
    /// デバイス登録情報DTO
    /// プッシュ通知用デバイス情報の表現を提供
    /// </summary>
    public class DeviceRegistrationDto
    {
        /// <summary>
        /// デバイス登録ID（主キー）
        /// </summary>
        public int Id { get; set; }

        /// <summary>
        /// デバイス固有ID（UUID）
        /// </summary>
        public string DeviceId { get; set; } = string.Empty;

        /// <summary>
        /// ユーザーID
        /// </summary>
        public int UserId { get; set; }

        /// <summary>
        /// ユーザー種別（parent/staff）
        /// </summary>
        public string UserType { get; set; } = string.Empty;

        /// <summary>
        /// プラットフォーム（Android/iOS/Web）
        /// </summary>
        public string Platform { get; set; } = string.Empty;

        /// <summary>
        /// Androidフラグ
        /// </summary>
        public bool IsAndroid { get; set; }

        /// <summary>
        /// プッシュ通知トークン
        /// </summary>
        public string? PushToken { get; set; }

        /// <summary>
        /// Azure Notification Hub登録ID
        /// </summary>
        public string? RegistrationId { get; set; }

        /// <summary>
        /// デバイス情報（JSON）
        /// </summary>
        public string? DeviceInfo { get; set; }

        /// <summary>
        /// アプリバージョン
        /// </summary>
        public string? AppVersion { get; set; }

        /// <summary>
        /// アクティブフラグ
        /// </summary>
        public bool IsActive { get; set; }

        /// <summary>
        /// 最終ログイン日時
        /// </summary>
        public DateTime LastLoginAt { get; set; }

        /// <summary>
        /// 作成日時
        /// </summary>
        public DateTime CreatedAt { get; set; }

        /// <summary>
        /// 更新日時
        /// </summary>
        public DateTime UpdatedAt { get; set; }
    }

    /// <summary>
    /// Azure通知ログDTO
    /// </summary>
    public class AzureNotificationLogDto
    {
        /// <summary>
        /// 通知ログID（主キー）
        /// </summary>
        public int Id { get; set; }

        /// <summary>
        /// デバイスID
        /// </summary>
        public string DeviceId { get; set; } = string.Empty;

        /// <summary>
        /// 通知種別（general/absence/report）
        /// </summary>
        public string NotificationType { get; set; } = string.Empty;

        /// <summary>
        /// 通知タイトル
        /// </summary>
        public string Title { get; set; } = string.Empty;

        /// <summary>
        /// 通知本文
        /// </summary>
        public string Body { get; set; } = string.Empty;

        /// <summary>
        /// JSON通知ペイロード
        /// </summary>
        public string? JsonPayload { get; set; }

        /// <summary>
        /// プラットフォーム（Android/iOS/Web）
        /// </summary>
        public string Platform { get; set; } = string.Empty;

        /// <summary>
        /// 通知状態（pending/sent/failed/delivered）
        /// </summary>
        public string? NotificationState { get; set; }

        /// <summary>
        /// 送信日時
        /// </summary>
        public DateTime? SentAt { get; set; }

        /// <summary>
        /// 送信予定日時
        /// </summary>
        public DateTime? ScheduledAt { get; set; }

        /// <summary>
        /// 作成日時
        /// </summary>
        public DateTime CreatedAt { get; set; }
    }

    /// <summary>
    /// 通知テンプレートDTO
    /// </summary>
    public class NotificationTemplateDto
    {
        /// <summary>
        /// テンプレートID（主キー）
        /// </summary>
        public int Id { get; set; }

        /// <summary>
        /// 通知種別（general/absence/report）
        /// </summary>
        public string NotificationType { get; set; } = string.Empty;

        /// <summary>
        /// プラットフォーム（Android/iOS）
        /// </summary>
        public string Platform { get; set; } = string.Empty;

        /// <summary>
        /// JSON通知テンプレート
        /// </summary>
        public string TemplateJson { get; set; } = string.Empty;

        /// <summary>
        /// アクティブフラグ
        /// </summary>
        public bool IsActive { get; set; }

        /// <summary>
        /// 作成日時
        /// </summary>
        public DateTime CreatedAt { get; set; }

        /// <summary>
        /// 更新日時
        /// </summary>
        public DateTime UpdatedAt { get; set; }
    }
}
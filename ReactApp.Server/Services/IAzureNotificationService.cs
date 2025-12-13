using ReactApp.Server.DTOs;
using ReactApp.Server.Helpers;

namespace ReactApp.Server.Services
{
    /// <summary>
    /// Azure Notification Hub を使用したプッシュ通知サービスのインターフェース
    /// デバイスIDベースの通知配信とプラットフォーム別JSON切り替えを提供
    /// </summary>
    public interface IAzureNotificationService
    {
        /// <summary>
        /// 特定のデバイスに通知を送信
        /// </summary>
        /// <param name="deviceId">対象デバイスID (UUID)</param>
        /// <param name="title">通知タイトル</param>
        /// <param name="body">通知本文</param>
        /// <param name="notificationType">通知種別 (general/absence/report)</param>
        /// <param name="additionalData">追加データ (オプション)</param>
        /// <returns>送信結果</returns>
        Task<NotificationResult> SendNotificationAsync(
            string deviceId,
            string title,
            string body,
            string notificationType = "general",
            Dictionary<string, string>? additionalData = null);

        /// <summary>
        /// 複数デバイスに通知を一括送信
        /// </summary>
        /// <param name="deviceIds">対象デバイスIDリスト</param>
        /// <param name="title">通知タイトル</param>
        /// <param name="body">通知本文</param>
        /// <param name="notificationType">通知種別</param>
        /// <param name="additionalData">追加データ (オプション)</param>
        /// <returns>送信結果リスト</returns>
        Task<List<NotificationResult>> SendBulkNotificationAsync(
            List<string> deviceIds,
            string title,
            string body,
            string notificationType = "general",
            Dictionary<string, string>? additionalData = null);

        /// <summary>
        /// ユーザーの全デバイスに通知を送信
        /// </summary>
        /// <param name="userId">ユーザーID</param>
        /// <param name="userType">ユーザー種別 (parent/staff)</param>
        /// <param name="title">通知タイトル</param>
        /// <param name="body">通知本文</param>
        /// <param name="notificationType">通知種別</param>
        /// <param name="additionalData">追加データ (オプション)</param>
        /// <returns>送信結果リスト</returns>
        Task<List<NotificationResult>> SendToUserDevicesAsync(
            int userId,
            string userType,
            string title,
            string body,
            string notificationType = "general",
            Dictionary<string, string>? additionalData = null);

        /// <summary>
        /// 通知テンプレートを取得
        /// </summary>
        /// <param name="notificationType">通知種別</param>
        /// <param name="platform">プラットフォーム (Android/iOS)</param>
        /// <returns>JSONテンプレート</returns>
        Task<string?> GetNotificationTemplateAsync(string notificationType, string platform);

        /// <summary>
        /// 未読通知数を取得
        /// </summary>
        /// <param name="deviceId">デバイスID</param>
        /// <returns>未読通知数</returns>
        Task<int> GetUnreadCountAsync(string deviceId);

        /// <summary>
        /// 通知配信ログを記録
        /// </summary>
        /// <param name="deviceId">デバイスID</param>
        /// <param name="title">通知タイトル</param>
        /// <param name="body">通知本文</param>
        /// <param name="notificationType">通知種別</param>
        /// <param name="platform">プラットフォーム</param>
        /// <param name="jsonPayload">送信JSONペイロード</param>
        /// <param name="notificationState">通知状態</param>
        /// <returns>ログID</returns>
        Task<int> LogNotificationAsync(
            string deviceId,
            string title,
            string body,
            string notificationType,
            string platform,
            string jsonPayload,
            string notificationState);
    }

    /// <summary>
    /// 通知送信結果
    /// </summary>
    public class NotificationResult
    {
        /// <summary>
        /// 送信成功フラグ
        /// </summary>
        public bool IsSuccess { get; set; }

        /// <summary>
        /// 対象デバイスID
        /// </summary>
        public string DeviceId { get; set; } = string.Empty;

        /// <summary>
        /// エラーメッセージ (失敗時)
        /// </summary>
        public string? ErrorMessage { get; set; }

        /// <summary>
        /// Azure Notification Hub応答ID
        /// </summary>
        public string? NotificationId { get; set; }

        /// <summary>
        /// 送信日時
        /// </summary>
        public DateTime SentAt { get; set; } = DateTimeHelper.GetJstNow();
    }
}

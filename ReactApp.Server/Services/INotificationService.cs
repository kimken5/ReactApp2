using ReactApp.Server.DTOs;

namespace ReactApp.Server.Services
{
    /// <summary>
    /// 通知管理サービスインターフェース
    /// 保護者への通知設定・送信・履歴管理機能を提供
    /// SMS・プッシュ通知等の複数チャネル対応
    /// </summary>
    public interface INotificationService
    {
        /// <summary>
        /// 保護者通知設定取得
        /// </summary>
        /// <param name="parentId">保護者ID</param>
        /// <returns>通知設定情報（見つからない場合はnull）</returns>
        Task<NotificationSettingsDto?> GetNotificationSettingsAsync(int parentId);

        /// <summary>
        /// 保護者通知設定更新
        /// </summary>
        /// <param name="parentId">保護者ID</param>
        /// <param name="dto">通知設定更新データ</param>
        /// <returns>更新処理の成功可否</returns>
        Task<bool> UpdateNotificationSettingsAsync(int parentId, UpdateNotificationSettingsDto dto);

        /// <summary>
        /// 通知送信実行
        /// </summary>
        /// <param name="dto">通知送信データ</param>
        /// <returns>送信処理の成功可否</returns>
        Task<bool> SendNotificationAsync(SendNotificationDto dto);

        /// <summary>
        /// 保護者の通知履歴取得
        /// </summary>
        /// <param name="parentId">保護者ID</param>
        /// <returns>該当保護者の通知履歴一覧</returns>
        Task<IEnumerable<NotificationLogDto>> GetNotificationLogsByParentAsync(int parentId);

        /// <summary>
        /// 通知種別履歴取得
        /// </summary>
        /// <param name="notificationType">通知種別</param>
        /// <returns>該当種別の通知履歴一覧</returns>
        Task<IEnumerable<NotificationLogDto>> GetNotificationLogsByTypeAsync(string notificationType);

        /// <summary>
        /// 通知既読マーク設定
        /// </summary>
        /// <param name="notificationId">通知ID</param>
        /// <returns>既読マーク設定の成功可否</returns>
        Task<bool> MarkNotificationAsReadAsync(int notificationId);

        /// <summary>
        /// 失敗通知の再送信実行
        /// </summary>
        /// <param name="notificationId">通知ID</param>
        /// <returns>再送信処理の成功可否</returns>
        Task<bool> RetryFailedNotificationAsync(int notificationId);

        /// <summary>
        /// 失敗通知一覧取得
        /// </summary>
        /// <returns>送信失敗した通知の一覧</returns>
        Task<IEnumerable<NotificationLogDto>> GetFailedNotificationsAsync();
    }
}
using ReactApp.Server.DTOs.Desktop;

namespace ReactApp.Server.Services
{
    /// <summary>
    /// デスクトップアプリ用連絡通知管理サービスインターフェース
    /// </summary>
    public interface IDesktopContactNotificationService
    {
        /// <summary>
        /// 連絡通知一覧を取得（フィルタ対応）
        /// </summary>
        Task<List<ContactNotificationDto>> GetContactNotificationsAsync(ContactNotificationFilterDto filter);

        /// <summary>
        /// 連絡通知詳細を取得
        /// </summary>
        Task<ContactNotificationDto?> GetContactNotificationByIdAsync(int id);

        /// <summary>
        /// 連絡通知を確認済みにする
        /// </summary>
        Task<ContactNotificationDto> AcknowledgeNotificationAsync(int id, AcknowledgeNotificationRequestDto request);

        /// <summary>
        /// 連絡通知に返信を追加
        /// </summary>
        Task<ContactNotificationResponseDto> CreateResponseAsync(int notificationId, CreateResponseRequestDto request);

        /// <summary>
        /// 連絡通知を削除（論理削除）
        /// </summary>
        Task<bool> DeleteContactNotificationAsync(int id);

        /// <summary>
        /// 未確認の連絡通知数を取得
        /// </summary>
        Task<int> GetUnacknowledgedCountAsync();
    }
}

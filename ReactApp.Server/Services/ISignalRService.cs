namespace ReactApp.Server.Services
{
    /// <summary>
    /// SignalRリアルタイム通知サービスのインターフェース
    /// Hub経由でのリアルタイム通知配信を提供
    /// </summary>
    public interface ISignalRService
    {
        /// <summary>
        /// 特定ユーザーにリアルタイム通知を送信
        /// </summary>
        /// <param name="userId">対象ユーザーID</param>
        /// <param name="notificationType">通知種別</param>
        /// <param name="title">通知タイトル</param>
        /// <param name="body">通知本文</param>
        /// <param name="additionalData">追加データ</param>
        /// <returns>送信タスク</returns>
        Task SendToUserAsync(
            string userId,
            string notificationType,
            string title,
            string body,
            object? additionalData = null);

        /// <summary>
        /// 複数ユーザーにリアルタイム通知を送信
        /// </summary>
        /// <param name="userIds">対象ユーザーIDリスト</param>
        /// <param name="notificationType">通知種別</param>
        /// <param name="title">通知タイトル</param>
        /// <param name="body">通知本文</param>
        /// <param name="additionalData">追加データ</param>
        /// <returns>送信タスク</returns>
        Task SendToUsersAsync(
            List<string> userIds,
            string notificationType,
            string title,
            string body,
            object? additionalData = null);

        /// <summary>
        /// 特定デバイスにリアルタイム通知を送信
        /// </summary>
        /// <param name="deviceId">対象デバイスID</param>
        /// <param name="notificationType">通知種別</param>
        /// <param name="title">通知タイトル</param>
        /// <param name="body">通知本文</param>
        /// <param name="additionalData">追加データ</param>
        /// <returns>送信タスク</returns>
        Task SendToDeviceAsync(
            string deviceId,
            string notificationType,
            string title,
            string body,
            object? additionalData = null);

        /// <summary>
        /// クラス全体にリアルタイム通知を送信
        /// </summary>
        /// <param name="classId">対象クラスID</param>
        /// <param name="notificationType">通知種別</param>
        /// <param name="title">通知タイトル</param>
        /// <param name="body">通知本文</param>
        /// <param name="additionalData">追加データ</param>
        /// <returns>送信タスク</returns>
        Task SendToClassAsync(
            string classId,
            string notificationType,
            string title,
            string body,
            object? additionalData = null);

        /// <summary>
        /// ユーザー種別全体にリアルタイム通知を送信
        /// </summary>
        /// <param name="userType">対象ユーザー種別（parent/staff）</param>
        /// <param name="notificationType">通知種別</param>
        /// <param name="title">通知タイトル</param>
        /// <param name="body">通知本文</param>
        /// <param name="additionalData">追加データ</param>
        /// <returns>送信タスク</returns>
        Task SendToUserTypeAsync(
            string userType,
            string notificationType,
            string title,
            string body,
            object? additionalData = null);

        /// <summary>
        /// 緊急通知を全体に送信
        /// </summary>
        /// <param name="title">通知タイトル</param>
        /// <param name="body">通知本文</param>
        /// <param name="additionalData">追加データ</param>
        /// <returns>送信タスク</returns>
        Task SendEmergencyNotificationAsync(
            string title,
            string body,
            object? additionalData = null);

        /// <summary>
        /// 欠席・遅刻・お迎え連絡通知を送信
        /// </summary>
        /// <param name="targetStaffIds">対象スタッフIDリスト</param>
        /// <param name="absenceType">連絡種別（absence/late/pickup）</param>
        /// <param name="childName">園児名</param>
        /// <param name="reason">理由</param>
        /// <param name="additionalData">追加データ</param>
        /// <returns>送信タスク</returns>
        Task SendAbsenceNotificationAsync(
            List<string> targetStaffIds,
            string absenceType,
            string childName,
            string reason,
            object? additionalData = null);

        /// <summary>
        /// 日次レポート通知を送信
        /// </summary>
        /// <param name="parentIds">対象保護者IDリスト</param>
        /// <param name="childName">園児名</param>
        /// <param name="reportSummary">レポート概要</param>
        /// <param name="additionalData">追加データ</param>
        /// <returns>送信タスク</returns>
        Task SendDailyReportNotificationAsync(
            List<string> parentIds,
            string childName,
            string reportSummary,
            object? additionalData = null);

        /// <summary>
        /// 写真アップロード通知を送信
        /// </summary>
        /// <param name="parentIds">対象保護者IDリスト</param>
        /// <param name="photoCount">アップロード写真数</param>
        /// <param name="uploadDate">アップロード日</param>
        /// <param name="additionalData">追加データ</param>
        /// <returns>送信タスク</returns>
        Task SendPhotoUploadNotificationAsync(
            List<string> parentIds,
            int photoCount,
            DateTime uploadDate,
            object? additionalData = null);

        /// <summary>
        /// システムメンテナンス通知を送信
        /// </summary>
        /// <param name="maintenanceStart">メンテナンス開始時刻</param>
        /// <param name="maintenanceEnd">メンテナンス終了時刻</param>
        /// <param name="additionalData">追加データ</param>
        /// <returns>送信タスク</returns>
        Task SendMaintenanceNotificationAsync(
            DateTime maintenanceStart,
            DateTime maintenanceEnd,
            object? additionalData = null);

        /// <summary>
        /// 接続中のユーザー数を取得
        /// </summary>
        /// <returns>接続中ユーザー数</returns>
        Task<int> GetConnectedUsersCountAsync();

        /// <summary>
        /// 特定ユーザーの接続状態を確認
        /// </summary>
        /// <param name="userId">ユーザーID</param>
        /// <returns>接続中フラグ</returns>
        Task<bool> IsUserConnectedAsync(string userId);
    }
}
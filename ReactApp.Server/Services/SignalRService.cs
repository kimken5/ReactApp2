using Microsoft.AspNetCore.SignalR;
using ReactApp.Server.Hubs;

namespace ReactApp.Server.Services
{
    /// <summary>
    /// SignalRリアルタイム通知サービス実装
    /// Hub経由でのリアルタイム通知配信を提供
    /// </summary>
    public class SignalRService : ISignalRService
    {
        private readonly IHubContext<NotificationHub> _hubContext;
        private readonly ILogger<SignalRService> _logger;

        public SignalRService(
            IHubContext<NotificationHub> hubContext,
            ILogger<SignalRService> logger)
        {
            _hubContext = hubContext;
            _logger = logger;
        }

        /// <summary>
        /// 特定ユーザーにリアルタイム通知を送信
        /// </summary>
        public async Task SendToUserAsync(
            string userId,
            string notificationType,
            string title,
            string body,
            object? additionalData = null)
        {
            try
            {
                _logger.LogInformation("Sending realtime notification to user {UserId}: {Title}",
                    userId, title);

                var notification = CreateNotification(notificationType, title, body, additionalData);

                await _hubContext.Clients.Group($"user_{userId}")
                    .SendAsync("ReceiveNotification", notification);

                _logger.LogInformation("Realtime notification sent successfully to user {UserId}", userId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send realtime notification to user {UserId}", userId);
                throw;
            }
        }

        /// <summary>
        /// 複数ユーザーにリアルタイム通知を送信
        /// </summary>
        public async Task SendToUsersAsync(
            List<string> userIds,
            string notificationType,
            string title,
            string body,
            object? additionalData = null)
        {
            try
            {
                _logger.LogInformation("Sending realtime notification to {UserCount} users: {Title}",
                    userIds.Count, title);

                var notification = CreateNotification(notificationType, title, body, additionalData);
                var groupNames = userIds.Select(id => $"user_{id}").ToList();

                await _hubContext.Clients.Groups(groupNames)
                    .SendAsync("ReceiveNotification", notification);

                _logger.LogInformation("Realtime notification sent successfully to {UserCount} users", userIds.Count);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send realtime notification to multiple users");
                throw;
            }
        }

        /// <summary>
        /// 特定デバイスにリアルタイム通知を送信
        /// </summary>
        public async Task SendToDeviceAsync(
            string deviceId,
            string notificationType,
            string title,
            string body,
            object? additionalData = null)
        {
            try
            {
                _logger.LogInformation("Sending realtime notification to device {DeviceId}: {Title}",
                    deviceId, title);

                var notification = CreateNotification(notificationType, title, body, additionalData);

                await _hubContext.Clients.Group($"device_{deviceId}")
                    .SendAsync("ReceiveNotification", notification);

                _logger.LogInformation("Realtime notification sent successfully to device {DeviceId}", deviceId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send realtime notification to device {DeviceId}", deviceId);
                throw;
            }
        }

        /// <summary>
        /// クラス全体にリアルタイム通知を送信
        /// </summary>
        public async Task SendToClassAsync(
            string classId,
            string notificationType,
            string title,
            string body,
            object? additionalData = null)
        {
            try
            {
                _logger.LogInformation("Sending realtime notification to class {ClassId}: {Title}",
                    classId, title);

                var notification = CreateNotification(notificationType, title, body, additionalData);

                await _hubContext.Clients.Group($"class_{classId}")
                    .SendAsync("ReceiveNotification", notification);

                _logger.LogInformation("Realtime notification sent successfully to class {ClassId}", classId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send realtime notification to class {ClassId}", classId);
                throw;
            }
        }

        /// <summary>
        /// ユーザー種別全体にリアルタイム通知を送信
        /// </summary>
        public async Task SendToUserTypeAsync(
            string userType,
            string notificationType,
            string title,
            string body,
            object? additionalData = null)
        {
            try
            {
                _logger.LogInformation("Sending realtime notification to usertype {UserType}: {Title}",
                    userType, title);

                var notification = CreateNotification(notificationType, title, body, additionalData);

                await _hubContext.Clients.Group($"usertype_{userType}")
                    .SendAsync("ReceiveNotification", notification);

                _logger.LogInformation("Realtime notification sent successfully to usertype {UserType}", userType);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send realtime notification to usertype {UserType}", userType);
                throw;
            }
        }

        /// <summary>
        /// 緊急通知を全体に送信
        /// </summary>
        public async Task SendEmergencyNotificationAsync(
            string title,
            string body,
            object? additionalData = null)
        {
            try
            {
                _logger.LogWarning("Sending emergency notification: {Title}", title);

                var notification = CreateNotification("emergency", title, body, additionalData, isEmergency: true);

                await _hubContext.Clients.All
                    .SendAsync("ReceiveEmergencyNotification", notification);

                _logger.LogWarning("Emergency notification sent successfully to all connected users");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send emergency notification");
                throw;
            }
        }

        /// <summary>
        /// 欠席・遅刻・お迎え連絡通知を送信
        /// </summary>
        public async Task SendAbsenceNotificationAsync(
            List<string> targetStaffIds,
            string absenceType,
            string childName,
            string reason,
            object? additionalData = null)
        {
            var title = absenceType switch
            {
                "absence" => $"欠席連絡: {childName}",
                "late" => $"遅刻連絡: {childName}",
                "pickup" => $"お迎え連絡: {childName}",
                _ => $"連絡: {childName}"
            };

            var body = $"理由: {reason}";

            var data = new
            {
                absenceType = absenceType,
                childName = childName,
                reason = reason,
                additionalData = additionalData
            };

            await SendToUsersAsync(targetStaffIds, "absence", title, body, data);
        }

        /// <summary>
        /// 日次レポート通知を送信
        /// </summary>
        public async Task SendDailyReportNotificationAsync(
            List<string> parentIds,
            string childName,
            string reportSummary,
            object? additionalData = null)
        {
            var title = $"日次レポート: {childName}";
            var body = reportSummary;

            var data = new
            {
                childName = childName,
                reportSummary = reportSummary,
                reportDate = DateTime.Today,
                additionalData = additionalData
            };

            await SendToUsersAsync(parentIds, "report", title, body, data);
        }

        /// <summary>
        /// 写真アップロード通知を送信
        /// </summary>
        public async Task SendPhotoUploadNotificationAsync(
            List<string> parentIds,
            int photoCount,
            DateTime uploadDate,
            object? additionalData = null)
        {
            var title = "新しい写真がアップロードされました";
            var body = $"{photoCount}枚の写真が追加されました";

            var data = new
            {
                photoCount = photoCount,
                uploadDate = uploadDate,
                additionalData = additionalData
            };

            await SendToUsersAsync(parentIds, "photo", title, body, data);
        }

        /// <summary>
        /// システムメンテナンス通知を送信
        /// </summary>
        public async Task SendMaintenanceNotificationAsync(
            DateTime maintenanceStart,
            DateTime maintenanceEnd,
            object? additionalData = null)
        {
            var title = "システムメンテナンスのお知らせ";
            var body = $"メンテナンス時間: {maintenanceStart:yyyy/MM/dd HH:mm} - {maintenanceEnd:HH:mm}";

            var data = new
            {
                maintenanceStart = maintenanceStart,
                maintenanceEnd = maintenanceEnd,
                additionalData = additionalData
            };

            await _hubContext.Clients.All
                .SendAsync("ReceiveSystemNotification", CreateNotification("system", title, body, data));
        }

        /// <summary>
        /// 接続中のユーザー数を取得
        /// </summary>
        public async Task<int> GetConnectedUsersCountAsync()
        {
            // SignalRでは直接的な接続数取得は困難
            // 実装時はRedisなどの外部ストレージで管理することを推奨
            _logger.LogInformation("Getting connected users count (placeholder implementation)");

            // プレースホルダー実装
            await Task.CompletedTask;
            return 0;
        }

        /// <summary>
        /// 特定ユーザーの接続状態を確認
        /// </summary>
        public async Task<bool> IsUserConnectedAsync(string userId)
        {
            // SignalRでは直接的な接続状態確認は困難
            // 実装時はRedisなどの外部ストレージで管理することを推奨
            _logger.LogInformation("Checking connection status for user {UserId} (placeholder implementation)", userId);

            // プレースホルダー実装
            await Task.CompletedTask;
            return false;
        }

        /// <summary>
        /// 通知オブジェクトを作成
        /// </summary>
        private object CreateNotification(
            string notificationType,
            string title,
            string body,
            object? additionalData = null,
            bool isEmergency = false)
        {
            return new
            {
                id = Guid.NewGuid().ToString(),
                type = notificationType,
                title = title,
                body = body,
                timestamp = DateTime.UtcNow,
                isEmergency = isEmergency,
                data = additionalData,
                source = "signalr"
            };
        }
    }
}
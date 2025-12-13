using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;
using ReactApp.Server.Helpers;

namespace ReactApp.Server.Hubs
{
    /// <summary>
    /// リアルタイム通知用SignalR Hub
    /// 保護者・スタッフ間のリアルタイム通知配信を提供
    /// </summary>
    [Authorize]
    public class NotificationHub : Hub
    {
        private readonly ILogger<NotificationHub> _logger;

        public NotificationHub(ILogger<NotificationHub> logger)
        {
            _logger = logger;
        }

        /// <summary>
        /// クライアント接続時の処理
        /// </summary>
        public override async Task OnConnectedAsync()
        {
            var userId = GetUserId();
            var userType = GetUserType();
            var deviceId = GetDeviceId();

            _logger.LogInformation("User {UserId} ({UserType}) connected from device {DeviceId}",
                userId, userType, deviceId);

            // ユーザー固有グループに参加
            await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userId}");

            // ユーザー種別グループに参加
            await Groups.AddToGroupAsync(Context.ConnectionId, $"usertype_{userType}");

            // デバイス固有グループに参加
            if (!string.IsNullOrEmpty(deviceId))
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, $"device_{deviceId}");
            }

            // 接続通知をクライアントに送信
            await Clients.Caller.SendAsync("Connected", new
            {
                message = "リアルタイム通知に接続しました",
                timestamp = DateTimeHelper.GetJstNow(),
                userId = userId,
                userType = userType
            });

            await base.OnConnectedAsync();
        }

        /// <summary>
        /// クライアント切断時の処理
        /// </summary>
        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var userId = GetUserId();
            var userType = GetUserType();

            _logger.LogInformation("User {UserId} ({UserType}) disconnected", userId, userType);

            if (exception != null)
            {
                _logger.LogError(exception, "Connection lost due to error for user {UserId}", userId);
            }

            await base.OnDisconnectedAsync(exception);
        }

        /// <summary>
        /// クラス固有グループに参加
        /// </summary>
        /// <param name="classId">クラスID</param>
        [HubMethodName("JoinClassGroup")]
        public async Task JoinClassGroup(string classId)
        {
            var userId = GetUserId();
            _logger.LogInformation("User {UserId} joining class group {ClassId}", userId, classId);

            await Groups.AddToGroupAsync(Context.ConnectionId, $"class_{classId}");

            await Clients.Caller.SendAsync("JoinedClassGroup", new
            {
                classId = classId,
                message = $"クラス {classId} の通知グループに参加しました",
                timestamp = DateTimeHelper.GetJstNow()
            });
        }

        /// <summary>
        /// クラス固有グループから退出
        /// </summary>
        /// <param name="classId">クラスID</param>
        [HubMethodName("LeaveClassGroup")]
        public async Task LeaveClassGroup(string classId)
        {
            var userId = GetUserId();
            _logger.LogInformation("User {UserId} leaving class group {ClassId}", userId, classId);

            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"class_{classId}");

            await Clients.Caller.SendAsync("LeftClassGroup", new
            {
                classId = classId,
                message = $"クラス {classId} の通知グループから退出しました",
                timestamp = DateTimeHelper.GetJstNow()
            });
        }

        /// <summary>
        /// 通知確認状態を更新
        /// </summary>
        /// <param name="notificationId">通知ID</param>
        [HubMethodName("MarkAsRead")]
        public async Task MarkAsRead(string notificationId)
        {
            var userId = GetUserId();
            _logger.LogInformation("User {UserId} marked notification {NotificationId} as read",
                userId, notificationId);

            // 通知確認をグループに送信（同一ユーザーの他デバイスにも通知）
            await Clients.Group($"user_{userId}").SendAsync("NotificationRead", new
            {
                notificationId = notificationId,
                readBy = userId,
                readAt = DateTimeHelper.GetJstNow()
            });
        }

        /// <summary>
        /// 勤務時間外通知設定を更新
        /// </summary>
        /// <param name="allowAfterHours">勤務時間外通知許可フラグ</param>
        [HubMethodName("UpdateAfterHoursNotification")]
        public async Task UpdateAfterHoursNotification(bool allowAfterHours)
        {
            var userId = GetUserId();
            _logger.LogInformation("User {UserId} updated after hours notification setting to {AllowAfterHours}",
                userId, allowAfterHours);

            // 設定更新をクライアントに確認
            await Clients.Caller.SendAsync("AfterHoursNotificationUpdated", new
            {
                allowAfterHours = allowAfterHours,
                updatedAt = DateTimeHelper.GetJstNow(),
                message = allowAfterHours ? "勤務時間外通知を有効にしました" : "勤務時間外通知を無効にしました"
            });
        }

        /// <summary>
        /// Ping/Pong for connection health check
        /// </summary>
        [HubMethodName("Ping")]
        public async Task Ping()
        {
            await Clients.Caller.SendAsync("Pong", DateTimeHelper.GetJstNow());
        }

        /// <summary>
        /// 現在の接続情報を取得
        /// </summary>
        [HubMethodName("GetConnectionInfo")]
        public async Task GetConnectionInfo()
        {
            var userId = GetUserId();
            var userType = GetUserType();
            var deviceId = GetDeviceId();

            await Clients.Caller.SendAsync("ConnectionInfo", new
            {
                connectionId = Context.ConnectionId,
                userId = userId,
                userType = userType,
                deviceId = deviceId,
                connectedAt = DateTimeHelper.GetJstNow(),
                groups = new[] { $"user_{userId}", $"usertype_{userType}", $"device_{deviceId}" }
            });
        }

        /// <summary>
        /// ユーザーIDを取得
        /// </summary>
        private string GetUserId()
        {
            return Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "unknown";
        }

        /// <summary>
        /// ユーザー種別を取得
        /// </summary>
        private string GetUserType()
        {
            return Context.User?.FindFirst("UserType")?.Value ?? "parent";
        }

        /// <summary>
        /// デバイスIDを取得（リクエストヘッダーから）
        /// </summary>
        private string GetDeviceId()
        {
            if (Context.GetHttpContext()?.Request.Headers.TryGetValue("X-Device-Id", out var deviceId) == true)
            {
                return deviceId.FirstOrDefault() ?? string.Empty;
            }
            return string.Empty;
        }
    }
}

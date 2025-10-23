using AutoMapper;
using Microsoft.EntityFrameworkCore;
using ReactApp.Server.Data;
using ReactApp.Server.DTOs;
using ReactApp.Server.Models;
using ReactApp.Server.Exceptions;

namespace ReactApp.Server.Services
{
    /// <summary>
    /// 通知管理サービス実装クラス
    /// 保護者への通知設定・送信・履歴管理の業務ロジックを提供
    /// SMS・プッシュ通知等の複数チャネル対応
    /// </summary>
    public class NotificationService : INotificationService
    {
        // 依存サービス
        private readonly KindergartenDbContext _context;             // データベースコンテキスト
        private readonly IMapper _mapper;                            // オブジェクトマッピングサービス
        private readonly ILogger<NotificationService> _logger;       // ログ出力サービス

        /// <summary>
        /// NotificationServiceコンストラクタ
        /// 必要な依存サービスを注入により受け取り初期化
        /// </summary>
        /// <param name="context">データベースコンテキスト</param>
        /// <param name="mapper">オブジェクトマッピングサービス</param>
        /// <param name="logger">ログ出力サービス</param>
        public NotificationService(
            KindergartenDbContext context,
            IMapper mapper,
            ILogger<NotificationService> logger)
        {
            _context = context;
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<NotificationSettingsDto?> GetNotificationSettingsAsync(int parentId)
        {
            var parent = await _context.Parents.FindAsync(parentId);

            if (parent == null)
            {
                return null;
            }

            // Map Parent properties to NotificationSettingsDto
            var dto = new NotificationSettingsDto
            {
                Id = parent.Id,
                ParentId = parent.Id,
                PushNotificationsEnabled = parent.PushNotificationsEnabled,
                AbsenceConfirmationEnabled = parent.AbsenceConfirmationEnabled,
                DailyReportEnabled = parent.DailyReportEnabled,
                EventNotificationEnabled = parent.EventNotificationEnabled,
                AnnouncementEnabled = parent.AnnouncementEnabled,
                SmsNotificationsEnabled = false,  // Not supported in Parents table
                EmailNotificationsEnabled = false,  // Not supported in Parents table
                DeviceToken = null,  // Not stored in Parents table
                DevicePlatform = null,  // Not stored in Parents table
                CreatedAt = parent.CreatedAt,
                UpdatedAt = parent.UpdatedAt
            };

            return dto;
        }

        public async Task<bool> UpdateNotificationSettingsAsync(int parentId, UpdateNotificationSettingsDto dto)
        {
            var parent = await _context.Parents.FindAsync(parentId);

            if (parent == null)
            {
                return false;
            }

            // Update notification settings stored in Parent table
            if (dto.PushNotificationsEnabled.HasValue)
                parent.PushNotificationsEnabled = dto.PushNotificationsEnabled.Value;
            if (dto.AbsenceConfirmationEnabled.HasValue)
                parent.AbsenceConfirmationEnabled = dto.AbsenceConfirmationEnabled.Value;
            if (dto.DailyReportEnabled.HasValue)
                parent.DailyReportEnabled = dto.DailyReportEnabled.Value;
            if (dto.EventNotificationEnabled.HasValue)
                parent.EventNotificationEnabled = dto.EventNotificationEnabled.Value;
            if (dto.AnnouncementEnabled.HasValue)
                parent.AnnouncementEnabled = dto.AnnouncementEnabled.Value;

            // SMS, Email, DeviceToken, DevicePlatform are not supported in Parents table
            // These settings are ignored

            parent.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Notification settings updated for parent: {ParentId}", parentId);
            return true;
        }

        public async Task<bool> SendNotificationAsync(SendNotificationDto dto)
        {
            var logs = new List<NotificationLog>();

            foreach (var parentId in dto.ParentIds)
            {
                var parent = await _context.Parents.FindAsync(parentId);
                if (parent == null) continue;

                // Check if notification type is enabled (read from Parent table)
                bool isEnabled = parent.PushNotificationsEnabled;
                switch (dto.NotificationType.ToLower())
                {
                    case "absence":
                        isEnabled = parent.AbsenceConfirmationEnabled;
                        break;
                    case "report":
                        isEnabled = parent.DailyReportEnabled;
                        break;
                    case "event":
                        isEnabled = parent.EventNotificationEnabled;
                        break;
                    case "announcement":
                        isEnabled = parent.AnnouncementEnabled;
                        break;
                }

                if (!isEnabled)
                {
                    _logger.LogInformation("Notification skipped for parent {ParentId} - type {Type} disabled",
                        parentId, dto.NotificationType);
                    continue;
                }

                var log = new NotificationLog
                {
                    ParentId = parentId,
                    NotificationType = dto.NotificationType,
                    DeliveryMethod = dto.DeliveryMethod,
                    Title = dto.Title,
                    Content = dto.Content,
                    Status = "pending",
                    RelatedEntityId = dto.RelatedEntityId,
                    RelatedEntityType = dto.RelatedEntityType,
                    CreatedAt = DateTime.UtcNow
                };

                // Simulate delivery (in real implementation, this would call external services)
                try
                {
                    await SimulateNotificationDeliveryAsync(log, parent);
                    log.Status = "sent";
                    log.SentAt = DateTime.UtcNow;

                    // Simulate delivery confirmation for push notifications
                    if (dto.DeliveryMethod == "push")
                    {
                        log.Status = "delivered";
                        log.DeliveredAt = DateTime.UtcNow;
                    }
                }
                catch (Exception ex)
                {
                    log.Status = "failed";
                    log.ErrorMessage = ex.Message;
                    log.NextRetryAt = DateTime.UtcNow.AddMinutes(5); // Retry in 5 minutes

                    _logger.LogError(ex, "Failed to send notification to parent {ParentId}", parentId);
                }

                logs.Add(log);
            }

            _context.NotificationLogs.AddRange(logs);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Sent {Count} notifications for type: {Type}",
                logs.Count(l => l.Status == "sent" || l.Status == "delivered"), dto.NotificationType);

            return logs.Any(l => l.Status == "sent" || l.Status == "delivered");
        }

        public async Task<IEnumerable<NotificationLogDto>> GetNotificationLogsByParentAsync(int parentId)
        {
            var logs = await _context.NotificationLogs
                .Include(l => l.Parent)
                .Where(l => l.ParentId == parentId)
                .OrderByDescending(l => l.CreatedAt)
                .Take(100) // Limit to recent 100 notifications
                .ToListAsync();

            return _mapper.Map<IEnumerable<NotificationLogDto>>(logs);
        }

        public async Task<IEnumerable<NotificationLogDto>> GetNotificationLogsByTypeAsync(string notificationType)
        {
            var logs = await _context.NotificationLogs
                .Include(l => l.Parent)
                .Where(l => l.NotificationType == notificationType)
                .OrderByDescending(l => l.CreatedAt)
                .Take(500) // Limit to recent 500 notifications
                .ToListAsync();

            return _mapper.Map<IEnumerable<NotificationLogDto>>(logs);
        }

        public async Task<bool> MarkNotificationAsReadAsync(int notificationId)
        {
            var log = await _context.NotificationLogs.FindAsync(notificationId);
            if (log == null || log.Status != "delivered")
            {
                return false;
            }

            log.Status = "read";
            log.ReadAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Notification marked as read: {NotificationId}", notificationId);
            return true;
        }

        public async Task<bool> RetryFailedNotificationAsync(int notificationId)
        {
            var log = await _context.NotificationLogs
                .Include(l => l.Parent)
                .FirstOrDefaultAsync(l => l.Id == notificationId && l.Status == "failed");

            if (log == null || log.Parent == null)
            {
                return false;
            }

            try
            {
                await SimulateNotificationDeliveryAsync(log, log.Parent);
                log.Status = "sent";
                log.SentAt = DateTime.UtcNow;
                log.RetryCount++;
                log.NextRetryAt = null;
                log.ErrorMessage = null;

                if (log.DeliveryMethod == "push")
                {
                    log.Status = "delivered";
                    log.DeliveredAt = DateTime.UtcNow;
                }

                await _context.SaveChangesAsync();

                _logger.LogInformation("Notification retry successful: {NotificationId}", notificationId);
                return true;
            }
            catch (Exception ex)
            {
                log.RetryCount++;
                log.ErrorMessage = ex.Message;
                log.NextRetryAt = DateTime.UtcNow.AddMinutes(Math.Min(30, 5 * log.RetryCount)); // Exponential backoff

                await _context.SaveChangesAsync();

                _logger.LogError(ex, "Notification retry failed: {NotificationId}", notificationId);
                return false;
            }
        }

        public async Task<IEnumerable<NotificationLogDto>> GetFailedNotificationsAsync()
        {
            var logs = await _context.NotificationLogs
                .Include(l => l.Parent)
                .Where(l => l.Status == "failed" && (l.NextRetryAt == null || l.NextRetryAt <= DateTime.UtcNow))
                .OrderBy(l => l.CreatedAt)
                .Take(100) // Process up to 100 failed notifications at a time
                .ToListAsync();

            return _mapper.Map<IEnumerable<NotificationLogDto>>(logs);
        }

        private async Task SimulateNotificationDeliveryAsync(NotificationLog log, Parent parent)
        {
            // Simulate network delay
            await Task.Delay(100);

            // Simulate occasional failures (10% failure rate)
            if (new Random().Next(1, 11) == 1)
            {
                throw new Exception("Network timeout or external service unavailable");
            }

            // Simulate delivery method specific logic
            switch (log.DeliveryMethod.ToLower())
            {
                case "push":
                    // In real implementation: call FCM/APNs service
                    // DeviceToken is no longer stored in Parents table
                    break;

                case "sms":
                    // SMS notifications are not supported in Parents table
                    throw new Exception("SMS notifications are not supported");

                case "email":
                    // Email notifications are not supported in Parents table
                    throw new Exception("Email notifications are not supported");

                default:
                    throw new Exception($"Unsupported delivery method: {log.DeliveryMethod}");
            }

            _logger.LogDebug("Simulated {Method} notification delivery for parent {ParentId}",
                log.DeliveryMethod, log.ParentId);
        }
    }
}
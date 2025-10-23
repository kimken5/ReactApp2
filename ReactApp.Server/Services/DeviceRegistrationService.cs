using AutoMapper;
using Microsoft.EntityFrameworkCore;
using ReactApp.Server.Data;
using ReactApp.Server.DTOs;
using ReactApp.Server.Models;

namespace ReactApp.Server.Services
{
    /// <summary>
    /// デバイス登録管理サービス実装
    /// プッシュ通知用デバイス情報の登録・更新・管理を提供
    /// </summary>
    public class DeviceRegistrationService : IDeviceRegistrationService
    {
        private readonly KindergartenDbContext _context;
        private readonly IMapper _mapper;
        private readonly ILogger<DeviceRegistrationService> _logger;

        public DeviceRegistrationService(
            KindergartenDbContext context,
            IMapper mapper,
            ILogger<DeviceRegistrationService> logger)
        {
            _context = context;
            _mapper = mapper;
            _logger = logger;
        }

        /// <summary>
        /// 新規デバイスを登録
        /// </summary>
        public async Task<DeviceRegistrationDto> RegisterDeviceAsync(RegisterDeviceRequest request)
        {
            _logger.LogInformation("Registering device {DeviceId} for user {UserId}",
                request.DeviceId, request.UserId);

            // 既存デバイスのチェック
            var existingDevice = await _context.DeviceRegistrations
                .FirstOrDefaultAsync(d => d.DeviceId == request.DeviceId);

            if (existingDevice != null)
            {
                _logger.LogInformation("Device {DeviceId} already exists, updating instead", request.DeviceId);

                // 既存デバイスを更新
                existingDevice.UserId = request.UserId;
                existingDevice.UserType = request.UserType;
                existingDevice.Platform = request.Platform;
                existingDevice.IsAndroid = request.Platform.Equals("Android", StringComparison.OrdinalIgnoreCase);
                existingDevice.PushToken = request.PushToken;
                existingDevice.DeviceInfo = request.DeviceInfo;
                existingDevice.AppVersion = request.AppVersion;
                existingDevice.IsActive = true;
                existingDevice.LastLoginAt = DateTime.UtcNow;
                existingDevice.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();
                return _mapper.Map<DeviceRegistrationDto>(existingDevice);
            }

            // 新規デバイス登録
            var deviceRegistration = new DeviceRegistration
            {
                DeviceId = request.DeviceId,
                UserId = request.UserId,
                UserType = request.UserType,
                Platform = request.Platform,
                IsAndroid = request.Platform.Equals("Android", StringComparison.OrdinalIgnoreCase),
                PushToken = request.PushToken,
                DeviceInfo = request.DeviceInfo,
                AppVersion = request.AppVersion,
                IsActive = true,
                LastLoginAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.DeviceRegistrations.Add(deviceRegistration);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Device {DeviceId} registered successfully", request.DeviceId);
            return _mapper.Map<DeviceRegistrationDto>(deviceRegistration);
        }

        /// <summary>
        /// 既存デバイス情報を更新
        /// </summary>
        public async Task<DeviceRegistrationDto?> UpdateDeviceAsync(string deviceId, UpdateDeviceRequest request)
        {
            _logger.LogInformation("Updating device {DeviceId}", deviceId);

            var device = await _context.DeviceRegistrations
                .FirstOrDefaultAsync(d => d.DeviceId == deviceId);

            if (device == null)
            {
                _logger.LogWarning("Device {DeviceId} not found for update", deviceId);
                return null;
            }

            // 更新可能なフィールドのみ更新
            if (!string.IsNullOrEmpty(request.PushToken))
                device.PushToken = request.PushToken;

            if (!string.IsNullOrEmpty(request.DeviceInfo))
                device.DeviceInfo = request.DeviceInfo;

            if (!string.IsNullOrEmpty(request.AppVersion))
                device.AppVersion = request.AppVersion;

            if (request.IsActive.HasValue)
                device.IsActive = request.IsActive.Value;

            device.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Device {DeviceId} updated successfully", deviceId);
            return _mapper.Map<DeviceRegistrationDto>(device);
        }

        /// <summary>
        /// デバイスを無効化（論理削除）
        /// </summary>
        public async Task<bool> DeactivateDeviceAsync(string deviceId)
        {
            _logger.LogInformation("Deactivating device {DeviceId}", deviceId);

            var device = await _context.DeviceRegistrations
                .FirstOrDefaultAsync(d => d.DeviceId == deviceId);

            if (device == null)
            {
                _logger.LogWarning("Device {DeviceId} not found for deactivation", deviceId);
                return false;
            }

            device.IsActive = false;
            device.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Device {DeviceId} deactivated successfully", deviceId);
            return true;
        }

        /// <summary>
        /// ユーザーの全デバイスを取得
        /// </summary>
        public async Task<List<DeviceRegistrationDto>> GetUserDevicesAsync(int userId, string userType)
        {
            var devices = await _context.DeviceRegistrations
                .Where(d => d.UserId == userId && d.UserType == userType)
                .OrderByDescending(d => d.LastLoginAt)
                .ToListAsync();

            return _mapper.Map<List<DeviceRegistrationDto>>(devices);
        }

        /// <summary>
        /// デバイス情報を取得
        /// </summary>
        public async Task<DeviceRegistrationDto?> GetDeviceAsync(string deviceId)
        {
            var device = await _context.DeviceRegistrations
                .FirstOrDefaultAsync(d => d.DeviceId == deviceId);

            return device != null ? _mapper.Map<DeviceRegistrationDto>(device) : null;
        }

        /// <summary>
        /// プッシュトークンを更新
        /// </summary>
        public async Task<bool> UpdatePushTokenAsync(string deviceId, string pushToken)
        {
            _logger.LogInformation("Updating push token for device {DeviceId}", deviceId);

            var device = await _context.DeviceRegistrations
                .FirstOrDefaultAsync(d => d.DeviceId == deviceId);

            if (device == null)
            {
                _logger.LogWarning("Device {DeviceId} not found for push token update", deviceId);
                return false;
            }

            device.PushToken = pushToken;
            device.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Push token updated successfully for device {DeviceId}", deviceId);
            return true;
        }

        /// <summary>
        /// 最終ログイン日時を更新
        /// </summary>
        public async Task<bool> UpdateLastLoginAsync(string deviceId)
        {
            var device = await _context.DeviceRegistrations
                .FirstOrDefaultAsync(d => d.DeviceId == deviceId);

            if (device == null)
                return false;

            device.LastLoginAt = DateTime.UtcNow;
            device.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }

        /// <summary>
        /// 非アクティブなデバイスをクリーンアップ
        /// </summary>
        public async Task<int> CleanupInactiveDevicesAsync(int daysThreshold = 30)
        {
            _logger.LogInformation("Starting cleanup of inactive devices (threshold: {Days} days)", daysThreshold);

            var cutoffDate = DateTime.UtcNow.AddDays(-daysThreshold);

            var inactiveDevices = await _context.DeviceRegistrations
                .Where(d => d.LastLoginAt < cutoffDate || !d.IsActive)
                .ToListAsync();

            if (!inactiveDevices.Any())
            {
                _logger.LogInformation("No inactive devices found for cleanup");
                return 0;
            }

            // 論理削除（IsActive = false）
            foreach (var device in inactiveDevices)
            {
                device.IsActive = false;
                device.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            _logger.LogInformation("Cleaned up {Count} inactive devices", inactiveDevices.Count);
            return inactiveDevices.Count;
        }

        /// <summary>
        /// デバイス統計情報を取得
        /// </summary>
        public async Task<DeviceStatistics> GetDeviceStatisticsAsync()
        {
            var totalDevices = await _context.DeviceRegistrations.CountAsync();
            var activeDevices = await _context.DeviceRegistrations.CountAsync(d => d.IsActive);

            var platformBreakdown = await _context.DeviceRegistrations
                .Where(d => d.IsActive)
                .GroupBy(d => d.Platform)
                .Select(g => new { Platform = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.Platform, x => x.Count);

            var userTypeBreakdown = await _context.DeviceRegistrations
                .Where(d => d.IsActive)
                .GroupBy(d => d.UserType)
                .Select(g => new { UserType = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.UserType, x => x.Count);

            return new DeviceStatistics
            {
                TotalDevices = totalDevices,
                ActiveDevices = activeDevices,
                PlatformBreakdown = platformBreakdown,
                UserTypeBreakdown = userTypeBreakdown,
                LastUpdated = DateTime.UtcNow
            };
        }
    }
}
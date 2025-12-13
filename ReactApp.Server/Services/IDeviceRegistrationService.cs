using ReactApp.Server.DTOs;
using ReactApp.Server.Models;
using ReactApp.Server.Helpers;

namespace ReactApp.Server.Services
{
    /// <summary>
    /// デバイス登録管理サービスのインターフェース
    /// プッシュ通知用デバイス情報の登録・更新・管理を提供
    /// </summary>
    public interface IDeviceRegistrationService
    {
        /// <summary>
        /// 新規デバイスを登録
        /// </summary>
        /// <param name="request">デバイス登録リクエスト</param>
        /// <returns>登録されたデバイス情報</returns>
        Task<DeviceRegistrationDto> RegisterDeviceAsync(RegisterDeviceRequest request);

        /// <summary>
        /// 既存デバイス情報を更新
        /// </summary>
        /// <param name="deviceId">デバイスID</param>
        /// <param name="request">更新リクエスト</param>
        /// <returns>更新されたデバイス情報</returns>
        Task<DeviceRegistrationDto?> UpdateDeviceAsync(string deviceId, UpdateDeviceRequest request);

        /// <summary>
        /// デバイスを無効化（論理削除）
        /// </summary>
        /// <param name="deviceId">デバイスID</param>
        /// <returns>無効化成功フラグ</returns>
        Task<bool> DeactivateDeviceAsync(string deviceId);

        /// <summary>
        /// ユーザーの全デバイスを取得
        /// </summary>
        /// <param name="userId">ユーザーID</param>
        /// <param name="userType">ユーザー種別</param>
        /// <returns>デバイス一覧</returns>
        Task<List<DeviceRegistrationDto>> GetUserDevicesAsync(int userId, string userType);

        /// <summary>
        /// デバイス情報を取得
        /// </summary>
        /// <param name="deviceId">デバイスID</param>
        /// <returns>デバイス情報</returns>
        Task<DeviceRegistrationDto?> GetDeviceAsync(string deviceId);

        /// <summary>
        /// プッシュトークンを更新
        /// </summary>
        /// <param name="deviceId">デバイスID</param>
        /// <param name="pushToken">新しいプッシュトークン</param>
        /// <returns>更新成功フラグ</returns>
        Task<bool> UpdatePushTokenAsync(string deviceId, string pushToken);

        /// <summary>
        /// 最終ログイン日時を更新
        /// </summary>
        /// <param name="deviceId">デバイスID</param>
        /// <returns>更新成功フラグ</returns>
        Task<bool> UpdateLastLoginAsync(string deviceId);

        /// <summary>
        /// 非アクティブなデバイスをクリーンアップ
        /// </summary>
        /// <param name="daysThreshold">非アクティブ日数閾値（デフォルト30日）</param>
        /// <returns>クリーンアップされたデバイス数</returns>
        Task<int> CleanupInactiveDevicesAsync(int daysThreshold = 30);

        /// <summary>
        /// デバイス統計情報を取得
        /// </summary>
        /// <returns>デバイス統計</returns>
        Task<DeviceStatistics> GetDeviceStatisticsAsync();
    }

    /// <summary>
    /// デバイス登録リクエスト
    /// </summary>
    public class RegisterDeviceRequest
    {
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
        /// プッシュ通知トークン
        /// </summary>
        public string? PushToken { get; set; }

        /// <summary>
        /// デバイス情報（JSON）
        /// </summary>
        public string? DeviceInfo { get; set; }

        /// <summary>
        /// アプリバージョン
        /// </summary>
        public string? AppVersion { get; set; }
    }

    /// <summary>
    /// デバイス更新リクエスト
    /// </summary>
    public class UpdateDeviceRequest
    {
        /// <summary>
        /// プッシュ通知トークン
        /// </summary>
        public string? PushToken { get; set; }

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
        public bool? IsActive { get; set; }
    }

    /// <summary>
    /// デバイス統計情報
    /// </summary>
    public class DeviceStatistics
    {
        /// <summary>
        /// 総デバイス数
        /// </summary>
        public int TotalDevices { get; set; }

        /// <summary>
        /// アクティブデバイス数
        /// </summary>
        public int ActiveDevices { get; set; }

        /// <summary>
        /// プラットフォーム別統計
        /// </summary>
        public Dictionary<string, int> PlatformBreakdown { get; set; } = new();

        /// <summary>
        /// ユーザー種別統計
        /// </summary>
        public Dictionary<string, int> UserTypeBreakdown { get; set; } = new();

        /// <summary>
        /// 最終更新日時
        /// </summary>
        public DateTime LastUpdated { get; set; } = DateTimeHelper.GetJstNow();
    }
}

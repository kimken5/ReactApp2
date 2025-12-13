using ReactApp.Server.Helpers;

namespace ReactApp.Server.Services
{
    /// <summary>
    /// オフライン機能管理サービスのインターフェース
    /// オフラインデータ同期、競合解決、ステータス管理を提供
    /// </summary>
    public interface IOfflineService
    {
        /// <summary>
        /// オフライン同期データを処理
        /// </summary>
        /// <param name="syncData">同期データリスト</param>
        /// <returns>同期結果</returns>
        Task<OfflineSyncResult> ProcessSyncDataAsync(List<OfflineSyncItem> syncData);

        /// <summary>
        /// データ競合を解決
        /// </summary>
        /// <param name="conflictData">競合データ</param>
        /// <returns>解決結果</returns>
        Task<ConflictResolutionResult> ResolveDataConflictAsync(DataConflict conflictData);

        /// <summary>
        /// ユーザーのオフライン利用統計を取得
        /// </summary>
        /// <param name="userId">ユーザーID</param>
        /// <param name="days">統計対象日数</param>
        /// <returns>オフライン利用統計</returns>
        Task<OfflineUsageStatistics> GetOfflineUsageAsync(int userId, int days = 30);

        /// <summary>
        /// オフライン可能なデータをプリキャッシュ
        /// </summary>
        /// <param name="userId">ユーザーID</param>
        /// <param name="userType">ユーザー種別</param>
        /// <returns>プリキャッシュ結果</returns>
        Task<PreCacheResult> PreCacheUserDataAsync(int userId, string userType);

        /// <summary>
        /// オフライン期間中のアクションを記録
        /// </summary>
        /// <param name="action">オフラインアクション</param>
        /// <returns>記録ID</returns>
        Task<int> LogOfflineActionAsync(OfflineAction action);

        /// <summary>
        /// 差分同期用のデータ変更ログを取得
        /// </summary>
        /// <param name="userId">ユーザーID</param>
        /// <param name="lastSyncTime">最終同期時刻</param>
        /// <returns>変更ログリスト</returns>
        Task<List<DataChangeLog>> GetDataChangesAsync(int userId, DateTime lastSyncTime);

        /// <summary>
        /// オフライン同期設定を管理
        /// </summary>
        /// <param name="userId">ユーザーID</param>
        /// <param name="settings">同期設定</param>
        /// <returns>設定更新結果</returns>
        Task<bool> UpdateSyncSettingsAsync(int userId, OfflineSyncSettings settings);

        /// <summary>
        /// システム全体のオフライン利用状況を取得
        /// </summary>
        /// <returns>システム統計</returns>
        Task<SystemOfflineStatistics> GetSystemOfflineStatisticsAsync();
    }

    /// <summary>
    /// オフライン同期アイテム
    /// </summary>
    public class OfflineSyncItem
    {
        public string Id { get; set; } = string.Empty;
        public string EntityType { get; set; } = string.Empty;
        public string Operation { get; set; } = string.Empty; // CREATE, UPDATE, DELETE
        public string Data { get; set; } = string.Empty; // JSON データ
        public DateTime Timestamp { get; set; }
        public int UserId { get; set; }
        public string DeviceId { get; set; } = string.Empty;
        public Dictionary<string, string> Metadata { get; set; } = new();
    }

    /// <summary>
    /// オフライン同期結果
    /// </summary>
    public class OfflineSyncResult
    {
        public bool Success { get; set; }
        public int ProcessedCount { get; set; }
        public int SuccessCount { get; set; }
        public int FailureCount { get; set; }
        public int ConflictCount { get; set; }
        public List<SyncItemResult> Results { get; set; } = new();
        public List<DataConflict> Conflicts { get; set; } = new();
        public string Message { get; set; } = string.Empty;
    }

    /// <summary>
    /// 同期アイテム結果
    /// </summary>
    public class SyncItemResult
    {
        public string Id { get; set; } = string.Empty;
        public bool Success { get; set; }
        public string? ErrorMessage { get; set; }
        public bool HasConflict { get; set; }
        public string? ResolvedData { get; set; }
    }

    /// <summary>
    /// データ競合情報
    /// </summary>
    public class DataConflict
    {
        public string Id { get; set; } = string.Empty;
        public string EntityType { get; set; } = string.Empty;
        public string EntityId { get; set; } = string.Empty;
        public string LocalData { get; set; } = string.Empty;
        public string ServerData { get; set; } = string.Empty;
        public DateTime LocalTimestamp { get; set; }
        public DateTime ServerTimestamp { get; set; }
        public string ConflictType { get; set; } = string.Empty; // CONCURRENT_UPDATE, DELETE_UPDATE
        public ConflictResolutionStrategy Strategy { get; set; }
    }

    /// <summary>
    /// 競合解決戦略
    /// </summary>
    public enum ConflictResolutionStrategy
    {
        ServerWins,      // サーバー優先
        ClientWins,      // クライアント優先
        MergeFields,     // フィールドマージ
        UserDecision,    // ユーザー判断
        LastModified     // 最終更新日時優先
    }

    /// <summary>
    /// 競合解決結果
    /// </summary>
    public class ConflictResolutionResult
    {
        public bool Success { get; set; }
        public string ResolvedData { get; set; } = string.Empty;
        public ConflictResolutionStrategy UsedStrategy { get; set; }
        public string ResolutionDetails { get; set; } = string.Empty;
        public bool RequiresUserInput { get; set; }
    }

    /// <summary>
    /// オフライン利用統計
    /// </summary>
    public class OfflineUsageStatistics
    {
        public int UserId { get; set; }
        public int TotalOfflineActions { get; set; }
        public int OfflineDays { get; set; }
        public TimeSpan TotalOfflineTime { get; set; }
        public Dictionary<string, int> ActionBreakdown { get; set; } = new();
        public List<DateTime> OfflinePeriods { get; set; } = new();
        public double OfflineSuccessRate { get; set; }
        public DateTime LastOfflineActivity { get; set; }
    }

    /// <summary>
    /// プリキャッシュ結果
    /// </summary>
    public class PreCacheResult
    {
        public bool Success { get; set; }
        public int CachedItemsCount { get; set; }
        public long CacheSize { get; set; }
        public List<string> CachedEndpoints { get; set; } = new();
        public DateTime CacheExpiry { get; set; }
        public string Message { get; set; } = string.Empty;
    }

    /// <summary>
    /// オフラインアクション
    /// </summary>
    public class OfflineAction
    {
        public int UserId { get; set; }
        public string DeviceId { get; set; } = string.Empty;
        public string ActionType { get; set; } = string.Empty;
        public string EntityType { get; set; } = string.Empty;
        public string Data { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; } = DateTimeHelper.GetJstNow();
        public bool SyncCompleted { get; set; }
        public Dictionary<string, string> Metadata { get; set; } = new();
    }

    /// <summary>
    /// データ変更ログ
    /// </summary>
    public class DataChangeLog
    {
        public string Id { get; set; } = string.Empty;
        public string EntityType { get; set; } = string.Empty;
        public string EntityId { get; set; } = string.Empty;
        public string Operation { get; set; } = string.Empty;
        public string Data { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
        public int UserId { get; set; }
        public string ChangeHash { get; set; } = string.Empty;
    }

    /// <summary>
    /// オフライン同期設定
    /// </summary>
    public class OfflineSyncSettings
    {
        public bool AutoSyncEnabled { get; set; } = true;
        public int SyncIntervalMinutes { get; set; } = 30;
        public bool SyncOnWifiOnly { get; set; } = true;
        public bool PreCacheEnabled { get; set; } = true;
        public List<string> SyncableEntities { get; set; } = new();
        public ConflictResolutionStrategy DefaultConflictStrategy { get; set; } = ConflictResolutionStrategy.LastModified;
        public int MaxOfflineDays { get; set; } = 7;
        public bool BackgroundSyncEnabled { get; set; } = true;
    }

    /// <summary>
    /// システムオフライン統計
    /// </summary>
    public class SystemOfflineStatistics
    {
        public int TotalUsers { get; set; }
        public int OfflineUsers { get; set; }
        public double OfflineUsageRate { get; set; }
        public int TotalOfflineActions { get; set; }
        public int PendingSyncItems { get; set; }
        public Dictionary<string, int> EntitySyncBreakdown { get; set; } = new();
        public List<OfflinePerformanceMetric> PerformanceMetrics { get; set; } = new();
        public DateTime LastUpdated { get; set; } = DateTimeHelper.GetJstNow();
    }

    /// <summary>
    /// オフライン性能指標
    /// </summary>
    public class OfflinePerformanceMetric
    {
        public string MetricName { get; set; } = string.Empty;
        public double Value { get; set; }
        public string Unit { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
    }
}

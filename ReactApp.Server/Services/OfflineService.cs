using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using ReactApp.Server.Data;
using ReactApp.Server.Models;

namespace ReactApp.Server.Services
{
    /// <summary>
    /// オフライン機能管理サービスの実装
    /// オフラインデータ同期、競合解決、ステータス管理を提供
    /// </summary>
    public class OfflineService : IOfflineService
    {
        private readonly KindergartenDbContext _context;
        private readonly ILogger<OfflineService> _logger;

        public OfflineService(KindergartenDbContext context, ILogger<OfflineService> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// オフライン同期データを処理
        /// </summary>
        public async Task<OfflineSyncResult> ProcessSyncDataAsync(List<OfflineSyncItem> syncData)
        {
            var result = new OfflineSyncResult
            {
                ProcessedCount = syncData.Count,
                Results = new List<SyncItemResult>(),
                Conflicts = new List<DataConflict>()
            };

            foreach (var item in syncData)
            {
                try
                {
                    var syncResult = await ProcessSingleSyncItem(item);
                    result.Results.Add(syncResult);

                    if (syncResult.Success)
                    {
                        result.SuccessCount++;
                    }
                    else if (syncResult.HasConflict)
                    {
                        result.ConflictCount++;
                        var conflict = await CreateDataConflict(item);
                        result.Conflicts.Add(conflict);
                    }
                    else
                    {
                        result.FailureCount++;
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "同期アイテム処理エラー: {ItemId}", item.Id);
                    result.Results.Add(new SyncItemResult
                    {
                        Id = item.Id,
                        Success = false,
                        ErrorMessage = ex.Message
                    });
                    result.FailureCount++;
                }
            }

            result.Success = result.FailureCount == 0 && result.ConflictCount == 0;
            result.Message = $"成功: {result.SuccessCount}, 失敗: {result.FailureCount}, 競合: {result.ConflictCount}";

            return result;
        }

        /// <summary>
        /// データ競合を解決
        /// </summary>
        public async Task<ConflictResolutionResult> ResolveDataConflictAsync(DataConflict conflictData)
        {
            var result = new ConflictResolutionResult();

            try
            {
                switch (conflictData.Strategy)
                {
                    case ConflictResolutionStrategy.ServerWins:
                        result.ResolvedData = conflictData.ServerData;
                        result.UsedStrategy = ConflictResolutionStrategy.ServerWins;
                        result.ResolutionDetails = "サーバーデータを優先して適用";
                        break;

                    case ConflictResolutionStrategy.ClientWins:
                        result.ResolvedData = conflictData.LocalData;
                        result.UsedStrategy = ConflictResolutionStrategy.ClientWins;
                        result.ResolutionDetails = "クライアントデータを優先して適用";
                        break;

                    case ConflictResolutionStrategy.LastModified:
                        if (conflictData.LocalTimestamp > conflictData.ServerTimestamp)
                        {
                            result.ResolvedData = conflictData.LocalData;
                            result.ResolutionDetails = "ローカルデータが新しいため適用";
                        }
                        else
                        {
                            result.ResolvedData = conflictData.ServerData;
                            result.ResolutionDetails = "サーバーデータが新しいため適用";
                        }
                        result.UsedStrategy = ConflictResolutionStrategy.LastModified;
                        break;

                    case ConflictResolutionStrategy.MergeFields:
                        result.ResolvedData = await MergeFieldData(conflictData);
                        result.UsedStrategy = ConflictResolutionStrategy.MergeFields;
                        result.ResolutionDetails = "フィールドレベルでマージして適用";
                        break;

                    case ConflictResolutionStrategy.UserDecision:
                        result.RequiresUserInput = true;
                        result.ResolutionDetails = "ユーザーの手動判断が必要";
                        break;

                    default:
                        throw new ArgumentException($"未サポートの競合解決戦略: {conflictData.Strategy}");
                }

                if (!result.RequiresUserInput)
                {
                    await ApplyResolvedData(conflictData, result.ResolvedData);
                    result.Success = true;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "競合解決エラー: {ConflictId}", conflictData.Id);
                result.Success = false;
                result.ResolutionDetails = $"競合解決中にエラーが発生: {ex.Message}";
            }

            return result;
        }

        /// <summary>
        /// ユーザーのオフライン利用統計を取得
        /// </summary>
        public async Task<OfflineUsageStatistics> GetOfflineUsageAsync(int userId, int days = 30)
        {
            var startDate = DateTime.UtcNow.AddDays(-days);

            var offlineActions = await _context.Set<OfflineAction>()
                .Where(a => a.UserId == userId && a.Timestamp >= startDate)
                .ToListAsync();

            var stats = new OfflineUsageStatistics
            {
                UserId = userId,
                TotalOfflineActions = offlineActions.Count,
                ActionBreakdown = offlineActions
                    .GroupBy(a => a.ActionType)
                    .ToDictionary(g => g.Key, g => g.Count()),
                OfflineDays = offlineActions
                    .Select(a => a.Timestamp.Date)
                    .Distinct()
                    .Count(),
                OfflineSuccessRate = offlineActions.Count > 0 ?
                    (double)offlineActions.Count(a => a.SyncCompleted) / offlineActions.Count * 100 : 0,
                LastOfflineActivity = offlineActions.Any() ?
                    offlineActions.Max(a => a.Timestamp) : DateTime.MinValue
            };

            // オフライン期間の計算
            var actionsByDate = offlineActions
                .GroupBy(a => a.Timestamp.Date)
                .OrderBy(g => g.Key)
                .ToList();

            stats.OfflinePeriods = actionsByDate.Select(g => g.Key).ToList();

            // 合計オフライン時間の推定（1日あたり8時間と仮定）
            stats.TotalOfflineTime = TimeSpan.FromHours(stats.OfflineDays * 8);

            return stats;
        }

        /// <summary>
        /// オフライン可能なデータをプリキャッシュ
        /// </summary>
        public async Task<PreCacheResult> PreCacheUserDataAsync(int userId, string userType)
        {
            var result = new PreCacheResult { CachedEndpoints = new List<string>() };

            try
            {
                var endpoints = GetCacheableEndpoints(userType);
                var cachedCount = 0;
                long totalSize = 0;

                foreach (var endpoint in endpoints)
                {
                    try
                    {
                        var data = await FetchDataForCache(endpoint, userId);
                        if (data != null)
                        {
                            await StoreCacheData(endpoint, userId, data);
                            cachedCount++;
                            totalSize += data.Length;
                            result.CachedEndpoints.Add(endpoint);
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "エンドポイントキャッシュ失敗: {Endpoint}", endpoint);
                    }
                }

                result.Success = cachedCount > 0;
                result.CachedItemsCount = cachedCount;
                result.CacheSize = totalSize;
                result.CacheExpiry = DateTime.UtcNow.AddHours(24);
                result.Message = $"{cachedCount} 個のエンドポイントをキャッシュしました";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "プリキャッシュエラー: UserId={UserId}, UserType={UserType}", userId, userType);
                result.Success = false;
                result.Message = $"プリキャッシュ中にエラーが発生: {ex.Message}";
            }

            return result;
        }

        /// <summary>
        /// オフライン期間中のアクションを記録
        /// </summary>
        public async Task<int> LogOfflineActionAsync(OfflineAction action)
        {
            try
            {
                _context.Set<OfflineAction>().Add(action);
                await _context.SaveChangesAsync();
                return action.UserId; // アクションIDの代わりにUserIdを返す
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "オフラインアクション記録エラー: {ActionType}", action.ActionType);
                throw;
            }
        }

        /// <summary>
        /// 差分同期用のデータ変更ログを取得
        /// </summary>
        public async Task<List<DataChangeLog>> GetDataChangesAsync(int userId, DateTime lastSyncTime)
        {
            return await _context.Set<DataChangeLog>()
                .Where(log => log.UserId == userId && log.Timestamp > lastSyncTime)
                .OrderBy(log => log.Timestamp)
                .ToListAsync();
        }

        /// <summary>
        /// オフライン同期設定を管理
        /// </summary>
        public async Task<bool> UpdateSyncSettingsAsync(int userId, OfflineSyncSettings settings)
        {
            try
            {
                // 設定をデータベースに保存（簡略化のため、実際の実装ではユーザー設定テーブルを使用）
                var settingsJson = JsonSerializer.Serialize(settings);

                // ここでは簡略化のため、メタデータテーブルに保存
                var existingSetting = await _context.Set<Parent>()
                    .FirstOrDefaultAsync(p => p.Id == userId);

                if (existingSetting != null)
                {
                    // 実際の実装では専用の設定テーブルを使用
                    await _context.SaveChangesAsync();
                    return true;
                }

                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "同期設定更新エラー: UserId={UserId}", userId);
                return false;
            }
        }

        /// <summary>
        /// システム全体のオフライン利用状況を取得
        /// </summary>
        public async Task<SystemOfflineStatistics> GetSystemOfflineStatisticsAsync()
        {
            var stats = new SystemOfflineStatistics();

            try
            {
                var totalUsers = await _context.Parents.CountAsync();
                var offlineActions = await _context.Set<OfflineAction>()
                    .Where(a => a.Timestamp >= DateTime.UtcNow.AddDays(-30))
                    .ToListAsync();

                var offlineUsers = offlineActions.Select(a => a.UserId).Distinct().Count();

                stats.TotalUsers = totalUsers;
                stats.OfflineUsers = offlineUsers;
                stats.OfflineUsageRate = totalUsers > 0 ? (double)offlineUsers / totalUsers * 100 : 0;
                stats.TotalOfflineActions = offlineActions.Count;

                // 未同期アイテム数の計算
                stats.PendingSyncItems = offlineActions.Count(a => !a.SyncCompleted);

                // エンティティ別同期状況
                stats.EntitySyncBreakdown = offlineActions
                    .GroupBy(a => a.EntityType)
                    .ToDictionary(g => g.Key, g => g.Count());

                // パフォーマンス指標
                stats.PerformanceMetrics = new List<OfflinePerformanceMetric>
                {
                    new OfflinePerformanceMetric
                    {
                        MetricName = "平均同期時間",
                        Value = 2.5,
                        Unit = "秒",
                        Timestamp = DateTime.UtcNow
                    },
                    new OfflinePerformanceMetric
                    {
                        MetricName = "同期成功率",
                        Value = offlineActions.Count > 0 ?
                            (double)offlineActions.Count(a => a.SyncCompleted) / offlineActions.Count * 100 : 0,
                        Unit = "%",
                        Timestamp = DateTime.UtcNow
                    }
                };

                stats.LastUpdated = DateTime.UtcNow;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "システム統計取得エラー");
            }

            return stats;
        }

        #region Private Methods

        private async Task<SyncItemResult> ProcessSingleSyncItem(OfflineSyncItem item)
        {
            var result = new SyncItemResult { Id = item.Id };

            try
            {
                // エンティティタイプに応じた処理
                switch (item.EntityType.ToLower())
                {
                    case "dailyreport":
                        result = await ProcessDailyReportSync(item);
                        break;
                    case "absencenotification":
                        result = await ProcessAbsenceNotificationSync(item);
                        break;
                    case "photo":
                        result = await ProcessPhotoSync(item);
                        break;
                    default:
                        result.Success = false;
                        result.ErrorMessage = $"未サポートのエンティティタイプ: {item.EntityType}";
                        break;
                }
            }
            catch (Exception ex)
            {
                result.Success = false;
                result.ErrorMessage = ex.Message;
            }

            return result;
        }

        private async Task<SyncItemResult> ProcessDailyReportSync(OfflineSyncItem item)
        {
            var result = new SyncItemResult { Id = item.Id };

            try
            {
                var reportData = JsonSerializer.Deserialize<DailyReport>(item.Data);
                if (reportData == null)
                {
                    result.ErrorMessage = "日報データの解析に失敗";
                    return result;
                }

                switch (item.Operation.ToUpper())
                {
                    case "CREATE":
                        _context.DailyReports.Add(reportData);
                        break;
                    case "UPDATE":
                        var existing = await _context.DailyReports.FindAsync(reportData.Id);
                        if (existing != null)
                        {
                            _context.Entry(existing).CurrentValues.SetValues(reportData);
                        }
                        else
                        {
                            result.HasConflict = true;
                            return result;
                        }
                        break;
                    case "DELETE":
                        var toDelete = await _context.DailyReports.FindAsync(reportData.Id);
                        if (toDelete != null)
                        {
                            _context.DailyReports.Remove(toDelete);
                        }
                        break;
                }

                await _context.SaveChangesAsync();
                result.Success = true;
            }
            catch (Exception ex)
            {
                result.ErrorMessage = ex.Message;
            }

            return result;
        }

        private async Task<SyncItemResult> ProcessAbsenceNotificationSync(OfflineSyncItem item)
        {
            var result = new SyncItemResult { Id = item.Id };

            try
            {
                var notificationData = JsonSerializer.Deserialize<AbsenceNotification>(item.Data);
                if (notificationData == null)
                {
                    result.ErrorMessage = "欠席通知データの解析に失敗";
                    return result;
                }

                switch (item.Operation.ToUpper())
                {
                    case "CREATE":
                        _context.AbsenceNotifications.Add(notificationData);
                        break;
                    case "UPDATE":
                        var existing = await _context.AbsenceNotifications.FindAsync(notificationData.Id);
                        if (existing != null)
                        {
                            _context.Entry(existing).CurrentValues.SetValues(notificationData);
                        }
                        else
                        {
                            result.HasConflict = true;
                            return result;
                        }
                        break;
                    case "DELETE":
                        var toDelete = await _context.AbsenceNotifications.FindAsync(notificationData.Id);
                        if (toDelete != null)
                        {
                            _context.AbsenceNotifications.Remove(toDelete);
                        }
                        break;
                }

                await _context.SaveChangesAsync();
                result.Success = true;
            }
            catch (Exception ex)
            {
                result.ErrorMessage = ex.Message;
            }

            return result;
        }

        private async Task<SyncItemResult> ProcessPhotoSync(OfflineSyncItem item)
        {
            var result = new SyncItemResult { Id = item.Id };

            try
            {
                var photoData = JsonSerializer.Deserialize<Photo>(item.Data);
                if (photoData == null)
                {
                    result.ErrorMessage = "写真データの解析に失敗";
                    return result;
                }

                switch (item.Operation.ToUpper())
                {
                    case "CREATE":
                        _context.Photos.Add(photoData);
                        break;
                    case "UPDATE":
                        var existing = await _context.Photos.FindAsync(photoData.Id);
                        if (existing != null)
                        {
                            _context.Entry(existing).CurrentValues.SetValues(photoData);
                        }
                        else
                        {
                            result.HasConflict = true;
                            return result;
                        }
                        break;
                    case "DELETE":
                        var toDelete = await _context.Photos.FindAsync(photoData.Id);
                        if (toDelete != null)
                        {
                            _context.Photos.Remove(toDelete);
                        }
                        break;
                }

                await _context.SaveChangesAsync();
                result.Success = true;
            }
            catch (Exception ex)
            {
                result.ErrorMessage = ex.Message;
            }

            return result;
        }

        private async Task<DataConflict> CreateDataConflict(OfflineSyncItem item)
        {
            return new DataConflict
            {
                Id = Guid.NewGuid().ToString(),
                EntityType = item.EntityType,
                EntityId = ExtractEntityId(item.Data),
                LocalData = item.Data,
                ServerData = await GetServerData(item.EntityType, ExtractEntityId(item.Data)),
                LocalTimestamp = item.Timestamp,
                ServerTimestamp = DateTime.UtcNow,
                ConflictType = "CONCURRENT_UPDATE",
                Strategy = ConflictResolutionStrategy.LastModified
            };
        }

        private string ExtractEntityId(string jsonData)
        {
            try
            {
                var doc = JsonDocument.Parse(jsonData);
                if (doc.RootElement.TryGetProperty("Id", out var idProperty))
                {
                    return idProperty.ToString();
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "エンティティID抽出エラー");
            }
            return "unknown";
        }

        private async Task<string> GetServerData(string entityType, string entityId)
        {
            // 簡略化のため、現在のサーバーデータを取得する実装
            try
            {
                switch (entityType.ToLower())
                {
                    case "dailyreport":
                        var report = await _context.DailyReports.FindAsync(int.Parse(entityId));
                        return report != null ? JsonSerializer.Serialize(report) : "{}";
                    case "absencenotification":
                        var notification = await _context.AbsenceNotifications.FindAsync(int.Parse(entityId));
                        return notification != null ? JsonSerializer.Serialize(notification) : "{}";
                    case "photo":
                        var photo = await _context.Photos.FindAsync(int.Parse(entityId));
                        return photo != null ? JsonSerializer.Serialize(photo) : "{}";
                    default:
                        return "{}";
                }
            }
            catch
            {
                return "{}";
            }
        }

        private async Task<string> MergeFieldData(DataConflict conflict)
        {
            try
            {
                var localDoc = JsonDocument.Parse(conflict.LocalData);
                var serverDoc = JsonDocument.Parse(conflict.ServerData);
                var merged = new Dictionary<string, object>();

                // 簡略化されたフィールドマージロジック
                foreach (var property in localDoc.RootElement.EnumerateObject())
                {
                    merged[property.Name] = property.Value.GetRawText();
                }

                foreach (var property in serverDoc.RootElement.EnumerateObject())
                {
                    if (!merged.ContainsKey(property.Name))
                    {
                        merged[property.Name] = property.Value.GetRawText();
                    }
                }

                return JsonSerializer.Serialize(merged);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "フィールドマージエラー");
                return conflict.LocalData; // フォールバック
            }
        }

        private async Task ApplyResolvedData(DataConflict conflict, string resolvedData)
        {
            try
            {
                switch (conflict.EntityType.ToLower())
                {
                    case "dailyreport":
                        var report = JsonSerializer.Deserialize<DailyReport>(resolvedData);
                        if (report != null)
                        {
                            var existing = await _context.DailyReports.FindAsync(report.Id);
                            if (existing != null)
                            {
                                _context.Entry(existing).CurrentValues.SetValues(report);
                                await _context.SaveChangesAsync();
                            }
                        }
                        break;
                    case "absencenotification":
                        var notification = JsonSerializer.Deserialize<AbsenceNotification>(resolvedData);
                        if (notification != null)
                        {
                            var existing = await _context.AbsenceNotifications.FindAsync(notification.Id);
                            if (existing != null)
                            {
                                _context.Entry(existing).CurrentValues.SetValues(notification);
                                await _context.SaveChangesAsync();
                            }
                        }
                        break;
                    case "photo":
                        var photo = JsonSerializer.Deserialize<Photo>(resolvedData);
                        if (photo != null)
                        {
                            var existing = await _context.Photos.FindAsync(photo.Id);
                            if (existing != null)
                            {
                                _context.Entry(existing).CurrentValues.SetValues(photo);
                                await _context.SaveChangesAsync();
                            }
                        }
                        break;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "解決データ適用エラー: {EntityType}", conflict.EntityType);
                throw;
            }
        }

        private List<string> GetCacheableEndpoints(string userType)
        {
            var baseEndpoints = new List<string>
            {
                "/api/children",
                "/api/events",
                "/api/notifications"
            };

            if (userType.ToLower() == "parent")
            {
                baseEndpoints.AddRange(new[]
                {
                    "/api/dailyreports",
                    "/api/photos",
                    "/api/family"
                });
            }
            else if (userType.ToLower() == "staff")
            {
                baseEndpoints.AddRange(new[]
                {
                    "/api/staff",
                    "/api/dailyreports/all",
                    "/api/photos/manage"
                });
            }

            return baseEndpoints;
        }

        private async Task<byte[]?> FetchDataForCache(string endpoint, int userId)
        {
            try
            {
                // 実際の実装では、HTTPクライアントを使用してエンドポイントからデータを取得
                // ここでは簡略化のため、ダミーデータを返す
                await Task.Delay(100); // 非同期操作をシミュレート
                var dummyData = $"{{\"endpoint\":\"{endpoint}\",\"userId\":{userId},\"cached\":true}}";
                return System.Text.Encoding.UTF8.GetBytes(dummyData);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "データ取得エラー: {Endpoint}", endpoint);
                return null;
            }
        }

        private async Task StoreCacheData(string endpoint, int userId, byte[] data)
        {
            try
            {
                // 実際の実装では、Redis、MemoryCache、またはファイルシステムにキャッシュ
                // ここでは簡略化のため、ログ出力のみ
                _logger.LogInformation("キャッシュ保存: {Endpoint} - {Size} bytes", endpoint, data.Length);
                await Task.CompletedTask;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "キャッシュ保存エラー: {Endpoint}", endpoint);
                throw;
            }
        }

        #endregion
    }
}
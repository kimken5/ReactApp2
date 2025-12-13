using Microsoft.EntityFrameworkCore;
using ReactApp.Server.Data;
using ReactApp.Server.Helpers;

namespace ReactApp.Server.Services
{
    /// <summary>
    /// バックグラウンドタスクサービス
    /// 重い処理をメインスレッドから分離して性能向上を実現
    /// データベースクリーンアップ、キャッシュ最適化、統計処理を定期実行
    /// </summary>
    public class BackgroundTaskService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<BackgroundTaskService> _logger;

        // タスク実行間隔設定
        private readonly TimeSpan _cleanupInterval = TimeSpan.FromHours(6);      // データクリーンアップ: 6時間毎
        private readonly TimeSpan _cacheOptimizeInterval = TimeSpan.FromHours(1); // キャッシュ最適化: 1時間毎
        private readonly TimeSpan _statisticsInterval = TimeSpan.FromMinutes(30); // 統計更新: 30分毎

        public BackgroundTaskService(
            IServiceProvider serviceProvider,
            ILogger<BackgroundTaskService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("バックグラウンドタスクサービス開始");

            // 定期タスクを並列実行
            var tasks = new[]
            {
                RunPeriodicTask("データベースクリーンアップ", _cleanupInterval, CleanupDatabaseAsync, stoppingToken),
                RunPeriodicTask("キャッシュ最適化", _cacheOptimizeInterval, OptimizeCacheAsync, stoppingToken),
                RunPeriodicTask("統計データ更新", _statisticsInterval, UpdateStatisticsAsync, stoppingToken)
            };

            try
            {
                await Task.WhenAll(tasks);
            }
            catch (OperationCanceledException)
            {
                _logger.LogInformation("バックグラウンドタスクサービス停止");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "バックグラウンドタスク実行エラー");
            }
        }

        /// <summary>
        /// 定期タスク実行フレームワーク
        /// </summary>
        private async Task RunPeriodicTask(
            string taskName,
            TimeSpan interval,
            Func<CancellationToken, Task> taskFunc,
            CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    var startTime = DateTimeHelper.GetJstNow();
                    _logger.LogDebug("{TaskName} 実行開始", taskName);

                    await taskFunc(stoppingToken);

                    var duration = DateTimeHelper.GetJstNow() - startTime;
                    _logger.LogDebug("{TaskName} 実行完了 (所要時間: {Duration}ms)", taskName, duration.TotalMilliseconds);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "{TaskName} 実行エラー", taskName);
                }

                try
                {
                    await Task.Delay(interval, stoppingToken);
                }
                catch (OperationCanceledException)
                {
                    break;
                }
            }
        }

        /// <summary>
        /// データベースクリーンアップタスク
        /// パフォーマンス向上のため古いデータと不要レコードを定期削除
        /// </summary>
        private async Task CleanupDatabaseAsync(CancellationToken cancellationToken)
        {
            using var scope = _serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<KindergartenDbContext>();

            try
            {
                var deletedCount = 0;

                // 1. 期限切れSMS認証コードを削除（24時間経過）
                var expiredSmsAuth = await context.SmsAuthentications
                    .Where(s => s.CreatedAt < DateTimeHelper.GetJstNow().AddHours(-24))
                    .ToListAsync(cancellationToken);

                if (expiredSmsAuth.Any())
                {
                    context.SmsAuthentications.RemoveRange(expiredSmsAuth);
                    deletedCount += expiredSmsAuth.Count;
                }

                // 2. 期限切れリフレッシュトークンを削除
                var expiredTokens = await context.RefreshTokens
                    .Where(r => r.ExpiresAt < DateTimeHelper.GetJstNow())
                    .ToListAsync(cancellationToken);

                if (expiredTokens.Any())
                {
                    context.RefreshTokens.RemoveRange(expiredTokens);
                    deletedCount += expiredTokens.Count;
                }

                // 3. 古い通知ログを削除（90日経過）
                var oldNotificationLogs = await context.NotificationLogs
                    .Where(n => n.CreatedAt < DateTimeHelper.GetJstNow().AddDays(-90))
                    .ToListAsync(cancellationToken);

                if (oldNotificationLogs.Any())
                {
                    context.NotificationLogs.RemoveRange(oldNotificationLogs);
                    deletedCount += oldNotificationLogs.Count;
                }

                // 4. 失敗したAzure通知ログを削除（30日経過）
                var oldAzureNotificationLogs = await context.AzureNotificationLogs
                    .Where(a => a.CreatedAt < DateTimeHelper.GetJstNow().AddDays(-30) &&
                               !string.IsNullOrEmpty(a.NotificationState) &&
                               a.NotificationState != "delivered")
                    .ToListAsync(cancellationToken);

                if (oldAzureNotificationLogs.Any())
                {
                    context.AzureNotificationLogs.RemoveRange(oldAzureNotificationLogs);
                    deletedCount += oldAzureNotificationLogs.Count;
                }

                // 5. 古い写真アクセスログを削除（180日経過）
                var oldPhotoAccess = await context.PhotoAccesses
                    .Where(p => p.AccessedAt < DateTimeHelper.GetJstNow().AddDays(-180))
                    .ToListAsync(cancellationToken);

                if (oldPhotoAccess.Any())
                {
                    context.PhotoAccesses.RemoveRange(oldPhotoAccess);
                    deletedCount += oldPhotoAccess.Count;
                }

                if (deletedCount > 0)
                {
                    await context.SaveChangesAsync(cancellationToken);
                    _logger.LogInformation("データベースクリーンアップ完了: {DeletedCount}件削除", deletedCount);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "データベースクリーンアップエラー");
            }
        }

        /// <summary>
        /// キャッシュ最適化タスク
        /// メモリ使用量監視と使用頻度の低いキャッシュエントリの削除
        /// </summary>
        private async Task OptimizeCacheAsync(CancellationToken cancellationToken)
        {
            using var scope = _serviceProvider.CreateScope();
            var cacheService = scope.ServiceProvider.GetRequiredService<ICacheService>();

            try
            {
                // 使用頻度の低いキャッシュを削除（実装例）
                var oldPatterns = new[]
                {
                    "temp:*",           // 一時キャッシュ
                    "search:*",         // 検索結果キャッシュ
                    "stats:daily:*"     // 日次統計（古いもの）
                };

                foreach (var pattern in oldPatterns)
                {
                    await cacheService.RemoveByPatternAsync(pattern);
                }

                _logger.LogDebug("キャッシュ最適化完了");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "キャッシュ最適化エラー");
            }
        }

        /// <summary>
        /// 統計データ更新タスク
        /// システム使用状況の集計とパフォーマンス監視データの更新
        /// </summary>
        private async Task UpdateStatisticsAsync(CancellationToken cancellationToken)
        {
            using var scope = _serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<KindergartenDbContext>();
            var cacheService = scope.ServiceProvider.GetRequiredService<ICacheService>();

            try
            {
                var now = DateTimeHelper.GetJstNow();
                var today = now.Date;

                // 日次統計の更新
                var stats = new
                {
                    Date = today,
                    TotalUsers = await context.Parents.CountAsync(cancellationToken),
                    ActiveUsers = await context.RefreshTokens
                        .Where(r => r.CreatedAt >= today)
                        .Select(r => r.ParentId)
                        .Distinct()
                        .CountAsync(cancellationToken),
                    DailyReports = await context.DailyReports
                        .Where(d => d.ReportDate >= today)
                        .CountAsync(cancellationToken),
                    PhotosUploaded = await context.Photos
                        .Where(p => p.UploadedAt >= today)
                        .CountAsync(cancellationToken),
                    NotificationsSent = await context.NotificationLogs
                        .Where(n => n.CreatedAt >= today)
                        .CountAsync(cancellationToken)
                };

                // 統計をキャッシュに保存（1時間有効）
                await cacheService.SetAsync($"stats:daily:{today:yyyy-MM-dd}", stats, TimeSpan.FromHours(1));

                // 週次・月次統計もここで更新可能
                if (now.Hour == 1) // 深夜1時に実行
                {
                    await UpdateWeeklyMonthlyStatsAsync(context, cacheService, cancellationToken);
                }

                _logger.LogDebug("統計データ更新完了: アクティブユーザー {ActiveUsers}名", stats.ActiveUsers);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "統計データ更新エラー");
            }
        }

        /// <summary>
        /// 週次・月次統計の更新
        /// </summary>
        private async Task UpdateWeeklyMonthlyStatsAsync(
            KindergartenDbContext context,
            ICacheService cacheService,
            CancellationToken cancellationToken)
        {
            try
            {
                var now = DateTimeHelper.GetJstNow();
                var startOfWeek = now.Date.AddDays(-(int)now.DayOfWeek);
                var startOfMonth = new DateTime(now.Year, now.Month, 1);

                // 週次統計
                var weeklyStats = new
                {
                    WeekStart = startOfWeek,
                    TotalReports = await context.DailyReports
                        .Where(d => d.ReportDate >= startOfWeek)
                        .CountAsync(cancellationToken),
                    TotalPhotos = await context.Photos
                        .Where(p => p.UploadedAt >= startOfWeek)
                        .CountAsync(cancellationToken),
                    UniqueActiveUsers = await context.RefreshTokens
                        .Where(r => r.CreatedAt >= startOfWeek)
                        .Select(r => r.ParentId)
                        .Distinct()
                        .CountAsync(cancellationToken)
                };

                await cacheService.SetAsync($"stats:weekly:{startOfWeek:yyyy-MM-dd}", weeklyStats, TimeSpan.FromDays(7));

                // 月次統計
                var monthlyStats = new
                {
                    MonthStart = startOfMonth,
                    TotalReports = await context.DailyReports
                        .Where(d => d.ReportDate >= startOfMonth)
                        .CountAsync(cancellationToken),
                    TotalPhotos = await context.Photos
                        .Where(p => p.UploadedAt >= startOfMonth)
                        .CountAsync(cancellationToken),
                    UniqueActiveUsers = await context.RefreshTokens
                        .Where(r => r.CreatedAt >= startOfMonth)
                        .Select(r => r.ParentId)
                        .Distinct()
                        .CountAsync(cancellationToken)
                };

                await cacheService.SetAsync($"stats:monthly:{startOfMonth:yyyy-MM}", monthlyStats, TimeSpan.FromDays(30));

                _logger.LogInformation("週次・月次統計更新完了");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "週次・月次統計更新エラー");
            }
        }
    }
}

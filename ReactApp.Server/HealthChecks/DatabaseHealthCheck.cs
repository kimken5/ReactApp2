using Microsoft.Extensions.Diagnostics.HealthChecks;
using ReactApp.Server.Data;
using Microsoft.EntityFrameworkCore;

namespace ReactApp.Server.HealthChecks
{
    /// <summary>
    /// データベース接続の健全性チェック
    /// データベースへの接続状態と基本クエリの実行可否を監視
    /// </summary>
    public class DatabaseHealthCheck : IHealthCheck
    {
        private readonly KindergartenDbContext _context;
        private readonly ILogger<DatabaseHealthCheck> _logger;

        public DatabaseHealthCheck(KindergartenDbContext context, ILogger<DatabaseHealthCheck> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<HealthCheckResult> CheckHealthAsync(
            HealthCheckContext context,
            CancellationToken cancellationToken = default)
        {
            try
            {
                // データベース接続テスト
                await _context.Database.CanConnectAsync(cancellationToken);

                // 基本クエリテスト - テーブル存在確認
                var tableExists = await _context.Database
                    .SqlQuery<int>($"SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Staff'")
                    .FirstOrDefaultAsync(cancellationToken);

                if (tableExists == 0)
                {
                    return HealthCheckResult.Degraded("Staff テーブルが存在しません");
                }

                // パフォーマンステスト - 簡単なクエリの実行時間測定
                var stopwatch = System.Diagnostics.Stopwatch.StartNew();
                var staffCount = await _context.Staff.CountAsync(cancellationToken);
                stopwatch.Stop();

                var responseTime = stopwatch.ElapsedMilliseconds;

                var data = new Dictionary<string, object>
                {
                    { "StaffCount", staffCount },
                    { "ResponseTimeMs", responseTime },
                    { "DatabaseProvider", _context.Database.ProviderName ?? "Unknown" },
                    { "ConnectionState", _context.Database.CanConnect() ? "Connected" : "Disconnected" }
                };

                if (responseTime > 5000) // 5秒以上の場合は劣化状態
                {
                    return HealthCheckResult.Degraded(
                        $"データベースレスポンスが遅延しています: {responseTime}ms",
                        data: data);
                }

                return HealthCheckResult.Healthy(
                    $"データベース正常: {staffCount}人のスタッフ登録済み, レスポンス時間: {responseTime}ms",
                    data);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "データベースヘルスチェックエラー");

                return HealthCheckResult.Unhealthy(
                    $"データベース接続エラー: {ex.Message}",
                    ex,
                    new Dictionary<string, object>
                    {
                        { "ExceptionType", ex.GetType().Name },
                        { "Source", ex.Source ?? "Unknown" }
                    });
            }
        }
    }
}
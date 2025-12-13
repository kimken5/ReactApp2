using Microsoft.Extensions.Caching.Memory;
using System.Net;
using System.Text.Json;
using ReactApp.Server.Helpers;

namespace ReactApp.Server.Middleware
{
    /// <summary>
    /// レート制限ミドルウェア
    /// API呼び出し頻度を制限してDoS攻撃やスパムアクセスを防止
    /// IPアドレス・ユーザー単位でのリクエスト数制御を提供
    /// </summary>
    public class RateLimitingMiddleware
    {
        // 依存サービス
        private readonly RequestDelegate _next;                      // 次のミドルウェアデリゲート
        private readonly IMemoryCache _cache;                        // メモリキャッシュサービス
        private readonly ILogger<RateLimitingMiddleware> _logger;    // ログ出力サービス
        private readonly RateLimitOptions _options;                  // レート制限設定オプション

        /// <summary>
        /// RateLimitingMiddlewareコンストラクタ
        /// 必要な依存サービスとレート制限設定を注入により受け取り初期化
        /// </summary>
        /// <param name="next">次のミドルウェアデリゲート</param>
        public RateLimitingMiddleware(
            RequestDelegate next,
            IMemoryCache cache,
            ILogger<RateLimitingMiddleware> logger,
            RateLimitOptions options)
        {
            _next = next;
            _cache = cache;
            _logger = logger;
            _options = options;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            var endpoint = context.Request.Path.Value;
            var clientId = GetClientIdentifier(context);

            // SMS認証エンドポイントのレート制限のみ適用
            if (ShouldApplyRateLimit(endpoint))
            {
                var key = $"rate_limit_{clientId}_{endpoint}";
                var attempts = _cache.Get<List<DateTime>>(key) ?? new List<DateTime>();

                // 古いエントリを削除
                var cutoffTime = DateTimeHelper.GetJstNow().Subtract(_options.TimeWindow);
                attempts.RemoveAll(time => time < cutoffTime);

                if (attempts.Count >= _options.MaxRequests)
                {
                    _logger.LogWarning("Rate limit exceeded for client {ClientId} on endpoint {Endpoint}", clientId, endpoint);

                    context.Response.StatusCode = (int)HttpStatusCode.TooManyRequests;
                    context.Response.ContentType = "application/json";

                    var response = new
                    {
                        error = "Rate limit exceeded",
                        message = $"Too many requests. Try again in {_options.TimeWindow.TotalMinutes} minutes.",
                        retryAfter = _options.TimeWindow.TotalSeconds
                    };

                    await context.Response.WriteAsync(JsonSerializer.Serialize(response));
                    return;
                }

                attempts.Add(DateTimeHelper.GetJstNow());
                _cache.Set(key, attempts, _options.TimeWindow);
            }

            await _next(context);
        }

        private string GetClientIdentifier(HttpContext context)
        {
            // IPアドレスをクライアント識別子として使用
            var forwardedFor = context.Request.Headers["X-Forwarded-For"].FirstOrDefault();
            if (!string.IsNullOrEmpty(forwardedFor))
            {
                return forwardedFor.Split(',')[0].Trim();
            }

            return context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        }

        private bool ShouldApplyRateLimit(string? endpoint)
        {
            if (string.IsNullOrEmpty(endpoint)) return false;

            // SMS認証関連のエンドポイントにのみレート制限を適用
            var rateLimitedPaths = new[]
            {
                "/api/auth/send-sms",
                "/api/auth/verify-sms",
                "/api/auth/resend-sms"
            };

            return rateLimitedPaths.Any(path => endpoint.StartsWith(path, StringComparison.OrdinalIgnoreCase));
        }
    }

    public class RateLimitOptions
    {
        public int MaxRequests { get; set; } = 5; // 最大リクエスト数
        public TimeSpan TimeWindow { get; set; } = TimeSpan.FromMinutes(15); // 時間窓
    }

    public static class RateLimitingExtensions
    {
        public static IServiceCollection AddRateLimiting(this IServiceCollection services, Action<RateLimitOptions> configureOptions)
        {
            var options = new RateLimitOptions();
            configureOptions(options);
            services.AddSingleton(options);
            return services;
        }

        public static IApplicationBuilder UseRateLimiting(this IApplicationBuilder app)
        {
            return app.UseMiddleware<RateLimitingMiddleware>();
        }
    }
}

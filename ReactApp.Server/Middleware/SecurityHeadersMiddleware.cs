namespace ReactApp.Server.Middleware
{
    /// <summary>
    /// セキュリティヘッダーミドルウェア
    /// HTTPレスポンスにセキュリティ関連ヘッダーを自動付与
    /// XSS、CSRF、クリックジャッキング等の攻撃から保護
    /// </summary>
    public class SecurityHeadersMiddleware
    {
        // 依存サービス
        private readonly RequestDelegate _next;                       // 次のミドルウェアデリゲート
        private readonly ILogger<SecurityHeadersMiddleware> _logger;  // ログ出力サービス

        /// <summary>
        /// SecurityHeadersMiddlewareコンストラクタ
        /// 必要な依存サービスを注入により受け取り初期化
        /// </summary>
        /// <param name="next">次のミドルウェアデリゲート</param>
        /// <param name="logger">ログ出力サービス</param>
        public SecurityHeadersMiddleware(RequestDelegate next, ILogger<SecurityHeadersMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            // Security headers - using indexer to avoid duplicate header warnings
            context.Response.Headers["X-Content-Type-Options"] = "nosniff";
            context.Response.Headers["X-Frame-Options"] = "DENY";
            context.Response.Headers["X-XSS-Protection"] = "1; mode=block";
            context.Response.Headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
            context.Response.Headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()";
            
            // Remove server header
            context.Response.Headers.Remove("Server");

            // CORS headers for API
            if (context.Request.Path.StartsWithSegments("/api"))
            {
                context.Response.Headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
                context.Response.Headers["Pragma"] = "no-cache";
                context.Response.Headers["Expires"] = "0";
            }

            await _next(context);
        }
    }

    public class IpAddressLoggingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<IpAddressLoggingMiddleware> _logger;

        public IpAddressLoggingMiddleware(RequestDelegate next, ILogger<IpAddressLoggingMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            var ipAddress = GetClientIpAddress(context);
            var userAgent = context.Request.Headers.UserAgent.ToString();
            
            // Add IP address to context for later use
            context.Items["ClientIpAddress"] = ipAddress;
            context.Items["UserAgent"] = userAgent;

            // Log suspicious activity patterns
            if (IsSuspiciousRequest(context))
            {
                _logger.LogWarning("疑わしいリクエスト検出: IP={IpAddress}, Path={Path}, UserAgent={UserAgent}", 
                    ipAddress, context.Request.Path, userAgent);
            }

            await _next(context);
        }

        private static string GetClientIpAddress(HttpContext context)
        {
            var forwardedFor = context.Request.Headers["X-Forwarded-For"].FirstOrDefault();
            if (!string.IsNullOrEmpty(forwardedFor))
            {
                return forwardedFor.Split(',').FirstOrDefault()?.Trim() ?? "unknown";
            }

            var realIp = context.Request.Headers["X-Real-IP"].FirstOrDefault();
            if (!string.IsNullOrEmpty(realIp))
            {
                return realIp;
            }

            return context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        }

        private static bool IsSuspiciousRequest(HttpContext context)
        {
            var userAgent = context.Request.Headers.UserAgent.ToString().ToLower();
            var path = context.Request.Path.ToString().ToLower();

            // Check for suspicious user agents
            var suspiciousAgents = new[] { "bot", "crawler", "spider", "scan", "curl", "wget" };
            if (suspiciousAgents.Any(agent => userAgent.Contains(agent)))
                return true;

            // Check for suspicious paths
            var suspiciousPaths = new[] { "admin", "wp-", "phpmyadmin", ".php", "/.env", "/config" };
            if (suspiciousPaths.Any(path.Contains))
                return true;

            // Check for empty user agent on API endpoints
            if (context.Request.Path.StartsWithSegments("/api") && string.IsNullOrEmpty(userAgent))
                return true;

            return false;
        }
    }
}
using Microsoft.Extensions.Diagnostics.HealthChecks;
using System.Net.Http;
using System.Diagnostics;

namespace ReactApp.Server.HealthChecks
{
    /// <summary>
    /// 外部サービスの健全性チェック
    /// SMS API、Azure Storage、その他の外部依存サービスの状態を監視
    /// </summary>
    public class ExternalServiceHealthCheck : IHealthCheck
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;
        private readonly ILogger<ExternalServiceHealthCheck> _logger;

        public ExternalServiceHealthCheck(
            HttpClient httpClient,
            IConfiguration configuration,
            ILogger<ExternalServiceHealthCheck> logger)
        {
            _httpClient = httpClient;
            _configuration = configuration;
            _logger = logger;
        }

        public async Task<HealthCheckResult> CheckHealthAsync(
            HealthCheckContext context,
            CancellationToken cancellationToken = default)
        {
            var results = new Dictionary<string, object>();
            var issues = new List<string>();
            var warnings = new List<string>();

            // SMS API Health Check
            await CheckSmsApiHealth(results, issues, warnings, cancellationToken);

            // Azure Storage Health Check
            await CheckAzureStorageHealth(results, issues, warnings, cancellationToken);

            // CDN Health Check
            await CheckCdnHealth(results, issues, warnings, cancellationToken);

            // 結果の評価
            if (issues.Count > 0)
            {
                return HealthCheckResult.Unhealthy(
                    $"外部サービスエラー: {string.Join(", ", issues)}",
                    data: results);
            }

            if (warnings.Count > 0)
            {
                return HealthCheckResult.Degraded(
                    $"外部サービス警告: {string.Join(", ", warnings)}",
                    data: results);
            }

            return HealthCheckResult.Healthy("すべての外部サービスが正常", results);
        }

        private async Task CheckSmsApiHealth(
            Dictionary<string, object> results,
            List<string> issues,
            List<string> warnings,
            CancellationToken cancellationToken)
        {
            try
            {
                var apiEndpoint = _configuration["Media4U:ApiEndpoint"];
                if (string.IsNullOrEmpty(apiEndpoint))
                {
                    results["SmsApi"] = "設定なし";
                    warnings.Add("SMS API エンドポイントが設定されていません");
                    return;
                }

                var stopwatch = Stopwatch.StartNew();

                // ヘルスチェック用の軽量リクエスト（実際のAPIに合わせて調整）
                using var request = new HttpRequestMessage(HttpMethod.Get, apiEndpoint);
                request.Headers.Add("User-Agent", "KindergartenApp-HealthCheck/1.0");

                using var response = await _httpClient.SendAsync(request, cancellationToken);
                stopwatch.Stop();

                var responseTime = stopwatch.ElapsedMilliseconds;

                results["SmsApiStatus"] = response.StatusCode.ToString();
                results["SmsApiResponseTime"] = responseTime;

                if (responseTime > 10000) // 10秒以上
                {
                    warnings.Add($"SMS API レスポンス遅延: {responseTime}ms");
                }
                else if (!response.IsSuccessStatusCode)
                {
                    warnings.Add($"SMS API 応答異常: {response.StatusCode}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "SMS API ヘルスチェックエラー");
                results["SmsApiError"] = ex.Message;
                issues.Add("SMS API 接続エラー");
            }
        }

        private async Task CheckAzureStorageHealth(
            Dictionary<string, object> results,
            List<string> issues,
            List<string> warnings,
            CancellationToken cancellationToken)
        {
            try
            {
                var storageConnectionString = _configuration["Azure:Storage:ConnectionString"];
                if (string.IsNullOrEmpty(storageConnectionString) || storageConnectionString.Contains("${"))
                {
                    results["AzureStorage"] = "設定なし";
                    warnings.Add("Azure Storage が設定されていません");
                    return;
                }

                // 実際のAzure Storage Health Checkの実装
                // この例では簡略化していますが、実際にはAzure.Storage.Blobs パッケージを使用
                results["AzureStorageStatus"] = "設定済み";

                // TODO: 実際のBlob Storageへの接続テストを実装
                // var blobServiceClient = new BlobServiceClient(storageConnectionString);
                // await blobServiceClient.GetPropertiesAsync(cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Azure Storage ヘルスチェックエラー");
                results["AzureStorageError"] = ex.Message;
                issues.Add("Azure Storage 接続エラー");
            }
        }

        private async Task CheckCdnHealth(
            Dictionary<string, object> results,
            List<string> issues,
            List<string> warnings,
            CancellationToken cancellationToken)
        {
            try
            {
                var cdnEndpoint = _configuration["Azure:Storage:CdnEndpoint"];
                if (string.IsNullOrEmpty(cdnEndpoint) || cdnEndpoint.Contains("${"))
                {
                    results["Cdn"] = "設定なし";
                    return;
                }

                var stopwatch = Stopwatch.StartNew();

                // CDNヘルスチェック用のテストファイルを確認
                using var request = new HttpRequestMessage(HttpMethod.Head, $"{cdnEndpoint}/health-check.txt");
                using var response = await _httpClient.SendAsync(request, cancellationToken);
                stopwatch.Stop();

                var responseTime = stopwatch.ElapsedMilliseconds;

                results["CdnStatus"] = response.StatusCode.ToString();
                results["CdnResponseTime"] = responseTime;

                if (responseTime > 5000) // 5秒以上
                {
                    warnings.Add($"CDN レスポンス遅延: {responseTime}ms");
                }
                else if (!response.IsSuccessStatusCode)
                {
                    warnings.Add($"CDN 応答異常: {response.StatusCode}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "CDN ヘルスチェックエラー");
                results["CdnError"] = ex.Message;
                warnings.Add("CDN 接続警告");
            }
        }
    }
}
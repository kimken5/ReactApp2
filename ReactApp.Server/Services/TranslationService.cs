using System.Text;
using Newtonsoft.Json;

namespace ReactApp.Server.Services
{
    /// <summary>
    /// Azure Translator API連携サービス
    /// データベースから取得したテキストを多言語に翻訳
    /// </summary>
    public interface ITranslationService
    {
        /// <summary>
        /// テキストを指定された言語に翻訳
        /// </summary>
        /// <param name="text">翻訳対象テキスト</param>
        /// <param name="targetLanguage">翻訳先言語コード (ja, en, zh-CN, ko)</param>
        /// <param name="sourceLanguage">翻訳元言語コード（デフォルト: ja）</param>
        /// <returns>翻訳後のテキスト</returns>
        Task<string> TranslateTextAsync(string text, string targetLanguage, string sourceLanguage = "ja");
    }

    /// <summary>
    /// Azure Translator API実装クラス
    /// </summary>
    public class TranslationService : ITranslationService
    {
        private readonly string _subscriptionKey;
        private readonly string _endpoint;
        private readonly string _region;
        private readonly ILogger<TranslationService> _logger;
        private readonly HttpClient _httpClient;

        public TranslationService(
            IConfiguration configuration,
            ILogger<TranslationService> logger,
            HttpClient httpClient)
        {
            _subscriptionKey = configuration["AzureTranslator:SubscriptionKey"]
                ?? throw new InvalidOperationException("Azure Translator subscription key not configured");
            _endpoint = configuration["AzureTranslator:Endpoint"]
                ?? throw new InvalidOperationException("Azure Translator endpoint not configured");
            _region = configuration["AzureTranslator:Region"]
                ?? throw new InvalidOperationException("Azure Translator region not configured");
            _logger = logger;
            _httpClient = httpClient;
        }

        public async Task<string> TranslateTextAsync(string text, string targetLanguage, string sourceLanguage = "ja")
        {
            // 翻訳が不要な場合（同じ言語または空テキスト）
            if (string.IsNullOrWhiteSpace(text) || sourceLanguage == targetLanguage)
            {
                return text;
            }

            try
            {
                // zh-CN を zh-Hans に変換（Azure Translator形式）
                string azureTargetLang = targetLanguage == "zh-CN" ? "zh-Hans" : targetLanguage;
                string azureSourceLang = sourceLanguage == "zh-CN" ? "zh-Hans" : sourceLanguage;

                string route = $"/translate?api-version=3.0&from={azureSourceLang}&to={azureTargetLang}";
                object[] body = new object[] { new { Text = text } };
                var requestBody = JsonConvert.SerializeObject(body);

                using var request = new HttpRequestMessage
                {
                    Method = HttpMethod.Post,
                    RequestUri = new Uri(_endpoint + route),
                    Content = new StringContent(requestBody, Encoding.UTF8, "application/json")
                };

                request.Headers.Add("Ocp-Apim-Subscription-Key", _subscriptionKey);
                // Azure Translator requires region for multi-service resources
                request.Headers.Add("Ocp-Apim-Subscription-Region", _region);

                _logger.LogInformation("Translating text from {SourceLang} to {TargetLang}: {TextPreview}...",
                    sourceLanguage, targetLanguage, text.Substring(0, Math.Min(50, text.Length)));

                HttpResponseMessage response = await _httpClient.SendAsync(request);

                if (!response.IsSuccessStatusCode)
                {
                    string errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError("Translation API failed with status {StatusCode}: {Reason}. Response: {ErrorContent}",
                        response.StatusCode, response.ReasonPhrase, errorContent);
                    return text; // 翻訳失敗時は元のテキストを返す
                }

                string result = await response.Content.ReadAsStringAsync();

                // レスポンスをパース
                var translations = JsonConvert.DeserializeObject<List<TranslationResponse>>(result);
                if (translations != null && translations.Count > 0 && translations[0].Translations.Count > 0)
                {
                    string translatedText = translations[0].Translations[0].Text;
                    _logger.LogInformation("Translation successful: {TranslatedPreview}...",
                        translatedText.Substring(0, Math.Min(50, translatedText.Length)));
                    return translatedText;
                }

                _logger.LogWarning("Translation response was empty or invalid");
                return text;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during translation from {SourceLang} to {TargetLang}",
                    sourceLanguage, targetLanguage);
                return text; // エラー時は元のテキストを返す
            }
        }
    }

    /// <summary>
    /// Azure Translator APIレスポンスモデル
    /// </summary>
    internal class TranslationResponse
    {
        public List<TranslationResult> Translations { get; set; } = new List<TranslationResult>();
    }

    internal class TranslationResult
    {
        public string Text { get; set; } = string.Empty;
        public string To { get; set; } = string.Empty;
    }
}

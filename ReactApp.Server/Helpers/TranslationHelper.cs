using ReactApp.Server.Data;
using ReactApp.Server.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace ReactApp.Server.Helpers
{
    /// <summary>
    /// 翻訳ヘルパークラス
    /// Azure Translatorを使用した翻訳処理の共通メソッドを提供
    /// </summary>
    public class TranslationHelper
    {
        private readonly ITranslationService _translationService;
        private readonly KindergartenDbContext _context;
        private readonly ILogger<TranslationHelper> _logger;

        public TranslationHelper(
            ITranslationService translationService,
            KindergartenDbContext context,
            ILogger<TranslationHelper> logger)
        {
            _translationService = translationService;
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// 保護者の言語設定を取得
        /// </summary>
        /// <param name="parentId">保護者ID</param>
        /// <returns>言語コード (ja, en, zh-CN, ko)</returns>
        public async Task<string> GetParentLanguageAsync(int parentId)
        {
            var parent = await _context.Parents.FindAsync(parentId);
            return parent?.Language ?? "ja";
        }

        /// <summary>
        /// テキストを保護者の言語に翻訳
        /// 日本語の場合は翻訳をスキップ
        /// </summary>
        /// <param name="text">翻訳対象テキスト</param>
        /// <param name="parentId">保護者ID</param>
        /// <param name="sourceLanguage">元の言語 (デフォルト: ja)</param>
        /// <returns>翻訳されたテキスト</returns>
        public async Task<string> TranslateForParentAsync(string text, int parentId, string sourceLanguage = "ja")
        {
            if (string.IsNullOrWhiteSpace(text))
            {
                return text;
            }

            var targetLanguage = await GetParentLanguageAsync(parentId);
            return await TranslateTextAsync(text, targetLanguage, sourceLanguage);
        }

        /// <summary>
        /// テキストを指定言語に翻訳
        /// 元の言語と同じ場合、または日本語の場合は翻訳をスキップ
        /// </summary>
        /// <param name="text">翻訳対象テキスト</param>
        /// <param name="targetLanguage">翻訳先言語</param>
        /// <param name="sourceLanguage">元の言語 (デフォルト: ja)</param>
        /// <returns>翻訳されたテキスト</returns>
        public async Task<string> TranslateTextAsync(string text, string targetLanguage, string sourceLanguage = "ja")
        {
            // テキストが空または翻訳不要な場合はそのまま返す
            if (string.IsNullOrWhiteSpace(text) || targetLanguage == sourceLanguage || targetLanguage == "ja")
            {
                return text;
            }

            try
            {
                var translatedText = await _translationService.TranslateTextAsync(text, targetLanguage, sourceLanguage);
                _logger.LogInformation("Text translated from {SourceLang} to {TargetLang}", sourceLanguage, targetLanguage);
                return translatedText;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to translate text from {SourceLang} to {TargetLang}", sourceLanguage, targetLanguage);
                // 翻訳失敗時は元のテキストを返す
                return text;
            }
        }

        /// <summary>
        /// 複数のテキストを一括で翻訳
        /// </summary>
        /// <param name="texts">翻訳対象テキストのリスト</param>
        /// <param name="targetLanguage">翻訳先言語</param>
        /// <param name="sourceLanguage">元の言語 (デフォルト: ja)</param>
        /// <returns>翻訳されたテキストのリスト</returns>
        public async Task<List<string>> TranslateTextsAsync(List<string> texts, string targetLanguage, string sourceLanguage = "ja")
        {
            // 翻訳不要な場合はそのまま返す
            if (targetLanguage == sourceLanguage || targetLanguage == "ja")
            {
                return texts;
            }

            var translatedTexts = new List<string>();
            foreach (var text in texts)
            {
                var translatedText = await TranslateTextAsync(text, targetLanguage, sourceLanguage);
                translatedTexts.Add(translatedText);
            }

            return translatedTexts;
        }

        /// <summary>
        /// 複数のテキストを保護者の言語に一括翻訳
        /// </summary>
        /// <param name="texts">翻訳対象テキストのリスト</param>
        /// <param name="parentId">保護者ID</param>
        /// <param name="sourceLanguage">元の言語 (デフォルト: ja)</param>
        /// <returns>翻訳されたテキストのリスト</returns>
        public async Task<List<string>> TranslateTextsForParentAsync(List<string> texts, int parentId, string sourceLanguage = "ja")
        {
            var targetLanguage = await GetParentLanguageAsync(parentId);
            return await TranslateTextsAsync(texts, targetLanguage, sourceLanguage);
        }

        /// <summary>
        /// オブジェクトの特定プロパティを翻訳
        /// </summary>
        /// <typeparam name="T">オブジェクトの型</typeparam>
        /// <param name="obj">翻訳対象オブジェクト</param>
        /// <param name="propertyName">翻訳対象プロパティ名</param>
        /// <param name="targetLanguage">翻訳先言語</param>
        /// <param name="sourceLanguage">元の言語 (デフォルト: ja)</param>
        public async Task TranslatePropertyAsync<T>(T obj, string propertyName, string targetLanguage, string sourceLanguage = "ja") where T : class
        {
            if (obj == null || targetLanguage == "ja" || targetLanguage == sourceLanguage)
            {
                return;
            }

            var property = typeof(T).GetProperty(propertyName);
            if (property != null && property.PropertyType == typeof(string))
            {
                var value = property.GetValue(obj) as string;
                if (!string.IsNullOrWhiteSpace(value))
                {
                    var translatedValue = await TranslateTextAsync(value, targetLanguage, sourceLanguage);
                    property.SetValue(obj, translatedValue);
                }
            }
        }

        /// <summary>
        /// オブジェクトの複数プロパティを翻訳
        /// </summary>
        /// <typeparam name="T">オブジェクトの型</typeparam>
        /// <param name="obj">翻訳対象オブジェクト</param>
        /// <param name="propertyNames">翻訳対象プロパティ名のリスト</param>
        /// <param name="targetLanguage">翻訳先言語</param>
        /// <param name="sourceLanguage">元の言語 (デフォルト: ja)</param>
        public async Task TranslatePropertiesAsync<T>(T obj, List<string> propertyNames, string targetLanguage, string sourceLanguage = "ja") where T : class
        {
            if (obj == null || targetLanguage == "ja" || targetLanguage == sourceLanguage)
            {
                return;
            }

            foreach (var propertyName in propertyNames)
            {
                await TranslatePropertyAsync(obj, propertyName, targetLanguage, sourceLanguage);
            }
        }
    }
}

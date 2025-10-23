using BCrypt.Net;
using System.Net;
using System.Security.Cryptography;
using System.Text;

namespace ReactApp.Server.Services
{
    /// <summary>
    /// メディア4U SMS認証サービス実装
    /// </summary>
    public class Media4USmsService : IMedia4USmsService
    {
        // 設定情報とロガー
        private readonly IConfiguration _configuration;
        private readonly ILogger<Media4USmsService> _logger;

        // メディア4U API認証情報
        private readonly string _basicAuthUser;        // Basic認証ユーザー名
        private readonly string _basicAuthPassword;   // Basic認証パスワード
        private readonly string _apiEndpoint;         // SMS送信API エンドポイント

        /// <summary>
        /// メディア4U SMSサービスのコンストラクタ
        /// 設定ファイルからAPI認証情報を読み込み初期化
        /// </summary>
        /// <param name="configuration">アプリケーション設定</param>
        /// <param name="logger">ロガー</param>
        public Media4USmsService(IConfiguration configuration, ILogger<Media4USmsService> logger)
        {
            _configuration = configuration;
            _logger = logger;

            // メディア4U API設定の読み込み（必須項目）
            _basicAuthUser = _configuration["Media4U:BasicAuthUser"] ?? throw new InvalidOperationException("Media4U BasicAuthUser not configured");
            _basicAuthPassword = _configuration["Media4U:BasicAuthPassword"] ?? throw new InvalidOperationException("Media4U BasicAuthPassword not configured");
            _apiEndpoint = _configuration["Media4U:ApiEndpoint"] ?? "https://www.sms-ope.com/sms/api/";
        }

        /// <summary>
        /// SMS送信メイン処理
        /// 開発環境での送信無効化チェックを含む
        /// </summary>
        /// <param name="phoneNumber">送信先電話番号</param>
        /// <param name="message">送信メッセージ</param>
        /// <param name="smsId">SMS識別ID（メディア4U用）</param>
        /// <returns>送信成功可否</returns>
        public async Task<bool> SendSmsAsync(string phoneNumber, string message, int smsId)
        {
            try
            {
                _logger.LogInformation("メディア4U SMS送信開始: {PhoneNumber}, SmsId: {SmsId}", phoneNumber, smsId);

                // 開発環境でのSMS送信無効化チェック
                if (_configuration.GetValue<bool>("Development:DisableSms"))
                {
                    _logger.LogWarning("開発環境でSMS送信を無効化: {PhoneNumber}, メッセージ: {Message}", phoneNumber, message);
                    return true; // 開発モード - 実際は送信せずに成功をシミュレート
                }

                // 実際のSMS送信リクエスト実行
                return await SendSmsRequestAsync(smsId, phoneNumber, message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "メディア4U SMS送信中にエラーが発生: {PhoneNumber}, SmsId: {SmsId}", phoneNumber, smsId);
                return false;
            }
        }

        /// <summary>
        /// SMS認証用6桁認証コード生成
        /// 暗号学的に安全な乱数生成器を使用
        /// </summary>
        /// <returns>6桁の認証コード（例：123456）</returns>
        public string GenerateVerificationCode()
        {
            // 開発環境では固定認証コードを使用
            var fixedCode = _configuration.GetValue<string>("Development:FixedVerificationCode");
            if (!string.IsNullOrEmpty(fixedCode) && _configuration.GetValue<bool>("Development:DisableSms"))
            {
                _logger.LogInformation("開発環境固定認証コード使用: {Code}", fixedCode);
                return fixedCode;
            }

            // 暗号学的に安全な乱数生成器を使用
            using var rng = RandomNumberGenerator.Create();
            var bytes = new byte[4];
            rng.GetBytes(bytes);

            // 4バイトを整数に変換し、100万で割った余りを取得（0-999999）
            var number = Math.Abs(BitConverter.ToInt32(bytes, 0)) % 1000000;

            // 6桁0埋め形式で文字列化（例：000123）
            return number.ToString("D6");
        }

        /// <summary>
        /// 認証コードのハッシュ化
        /// BCryptアルゴリズムを使用してセキュアにハッシュ化
        /// </summary>
        /// <param name="code">平文の認証コード</param>
        /// <returns>BCryptでハッシュ化された認証コード</returns>
        public string HashCode(string code)
        {
            // BCryptでコスト値10のソルトを生成してハッシュ化
            return BCrypt.Net.BCrypt.HashPassword(code, BCrypt.Net.BCrypt.GenerateSalt(10));
        }

        /// <summary>
        /// 認証コードの検証
        /// 平文のコードとハッシュ化されたコードを比較
        /// </summary>
        /// <param name="code">ユーザー入力の平文認証コード</param>
        /// <param name="hashedCode">データベース保存のハッシュ化認証コード</param>
        /// <returns>認証成功可否</returns>
        public bool VerifyCode(string code, string hashedCode)
        {
            try
            {
                // BCryptによる認証コード照合
                return BCrypt.Net.BCrypt.Verify(code, hashedCode);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "コード検証中にエラーが発生");
                return false;
            }
        }

        /// <summary>
        /// メディア4U SMS API への実際のHTTPリクエスト送信処理
        /// Basic認証、form-data形式でのPOSTリクエストを実行
        /// </summary>
        /// <param name="smsId">SMS識別ID（メディア4Uでの管理用）</param>
        /// <param name="phoneNumber">送信先電話番号</param>
        /// <param name="oneTimePassword">認証用ワンタイムパスワード</param>
        /// <returns>送信成功可否</returns>
        private async Task<bool> SendSmsRequestAsync(int smsId, string phoneNumber, string oneTimePassword)
        {
            // HTTPクライアント作成（using文でリソース自動解放）
            using var httpClient = new HttpClient();

            try
            {
                // Basic認証ヘッダー設定
                // ユーザー名:パスワードをBase64エンコードして認証ヘッダーに設定
                var authValue = Convert.ToBase64String(Encoding.ASCII.GetBytes($"{_basicAuthUser}:{_basicAuthPassword}"));
                httpClient.DefaultRequestHeaders.Authorization =
                    new System.Net.Http.Headers.AuthenticationHeaderValue("Basic", authValue);

                // TLS1.2プロトコル設定（セキュリティ確保）
                ServicePointManager.SecurityProtocol = SecurityProtocolType.Tls12;

                // SMS送信メッセージ内容構築
                // 保育園アプリ用の定型フォーマット
                var message = $"パスコード:{oneTimePassword}{Environment.NewLine}" +
                             $"本人認証用のワンタイムパスワードのお知らせです。{Environment.NewLine}" +
                             $"※パスワードは１時間で無効になります。{Environment.NewLine}" +
                             $"発信元：保育園アプリ";

                // メディア4U API用のform-dataパラメータ作成
                var formContent = new FormUrlEncodedContent(new[]
                {
                    new KeyValuePair<string, string>("mobilenumber", phoneNumber),    // 送信先電話番号
                    new KeyValuePair<string, string>("mobilecareer", "b"),            // キャリア設定（b=全キャリア対応）
                    new KeyValuePair<string, string>("smstext", message),             // SMS本文
                    new KeyValuePair<string, string>("status", "1"),                 // 送信ステータス（1=送信）
                    new KeyValuePair<string, string>("smsid", smsId.ToString()),      // SMS識別ID
                    new KeyValuePair<string, string>("method", "2"),                 // 送信方法（2=SMS）
                    new KeyValuePair<string, string>("holdingtime", "60")           // 保持時間（分）
                });

                // メディア4U SMS API への非同期POSTリクエスト送信
                var response = await httpClient.PostAsync(_apiEndpoint, formContent);

                // レスポンス状態チェック
                if (response.StatusCode != HttpStatusCode.OK)
                {
                    // エラー時はレスポンス内容をログ出力
                    var content = await response.Content.ReadAsStringAsync();
                    _logger.LogError("メディア4U SMS送信失敗: StatusCode={StatusCode}, Content={Content}",
                                   response.StatusCode, content);
                    return false;
                }

                // 送信成功時のログ出力
                _logger.LogInformation("メディア4U SMS送信成功: {PhoneNumber}, SmsId: {SmsId}", phoneNumber, smsId);
                return true;
            }
            catch (Exception ex)
            {
                // API呼び出し例外時のエラーログ
                _logger.LogError(ex, "メディア4U SMS API呼び出しエラー: {PhoneNumber}, SmsId: {SmsId}", phoneNumber, smsId);
                return false;
            }
        }
    }
}
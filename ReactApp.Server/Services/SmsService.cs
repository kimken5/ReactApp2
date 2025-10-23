using Twilio;
using Twilio.Rest.Api.V2010.Account;
using BCrypt.Net;
using System.Security.Cryptography;

namespace ReactApp.Server.Services
{
    /// <summary>
    /// Twilio SMS通信サービス実装クラス
    /// Twilio APIを使用したSMS送信機能と認証コード生成・検証を提供
    /// 代替のSMS通信プロバイダー実装
    /// </summary>
    public class SmsService : ISmsService
    {
        // 依存サービスとTwilio設定
        private readonly IConfiguration _configuration;     // アプリケーション設定
        private readonly ILogger<SmsService> _logger;       // ログ出力サービス
        private readonly string _twilioAccountSid;          // Twilioアカウント識別子
        private readonly string _twilioAuthToken;           // Twilio認証トークン
        private readonly string _twilioFromNumber;          // SMS送信元電話番号

        /// <summary>
        /// SmsServiceコンストラクタ
        /// 設定ファイルからTwilio API認証情報を読み込み初期化
        /// </summary>
        /// <param name="configuration">アプリケーション設定</param>
        /// <param name="logger">ログ出力サービス</param>
        public SmsService(IConfiguration configuration, ILogger<SmsService> logger)
        {
            _configuration = configuration;
            _logger = logger;

            // Twilio API設定の読み込み（必須項目）
            _twilioAccountSid = _configuration["Twilio:AccountSid"] ?? throw new InvalidOperationException("Twilio AccountSid not configured");
            _twilioAuthToken = _configuration["Twilio:AuthToken"] ?? throw new InvalidOperationException("Twilio AuthToken not configured");
            _twilioFromNumber = _configuration["Twilio:FromNumber"] ?? throw new InvalidOperationException("Twilio FromNumber not configured");

            // Twilioクライアント初期化
            TwilioClient.Init(_twilioAccountSid, _twilioAuthToken);
        }

        public async Task<bool> SendSmsAsync(string phoneNumber, string message)
        {
            try
            {
                _logger.LogInformation("SMS送信開始: {PhoneNumber}", phoneNumber);

                // Development environment check
                if (_configuration.GetValue<bool>("Development:DisableSms"))
                {
                    _logger.LogWarning("開発環境でSMS送信を無効化: {PhoneNumber}, メッセージ: {Message}", phoneNumber, message);
                    return true; // Development mode - simulate success
                }

                var messageResource = await MessageResource.CreateAsync(
                    body: message,
                    from: new Twilio.Types.PhoneNumber(_twilioFromNumber),
                    to: new Twilio.Types.PhoneNumber(NormalizePhoneNumber(phoneNumber))
                );

                if (messageResource.Status == MessageResource.StatusEnum.Failed)
                {
                    _logger.LogError("SMS送信失敗: {PhoneNumber}, Status: {Status}, ErrorCode: {ErrorCode}, ErrorMessage: {ErrorMessage}",
                        phoneNumber, messageResource.Status, messageResource.ErrorCode, messageResource.ErrorMessage);
                    return false;
                }

                _logger.LogInformation("SMS送信成功: {PhoneNumber}, MessageSid: {MessageSid}", phoneNumber, messageResource.Sid);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "SMS送信中にエラーが発生: {PhoneNumber}", phoneNumber);
                return false;
            }
        }

        public string GenerateVerificationCode()
        {
            using var rng = RandomNumberGenerator.Create();
            var bytes = new byte[4];
            rng.GetBytes(bytes);
            var number = Math.Abs(BitConverter.ToInt32(bytes, 0)) % 1000000;
            return number.ToString("D6"); // 6桁0埋め
        }

        public string HashCode(string code)
        {
            return BCrypt.Net.BCrypt.HashPassword(code, BCrypt.Net.BCrypt.GenerateSalt(10));
        }

        public bool VerifyCode(string code, string hashedCode)
        {
            try
            {
                return BCrypt.Net.BCrypt.Verify(code, hashedCode);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "コード検証中にエラーが発生");
                return false;
            }
        }

        private string NormalizePhoneNumber(string phoneNumber)
        {
            // 日本の電話番号を国際形式に正規化
            phoneNumber = phoneNumber.Replace("-", "").Replace(" ", "");
            
            if (phoneNumber.StartsWith("0"))
            {
                phoneNumber = "+81" + phoneNumber[1..];
            }
            else if (!phoneNumber.StartsWith("+"))
            {
                phoneNumber = "+" + phoneNumber;
            }

            return phoneNumber;
        }
    }
}
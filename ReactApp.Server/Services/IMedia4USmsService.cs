namespace ReactApp.Server.Services
{
    /// <summary>
    /// メディア4U SMS認証サービスインターフェース
    /// </summary>
    public interface IMedia4USmsService
    {
        /// <summary>
        /// SMS送信（メディア4U API使用）
        /// </summary>
        /// <param name="phoneNumber">送信先電話番号</param>
        /// <param name="message">送信メッセージ</param>
        /// <param name="smsId">SMS ID（認証レコードID）</param>
        /// <returns>送信成功可否</returns>
        Task<bool> SendSmsAsync(string phoneNumber, string message, int smsId);

        /// <summary>
        /// 6桁認証コード生成
        /// </summary>
        /// <returns>6桁数字コード</returns>
        string GenerateVerificationCode();

        /// <summary>
        /// 認証コードハッシュ化
        /// </summary>
        /// <param name="code">プレーンテキストコード</param>
        /// <returns>ハッシュ化されたコード</returns>
        string HashCode(string code);

        /// <summary>
        /// 認証コード検証
        /// </summary>
        /// <param name="code">入力されたコード</param>
        /// <param name="hashedCode">保存されたハッシュコード</param>
        /// <returns>検証結果</returns>
        bool VerifyCode(string code, string hashedCode);
    }
}
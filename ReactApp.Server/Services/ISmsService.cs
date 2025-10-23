namespace ReactApp.Server.Services
{
    /// <summary>
    /// SMS通信サービスインターフェース
    /// SMS送信機能と認証コード生成・検証機能を提供
    /// 認証システムのSMS通信部分を抽象化
    /// </summary>
    public interface ISmsService
    {
        /// <summary>
        /// SMS送信処理
        /// 指定された電話番号にSMSメッセージを送信
        /// </summary>
        /// <param name="phoneNumber">送信先電話番号</param>
        /// <param name="message">送信するメッセージ内容</param>
        /// <returns>送信処理の成功可否</returns>
        Task<bool> SendSmsAsync(string phoneNumber, string message);

        /// <summary>
        /// 認証コード生成
        /// ランダムな数字による認証用コードを生成
        /// </summary>
        /// <returns>生成された認証コード文字列</returns>
        string GenerateVerificationCode();

        /// <summary>
        /// 認証コードハッシュ化
        /// 認証コードをセキュアにハッシュ化してデータベース保存用に変換
        /// </summary>
        /// <param name="code">プレーンテキストの認証コード</param>
        /// <returns>ハッシュ化された認証コード</returns>
        string HashCode(string code);

        /// <summary>
        /// 認証コード検証
        /// 入力された認証コードとハッシュ化済みコードを比較検証
        /// </summary>
        /// <param name="code">ユーザー入力の認証コード</param>
        /// <param name="hashedCode">データベース保存済みのハッシュ化コード</param>
        /// <returns>認証コード検証結果</returns>
        bool VerifyCode(string code, string hashedCode);
    }
}
namespace ReactApp.Server.DTOs
{
    /// <summary>
    /// 入退登録ログインレスポンスDTO
    /// ログイン成功時に返すデータ
    /// </summary>
    public class EntryExitLoginResponse
    {
        /// <summary>
        /// JWTトークン
        /// ハートビート・入退ログAPI呼び出し時に使用
        /// </summary>
        public string Token { get; set; } = string.Empty;

        /// <summary>
        /// 保育園ID
        /// </summary>
        public int NurseryId { get; set; }

        /// <summary>
        /// 保育園名
        /// 画面表示用
        /// </summary>
        public string NurseryName { get; set; } = string.Empty;

        /// <summary>
        /// トークン有効期限（JST）
        /// </summary>
        public DateTime ExpiresAt { get; set; }
    }
}

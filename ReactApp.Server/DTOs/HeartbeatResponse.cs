namespace ReactApp.Server.DTOs
{
    /// <summary>
    /// ハートビートレスポンスDTO
    /// ハートビート成功時に返す新しいトークン情報
    /// </summary>
    public class HeartbeatResponse
    {
        /// <summary>
        /// 新しいJWTトークン
        /// 有効期限が延長されたトークン
        /// </summary>
        public string Token { get; set; } = string.Empty;

        /// <summary>
        /// トークン有効期限（JST）
        /// </summary>
        public DateTime ExpiresAt { get; set; }
    }
}

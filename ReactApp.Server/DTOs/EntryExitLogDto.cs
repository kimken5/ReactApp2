namespace ReactApp.Server.DTOs
{
    /// <summary>
    /// 入退ログレスポンスDTO
    /// クライアントに返す入退ログ情報
    /// </summary>
    public class EntryExitLogDto
    {
        /// <summary>
        /// 入退ログID
        /// </summary>
        public int Id { get; set; }

        /// <summary>
        /// 保護者ID
        /// </summary>
        public int ParentId { get; set; }

        /// <summary>
        /// 保護者名
        /// </summary>
        public string ParentName { get; set; } = string.Empty;

        /// <summary>
        /// 保育園ID
        /// </summary>
        public int NurseryId { get; set; }

        /// <summary>
        /// 入退種別（Entry=入、Exit=出）
        /// </summary>
        public string EntryType { get; set; } = string.Empty;

        /// <summary>
        /// 入退時刻（JST）
        /// </summary>
        public DateTime Timestamp { get; set; }

        /// <summary>
        /// 関連園児名のリスト
        /// この保護者に紐づく園児の名前（カンマ区切り表示用）
        /// </summary>
        public List<string> ChildNames { get; set; } = new List<string>();

        /// <summary>
        /// レコード作成日時（JST）
        /// </summary>
        public DateTime CreatedAt { get; set; }
    }
}

namespace ReactApp.Server.DTOs
{
    /// <summary>
    /// 日報フィルタDTO
    /// デスクトップアプリの日報検索フィルタ条件
    /// </summary>
    public class DailyReportFilterDto
    {
        /// <summary>
        /// 園児ID（任意）
        /// </summary>
        public int? ChildId { get; set; }

        /// <summary>
        /// クラスID（任意）
        /// </summary>
        public string? ClassId { get; set; }

        /// <summary>
        /// 職員ID（任意）
        /// </summary>
        public int? StaffId { get; set; }

        /// <summary>
        /// 日付範囲の開始日（任意）
        /// </summary>
        public DateTime? StartDate { get; set; }

        /// <summary>
        /// 日付範囲の終了日（任意）
        /// </summary>
        public DateTime? EndDate { get; set; }

        /// <summary>
        /// カテゴリ（任意）
        /// </summary>
        public string? Category { get; set; }

        /// <summary>
        /// ステータス（任意）
        /// "draft", "published", "archived"
        /// </summary>
        public string? Status { get; set; }

        /// <summary>
        /// 保護者確認済みフィルタ（任意）
        /// </summary>
        public bool? ParentAcknowledged { get; set; }

        /// <summary>
        /// キーワード検索（任意）
        /// タイトルまたは内容を検索
        /// </summary>
        public string? Keyword { get; set; }
    }
}

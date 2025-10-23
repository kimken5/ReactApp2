namespace ReactApp.Server.DTOs
{
    /// <summary>
    /// ページネーション要求DTO
    /// 大量データの効率的な取得とパフォーマンス最適化のため
    /// </summary>
    public class PaginationRequest
    {
        /// <summary>
        /// ページ番号（1から開始）
        /// </summary>
        public int Page { get; set; } = 1;

        /// <summary>
        /// 1ページあたりの件数（最大100件）
        /// </summary>
        public int PageSize { get; set; } = 20;

        /// <summary>
        /// ソートフィールド
        /// </summary>
        public string? SortBy { get; set; }

        /// <summary>
        /// ソート方向（asc/desc）
        /// </summary>
        public string SortDirection { get; set; } = "desc";

        /// <summary>
        /// 検索キーワード
        /// </summary>
        public string? Search { get; set; }

        /// <summary>
        /// 追加フィルター
        /// </summary>
        public Dictionary<string, object>? Filters { get; set; }

        /// <summary>
        /// 有効なページサイズに正規化
        /// </summary>
        public int GetValidPageSize()
        {
            return Math.Min(Math.Max(PageSize, 1), 100);
        }

        /// <summary>
        /// スキップ件数を計算
        /// </summary>
        public int GetSkip()
        {
            return (Math.Max(Page, 1) - 1) * GetValidPageSize();
        }
    }

    /// <summary>
    /// ページネーション結果DTO
    /// </summary>
    public class PaginatedResult<T>
    {
        /// <summary>
        /// データ一覧
        /// </summary>
        public IEnumerable<T> Items { get; set; } = new List<T>();

        /// <summary>
        /// 総件数
        /// </summary>
        public int TotalCount { get; set; }

        /// <summary>
        /// 現在のページ
        /// </summary>
        public int CurrentPage { get; set; }

        /// <summary>
        /// 1ページあたりの件数
        /// </summary>
        public int PageSize { get; set; }

        /// <summary>
        /// 総ページ数
        /// </summary>
        public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);

        /// <summary>
        /// 前のページがあるか
        /// </summary>
        public bool HasPreviousPage => CurrentPage > 1;

        /// <summary>
        /// 次のページがあるか
        /// </summary>
        public bool HasNextPage => CurrentPage < TotalPages;

        /// <summary>
        /// ページネーション情報
        /// </summary>
        public PaginationInfo Pagination => new()
        {
            CurrentPage = CurrentPage,
            TotalPages = TotalPages,
            PageSize = PageSize,
            TotalCount = TotalCount,
            HasPreviousPage = HasPreviousPage,
            HasNextPage = HasNextPage
        };
    }

    /// <summary>
    /// ページネーション情報
    /// </summary>
    public class PaginationInfo
    {
        public int CurrentPage { get; set; }
        public int TotalPages { get; set; }
        public int PageSize { get; set; }
        public int TotalCount { get; set; }
        public bool HasPreviousPage { get; set; }
        public bool HasNextPage { get; set; }
    }
}
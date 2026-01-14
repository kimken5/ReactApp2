using ReactApp.Server.DTOs;

namespace ReactApp.Server.Services
{
    /// <summary>
    /// 入退管理サービスインターフェース
    /// 入退ログのCRUD操作を提供
    /// </summary>
    public interface IEntryExitService
    {
        /// <summary>
        /// 入退ログを作成
        /// </summary>
        /// <param name="request">入退ログ作成リクエスト</param>
        /// <returns>作成された入退ログDTO</returns>
        Task<EntryExitLogDto> CreateLogAsync(CreateEntryExitLogRequest request);

        /// <summary>
        /// 入退ログ一覧を取得（ページネーション、フィルター付き）
        /// </summary>
        /// <param name="nurseryId">保育園ID</param>
        /// <param name="fromDate">開始日（任意）</param>
        /// <param name="toDate">終了日（任意）</param>
        /// <param name="parentName">保護者名（部分一致、任意）</param>
        /// <param name="entryType">入退種別（任意、"Entry" or "Exit"）</param>
        /// <param name="page">ページ番号（1から開始）</param>
        /// <param name="pageSize">1ページあたりの件数</param>
        /// <returns>入退ログリストと総件数</returns>
        Task<(List<EntryExitLogDto> Logs, int TotalCount)> GetLogsAsync(
            int nurseryId,
            DateTime? fromDate = null,
            DateTime? toDate = null,
            string? parentName = null,
            string? entryType = null,
            int page = 1,
            int pageSize = 50);

        /// <summary>
        /// 特定日付の入退ログを取得（出欠管理画面用）
        /// </summary>
        /// <param name="nurseryId">保育園ID</param>
        /// <param name="date">対象日付</param>
        /// <returns>入退ログリスト</returns>
        Task<List<EntryExitLogDto>> GetLogsByDateAsync(int nurseryId, DateTime date);

        /// <summary>
        /// 入退ログを削除
        /// </summary>
        /// <param name="logId">入退ログID</param>
        /// <param name="nurseryId">保育園ID（権限チェック用）</param>
        Task DeleteLogAsync(int logId, int nurseryId);

        /// <summary>
        /// 保護者IDから関連園児名を取得
        /// </summary>
        /// <param name="parentId">保護者ID</param>
        /// <returns>園児名のリスト</returns>
        Task<List<string>> GetChildNamesByParentIdAsync(int parentId);
    }
}

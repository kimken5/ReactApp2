using ReactApp.Server.DTOs.Desktop;

namespace ReactApp.Server.Services
{
    /// <summary>
    /// デスクトップアプリ用日報管理サービスインターフェース
    /// 日報の作成、更新、削除、公開、フィルタ検索機能を提供
    /// </summary>
    public interface IDesktopDailyReportService
    {
        /// <summary>
        /// 日報一覧取得（フィルタ対応）
        /// </summary>
        /// <param name="nurseryId">保育園ID</param>
        /// <param name="filter">フィルタ条件</param>
        /// <returns>日報一覧</returns>
        Task<List<DailyReportDto>> GetDailyReportsAsync(int nurseryId, DailyReportFilterDto filter);

        /// <summary>
        /// 日報詳細取得
        /// </summary>
        /// <param name="nurseryId">保育園ID</param>
        /// <param name="reportId">日報ID</param>
        /// <returns>日報詳細、存在しない場合はnull</returns>
        Task<DailyReportDto?> GetDailyReportByIdAsync(int nurseryId, int reportId);

        /// <summary>
        /// 日報作成
        /// </summary>
        /// <param name="nurseryId">保育園ID</param>
        /// <param name="request">日報作成リクエスト</param>
        /// <returns>作成された日報</returns>
        Task<DailyReportDto> CreateDailyReportAsync(int nurseryId, CreateDailyReportRequestDto request);

        /// <summary>
        /// 日報更新
        /// </summary>
        /// <param name="nurseryId">保育園ID</param>
        /// <param name="reportId">日報ID</param>
        /// <param name="request">日報更新リクエスト</param>
        /// <returns>更新された日報</returns>
        Task<DailyReportDto> UpdateDailyReportAsync(int nurseryId, int reportId, UpdateDailyReportRequestDto request);

        /// <summary>
        /// 日報削除
        /// </summary>
        /// <param name="nurseryId">保育園ID</param>
        /// <param name="reportId">日報ID</param>
        /// <exception cref="InvalidOperationException">Publishedステータスの日報は削除不可</exception>
        Task DeleteDailyReportAsync(int nurseryId, int reportId);

        /// <summary>
        /// 日報公開
        /// </summary>
        /// <param name="nurseryId">保育園ID</param>
        /// <param name="reportId">日報ID</param>
        /// <returns>公開された日報</returns>
        Task<DailyReportDto> PublishDailyReportAsync(int nurseryId, int reportId);

        /// <summary>
        /// 下書き日報一覧取得（職員別）
        /// </summary>
        /// <param name="nurseryId">保育園ID</param>
        /// <param name="staffId">職員ID</param>
        /// <returns>下書き日報一覧</returns>
        Task<List<DailyReportDto>> GetDraftReportsAsync(int nurseryId, int staffId);

        /// <summary>
        /// 日付別日報一覧取得
        /// </summary>
        /// <param name="nurseryId">保育園ID</param>
        /// <param name="date">日付</param>
        /// <returns>指定日の日報一覧</returns>
        Task<List<DailyReportDto>> GetReportsByDateAsync(int nurseryId, DateTime date);
    }
}

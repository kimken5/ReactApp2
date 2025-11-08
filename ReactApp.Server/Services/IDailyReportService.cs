using ReactApp.Server.DTOs;

namespace ReactApp.Server.Services
{
    /// <summary>
    /// 日報管理サービスインターフェース
    /// 園児の日々の活動記録・保護者への情報共有機能を提供
    /// 作成・更新・公開・アーカイブの全ライフサイクル管理
    /// </summary>
    public interface IDailyReportService
    {
        /// <summary>
        /// 特定園児の日報一覧取得
        /// </summary>
        /// <param name="childId">園児ID</param>
        /// <returns>該当園児の日報一覧</returns>
        Task<IEnumerable<DailyReportDto>> GetReportsByChildIdAsync(int childId);

        /// <summary>
        /// 特定日付の日報一覧取得
        /// </summary>
        /// <param name="date">検索対象日付</param>
        /// <returns>該当日付の日報一覧</returns>
        Task<IEnumerable<DailyReportDto>> GetReportsByDateAsync(DateTime date);

        /// <summary>
        /// 特定スタッフ作成の日報一覧取得
        /// </summary>
        /// <param name="staffId">スタッフID</param>
        /// <returns>該当スタッフの作成日報一覧</returns>
        Task<IEnumerable<DailyReportDto>> GetReportsByStaffIdAsync(int staffId);

        /// <summary>
        /// 特定レポート種別の日報一覧取得
        /// </summary>
        /// <param name="reportKind">レポート種別</param>
        /// <returns>該当レポート種別の日報一覧</returns>
        Task<IEnumerable<DailyReportDto>> GetReportsByReportKindAsync(string reportKind);

        /// <summary>
        /// 公開済み日報一覧取得
        /// </summary>
        /// <param name="parentId">保護者ID</param>
        /// <returns>公開状態の日報一覧</returns>
        Task<IEnumerable<DailyReportDto>> GetPublishedReportsAsync(int parentId);

        /// <summary>
        /// 特定ID日報の詳細取得
        /// </summary>
        /// <param name="id">日報ID</param>
        /// <returns>日報詳細情報（見つからない場合はnull）</returns>
        Task<DailyReportDto?> GetReportByIdAsync(int id);

        /// <summary>
        /// 新規日報作成
        /// </summary>
        /// <param name="dto">日報作成データ</param>
        /// <param name="staffId">作成スタッフID</param>
        /// <returns>作成された日報情報</returns>
        Task<DailyReportDto> CreateReportAsync(CreateDailyReportDto dto, int staffId);

        /// <summary>
        /// 日報内容更新
        /// </summary>
        /// <param name="id">日報ID</param>
        /// <param name="dto">更新データ</param>
        /// <returns>更新処理の成功可否</returns>
        Task<bool> UpdateReportAsync(int id, UpdateDailyReportDto dto);

        /// <summary>
        /// 日報公開処理
        /// </summary>
        /// <param name="id">日報ID</param>
        /// <returns>公開処理の成功可否</returns>
        Task<bool> PublishReportAsync(int id);

        /// <summary>
        /// 日報アーカイブ処理
        /// </summary>
        /// <param name="id">日報ID</param>
        /// <returns>アーカイブ処理の成功可否</returns>
        Task<bool> ArchiveReportAsync(int id);

        /// <summary>
        /// 日報削除処理
        /// </summary>
        /// <param name="id">日報ID</param>
        /// <returns>削除処理の成功可否</returns>
        Task<bool> DeleteReportAsync(int id);

        /// <summary>
        /// 日報への保護者コメント追加
        /// </summary>
        /// <param name="dto">コメント作成データ</param>
        /// <param name="parentId">保護者ID</param>
        /// <returns>コメント追加の成功可否</returns>
        Task<bool> AddResponseAsync(CreateDailyReportResponseDto dto, int parentId);

        /// <summary>
        /// 日報既読マーク設定
        /// </summary>
        /// <param name="reportId">日報ID</param>
        /// <param name="parentId">保護者ID</param>
        /// <returns>既読マーク設定の成功可否</returns>
        Task<bool> MarkReportAsReadAsync(int reportId, int parentId);
    }
}
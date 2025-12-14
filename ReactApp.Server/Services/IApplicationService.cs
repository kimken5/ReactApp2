using ReactApp.Server.DTOs.Desktop;
using ReactApp.Server.DTOs;

namespace ReactApp.Server.Services
{
    /// <summary>
    /// 入園申込管理サービスインターフェース
    /// </summary>
    public interface IApplicationService
    {
        /// <summary>
        /// ApplicationKey検証
        /// </summary>
        /// <param name="applicationKey">申込キー</param>
        /// <returns>検証結果</returns>
        Task<ValidateApplicationKeyResult> ValidateApplicationKeyAsync(string applicationKey);

        /// <summary>
        /// 入園申込作成（保護者向けWeb申込）
        /// 複数園児対応（Children配列で最大4人まで）
        /// </summary>
        /// <param name="request">申込情報</param>
        /// <param name="applicationKey">申込キー</param>
        /// <returns>作成された申込IDリストとメッセージ</returns>
        Task<CreateApplicationResponse> CreateApplicationAsync(CreateApplicationRequest request, string applicationKey);

        /// <summary>
        /// 入園申込一覧取得（デスクトップアプリ）
        /// </summary>
        /// <param name="nurseryId">保育園ID</param>
        /// <param name="status">申込状態フィルター（オプション）</param>
        /// <param name="startDate">申込開始日フィルター（オプション）</param>
        /// <param name="endDate">申込終了日フィルター（オプション）</param>
        /// <param name="page">ページ番号</param>
        /// <param name="pageSize">1ページあたりの件数</param>
        /// <returns>ページネーション済み申込一覧</returns>
        Task<PaginatedResult<ApplicationListItemDto>> GetApplicationListAsync(
            int nurseryId,
            string? status = null,
            DateTime? startDate = null,
            DateTime? endDate = null,
            int page = 1,
            int pageSize = 20);

        /// <summary>
        /// 入園申込詳細取得（デスクトップアプリ）
        /// </summary>
        /// <param name="id">申込ID</param>
        /// <param name="nurseryId">保育園ID</param>
        /// <returns>申込詳細情報</returns>
        Task<ApplicationWorkDto?> GetApplicationDetailAsync(int id, int nurseryId);

        /// <summary>
        /// 入園申込取込（デスクトップアプリ）
        /// </summary>
        /// <param name="id">申込ID</param>
        /// <param name="nurseryId">保育園ID</param>
        /// <param name="request">取込リクエスト</param>
        /// <param name="userId">取込実行ユーザーID</param>
        /// <returns>取込結果</returns>
        Task<ImportApplicationResult> ImportApplicationAsync(
            int id,
            int nurseryId,
            ImportApplicationRequest request,
            int userId);

        /// <summary>
        /// 入園申込却下（デスクトップアプリ）
        /// </summary>
        /// <param name="id">申込ID</param>
        /// <param name="nurseryId">保育園ID</param>
        /// <param name="request">却下リクエスト</param>
        /// <returns>処理成功・失敗</returns>
        Task RejectApplicationAsync(int id, int nurseryId, RejectApplicationRequest request);
    }
}

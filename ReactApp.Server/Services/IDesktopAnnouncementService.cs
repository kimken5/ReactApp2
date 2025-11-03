using ReactApp.Server.DTOs;

namespace ReactApp.Server.Services
{
    /// <summary>
    /// デスクトップアプリ用お知らせ管理サービスインターフェース
    /// お知らせのCRUD操作、公開、配信状況確認機能を提供
    /// </summary>
    public interface IDesktopAnnouncementService
    {
        /// <summary>
        /// お知らせ一覧を取得（フィルタ対応）
        /// </summary>
        /// <param name="nurseryId">保育園ID</param>
        /// <param name="filter">フィルタ条件</param>
        /// <returns>お知らせ一覧</returns>
        Task<List<AnnouncementDto>> GetAnnouncementsAsync(int nurseryId, AnnouncementFilterDto? filter = null);

        /// <summary>
        /// お知らせ詳細を取得
        /// </summary>
        /// <param name="nurseryId">保育園ID</param>
        /// <param name="announcementId">お知らせID</param>
        /// <returns>お知らせ詳細（存在しない場合はnull）</returns>
        Task<AnnouncementDto?> GetAnnouncementByIdAsync(int nurseryId, int announcementId);

        /// <summary>
        /// お知らせを作成
        /// </summary>
        /// <param name="nurseryId">保育園ID</param>
        /// <param name="staffId">作成者のスタッフID</param>
        /// <param name="request">作成リクエスト</param>
        /// <returns>作成されたお知らせ</returns>
        Task<AnnouncementDto> CreateAnnouncementAsync(int nurseryId, int staffId, CreateAnnouncementDto request);

        /// <summary>
        /// お知らせを更新
        /// </summary>
        /// <param name="nurseryId">保育園ID</param>
        /// <param name="announcementId">お知らせID</param>
        /// <param name="request">更新リクエスト</param>
        /// <returns>更新されたお知らせ</returns>
        Task<AnnouncementDto> UpdateAnnouncementAsync(int nurseryId, int announcementId, UpdateAnnouncementDto request);

        /// <summary>
        /// お知らせを削除
        /// </summary>
        /// <param name="nurseryId">保育園ID</param>
        /// <param name="announcementId">お知らせID</param>
        Task DeleteAnnouncementAsync(int nurseryId, int announcementId);

        /// <summary>
        /// お知らせを即時公開
        /// </summary>
        /// <param name="nurseryId">保育園ID</param>
        /// <param name="announcementId">お知らせID</param>
        /// <returns>公開されたお知らせ</returns>
        Task<AnnouncementDto> PublishAnnouncementAsync(int nurseryId, int announcementId);

        /// <summary>
        /// 未読保護者リストを取得
        /// </summary>
        /// <param name="nurseryId">保育園ID</param>
        /// <param name="announcementId">お知らせID</param>
        /// <returns>未読保護者一覧</returns>
        Task<List<UnreadParentDto>> GetUnreadParentsAsync(int nurseryId, int announcementId);

        /// <summary>
        /// 既読保護者リストを取得
        /// </summary>
        /// <param name="nurseryId">保育園ID</param>
        /// <param name="announcementId">お知らせID</param>
        /// <returns>既読保護者一覧</returns>
        Task<List<ReadParentDto>> GetReadParentsAsync(int nurseryId, int announcementId);
    }

    /// <summary>
    /// お知らせフィルターDTO
    /// </summary>
    public class AnnouncementFilterDto
    {
        public string? Category { get; set; }
        public string? Priority { get; set; }
        public string? TargetAudience { get; set; }
        public string? Status { get; set; }
        public string? StartDate { get; set; }
        public string? EndDate { get; set; }
        public string? SearchKeyword { get; set; }
    }

    /// <summary>
    /// 未読保護者情報DTO
    /// </summary>
    public class UnreadParentDto
    {
        public int ParentId { get; set; }
        public string ParentName { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string ChildName { get; set; } = string.Empty;
        public string ClassName { get; set; } = string.Empty;
    }

    /// <summary>
    /// 既読保護者情報DTO
    /// </summary>
    public class ReadParentDto
    {
        public int ParentId { get; set; }
        public string ParentName { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string ChildName { get; set; } = string.Empty;
        public string ClassName { get; set; } = string.Empty;
        public DateTime ReadAt { get; set; }
    }
}

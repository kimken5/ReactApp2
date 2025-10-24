using ReactApp.Server.DTOs.Desktop;

namespace ReactApp.Server.Services
{
    /// <summary>
    /// デスクトップアプリ用写真管理サービスインターフェース
    /// 写真のCRUD操作、フィルタ検索、園児・クラス別取得機能を提供
    /// </summary>
    public interface IDesktopPhotoService
    {
        /// <summary>
        /// 写真一覧取得（フィルタ対応）
        /// </summary>
        /// <param name="nurseryId">保育園ID</param>
        /// <param name="filter">フィルタ条件</param>
        /// <returns>写真一覧</returns>
        Task<List<PhotoDto>> GetPhotosAsync(int nurseryId, PhotoFilterDto filter);

        /// <summary>
        /// 写真詳細取得
        /// </summary>
        /// <param name="nurseryId">保育園ID</param>
        /// <param name="photoId">写真ID</param>
        /// <returns>写真詳細（存在しない場合はnull）</returns>
        Task<PhotoDto?> GetPhotoByIdAsync(int nurseryId, int photoId);

        /// <summary>
        /// 写真アップロード
        /// </summary>
        /// <param name="nurseryId">保育園ID</param>
        /// <param name="request">アップロードリクエスト</param>
        /// <returns>アップロードされた写真情報</returns>
        Task<PhotoDto> UploadPhotoAsync(int nurseryId, UploadPhotoRequestDto request);

        /// <summary>
        /// 写真メタデータ更新
        /// </summary>
        /// <param name="nurseryId">保育園ID</param>
        /// <param name="photoId">写真ID</param>
        /// <param name="request">更新リクエスト</param>
        /// <returns>更新後の写真情報</returns>
        Task<PhotoDto> UpdatePhotoAsync(int nurseryId, int photoId, UpdatePhotoRequestDto request);

        /// <summary>
        /// 写真削除
        /// </summary>
        /// <param name="nurseryId">保育園ID</param>
        /// <param name="photoId">写真ID</param>
        /// <returns>削除成功フラグ</returns>
        Task DeletePhotoAsync(int nurseryId, int photoId);

        /// <summary>
        /// 園児別写真一覧取得
        /// </summary>
        /// <param name="nurseryId">保育園ID</param>
        /// <param name="childId">園児ID</param>
        /// <returns>写真一覧</returns>
        Task<List<PhotoDto>> GetPhotosByChildAsync(int nurseryId, int childId);

        /// <summary>
        /// クラス別写真一覧取得
        /// </summary>
        /// <param name="nurseryId">保育園ID</param>
        /// <param name="classId">クラスID</param>
        /// <returns>写真一覧</returns>
        Task<List<PhotoDto>> GetPhotosByClassAsync(int nurseryId, string classId);
    }
}

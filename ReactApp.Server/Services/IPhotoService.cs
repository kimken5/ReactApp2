using ReactApp.Server.DTOs;

namespace ReactApp.Server.Services
{
    /// <summary>
    /// 写真管理サービスインターフェース
    /// 写真アップロード・ギャラリー表示・アクセス制御機能を提供
    /// 保護者同意管理とセキュアな写真共有を実現
    /// </summary>
    public interface IPhotoService
    {
        // 写真管理機能
        /// <summary>
        /// 写真アップロード処理
        /// </summary>
        /// <param name="nurseryId">保育園ID</param>
        /// <param name="staffId">アップロード実行スタッフID</param>
        /// <param name="dto">写真アップロードデータ</param>
        /// <returns>アップロードされた写真情報</returns>
        Task<PhotoDto> UploadPhotoAsync(int nurseryId, int staffId, PhotoUploadDto dto);

        /// <summary>
        /// 保護者用写真ギャラリー取得
        /// </summary>
        /// <param name="parentId">保護者ID</param>
        /// <param name="searchDto">検索・フィルタ条件</param>
        /// <returns>ギャラリー表示用写真一覧</returns>
        Task<PhotoGalleryResponseDto> GetPhotosAsync(int parentId, PhotoSearchDto searchDto);

        /// <summary>
        /// 特定写真の詳細取得
        /// </summary>
        /// <param name="photoId">写真ID</param>
        /// <param name="parentId">アクセス者の保護者ID</param>
        /// <returns>写真詳細情報（権限なしまたは見つからない場合はnull）</returns>
        Task<PhotoDto?> GetPhotoByIdAsync(int photoId, int parentId);

        /// <summary>
        /// 写真情報更新
        /// </summary>
        /// <param name="photoId">写真ID</param>
        /// <param name="nurseryId">保育園ID</param>
        /// <param name="staffId">更新実行スタッフID</param>
        /// <param name="dto">更新データ</param>
        /// <returns>更新処理の成功可否</returns>
        Task<bool> UpdatePhotoAsync(int photoId, int nurseryId, int staffId, UpdatePhotoDto dto);

        /// <summary>
        /// 写真削除処理
        /// </summary>
        /// <param name="photoId">写真ID</param>
        /// <param name="nurseryId">保育園ID</param>
        /// <param name="staffId">削除実行スタッフID</param>
        /// <returns>削除処理の成功可否</returns>
        Task<bool> DeletePhotoAsync(int photoId, int nurseryId, int staffId);

        /// <summary>
        /// 写真アーカイブ処理
        /// </summary>
        /// <param name="photoId">写真ID</param>
        /// <param name="nurseryId">保育園ID</param>
        /// <param name="staffId">アーカイブ実行スタッフID</param>
        /// <returns>アーカイブ処理の成功可否</returns>
        Task<bool> ArchivePhotoAsync(int photoId, int nurseryId, int staffId);

        // 写真アクセス制御機能
        /// <summary>
        /// 保護者の写真閲覧権限チェック
        /// </summary>
        /// <param name="parentId">保護者ID</param>
        /// <param name="photoId">写真ID</param>
        /// <returns>閲覧権限の有無</returns>
        Task<bool> CanParentViewPhotoAsync(int parentId, int photoId);

        /// <summary>
        /// 保護者の写真ダウンロード権限チェック
        /// </summary>
        /// <param name="parentId">保護者ID</param>
        /// <param name="photoId">写真ID</param>
        /// <returns>ダウンロード権限の有無</returns>
        Task<bool> CanParentDownloadPhotoAsync(int parentId, int photoId);

        /// <summary>
        /// 写真ファイルストリーム取得
        /// </summary>
        /// <param name="photoId">写真ID</param>
        /// <param name="parentId">アクセス者の保護者ID</param>
        /// <returns>写真ファイルストリーム（権限なしの場合はnull）</returns>
        Task<Stream?> GetPhotoStreamAsync(int photoId, int parentId);

        /// <summary>
        /// サムネイルストリーム取得
        /// </summary>
        /// <param name="photoId">写真ID</param>
        /// <param name="parentId">アクセス者の保護者ID</param>
        /// <returns>サムネイルストリーム（権限なしの場合はnull）</returns>
        Task<Stream?> GetThumbnailStreamAsync(int photoId, int parentId);

        /// <summary>
        /// 写真アクセスログ記録
        /// </summary>
        /// <param name="photoId">写真ID</param>
        /// <param name="parentId">アクセス者の保護者ID</param>
        /// <param name="accessType">アクセス種別</param>
        /// <param name="ipAddress">IPアドレス（任意）</param>
        /// <param name="userAgent">ユーザーエージェント（任意）</param>
        /// <returns>ログ記録の成功可否</returns>
        Task<bool> LogPhotoAccessAsync(int photoId, int parentId, string accessType, string? ipAddress, string? userAgent);

        // 写真同意管理機能
        /// <summary>
        /// 保護者の写真同意状況取得
        /// </summary>
        /// <param name="parentId">保護者ID</param>
        /// <returns>該当保護者の写真同意一覧</returns>
        Task<IEnumerable<PhotoConsentDto>> GetPhotoConsentsAsync(int parentId);

        /// <summary>
        /// 特定写真の未同意一覧取得
        /// </summary>
        /// <param name="photoId">写真ID</param>
        /// <returns>該当写真の未同意一覧</returns>
        Task<IEnumerable<PhotoConsentDto>> GetPendingConsentsForPhotoAsync(int photoId);

        /// <summary>
        /// 写真同意状況更新
        /// </summary>
        /// <param name="consentId">同意ID</param>
        /// <param name="parentId">保護者ID</param>
        /// <param name="dto">同意更新データ</param>
        /// <returns>更新処理の成功可否</returns>
        Task<bool> UpdatePhotoConsentAsync(int consentId, int parentId, UpdatePhotoConsentDto dto);

        /// <summary>
        /// 写真同意リクエスト送信
        /// </summary>
        /// <param name="photoId">写真ID</param>
        /// <param name="childId">園児ID</param>
        /// <param name="parentId">保護者ID</param>
        /// <returns>リクエスト送信の成功可否</returns>
        Task<bool> RequestPhotoConsentAsync(int photoId, int childId, int parentId);

        // 写真統計機能
        /// <summary>
        /// 写真統計情報取得
        /// </summary>
        /// <param name="staffId">スタッフID（特定スタッフの統計の場合）</param>
        /// <returns>写真統計データ</returns>
        Task<PhotoStatsDto> GetPhotoStatsAsync(int? staffId = null);

        /// <summary>
        /// 写真アクセスログ一覧取得
        /// </summary>
        /// <param name="photoId">写真ID</param>
        /// <returns>該当写真のアクセスログ一覧</returns>
        Task<IEnumerable<PhotoAccessDto>> GetPhotoAccessLogsAsync(int photoId);

        // ファイル管理機能
        /// <summary>
        /// 写真サムネイル生成処理
        /// </summary>
        /// <param name="photoId">写真ID</param>
        /// <returns>サムネイル生成の成功可否</returns>
        Task<bool> ProcessPhotoThumbnailAsync(int photoId);

        /// <summary>
        /// アップロードファイルのバリデーション
        /// </summary>
        /// <param name="file">アップロード対象ファイル</param>
        /// <returns>ファイルの妥当性</returns>
        Task<bool> ValidatePhotoFileAsync(IFormFile file);

        /// <summary>
        /// 一意ファイル名生成
        /// </summary>
        /// <param name="originalFileName">元のファイル名</param>
        /// <returns>一意なファイル名</returns>
        Task<string> GenerateUniqueFileNameAsync(string originalFileName);

        /// <summary>
        /// 写真ファイル削除処理
        /// </summary>
        /// <param name="photoId">写真ID</param>
        /// <returns>ファイル削除の成功可否</returns>
        Task<bool> DeletePhotoFilesAsync(int photoId);
    }
}
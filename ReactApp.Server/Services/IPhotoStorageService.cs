using Microsoft.AspNetCore.Http;

namespace ReactApp.Server.Services
{
    /// <summary>
    /// 写真ストレージサービスインターフェース
    /// 写真ファイルの保存、取得、削除を抽象化
    /// ローカルファイルシステムとAzure Blob Storageの両方に対応
    /// </summary>
    public interface IPhotoStorageService
    {
        /// <summary>
        /// 写真ファイルをアップロードする
        /// </summary>
        /// <param name="file">アップロードするファイル</param>
        /// <param name="fileName">保存するファイル名</param>
        /// <param name="isOriginal">オリジナル写真かサムネイルか</param>
        /// <returns>保存されたファイルのURL</returns>
        Task<string> UploadPhotoAsync(IFormFile file, string fileName, bool isOriginal = true);

        /// <summary>
        /// 画像データ（バイト配列）をアップロードする
        /// </summary>
        /// <param name="imageData">画像データ</param>
        /// <param name="fileName">保存するファイル名</param>
        /// <param name="contentType">ファイルのMIMEタイプ</param>
        /// <param name="isOriginal">オリジナル写真かサムネイルか</param>
        /// <returns>保存されたファイルのURL</returns>
        Task<string> UploadPhotoAsync(byte[] imageData, string fileName, string contentType, bool isOriginal = true);

        /// <summary>
        /// 写真ファイルのストリームを取得する
        /// </summary>
        /// <param name="fileName">ファイル名</param>
        /// <param name="isOriginal">オリジナル写真かサムネイルか</param>
        /// <returns>ファイルストリーム</returns>
        Task<Stream?> GetPhotoStreamAsync(string fileName, bool isOriginal = true);

        /// <summary>
        /// 写真ファイルを削除する
        /// </summary>
        /// <param name="fileName">削除するファイル名</param>
        /// <param name="isOriginal">オリジナル写真かサムネイルか</param>
        /// <returns>削除成功フラグ</returns>
        Task<bool> DeletePhotoAsync(string fileName, bool isOriginal = true);

        /// <summary>
        /// 写真ファイルが存在するかチェックする
        /// </summary>
        /// <param name="fileName">ファイル名</param>
        /// <param name="isOriginal">オリジナル写真かサムネイルか</param>
        /// <returns>存在フラグ</returns>
        Task<bool> ExistsAsync(string fileName, bool isOriginal = true);

        /// <summary>
        /// 写真の公開URLを取得する
        /// </summary>
        /// <param name="fileName">ファイル名</param>
        /// <param name="isOriginal">オリジナル写真かサムネイルか</param>
        /// <returns>公開URL</returns>
        string GetPhotoUrl(string fileName, bool isOriginal = true);

        /// <summary>
        /// サムネイル用の一時的なSAS URLを生成する（Azure Blob Storage用）
        /// </summary>
        /// <param name="fileName">ファイル名</param>
        /// <param name="expiresInMinutes">有効期限（分）</param>
        /// <returns>SAS URL</returns>
        Task<string?> GenerateSasUrlAsync(string fileName, int expiresInMinutes = 60);
    }
}
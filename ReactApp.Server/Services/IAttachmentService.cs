namespace ReactApp.Server.Services
{
    /// <summary>
    /// 添付ファイル管理サービスインターフェース
    /// お知らせや日報などの添付ファイルのアップロード・取得・削除機能を提供
    /// </summary>
    public interface IAttachmentService
    {
        /// <summary>
        /// 添付ファイルアップロード処理
        /// </summary>
        /// <param name="file">アップロード対象ファイル</param>
        /// <param name="fileName">保存ファイル名</param>
        /// <returns>アップロードされたファイルのURL</returns>
        Task<string> UploadAttachmentAsync(IFormFile file, string fileName);

        /// <summary>
        /// 添付ファイルバイナリデータアップロード処理
        /// </summary>
        /// <param name="fileData">ファイルバイナリデータ</param>
        /// <param name="fileName">保存ファイル名</param>
        /// <param name="contentType">コンテンツタイプ</param>
        /// <returns>アップロードされたファイルのURL</returns>
        Task<string> UploadAttachmentAsync(byte[] fileData, string fileName, string contentType);

        /// <summary>
        /// 添付ファイル取得
        /// </summary>
        /// <param name="fileName">ファイル名</param>
        /// <returns>ファイルURL</returns>
        string GetAttachmentUrl(string fileName);

        /// <summary>
        /// 添付ファイル削除処理
        /// </summary>
        /// <param name="fileName">削除対象ファイル名</param>
        /// <returns>削除処理の成功可否</returns>
        Task<bool> DeleteAttachmentAsync(string fileName);

        /// <summary>
        /// 添付ファイルストリーム取得
        /// </summary>
        /// <param name="fileName">ファイル名</param>
        /// <returns>ファイルストリーム</returns>
        Task<Stream?> GetAttachmentStreamAsync(string fileName);

        /// <summary>
        /// アップロードファイルのバリデーション
        /// </summary>
        /// <param name="file">アップロード対象ファイル</param>
        /// <returns>ファイルの妥当性</returns>
        Task<bool> ValidateAttachmentFileAsync(IFormFile file);

        /// <summary>
        /// 一意ファイル名生成
        /// </summary>
        /// <param name="originalFileName">元のファイル名</param>
        /// <returns>一意なファイル名</returns>
        Task<string> GenerateUniqueFileNameAsync(string originalFileName);
    }
}

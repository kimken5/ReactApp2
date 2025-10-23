using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;

namespace ReactApp.Server.Services
{
    /// <summary>
    /// Azure Blob Storage添付ファイルストレージサービス実装
    /// Azure Blob Storageを使用した添付ファイルの保存、取得、削除機能
    /// </summary>
    public class AzureBlobAttachmentService : IAttachmentService
    {
        private readonly BlobServiceClient _blobServiceClient;
        private readonly IConfiguration _configuration;
        private readonly ILogger<AzureBlobAttachmentService> _logger;
        private readonly string _attachmentContainerName;
        private readonly string? _cdnEndpoint;

        public AzureBlobAttachmentService(
            IConfiguration configuration,
            ILogger<AzureBlobAttachmentService> logger)
        {
            _configuration = configuration;
            _logger = logger;

            var connectionString = _configuration["Azure:Storage:ConnectionString"];
            if (string.IsNullOrEmpty(connectionString))
            {
                throw new InvalidOperationException("Azure Storage connection string is not configured");
            }

            _blobServiceClient = new BlobServiceClient(connectionString);
            _attachmentContainerName = _configuration["Azure:Storage:AttachmentContainerName"] ?? "attachments";
            _cdnEndpoint = _configuration["Azure:Storage:CdnEndpoint"];

            // コンテナの初期化
            _ = Task.Run(InitializeContainerAsync);
        }

        private async Task InitializeContainerAsync()
        {
            try
            {
                var containerClient = _blobServiceClient.GetBlobContainerClient(_attachmentContainerName);
                await containerClient.CreateIfNotExistsAsync(PublicAccessType.None);
                _logger.LogInformation("Attachment container initialized: {ContainerName}", _attachmentContainerName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to initialize attachment container: {ContainerName}", _attachmentContainerName);
            }
        }

        public async Task<string> UploadAttachmentAsync(IFormFile file, string fileName)
        {
            var containerClient = _blobServiceClient.GetBlobContainerClient(_attachmentContainerName);
            var blobClient = containerClient.GetBlobClient(fileName);

            try
            {
                using var stream = file.OpenReadStream();

                // 元のファイル名をBase64エンコードしてASCII文字のみにする
                var originalFileNameBytes = System.Text.Encoding.UTF8.GetBytes(file.FileName);
                var originalFileNameBase64 = Convert.ToBase64String(originalFileNameBytes);

                // RFC 2231準拠のエンコーディング（日本語ファイル名対応）
                var encodedFileName = System.Web.HttpUtility.UrlEncode(file.FileName).Replace("+", "%20");

                var uploadOptions = new BlobUploadOptions
                {
                    HttpHeaders = new BlobHttpHeaders
                    {
                        ContentType = file.ContentType,
                        CacheControl = "public, max-age=31536000", // 1年間キャッシュ
                        ContentDisposition = $"inline; filename*=UTF-8''{encodedFileName}"
                    },
                    Metadata = new Dictionary<string, string>
                    {
                        ["OriginalFileName"] = originalFileNameBase64,
                        ["UploadedAt"] = DateTime.UtcNow.ToString("O"),
                        ["FileSize"] = file.Length.ToString()
                    }
                };

                await blobClient.UploadAsync(stream, uploadOptions);

                var url = GetAttachmentUrl(fileName);
                _logger.LogInformation("Attachment uploaded to Azure Blob Storage: {FileName} -> {Url}", fileName, url);

                return url;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to upload attachment to Azure Blob Storage: {FileName}", fileName);
                throw new InvalidOperationException($"Failed to upload attachment: {ex.Message}", ex);
            }
        }

        public async Task<string> UploadAttachmentAsync(byte[] fileData, string fileName, string contentType)
        {
            var containerClient = _blobServiceClient.GetBlobContainerClient(_attachmentContainerName);
            var blobClient = containerClient.GetBlobClient(fileName);

            try
            {
                using var stream = new MemoryStream(fileData);

                var uploadOptions = new BlobUploadOptions
                {
                    HttpHeaders = new BlobHttpHeaders
                    {
                        ContentType = contentType,
                        CacheControl = "public, max-age=31536000"
                    },
                    Metadata = new Dictionary<string, string>
                    {
                        ["UploadedAt"] = DateTime.UtcNow.ToString("O"),
                        ["FileSize"] = fileData.Length.ToString()
                    }
                };

                await blobClient.UploadAsync(stream, uploadOptions);

                var url = GetAttachmentUrl(fileName);
                _logger.LogInformation("Attachment uploaded to Azure Blob Storage: {FileName} -> {Url}", fileName, url);

                return url;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to upload attachment to Azure Blob Storage: {FileName}", fileName);
                throw new InvalidOperationException($"Failed to upload attachment: {ex.Message}", ex);
            }
        }

        public string GetAttachmentUrl(string fileName)
        {
            if (!string.IsNullOrEmpty(_cdnEndpoint))
            {
                return $"{_cdnEndpoint.TrimEnd('/')}/{_attachmentContainerName}/{fileName}";
            }

            var containerClient = _blobServiceClient.GetBlobContainerClient(_attachmentContainerName);
            var blobClient = containerClient.GetBlobClient(fileName);
            return blobClient.Uri.ToString();
        }

        public async Task<bool> DeleteAttachmentAsync(string fileName)
        {
            var containerClient = _blobServiceClient.GetBlobContainerClient(_attachmentContainerName);
            var blobClient = containerClient.GetBlobClient(fileName);

            try
            {
                var response = await blobClient.DeleteIfExistsAsync();
                if (response.Value)
                {
                    _logger.LogInformation("Attachment deleted from Azure Blob Storage: {FileName}", fileName);
                    return true;
                }
                else
                {
                    _logger.LogWarning("Attachment not found for deletion: {FileName}", fileName);
                    return false;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to delete attachment from Azure Blob Storage: {FileName}", fileName);
                return false;
            }
        }

        public async Task<Stream?> GetAttachmentStreamAsync(string fileName)
        {
            var containerClient = _blobServiceClient.GetBlobContainerClient(_attachmentContainerName);
            var blobClient = containerClient.GetBlobClient(fileName);

            try
            {
                var response = await blobClient.DownloadAsync();
                return response.Value.Content;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to download attachment from Azure Blob Storage: {FileName}", fileName);
                return null;
            }
        }

        public async Task<bool> ValidateAttachmentFileAsync(IFormFile file)
        {
            // ファイルサイズチェック（最大50MB）
            const long maxFileSize = 50 * 1024 * 1024;
            if (file.Length > maxFileSize)
            {
                _logger.LogWarning("Attachment file size exceeds limit: {FileSize} bytes", file.Length);
                return false;
            }

            // 許可する拡張子
            var allowedExtensions = new[]
            {
                ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", // 画像
                ".pdf", // PDF
                ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", // Office
                ".txt", ".csv", // テキスト
                ".zip", ".rar", ".7z" // アーカイブ
            };

            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!allowedExtensions.Contains(extension))
            {
                _logger.LogWarning("Attachment file extension not allowed: {Extension}", extension);
                return false;
            }

            return await Task.FromResult(true);
        }

        public async Task<string> GenerateUniqueFileNameAsync(string originalFileName)
        {
            var extension = Path.GetExtension(originalFileName);
            var timestamp = DateTime.UtcNow.ToString("yyyyMMddHHmmss");
            var guid = Guid.NewGuid().ToString("N").Substring(0, 8);
            var uniqueFileName = $"{timestamp}_{guid}{extension}";

            return await Task.FromResult(uniqueFileName);
        }
    }
}

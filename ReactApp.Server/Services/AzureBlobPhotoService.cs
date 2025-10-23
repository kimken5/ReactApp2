using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Azure.Storage.Sas;
using Microsoft.AspNetCore.Http;

namespace ReactApp.Server.Services
{
    /// <summary>
    /// Azure Blob Storage写真ストレージサービス実装
    /// Azure Blob Storageを使用した写真ファイルの保存、取得、削除機能
    /// 開発環境と本番環境の両方に対応
    /// </summary>
    public class AzureBlobPhotoService : IPhotoStorageService
    {
        private readonly BlobServiceClient _blobServiceClient;
        private readonly IConfiguration _configuration;
        private readonly ILogger<AzureBlobPhotoService> _logger;
        private readonly string _photoContainerName;
        private readonly string _thumbnailContainerName;
        private readonly string? _cdnEndpoint;

        public AzureBlobPhotoService(
            IConfiguration configuration,
            ILogger<AzureBlobPhotoService> logger)
        {
            _configuration = configuration;
            _logger = logger;

            var connectionString = _configuration["Azure:Storage:ConnectionString"];
            if (string.IsNullOrEmpty(connectionString))
            {
                throw new InvalidOperationException("Azure Storage connection string is not configured");
            }

            _blobServiceClient = new BlobServiceClient(connectionString);
            _photoContainerName = _configuration["Azure:Storage:PhotoContainerName"] ?? "photos";
            _thumbnailContainerName = _configuration["Azure:Storage:ThumbnailContainerName"] ?? "thumbnails";
            _cdnEndpoint = _configuration["Azure:Storage:CdnEndpoint"];

            // コンテナの初期化
            _ = Task.Run(InitializeContainersAsync);
        }

        public async Task<string> UploadPhotoAsync(IFormFile file, string fileName, bool isOriginal = true)
        {
            var containerName = isOriginal ? _photoContainerName : _thumbnailContainerName;
            var containerClient = _blobServiceClient.GetBlobContainerClient(containerName);
            var blobClient = containerClient.GetBlobClient(fileName);

            try
            {
                using var stream = file.OpenReadStream();

                // 元のファイル名をBase64エンコードしてASCII文字のみにする
                var originalFileNameBytes = System.Text.Encoding.UTF8.GetBytes(file.FileName);
                var originalFileNameBase64 = Convert.ToBase64String(originalFileNameBytes);

                var uploadOptions = new BlobUploadOptions
                {
                    HttpHeaders = new BlobHttpHeaders
                    {
                        ContentType = file.ContentType,
                        CacheControl = "public, max-age=31536000" // 1年間キャッシュ
                    },
                    Metadata = new Dictionary<string, string>
                    {
                        ["OriginalFileName"] = originalFileNameBase64,
                        ["UploadedAt"] = DateTime.UtcNow.ToString("O"),
                        ["FileSize"] = file.Length.ToString()
                    }
                };

                await blobClient.UploadAsync(stream, uploadOptions);

                var url = GetPhotoUrl(fileName, isOriginal);
                _logger.LogInformation("Photo uploaded to Azure Blob Storage: {FileName} -> {Url}", fileName, url);

                return url;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to upload photo to Azure Blob Storage: {FileName}", fileName);
                throw new InvalidOperationException($"Failed to upload photo: {ex.Message}", ex);
            }
        }

        public async Task<string> UploadPhotoAsync(byte[] imageData, string fileName, string contentType, bool isOriginal = true)
        {
            var containerName = isOriginal ? _photoContainerName : _thumbnailContainerName;
            var containerClient = _blobServiceClient.GetBlobContainerClient(containerName);
            var blobClient = containerClient.GetBlobClient(fileName);

            try
            {
                using var stream = new MemoryStream(imageData);

                var uploadOptions = new BlobUploadOptions
                {
                    HttpHeaders = new BlobHttpHeaders
                    {
                        ContentType = contentType,
                        CacheControl = "public, max-age=31536000" // 1年間キャッシュ
                    },
                    Metadata = new Dictionary<string, string>
                    {
                        ["GeneratedAt"] = DateTime.UtcNow.ToString("O"),
                        ["FileSize"] = imageData.Length.ToString(),
                        ["IsGenerated"] = "true"
                    }
                };

                await blobClient.UploadAsync(stream, uploadOptions);

                var url = GetPhotoUrl(fileName, isOriginal);
                _logger.LogInformation("Generated photo uploaded to Azure Blob Storage: {FileName} -> {Url}", fileName, url);

                return url;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to upload generated photo to Azure Blob Storage: {FileName}", fileName);
                throw new InvalidOperationException($"Failed to upload generated photo: {ex.Message}", ex);
            }
        }

        public async Task<Stream?> GetPhotoStreamAsync(string fileName, bool isOriginal = true)
        {
            var containerName = isOriginal ? _photoContainerName : _thumbnailContainerName;
            var containerClient = _blobServiceClient.GetBlobContainerClient(containerName);
            var blobClient = containerClient.GetBlobClient(fileName);

            try
            {
                var response = await blobClient.DownloadStreamingAsync();
                return response.Value.Content;
            }
            catch (Azure.RequestFailedException ex) when (ex.Status == 404)
            {
                _logger.LogWarning("Photo not found in Azure Blob Storage: {FileName}", fileName);
                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get photo stream from Azure Blob Storage: {FileName}", fileName);
                return null;
            }
        }

        public async Task<bool> DeletePhotoAsync(string fileName, bool isOriginal = true)
        {
            var containerName = isOriginal ? _photoContainerName : _thumbnailContainerName;
            var containerClient = _blobServiceClient.GetBlobContainerClient(containerName);
            var blobClient = containerClient.GetBlobClient(fileName);

            try
            {
                var response = await blobClient.DeleteIfExistsAsync();
                if (response.Value)
                {
                    _logger.LogInformation("Photo deleted from Azure Blob Storage: {FileName}", fileName);
                }
                else
                {
                    _logger.LogWarning("Photo not found for deletion in Azure Blob Storage: {FileName}", fileName);
                }
                return response.Value;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to delete photo from Azure Blob Storage: {FileName}", fileName);
                return false;
            }
        }

        public async Task<bool> ExistsAsync(string fileName, bool isOriginal = true)
        {
            var containerName = isOriginal ? _photoContainerName : _thumbnailContainerName;
            var containerClient = _blobServiceClient.GetBlobContainerClient(containerName);
            var blobClient = containerClient.GetBlobClient(fileName);

            try
            {
                var response = await blobClient.ExistsAsync();
                return response.Value;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to check photo existence in Azure Blob Storage: {FileName}", fileName);
                return false;
            }
        }

        public string GetPhotoUrl(string fileName, bool isOriginal = true)
        {
            var containerName = isOriginal ? _photoContainerName : _thumbnailContainerName;

            if (!string.IsNullOrEmpty(_cdnEndpoint))
            {
                // CDN経由のURL
                return $"{_cdnEndpoint.TrimEnd('/')}/{containerName}/{fileName}";
            }
            else
            {
                // 直接Blob StorageのURL
                var containerClient = _blobServiceClient.GetBlobContainerClient(containerName);
                var blobClient = containerClient.GetBlobClient(fileName);
                return blobClient.Uri.ToString();
            }
        }

        public async Task<string?> GenerateSasUrlAsync(string fileName, int expiresInMinutes = 60)
        {
            try
            {
                var containerClient = _blobServiceClient.GetBlobContainerClient(_photoContainerName);
                var blobClient = containerClient.GetBlobClient(fileName);

                // SAS URLの生成（読み取り専用）
                if (blobClient.CanGenerateSasUri)
                {
                    var sasBuilder = new BlobSasBuilder
                    {
                        BlobContainerName = _photoContainerName,
                        BlobName = fileName,
                        Resource = "b", // blob
                        ExpiresOn = DateTimeOffset.UtcNow.AddMinutes(expiresInMinutes)
                    };

                    sasBuilder.SetPermissions(BlobSasPermissions.Read);

                    var sasUrl = blobClient.GenerateSasUri(sasBuilder).ToString();
                    _logger.LogDebug("Generated SAS URL for photo: {FileName}", fileName);
                    return sasUrl;
                }
                else
                {
                    _logger.LogWarning("Cannot generate SAS URL for blob client: {FileName}", fileName);
                    return null;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to generate SAS URL for photo: {FileName}", fileName);
                return null;
            }
        }

        /// <summary>
        /// コンテナの初期化（存在しない場合は作成）
        /// </summary>
        private async Task InitializeContainersAsync()
        {
            try
            {
                // 写真コンテナの作成
                var photoContainerClient = _blobServiceClient.GetBlobContainerClient(_photoContainerName);
                await photoContainerClient.CreateIfNotExistsAsync(PublicAccessType.None);

                // サムネイルコンテナの作成（同じコンテナを使用する場合は重複しない）
                if (_thumbnailContainerName != _photoContainerName)
                {
                    var thumbnailContainerClient = _blobServiceClient.GetBlobContainerClient(_thumbnailContainerName);
                    await thumbnailContainerClient.CreateIfNotExistsAsync(PublicAccessType.None);
                }

                _logger.LogInformation("Azure Blob Storage containers initialized: Photos={PhotoContainer}, Thumbnails={ThumbnailContainer}",
                    _photoContainerName, _thumbnailContainerName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to initialize Azure Blob Storage containers");
            }
        }
    }
}
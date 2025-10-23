using System.ComponentModel.DataAnnotations;

namespace ReactApp.Server.DTOs
{
    /// <summary>
    /// 写真DTO
    /// 保育園の写真情報をクライアントとサーバー間で伝送するためのデータ転送オブジェクト
    /// </summary>
    public class PhotoDto
    {
        public int Id { get; set; }
        public string FileName { get; set; } = string.Empty;
        public string FilePath { get; set; } = string.Empty;
        public string FileUrl { get; set; } = string.Empty;
        public string ThumbnailPath { get; set; } = string.Empty;
        public string ThumbnailUrl { get; set; } = string.Empty;
        public string? OriginalFileName { get; set; }
        public long FileSize { get; set; }
        public string MimeType { get; set; } = string.Empty;
        public int Width { get; set; }
        public int Height { get; set; }
        public string? Description { get; set; }
        public int UploadedByStaffId { get; set; }
        public string UploadedByStaffName { get; set; } = string.Empty;
        public DateTime UploadedAt { get; set; }
        public DateTime PublishedAt { get; set; }
        public string VisibilityLevel { get; set; } = string.Empty;
        public string? TargetClassId { get; set; }
        public string Status { get; set; } = string.Empty;
        public bool RequiresConsent { get; set; }
        public int ViewCount { get; set; }
        public int DownloadCount { get; set; }
        public List<PhotoChildDto> Children { get; set; } = new List<PhotoChildDto>();
        public bool CanView { get; set; } = false;
        public bool CanDownload { get; set; } = false;
        public bool HasConsent { get; set; } = false;
    }

    public class PhotoChildDto
    {
        public int ChildId { get; set; }
        public string ChildName { get; set; } = string.Empty;
        public bool IsPrimarySubject { get; set; }
        public DateTime AddedAt { get; set; }
    }

    public class PhotoUploadDto
    {
        [Required]
        public IFormFile PhotoFile { get; set; } = null!;

        [StringLength(500)]
        public string? Description { get; set; }

        [Required]
        public List<int> ChildIds { get; set; } = new List<int>();

        [Required]
        [StringLength(20)]
        public string VisibilityLevel { get; set; } = "class";

        [StringLength(50)]
        public string? TargetClassId { get; set; }

        public DateTime? PublishedAt { get; set; }

        public bool RequiresConsent { get; set; } = true;
    }

    public class UpdatePhotoDto
    {
        [StringLength(500)]
        public string? Description { get; set; }

        [StringLength(20)]
        public string? VisibilityLevel { get; set; }

        [StringLength(50)]
        public string? TargetClassId { get; set; }

        public DateTime? PublishedAt { get; set; }

        public bool? RequiresConsent { get; set; }

        [StringLength(20)]
        public string? Status { get; set; }

        public List<int>? ChildIds { get; set; }
    }

    public class PhotoSearchDto
    {
        public int? ChildId { get; set; }
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
        public string? VisibilityLevel { get; set; }
        public string? TargetClassId { get; set; }
        public string? Status { get; set; }
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 20;
        public string SortBy { get; set; } = "PublishedAt";
        public string SortOrder { get; set; } = "desc";
    }

    public class PhotoAccessDto
    {
        public int Id { get; set; }
        public int PhotoId { get; set; }
        public string PhotoFileName { get; set; } = string.Empty;
        public int ParentId { get; set; }
        public string ParentName { get; set; } = string.Empty;
        public string AccessType { get; set; } = string.Empty;
        public DateTime AccessedAt { get; set; }
        public string? IpAddress { get; set; }
        public bool IsSuccessful { get; set; }
        public string? ErrorMessage { get; set; }
    }

    public class PhotoConsentDto
    {
        public int Id { get; set; }
        public int PhotoId { get; set; }
        public string PhotoFileName { get; set; } = string.Empty;
        public int ChildId { get; set; }
        public string ChildName { get; set; } = string.Empty;
        public int ParentId { get; set; }
        public string ParentName { get; set; } = string.Empty;
        public string ConsentStatus { get; set; } = string.Empty;
        public string? Notes { get; set; }
        public DateTime RequestedAt { get; set; }
        public DateTime? RespondedAt { get; set; }
    }

    public class UpdatePhotoConsentDto
    {
        [Required]
        [StringLength(20)]
        public string ConsentStatus { get; set; } = string.Empty;

        [StringLength(500)]
        public string? Notes { get; set; }
    }

    public class PhotoStatsDto
    {
        public int TotalPhotos { get; set; }
        public int PublishedPhotos { get; set; }
        public int DraftPhotos { get; set; }
        public int ArchivedPhotos { get; set; }
        public int TotalViews { get; set; }
        public int TotalDownloads { get; set; }
        public int PendingConsents { get; set; }
        public long TotalStorageUsed { get; set; }
        public List<PhotoDto> RecentPhotos { get; set; } = new List<PhotoDto>();
    }

    public class PhotoGalleryResponseDto
    {
        public List<PhotoDto> Photos { get; set; } = new List<PhotoDto>();
        public int TotalCount { get; set; }
        public int PageNumber { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
        public bool HasNextPage { get; set; }
        public bool HasPreviousPage { get; set; }
    }
}
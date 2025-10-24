using System.ComponentModel.DataAnnotations;

namespace ReactApp.Server.DTOs.Desktop
{
    /// <summary>
    /// 写真情報DTO
    /// </summary>
    public class PhotoDto
    {
        public int Id { get; set; }
        public string FileName { get; set; } = string.Empty;
        public string FilePath { get; set; } = string.Empty;
        public string ThumbnailPath { get; set; } = string.Empty;
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
        public string VisibilityLevel { get; set; } = string.Empty; // "class", "grade", "all"
        public string? TargetClassId { get; set; }
        public string? TargetClassName { get; set; }
        public string Status { get; set; } = string.Empty; // "draft", "published", "archived"
        public bool RequiresConsent { get; set; }
        public int ViewCount { get; set; }
        public int DownloadCount { get; set; }
        public bool IsActive { get; set; }
        public bool UploadedByAdminUser { get; set; }
        public DateTime? UpdatedAt { get; set; }

        // 関連園児情報
        public List<PhotoChildInfoDto> Children { get; set; } = new();
    }

    /// <summary>
    /// 写真に写っている園児情報DTO
    /// </summary>
    public class PhotoChildInfoDto
    {
        public int ChildId { get; set; }
        public string ChildName { get; set; } = string.Empty;
        public string? ClassName { get; set; }
        public bool IsPrimarySubject { get; set; }
    }

    /// <summary>
    /// 写真アップロードリクエストDTO
    /// </summary>
    public class UploadPhotoRequestDto
    {
        [Required(ErrorMessage = "ファイルは必須です")]
        public IFormFile File { get; set; } = null!;

        [StringLength(500)]
        public string? Description { get; set; }

        [Required(ErrorMessage = "公開日時は必須です")]
        public DateTime PublishedAt { get; set; }

        [Required]
        [StringLength(20)]
        public string VisibilityLevel { get; set; } = "class"; // "class", "grade", "all"

        [StringLength(50)]
        public string? TargetClassId { get; set; }

        [Required]
        [StringLength(20)]
        public string Status { get; set; } = "published"; // "draft", "published"

        public bool RequiresConsent { get; set; } = true;

        [Required(ErrorMessage = "職員IDは必須です")]
        public int StaffId { get; set; }

        // 写っている園児IDリスト
        public List<int> ChildIds { get; set; } = new();

        // 主要被写体の園児ID（任意）
        public int? PrimaryChildId { get; set; }
    }

    /// <summary>
    /// 写真更新リクエストDTO
    /// </summary>
    public class UpdatePhotoRequestDto
    {
        [StringLength(500)]
        public string? Description { get; set; }

        [Required]
        public DateTime PublishedAt { get; set; }

        [Required]
        [StringLength(20)]
        public string VisibilityLevel { get; set; } = "class";

        [StringLength(50)]
        public string? TargetClassId { get; set; }

        [Required]
        [StringLength(20)]
        public string Status { get; set; } = "published";

        public bool RequiresConsent { get; set; } = true;

        // 写っている園児IDリスト（更新する場合）
        public List<int>? ChildIds { get; set; }

        // 主要被写体の園児ID（任意）
        public int? PrimaryChildId { get; set; }
    }

    /// <summary>
    /// 写真一覧フィルタDTO
    /// </summary>
    public class PhotoFilterDto
    {
        public int? ChildId { get; set; }
        public string? ClassId { get; set; }
        public int? StaffId { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string? VisibilityLevel { get; set; }
        public string? Status { get; set; }
        public bool? RequiresConsent { get; set; }
        public string? SearchKeyword { get; set; }
    }
}

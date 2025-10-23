using System.ComponentModel.DataAnnotations;

namespace ReactApp.Server.Models
{
    /// <summary>
    /// 写真エンティティ
    /// 保育園で撮影された写真のメタデータ、ファイル情報、公開設定等を管理するデータモデル
    /// </summary>
    public class Photo
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(200)]
        public string FileName { get; set; } = string.Empty;

        [Required]
        [StringLength(500)]
        public string FilePath { get; set; } = string.Empty;

        [Required]
        [StringLength(500)]
        public string ThumbnailPath { get; set; } = string.Empty;

        [StringLength(100)]
        public string? OriginalFileName { get; set; }

        [Required]
        public long FileSize { get; set; }

        [Required]
        [StringLength(50)]
        public string MimeType { get; set; } = string.Empty;

        [Required]
        public int Width { get; set; }

        [Required]
        public int Height { get; set; }

        [StringLength(500)]
        public string? Description { get; set; }

        [Required]
        public int UploadedByStaffNurseryId { get; set; }

        [Required]
        public int UploadedByStaffId { get; set; }
        public virtual Staff UploadedByStaff { get; set; } = null!;

        [Required]
        public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

        [Required]
        public DateTime PublishedAt { get; set; }

        [Required]
        [StringLength(20)]
        public string VisibilityLevel { get; set; } = "class"; // "class", "grade", "all"

        [StringLength(50)]
        public string? TargetClassId { get; set; }

        [Required]
        [StringLength(20)]
        public string Status { get; set; } = "published"; // "draft", "published", "archived"

        [Required]
        public bool RequiresConsent { get; set; } = true;

        [Required]
        public int ViewCount { get; set; } = 0;

        [Required]
        public int DownloadCount { get; set; } = 0;

        [Required]
        public bool IsActive { get; set; } = true;

        public DateTime? DeletedAt { get; set; }

        public DateTime? UpdatedAt { get; set; }

        // Navigation properties
        public virtual ICollection<PhotoChild> PhotoChildren { get; set; } = new List<PhotoChild>();
        public virtual ICollection<PhotoAccess> PhotoAccesses { get; set; } = new List<PhotoAccess>();
        public virtual ICollection<PhotoConsent> PhotoConsents { get; set; } = new List<PhotoConsent>();
    }
}
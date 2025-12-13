using System.ComponentModel.DataAnnotations;
using ReactApp.Server.Helpers;

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
        public DateTime UploadedAt { get; set; } = DateTimeHelper.GetJstNow();

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

        // ===== デスクトップアプリ用追加プロパティ =====

        /// <summary>
        /// 管理者アップロードフラグ（必須）
        /// デフォルト: false
        /// 管理者がスタッフに成り代わってアップロードした場合にtrue
        /// </summary>
        [Required]
        public bool UploadedByAdminUser { get; set; } = false;

        /// <summary>
        /// レポート作成フラグ（必須）
        /// デフォルト: false
        /// 日報作成時にアップロードされた写真の場合はtrue
        /// 写真管理画面からアップロードされた写真の場合はfalse
        /// </summary>
        [Required]
        public bool IsReportCreate { get; set; } = false;

        // Navigation properties
        public virtual ICollection<PhotoChild> PhotoChildren { get; set; } = new List<PhotoChild>();
        public virtual ICollection<PhotoAccess> PhotoAccesses { get; set; } = new List<PhotoAccess>();
        public virtual ICollection<PhotoConsent> PhotoConsents { get; set; } = new List<PhotoConsent>();
    }
}

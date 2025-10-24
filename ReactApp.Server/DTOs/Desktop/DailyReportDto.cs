using System.ComponentModel.DataAnnotations;

namespace ReactApp.Server.DTOs.Desktop
{
    /// <summary>
    /// 日報情報DTO
    /// </summary>
    public class DailyReportDto
    {
        public int Id { get; set; }
        public int NurseryId { get; set; }
        public int ChildId { get; set; }
        public string ChildName { get; set; } = string.Empty;
        public string? ClassName { get; set; }
        public int StaffNurseryId { get; set; }
        public int StaffId { get; set; }
        public string StaffName { get; set; } = string.Empty;
        public DateTime ReportDate { get; set; }
        public string Category { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public List<string> Tags { get; set; } = new();
        public List<string> Photos { get; set; } = new();
        public string Status { get; set; } = string.Empty;
        public DateTime? PublishedAt { get; set; }
        public bool ParentAcknowledged { get; set; }
        public DateTime? AcknowledgedAt { get; set; }
        public bool CreatedByAdminUser { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public int ResponseCount { get; set; }
    }

    /// <summary>
    /// 日報作成リクエストDTO
    /// </summary>
    public class CreateDailyReportRequestDto
    {
        [Required(ErrorMessage = "園児IDは必須です")]
        public int ChildId { get; set; }

        [Required(ErrorMessage = "職員IDは必須です")]
        public int StaffId { get; set; }

        [Required(ErrorMessage = "日報日付は必須です")]
        public DateTime ReportDate { get; set; }

        [Required(ErrorMessage = "カテゴリは必須です")]
        [StringLength(50, ErrorMessage = "カテゴリは50文字以内で入力してください")]
        public string Category { get; set; } = string.Empty;

        [Required(ErrorMessage = "タイトルは必須です")]
        [StringLength(200, ErrorMessage = "タイトルは200文字以内で入力してください")]
        public string Title { get; set; } = string.Empty;

        [Required(ErrorMessage = "内容は必須です")]
        [StringLength(1000, ErrorMessage = "内容は1000文字以内で入力してください")]
        public string Content { get; set; } = string.Empty;

        public List<string> Tags { get; set; } = new();

        public List<string> Photos { get; set; } = new();

        [Required(ErrorMessage = "ステータスは必須です")]
        [StringLength(20, ErrorMessage = "ステータスは20文字以内で入力してください")]
        public string Status { get; set; } = "draft";
    }

    /// <summary>
    /// 日報更新リクエストDTO
    /// </summary>
    public class UpdateDailyReportRequestDto
    {
        [Required(ErrorMessage = "日報日付は必須です")]
        public DateTime ReportDate { get; set; }

        [Required(ErrorMessage = "カテゴリは必須です")]
        [StringLength(50, ErrorMessage = "カテゴリは50文字以内で入力してください")]
        public string Category { get; set; } = string.Empty;

        [Required(ErrorMessage = "タイトルは必須です")]
        [StringLength(200, ErrorMessage = "タイトルは200文字以内で入力してください")]
        public string Title { get; set; } = string.Empty;

        [Required(ErrorMessage = "内容は必須です")]
        [StringLength(1000, ErrorMessage = "内容は1000文字以内で入力してください")]
        public string Content { get; set; } = string.Empty;

        public List<string> Tags { get; set; } = new();

        public List<string> Photos { get; set; } = new();

        [Required(ErrorMessage = "ステータスは必須です")]
        [StringLength(20, ErrorMessage = "ステータスは20文字以内で入力してください")]
        public string Status { get; set; } = "draft";
    }

    /// <summary>
    /// 日報一覧フィルタDTO
    /// </summary>
    public class DailyReportFilterDto
    {
        public int? ChildId { get; set; }
        public string? ClassId { get; set; }
        public int? StaffId { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string? Category { get; set; }
        public string? Status { get; set; }
        public bool? ParentAcknowledged { get; set; }
        public string? SearchKeyword { get; set; }
    }

    /// <summary>
    /// 日報公開リクエストDTO
    /// </summary>
    public class PublishDailyReportRequestDto
    {
        [Required(ErrorMessage = "日報IDは必須です")]
        public int ReportId { get; set; }
    }
}

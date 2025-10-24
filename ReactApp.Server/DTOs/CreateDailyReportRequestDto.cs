using System.ComponentModel.DataAnnotations;

namespace ReactApp.Server.DTOs
{
    /// <summary>
    /// 日報作成リクエストDTO
    /// デスクトップアプリから日報を作成するためのリクエストデータ
    /// </summary>
    public class CreateDailyReportRequestDto
    {
        /// <summary>
        /// 園児ID（必須）
        /// </summary>
        [Required(ErrorMessage = "園児IDは必須です")]
        public int ChildId { get; set; }

        /// <summary>
        /// 職員ID（必須）
        /// </summary>
        [Required(ErrorMessage = "職員IDは必須です")]
        public int StaffId { get; set; }

        /// <summary>
        /// 日報日付（必須）
        /// </summary>
        [Required(ErrorMessage = "日報日付は必須です")]
        public DateTime ReportDate { get; set; }

        /// <summary>
        /// カテゴリ（必須）
        /// "activity"（活動）、"meal"（食事）、"sleep"（睡眠）、"health"（健康）、"incident"（事故）、"behavior"（行動）
        /// </summary>
        [Required(ErrorMessage = "カテゴリは必須です")]
        [StringLength(50, ErrorMessage = "カテゴリは50文字以内で入力してください")]
        public string Category { get; set; } = string.Empty;

        /// <summary>
        /// タイトル（必須）
        /// </summary>
        [Required(ErrorMessage = "タイトルは必須です")]
        [StringLength(200, ErrorMessage = "タイトルは200文字以内で入力してください")]
        public string Title { get; set; } = string.Empty;

        /// <summary>
        /// 内容（必須）
        /// </summary>
        [Required(ErrorMessage = "内容は必須です")]
        [StringLength(1000, ErrorMessage = "内容は1000文字以内で入力してください")]
        public string Content { get; set; } = string.Empty;

        /// <summary>
        /// タグ一覧（任意）
        /// </summary>
        public List<string>? Tags { get; set; }

        /// <summary>
        /// 写真一覧（任意）
        /// </summary>
        public List<string>? Photos { get; set; }

        /// <summary>
        /// ステータス（任意、デフォルト: "draft"）
        /// "draft" または "published"
        /// </summary>
        [StringLength(20, ErrorMessage = "ステータスは20文字以内で入力してください")]
        public string? Status { get; set; }
    }
}

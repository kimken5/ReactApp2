using System.ComponentModel.DataAnnotations;

namespace ReactApp.Server.DTOs
{
    /// <summary>
    /// 日報更新リクエストDTO
    /// デスクトップアプリから日報を更新するためのリクエストデータ
    /// </summary>
    public class UpdateDailyReportRequestDto
    {
        /// <summary>
        /// 園児ID（任意、下書き状態のみ変更可能）
        /// </summary>
        public int? ChildId { get; set; }

        /// <summary>
        /// 日報日付（任意）
        /// </summary>
        public DateTime? ReportDate { get; set; }

        /// <summary>
        /// カテゴリ（任意）
        /// </summary>
        [StringLength(50, ErrorMessage = "カテゴリは50文字以内で入力してください")]
        public string? Category { get; set; }

        /// <summary>
        /// タイトル（任意）
        /// </summary>
        [StringLength(200, ErrorMessage = "タイトルは200文字以内で入力してください")]
        public string? Title { get; set; }

        /// <summary>
        /// 内容（任意）
        /// </summary>
        [StringLength(1000, ErrorMessage = "内容は1000文字以内で入力してください")]
        public string? Content { get; set; }

        /// <summary>
        /// タグ一覧（任意）
        /// </summary>
        public List<string>? Tags { get; set; }

        /// <summary>
        /// 写真一覧（任意）
        /// </summary>
        public List<string>? Photos { get; set; }

        /// <summary>
        /// ステータス（任意）
        /// "draft" または "published"（published → draftへの変更は不可）
        /// </summary>
        [StringLength(20, ErrorMessage = "ステータスは20文字以内で入力してください")]
        public string? Status { get; set; }
    }
}

using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using ReactApp.Server.Helpers;

namespace ReactApp.Server.Models
{
    /// <summary>
    /// 日報保護者コメントエンティティ
    /// スタッフの日報に対する保護者のコメントや返信を管理
    /// 双方向コミュニケーションの保護者側レスポンスを実現
    /// </summary>
    public class DailyReportResponse
    {
        /// <summary>
        /// コメントID（主キー）
        /// システム内のコメント一意識別子
        /// </summary>
        [Key]
        public int Id { get; set; }

        /// <summary>
        /// 日報ID（必須、外部キー）
        /// コメント対象の日報を特定
        /// </summary>
        [Required]
        public int DailyReportId { get; set; }

        /// <summary>
        /// 日報ナビゲーションプロパティ
        /// コメント対象の日報エンティティへの参照
        /// </summary>
        [ForeignKey("DailyReportId")]
        public virtual DailyReport DailyReport { get; set; } = null!;

        /// <summary>
        /// 保護者ID（必須、外部キー）
        /// コメント作成者の保護者を特定
        /// </summary>
        [Required]
        public int ParentId { get; set; }

        /// <summary>
        /// 保護者ナビゲーションプロパティ
        /// コメント作成保護者エンティティへの参照
        /// </summary>
        [ForeignKey("ParentId")]
        public virtual Parent Parent { get; set; } = null!;

        [StringLength(500)]
        public string? ResponseMessage { get; set; }

        public bool IsRead { get; set; } = false;

        public DateTime? ReadAt { get; set; }

        public DateTime CreatedAt { get; set; } = DateTimeHelper.GetJstNow();
    }
}

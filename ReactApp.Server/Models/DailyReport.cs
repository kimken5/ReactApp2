using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using ReactApp.Server.Helpers;

namespace ReactApp.Server.Models
{
    /// <summary>
    /// 日報エンティティ
    /// 園児の日々の活動、食事、睡眠、健康状態等を記録する日報データモデル
    /// スタッフが作成し、保護者が閲覧・返信できる
    /// </summary>
    public class DailyReport
    {
        /// <summary>
        /// 日報ID（主キー）
        /// システム内の日報一意識別子
        /// </summary>
        [Key]
        public int Id { get; set; }

        /// <summary>
        /// 保育園ID（必須）
        /// 園児の所属保育園識別子
        /// </summary>
        [Required]
        public int NurseryId { get; set; }

        /// <summary>
        /// 園児ID（必須）
        /// 日報対象の園児識別子
        /// </summary>
        [Required]
        public int ChildId { get; set; }

        /// <summary>
        /// 園児ナビゲーションプロパティ
        /// 日報対象の園児エンティティへの参照
        /// </summary>
        public virtual Child Child { get; set; } = null!;

        /// <summary>
        /// スタッフ保育園ID（必須）
        /// 日報作成スタッフの所属保育園識別子
        /// </summary>
        [Required]
        public int StaffNurseryId { get; set; }

        /// <summary>
        /// スタッフID（必須）
        /// 日報作成者のスタッフ識別子
        /// </summary>
        [Required]
        public int StaffId { get; set; }

        /// <summary>
        /// スタッフナビゲーションプロパティ
        /// 日報作成者のスタッフエンティティへの参照
        /// </summary>
        public virtual Staff Staff { get; set; } = null!;

        /// <summary>
        /// 日報日付（必須）
        /// 日報対象の日付（時刻なし、date型）
        /// </summary>
        [Required]
        [Column(TypeName = "date")]
        public DateTime ReportDate { get; set; }

        /// <summary>
        /// レポート種別（必須）
        /// "activity"（活動）、"meal"（食事）、"sleep"（睡眠）、"health"（健康）、"incident"（事故）、"behavior"（行動）
        /// </summary>
        [Required]
        [StringLength(50)]
        public string ReportKind { get; set; } = string.Empty;

        [Required]
        [StringLength(200)]
        public string Title { get; set; } = string.Empty;

        [Required]
        [StringLength(1000)]
        public string Content { get; set; } = string.Empty;

        [StringLength(1000)]
        public string? Photos { get; set; } // JSON array of photo URLs

        [Required]
        [StringLength(20)]
        public string Status { get; set; } = "draft"; // "draft", "published", "archived"

        public DateTime? PublishedAt { get; set; }

        /// <summary>
        /// 保護者確認済みフラグ
        /// 保護者が日報を確認したかどうか
        /// </summary>
        public bool ParentAcknowledged { get; set; } = false;

        /// <summary>
        /// 確認日時（任意）
        /// 保護者が日報を確認した日時
        /// </summary>
        public DateTime? AcknowledgedAt { get; set; }

        /// <summary>
        /// アクティブフラグ（必須）
        /// デフォルト: true
        /// 論理削除フラグ（false = 削除済み）
        /// </summary>
        [Required]
        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTimeHelper.GetJstNow();

        public DateTime? UpdatedAt { get; set; }

        // ===== デスクトップアプリ用追加プロパティ =====

        /// <summary>
        /// 管理者作成フラグ（必須）
        /// デフォルト: false
        /// 管理者がスタッフに成り代わって作成した場合にtrue
        /// </summary>
        [Required]
        public bool CreatedByAdminUser { get; set; } = false;

        // Navigation properties
        public virtual ICollection<DailyReportResponse> Responses { get; set; } = new List<DailyReportResponse>();
    }
}

using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ReactApp.Server.Models
{
    /// <summary>
    /// 欠席・遅刻通知スタッフ返信エンティティ
    /// 保護者からの欠席・遅刻通知に対するスタッフの返信メッセージを管理
    /// 確認状況、返信内容、スタッフ情報を含む
    /// </summary>
    public class AbsenceNotificationResponse
    {
        /// <summary>
        /// 返信ID（主キー）
        /// システム内の返信一意識別子
        /// </summary>
        [Key]
        public int Id { get; set; }

        /// <summary>
        /// 欠席・遅刻通知ID（必須、外部キー）
        /// 返信対象の欠席・遅刻通知を特定
        /// </summary>
        [Required]
        public int AbsenceNotificationId { get; set; }

        /// <summary>
        /// 欠席・遅刻通知ナビゲーションプロパティ
        /// 返信対象の通知エンティティへの参照
        /// </summary>
        [ForeignKey("AbsenceNotificationId")]
        public virtual AbsenceNotification AbsenceNotification { get; set; } = null!;

        /// <summary>
        /// 保育園ID（必須、外部キー）
        /// スタッフの所属保育園識別子
        /// </summary>
        [Required]
        public int NurseryId { get; set; }

        /// <summary>
        /// スタッフID（必須、外部キー）
        /// 返信を作成したスタッフを特定
        /// </summary>
        [Required]
        public int StaffId { get; set; }

        /// <summary>
        /// スタッフナビゲーションプロパティ
        /// 返信作成スタッフエンティティへの参照
        /// </summary>
        public virtual Staff Staff { get; set; } = null!;

        [Required]
        [StringLength(20)]
        public string ResponseType { get; set; } = string.Empty; // "acknowledged", "approved", "rejected", "requires_clarification"

        [StringLength(500)]
        public string? ResponseMessage { get; set; }

        [Required]
        public DateTime ResponseAt { get; set; } = DateTime.UtcNow;

        public bool IsActive { get; set; } = true;
    }
}
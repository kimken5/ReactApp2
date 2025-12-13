using System.ComponentModel.DataAnnotations;
using ReactApp.Server.Helpers;

namespace ReactApp.Server.Models
{
    /// <summary>
    /// 写真公開同意エンティティ
    /// 園児の保護者による写真公開・共有の同意管理
    /// プライバシー保護、同意状況追跡、法的コンプライアンスを実現
    /// </summary>
    public class PhotoConsent
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int PhotoId { get; set; }
        public virtual Photo Photo { get; set; } = null!;

        [Required]
        public int NurseryId { get; set; }

        [Required]
        public int ChildId { get; set; }
        public virtual Child Child { get; set; } = null!;

        [Required]
        public int ParentId { get; set; }
        public virtual Parent Parent { get; set; } = null!;

        /// <summary>
        /// 同意状況（必須、20文字以内）
        /// 現在の同意状態
        /// "pending", "granted", "denied"
        /// </summary>
        [Required]
        [StringLength(20)]
        public string ConsentStatus { get; set; } = "pending";

        /// <summary>
        /// 備考（任意、500文字以内）
        /// 同意に関する追加情報や条件
        /// </summary>
        [StringLength(500)]
        public string? Notes { get; set; }

        /// <summary>
        /// 同意依頼日時（必須）
        /// 同意が依頼された日時（UTC）
        /// </summary>
        [Required]
        public DateTime RequestedAt { get; set; } = DateTimeHelper.GetJstNow();

        /// <summary>
        /// 回答日時（任意）
        /// 保護者が同意に回答した日時（UTC）
        /// </summary>
        public DateTime? RespondedAt { get; set; }

        /// <summary>
        /// アクティブ状態（必須、論理削除フラグ）
        /// true: 有効、false: 論理削除済み
        /// </summary>
        [Required]
        public bool IsActive { get; set; } = true;

        /// <summary>
        /// 更新日時（任意）
        /// 同意情報が最後に更新された日時
        /// </summary>
        public DateTime? UpdatedAt { get; set; }
    }
}

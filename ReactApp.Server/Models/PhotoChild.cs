using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ReactApp.Server.Models
{
    /// <summary>
    /// 写真-園児関連エンティティ
    /// 写真に写っている園児との関連付けを管理
    /// 主要被写体識別、タグ付け管理、プライバシー制御を実現
    /// </summary>
    public class PhotoChild
    {
        [Key, Column(Order = 0)]
        [Required]
        public int PhotoId { get; set; }
        public virtual Photo Photo { get; set; } = null!;

        [Key, Column(Order = 1)]
        [Required]
        public int NurseryId { get; set; }

        [Key, Column(Order = 2)]
        [Required]
        public int ChildId { get; set; }
        public virtual Child Child { get; set; } = null!;

        /// <summary>
        /// 主要被写体フラグ（必須）
        /// この園児が写真のメイン被写体かどうか
        /// </summary>
        [Required]
        public bool IsPrimarySubject { get; set; } = false;

        /// <summary>
        /// 関連付け日時（必須）
        /// 写真と園児が関連付けられた日時（UTC）
        /// </summary>
        [Required]
        public DateTime AddedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// 関連付け実行スタッフID（任意、外部キー）
        /// この関連付けを実行したスタッフのID
        /// </summary>
        public int? AddedByStaffId { get; set; }

        /// <summary>
        /// 関連付け実行スタッフナビゲーションプロパティ
        /// 関連付け実行スタッフエンティティへの参照
        /// </summary>
        public virtual Staff? AddedByStaff { get; set; }

        /// <summary>
        /// アクティブ状態（必須、論理削除フラグ）
        /// true: 有効、false: 論理削除済み
        /// </summary>
        [Required]
        public bool IsActive { get; set; } = true;
    }
}
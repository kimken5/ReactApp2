using System.ComponentModel.DataAnnotations;

namespace ReactApp.Server.Models
{
    /// <summary>
    /// 家族構成員エンティティ
    /// 保護者と園児の関係性と権限管理を実現
    /// 家族内での役割、通知設定、閲覧権限、お迎え許可などを統合管理
    /// </summary>
    public class FamilyMember
    {
        /// <summary>
        /// 家族構成員ID（主キー）
        /// システム内の家族構成員一意識別子
        /// </summary>
        [Key]
        public int Id { get; set; }

        /// <summary>
        /// 保護者ID（必須、外部キー）
        /// 家族構成員を担当する保護者を特定
        /// </summary>
        [Required]
        public int ParentId { get; set; }

        /// <summary>
        /// 保護者ナビゲーションプロパティ
        /// 担当保護者エンティティへの参照
        /// </summary>
        public virtual Parent Parent { get; set; } = null!;

        /// <summary>
        /// 保育園ID（必須、外部キー）
        /// 園児の所属保育園識別子
        /// </summary>
        [Required]
        public int NurseryId { get; set; }

        /// <summary>
        /// 園児ID（必須、外部キー）
        /// 関係対象の園児を特定
        /// </summary>
        [Required]
        public int ChildId { get; set; }

        /// <summary>
        /// 園児ナビゲーションプロパティ
        /// 対象園児エンティティへの参照
        /// </summary>
        public virtual Child Child { get; set; } = null!;

        /// <summary>
        /// 続柄タイプ（必須、20文字以内）
        /// 園児との関係性を表す識別子
        /// "father", "mother", "grandfather", "grandmother", "brother", "sister", "other"
        /// </summary>
        [Required]
        [StringLength(20)]
        public string RelationshipType { get; set; } = string.Empty;

        /// <summary>
        /// 表示名（任意、100文字以内）
        /// UIでの表示用カスタム名称
        /// </summary>
        [StringLength(100)]
        public string? DisplayName { get; set; }

        /// <summary>
        /// 主要連絡先フラグ（必須）
        /// この構成員が主要な連絡先かどうか
        /// </summary>
        [Required]
        public bool IsPrimaryContact { get; set; } = false;

        /// <summary>
        /// 通知受信許可（必須）
        /// この構成員が通知を受信するかどうか
        /// </summary>
        [Required]
        public bool CanReceiveNotifications { get; set; } = true;

        /// <summary>
        /// 日報閲覧権限（必須）
        /// 日報の閲覧が許可されているかどうか
        /// </summary>
        [Required]
        public bool CanViewReports { get; set; } = true;

        /// <summary>
        /// 写真閲覧権限（必須）
        /// 写真の閲覧が許可されているかどうか
        /// </summary>
        [Required]
        public bool CanViewPhotos { get; set; } = true;

        /// <summary>
        /// お迎え許可（必須）
        /// 園児のお迎えが許可されているかどうか
        /// </summary>
        [Required]
        public bool HasPickupPermission { get; set; } = true;

        /// <summary>
        /// 参加日時（必須）
        /// 家族構成員として参加した日時（UTC）
        /// </summary>
        [Required]
        public DateTime JoinedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// 作成日時（必須）
        /// エンティティが作成された日時（UTC）
        /// </summary>
        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// アクティブ状態（必須、論理削除フラグ）
        /// true: 有効、false: 論理削除済み
        /// </summary>
        [Required]
        public bool IsActive { get; set; } = true;

        /// <summary>
        /// 更新日時（任意）
        /// エンティティが最後に更新された日時
        /// </summary>
        public DateTime? UpdatedAt { get; set; }

        /// <summary>
        /// 招待者保護者ID（任意、外部キー）
        /// この構成員を招待した保護者のID
        /// </summary>
        public int? InvitedByParentId { get; set; }

        /// <summary>
        /// 招待者保護者ナビゲーションプロパティ
        /// 招待者エンティティへの参照
        /// </summary>
        public virtual Parent? InvitedByParent { get; set; }
    }
}
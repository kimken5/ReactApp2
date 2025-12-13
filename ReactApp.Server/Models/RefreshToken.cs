using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using ReactApp.Server.Helpers;

namespace ReactApp.Server.Models
{
    /// <summary>
    /// リフレッシュトークンエンティティ
    /// JWT認証におけるリフレッシュトークンの管理
    /// セキュリティ制御、トークン失効、セッション管理を実現
    /// </summary>
    public class RefreshToken
    {
        [Key]
        public int Id { get; set; }

        public int? ParentId { get; set; }

        [Required]
        [StringLength(500)]
        public string Token { get; set; } = string.Empty;

        [Required]
        [StringLength(500)]
        public string JwtId { get; set; } = string.Empty;

        /// <summary>
        /// 作成日時
        /// リフレッシュトークンが作成された日時（UTC）
        /// </summary>
        public DateTime CreatedAt { get; set; } = DateTimeHelper.GetJstNow();

        /// <summary>
        /// 有効期限
        /// リフレッシュトークンの有効期限（UTC、デフォルト7日後）
        /// </summary>
        public DateTime ExpiresAt { get; set; } = DateTimeHelper.GetJstNow().AddDays(7);

        /// <summary>
        /// 失効フラグ
        /// トークンが失効されているかどうか
        /// </summary>
        public bool IsRevoked { get; set; } = false;

        /// <summary>
        /// 失効日時（任意）
        /// トークンが失効された日時（UTC）
        /// </summary>
        public DateTime? RevokedAt { get; set; }

        /// <summary>
        /// クライアントIPアドレス（任意、45文字以内）
        /// トークン発行時のクライアントIPアドレス
        /// </summary>
        [StringLength(45)]
        public string? ClientIpAddress { get; set; }

        /// <summary>
        /// ユーザーエージェント（任意、500文字以内）
        /// トークン発行時のクライアント情報
        /// </summary>
        [StringLength(500)]
        public string? UserAgent { get; set; }

        /// <summary>
        /// スタッフ保育園ID（任意、外部キー）
        /// スタッフの所属保育園識別子（スタッフ認証の場合）
        /// </summary>
        public int? StaffNurseryId { get; set; }

        /// <summary>
        /// スタッフID（任意、外部キー）
        /// トークン所有者のスタッフID（スタッフ認証の場合）
        /// </summary>
        public int? StaffId { get; set; }

        /// <summary>
        /// 保護者ナビゲーションプロパティ
        /// トークン所有者保護者エンティティへの参照
        /// </summary>
        [ForeignKey("ParentId")]
        public virtual Parent? Parent { get; set; }

        /// <summary>
        /// スタッフナビゲーションプロパティ
        /// トークン所有者スタッフエンティティへの参照
        /// </summary>
        public virtual Staff? Staff { get; set; }
    }
}

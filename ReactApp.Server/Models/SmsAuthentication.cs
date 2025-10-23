using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ReactApp.Server.Models
{
    /// <summary>
    /// SMS認証エンティティ
    /// 電話番号を使用した本人確認システム
    /// 認証コード生成、検証、セキュリティ制御、不正アクセス防止を実現
    /// </summary>
    public class SmsAuthentication
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(15)]
        public string PhoneNumber { get; set; } = string.Empty;

        [Required]
        [StringLength(6)]
        public string Code { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        public string HashedCode { get; set; } = string.Empty;

        /// <summary>
        /// 作成日時
        /// SMS認証が作成された日時（UTC）
        /// </summary>
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// 有効期限
        /// 認証コードの有効期限（UTC、デフォルト5分後）
        /// </summary>
        public DateTime ExpiresAt { get; set; } = DateTime.UtcNow.AddMinutes(5);

        /// <summary>
        /// 使用済みフラグ
        /// 認証コードが使用済みかどうか
        /// </summary>
        public bool IsUsed { get; set; } = false;

        /// <summary>
        /// 使用日時（任意）
        /// 認証コードが使用された日時（UTC）
        /// </summary>
        public DateTime? UsedAt { get; set; }

        /// <summary>
        /// 試行回数
        /// 認証コードの入力試行回数
        /// </summary>
        public int AttemptCount { get; set; } = 0;

        /// <summary>
        /// クライアントIPアドレス（任意、45文字以内）
        /// 認証リクエスト元のIPアドレス
        /// </summary>
        [StringLength(45)]
        public string? ClientIpAddress { get; set; }

        /// <summary>
        /// ユーザーエージェント（任意、500文字以内）
        /// 認証リクエスト時のクライアント情報
        /// </summary>
        [StringLength(500)]
        public string? UserAgent { get; set; }

        /// <summary>
        /// 保護者ID（任意、外部キー）
        /// 認証対象の保護者ID（登録済みユーザーの場合）
        /// </summary>
        public int? ParentId { get; set; }

        /// <summary>
        /// 保護者ナビゲーションプロパティ
        /// 認証対象保護者エンティティへの参照
        /// </summary>
        [ForeignKey("ParentId")]
        public virtual Parent? Parent { get; set; }

        /// <summary>
        /// スタッフ保育園ID（任意、外部キー）
        /// スタッフの所属保育園識別子（登録済みスタッフの場合）
        /// </summary>
        public int? StaffNurseryId { get; set; }

        /// <summary>
        /// スタッフID（任意、外部キー）
        /// 認証対象のスタッフID（登録済みスタッフの場合）
        /// </summary>
        public int? StaffId { get; set; }

        /// <summary>
        /// スタッフナビゲーションプロパティ
        /// 認証対象スタッフエンティティへの参照
        /// </summary>
        public virtual Staff? Staff { get; set; }
    }
}
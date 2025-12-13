using System.ComponentModel.DataAnnotations;
using ReactApp.Server.Helpers;

namespace ReactApp.Server.Models
{
    /// <summary>
    /// 写真アクセスログエンティティ
    /// 保護者による写真閲覧・ダウンロード履歴を記録
    /// アクセス制御、監査証跡、セキュリティ管理を実現
    /// </summary>
    public class PhotoAccess
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int PhotoId { get; set; }
        public virtual Photo Photo { get; set; } = null!;

        [Required]
        public int ParentId { get; set; }
        public virtual Parent Parent { get; set; } = null!;

        /// <summary>
        /// アクセスタイプ（必須、20文字以内）
        /// アクセスの種類を指定
        /// "view", "download"
        /// </summary>
        [Required]
        [StringLength(20)]
        public string AccessType { get; set; } = string.Empty;

        /// <summary>
        /// アクセス日時（必須）
        /// 写真にアクセスされた日時（UTC）
        /// </summary>
        [Required]
        public DateTime AccessedAt { get; set; } = DateTimeHelper.GetJstNow();

        /// <summary>
        /// IPアドレス（任意、45文字以内）
        /// アクセス元のIPアドレス（IPv4/IPv6対応）
        /// </summary>
        [StringLength(45)]
        public string? IpAddress { get; set; }

        /// <summary>
        /// ユーザーエージェント（任意、500文字以内）
        /// アクセス時のブラウザー・アプリ情報
        /// </summary>
        [StringLength(500)]
        public string? UserAgent { get; set; }

        /// <summary>
        /// 成功フラグ（必須）
        /// アクセスが成功したかどうか
        /// </summary>
        [Required]
        public bool IsSuccessful { get; set; } = true;

        /// <summary>
        /// エラーメッセージ（任意、200文字以内）
        /// アクセス失敗時の詳細エラー情報
        /// </summary>
        [StringLength(200)]
        public string? ErrorMessage { get; set; }
    }
}

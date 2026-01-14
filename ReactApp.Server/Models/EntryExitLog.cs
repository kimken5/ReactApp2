using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using ReactApp.Server.Helpers;

namespace ReactApp.Server.Models
{
    /// <summary>
    /// 入退管理ログエンティティ
    /// 保護者の入退園記録を管理するデータモデル
    /// </summary>
    public class EntryExitLog
    {
        /// <summary>
        /// 入退ログID（主キー）
        /// </summary>
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        /// <summary>
        /// 保護者ID（必須）
        /// この入退ログに関連する保護者のID
        /// </summary>
        [Required]
        public int ParentId { get; set; }

        /// <summary>
        /// 保育園ID（必須）
        /// この入退ログが記録された保育園のID
        /// </summary>
        [Required]
        public int NurseryId { get; set; }

        /// <summary>
        /// 入退種別（必須）
        /// "Entry" = 入（登園）、"Exit" = 出（降園）
        /// </summary>
        [Required]
        [StringLength(10)]
        public string EntryType { get; set; } = string.Empty;

        /// <summary>
        /// 入退時刻
        /// 保護者が入退園した日時（JST）
        /// </summary>
        [Required]
        public DateTime Timestamp { get; set; } = DateTimeHelper.GetJstNow();

        /// <summary>
        /// レコード作成日時
        /// このレコードが作成された日時（JST）
        /// </summary>
        public DateTime CreatedAt { get; set; } = DateTimeHelper.GetJstNow();

        // ナビゲーションプロパティは明示的に無視される（OnModelCreatingで設定）
    }
}

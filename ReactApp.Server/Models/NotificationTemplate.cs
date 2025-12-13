using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using ReactApp.Server.Helpers;

namespace ReactApp.Server.Models
{
    /// <summary>
    /// 通知テンプレート管理エンティティ
    /// プラットフォーム別通知JSONテンプレートを管理
    /// </summary>
    [Table("NotificationTemplates")]
    public class NotificationTemplate
    {
        /// <summary>
        /// テンプレートID（主キー）
        /// </summary>
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        /// <summary>
        /// 通知種別（general/absence/report）
        /// テンプレートの用途分類
        /// </summary>
        [Required]
        [StringLength(50)]
        public string NotificationType { get; set; } = string.Empty;

        /// <summary>
        /// プラットフォーム（Android/iOS）
        /// テンプレート対象のプラットフォーム
        /// </summary>
        [Required]
        [StringLength(20)]
        public string Platform { get; set; } = string.Empty;

        /// <summary>
        /// JSON通知テンプレート
        /// プラットフォーム固有の通知JSON構造
        /// プレースホルダー（@title@, @body@等）を含む
        /// </summary>
        [Required]
        [Column(TypeName = "NVARCHAR(MAX)")]
        public string TemplateJson { get; set; } = string.Empty;

        /// <summary>
        /// アクティブフラグ
        /// テンプレートが使用可能かどうかを示す
        /// </summary>
        [Required]
        public bool IsActive { get; set; } = true;

        /// <summary>
        /// 作成日時
        /// テンプレートの初回作成日時
        /// </summary>
        [Required]
        public DateTime CreatedAt { get; set; } = DateTimeHelper.GetJstNow();

        /// <summary>
        /// 更新日時
        /// テンプレートの最終更新日時
        /// </summary>
        [Required]
        public DateTime UpdatedAt { get; set; } = DateTimeHelper.GetJstNow();
    }
}

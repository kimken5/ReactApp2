using System.ComponentModel.DataAnnotations;

namespace ReactApp.Server.DTOs
{
    /// <summary>
    /// カスタマイズ設定DTO
    /// 保護者のフォントサイズと言語設定をクライアントとサーバー間で伝送するためのデータ転送オブジェクト
    /// </summary>
    public class CustomizationSettingsDto
    {
        public int Id { get; set; }
        public int ParentId { get; set; }

        /// <summary>
        /// フォントサイズ設定
        /// 値: small, medium, large, xlarge
        /// </summary>
        [Required]
        [StringLength(10)]
        public string FontSize { get; set; } = "medium";

        /// <summary>
        /// 言語設定
        /// 値: ja, en, zh-CN, ko
        /// </summary>
        [Required]
        [StringLength(10)]
        public string Language { get; set; } = "ja";

        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    /// <summary>
    /// カスタマイズ設定更新DTO
    /// </summary>
    public class UpdateCustomizationSettingsDto
    {
        /// <summary>
        /// フォントサイズ設定（任意）
        /// 値: small, medium, large, xlarge
        /// </summary>
        [StringLength(10)]
        public string? FontSize { get; set; }

        /// <summary>
        /// 言語設定（任意）
        /// 値: ja, en, zh-CN, ko
        /// </summary>
        [StringLength(10)]
        public string? Language { get; set; }
    }
}

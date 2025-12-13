using System.ComponentModel.DataAnnotations;
using ReactApp.Server.Helpers;

namespace ReactApp.Server.Models
{
    /// <summary>
    /// ユーザー役割選択設定エンティティ
    /// 電話番号を持つユーザーが保護者とスタッフの両方の役割を持つ場合の
    /// 優先役割設定を管理するデータモデル
    /// </summary>
    public class UserRolePreference
    {
        /// <summary>
        /// 設定ID（主キー）
        /// システム内の役割選択設定一意識別子
        /// </summary>
        [Key]
        public int Id { get; set; }

        /// <summary>
        /// 電話番号（必須、一意制約）
        /// 最大15桁の電話番号（一意制約により重複不可）
        /// </summary>
        [Required]
        [StringLength(15)]
        public string PhoneNumber { get; set; } = string.Empty;

        /// <summary>
        /// 優先役割（必須）
        /// "Parent"（保護者）または"Staff"（スタッフ）のいずれか
        /// </summary>
        [Required]
        [StringLength(20)]
        public string PreferredRole { get; set; } = string.Empty;

        /// <summary>
        /// 作成日時
        /// 設定が最初に作成された日時（UTC）
        /// </summary>
        public DateTime CreatedAt { get; set; } = DateTimeHelper.GetJstNow();

        /// <summary>
        /// 更新日時
        /// 設定が最後に更新された日時（UTC）
        /// </summary>
        public DateTime UpdatedAt { get; set; } = DateTimeHelper.GetJstNow();
    }
}

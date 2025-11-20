using System.ComponentModel.DataAnnotations;

namespace ReactApp.Server.DTOs
{
    /// <summary>
    /// 保護者DTO
    /// 保護者の基本情報をクライアントとサーバー間で伝送するためのデータ転送オブジェクト
    /// </summary>
    public class ParentDto
    {
        /// <summary>
        /// 保護者ID
        /// システム内の保護者一意識別子
        /// </summary>
        public int Id { get; set; }

        /// <summary>
        /// 電話番号（必須）
        /// 最大15文字の有効な電話番号、認証に使用
        /// </summary>
        [Required]
        [Phone]
        [StringLength(15)]
        public string PhoneNumber { get; set; } = string.Empty;

        /// <summary>
        /// 保護者名（任意）
        /// 最大100文字の保護者氏名
        /// </summary>
        [StringLength(100)]
        public string? Name { get; set; }

        /// <summary>
        /// メールアドレス（任意）
        /// 最大200文字の有効なメールアドレス形式
        /// </summary>
        [EmailAddress]
        [StringLength(200)]
        public string? Email { get; set; }

        /// <summary>
        /// 住所（任意）
        /// 最大200文字の住所情報
        /// </summary>
        [StringLength(200)]
        public string? Address { get; set; }

        /// <summary>
        /// 保育園ID
        /// この保護者が所属する保育園の識別子
        /// </summary>
        public int NurseryId { get; set; }

        /// <summary>
        /// アカウント有効状態
        /// 保護者アカウントがアクティブかどうか
        /// </summary>
        public bool IsActive { get; set; }

        /// <summary>
        /// 作成日時
        /// 保護者情報がシステムに登録された日時
        /// </summary>
        public DateTime CreatedAt { get; set; }

        /// <summary>
        /// 更新日時（任意）
        /// 保護者情報が最後に更新された日時
        /// </summary>
        public DateTime? UpdatedAt { get; set; }

        /// <summary>
        /// 最終ログイン日時（任意）
        /// 保護者が最後にログインした日時
        /// </summary>
        public DateTime? LastLoginAt { get; set; }

        /// <summary>
        /// 関連園児一覧
        /// この保護者に関連する園児たちの情報一覧
        /// </summary>
        public List<ChildDto> Children { get; set; } = new List<ChildDto>();
    }
}
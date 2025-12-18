using System.ComponentModel.DataAnnotations;

namespace ReactApp.Server.DTOs
{
    /// <summary>
    /// 園児DTO
    /// 園児の基本情報をクライアントとサーバー間で伝送するためのデータ転送オブジェクト
    /// </summary>
    public class ChildDto
    {
        /// <summary>
        /// 園児ID
        /// システム内の園児一意識別子
        /// </summary>
        public int Id { get; set; }

        /// <summary>
        /// 園児名（必須）
        /// 最大100文字の園児氏名
        /// </summary>
        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;

        /// <summary>
        /// ふりがな（任意）
        /// 最大100文字の園児名のふりがな
        /// </summary>
        [StringLength(100)]
        public string? Furigana { get; set; }

        /// <summary>
        /// 生年月日（必須）
        /// 園児の生年月日、年齢計算や成長記録管理に使用
        /// </summary>
        [Required]
        public DateTime DateOfBirth { get; set; }

        /// <summary>
        /// 性別（必須）
        /// 最大10文字で性別を表示（男、女、その他）
        /// </summary>
        [Required]
        [StringLength(10)]
        public string Gender { get; set; } = string.Empty;

        /// <summary>
        /// 保育園ID（必須）
        /// 園児が通う保育園の識別子
        /// </summary>
        [Required]
        public int NurseryId { get; set; }

        /// <summary>
        /// クラスID（任意）
        /// 最大50文字の所属クラス識別子
        /// </summary>
        [StringLength(50)]
        public string? ClassId { get; set; }

        /// <summary>
        /// 医療情報メモ（任意）
        /// 最大500文字でアレルギーや病歴などの医療関連情報
        /// </summary>
        [StringLength(500)]
        public string? MedicalNotes { get; set; }

        /// <summary>
        /// 特別指示事項（任意）
        /// 最大500文字で保育上の特別な注意事項や指示
        /// </summary>
        [StringLength(500)]
        public string? SpecialInstructions { get; set; }

        /// <summary>
        /// アカウント有効状態
        /// 園児がアクティブかどうか（在園中か退園済みか）
        /// </summary>
        public bool IsActive { get; set; }

        /// <summary>
        /// 作成日時
        /// 園児情報がシステムに登録された日時
        /// </summary>
        public DateTime CreatedAt { get; set; }

        /// <summary>
        /// 更新日時（任意）
        /// 園児情報が最後に更新された日時
        /// </summary>
        public DateTime? UpdatedAt { get; set; }

        /// <summary>
        /// 撮影禁止フラグ（デフォルト: false - 撮影・共有を許可）
        /// </summary>
        public bool NoPhoto { get; set; }

        /// <summary>
        /// 関連保護者一覧
        /// この園児に関連する保護者たちの情報一覧
        /// </summary>
        public List<ParentDto> Parents { get; set; } = new List<ParentDto>();
    }
}
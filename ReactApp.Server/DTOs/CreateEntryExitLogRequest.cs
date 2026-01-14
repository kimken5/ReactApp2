using System.ComponentModel.DataAnnotations;

namespace ReactApp.Server.DTOs
{
    /// <summary>
    /// 入退ログ作成リクエストDTO
    /// バーコードスキャン時に送信されるデータ
    /// </summary>
    public class CreateEntryExitLogRequest
    {
        /// <summary>
        /// 保護者ID（必須）
        /// バーコードから読み取った保護者ID
        /// </summary>
        [Required(ErrorMessage = "保護者IDは必須です")]
        public int ParentId { get; set; }

        /// <summary>
        /// 保育園ID（必須）
        /// 入退登録端末が所属する保育園のID
        /// </summary>
        [Required(ErrorMessage = "保育園IDは必須です")]
        public int NurseryId { get; set; }

        /// <summary>
        /// 入退種別（必須）
        /// "Entry" = 入（登園）、"Exit" = 出（降園）
        /// </summary>
        [Required(ErrorMessage = "入退種別は必須です")]
        [RegularExpression("^(Entry|Exit)$", ErrorMessage = "入退種別は 'Entry' または 'Exit' である必要があります")]
        public string EntryType { get; set; } = string.Empty;
    }
}

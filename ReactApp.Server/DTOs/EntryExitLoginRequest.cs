using System.ComponentModel.DataAnnotations;

namespace ReactApp.Server.DTOs
{
    /// <summary>
    /// 入退登録ログインリクエストDTO
    /// 入退登録画面用の認証リクエスト
    /// </summary>
    public class EntryExitLoginRequest
    {
        /// <summary>
        /// 保育園ログインID（必須）
        /// </summary>
        [Required(ErrorMessage = "ログインIDは必須です")]
        [StringLength(50, ErrorMessage = "ログインIDは50文字以内で入力してください")]
        public string LoginId { get; set; } = string.Empty;

        /// <summary>
        /// 入退管理用パスワード（必須）
        /// </summary>
        [Required(ErrorMessage = "パスワードは必須です")]
        public string Password { get; set; } = string.Empty;
    }
}

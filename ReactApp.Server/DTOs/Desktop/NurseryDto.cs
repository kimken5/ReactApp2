using System.ComponentModel.DataAnnotations;

namespace ReactApp.Server.DTOs.Desktop
{
    /// <summary>
    /// 保育園情報DTO
    /// </summary>
    public class NurseryDto
    {
        public int Id { get; set; }

        [Required(ErrorMessage = "保育園名は必須です")]
        [StringLength(100, ErrorMessage = "保育園名は100文字以内で入力してください")]
        public string Name { get; set; } = string.Empty;

        [StringLength(200, ErrorMessage = "住所は200文字以内で入力してください")]
        public string? Address { get; set; }

        [Phone(ErrorMessage = "有効な電話番号を入力してください")]
        [StringLength(20, ErrorMessage = "電話番号は20文字以内で入力してください")]
        public string? PhoneNumber { get; set; }

        [EmailAddress(ErrorMessage = "有効なメールアドレスを入力してください")]
        [StringLength(100, ErrorMessage = "メールアドレスは100文字以内で入力してください")]
        public string? Email { get; set; }

        public int CurrentAcademicYear { get; set; }

        [StringLength(50, ErrorMessage = "ログインIDは50文字以内で入力してください")]
        public string? LoginId { get; set; }

        public DateTime? LastLoginAt { get; set; }
        public bool IsLocked { get; set; }
        public DateTime? LockedUntil { get; set; }
        public int LoginAttempts { get; set; }
    }

    /// <summary>
    /// 保育園情報更新リクエストDTO
    /// </summary>
    public class UpdateNurseryRequestDto
    {
        [Required(ErrorMessage = "保育園名は必須です")]
        [StringLength(100, ErrorMessage = "保育園名は100文字以内で入力してください")]
        public string Name { get; set; } = string.Empty;

        [StringLength(200, ErrorMessage = "住所は200文字以内で入力してください")]
        public string? Address { get; set; }

        [Phone(ErrorMessage = "有効な電話番号を入力してください")]
        [StringLength(20, ErrorMessage = "電話番号は20文字以内で入力してください")]
        public string? PhoneNumber { get; set; }

        [EmailAddress(ErrorMessage = "有効なメールアドレスを入力してください")]
        [StringLength(100, ErrorMessage = "メールアドレスは100文字以内で入力してください")]
        public string? Email { get; set; }
    }
}

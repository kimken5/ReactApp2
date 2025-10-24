using System.ComponentModel.DataAnnotations;

namespace ReactApp.Server.DTOs.Desktop
{
    /// <summary>
    /// 保護者情報DTO
    /// </summary>
    public class ParentDto
    {
        public int Id { get; set; }
        public string PhoneNumber { get; set; } = string.Empty;
        public string? Name { get; set; }
        public string? Email { get; set; }
        public string? Address { get; set; }
        public bool PushNotificationsEnabled { get; set; }
        public bool AbsenceConfirmationEnabled { get; set; }
        public bool DailyReportEnabled { get; set; }
        public bool EventNotificationEnabled { get; set; }
        public bool AnnouncementEnabled { get; set; }
        public string FontSize { get; set; } = "medium";
        public string Language { get; set; } = "ja";
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public DateTime? LastLoginAt { get; set; }

        // 関連情報
        public List<ChildBasicInfoDto> Children { get; set; } = new();
    }

    /// <summary>
    /// 保護者作成リクエストDTO
    /// </summary>
    public class CreateParentRequestDto
    {
        [Required(ErrorMessage = "電話番号は必須です")]
        [Phone(ErrorMessage = "有効な電話番号を入力してください")]
        [StringLength(15, ErrorMessage = "電話番号は15文字以内で入力してください")]
        public string PhoneNumber { get; set; } = string.Empty;

        [StringLength(100, ErrorMessage = "氏名は100文字以内で入力してください")]
        public string? Name { get; set; }

        [EmailAddress(ErrorMessage = "有効なメールアドレスを入力してください")]
        [StringLength(200, ErrorMessage = "メールアドレスは200文字以内で入力してください")]
        public string? Email { get; set; }

        [StringLength(200, ErrorMessage = "住所は200文字以内で入力してください")]
        public string? Address { get; set; }

        /// <summary>
        /// 関連付ける園児IDのリスト（NurseryId, ChildId のペア）
        /// </summary>
        public List<ChildIdentifier> ChildIds { get; set; } = new();
    }

    /// <summary>
    /// 保護者更新リクエストDTO
    /// </summary>
    public class UpdateParentRequestDto
    {
        [StringLength(100, ErrorMessage = "氏名は100文字以内で入力してください")]
        public string? Name { get; set; }

        [EmailAddress(ErrorMessage = "有効なメールアドレスを入力してください")]
        [StringLength(200, ErrorMessage = "メールアドレスは200文字以内で入力してください")]
        public string? Email { get; set; }

        [StringLength(200, ErrorMessage = "住所は200文字以内で入力してください")]
        public string? Address { get; set; }

        public bool? PushNotificationsEnabled { get; set; }
        public bool? AbsenceConfirmationEnabled { get; set; }
        public bool? DailyReportEnabled { get; set; }
        public bool? EventNotificationEnabled { get; set; }
        public bool? AnnouncementEnabled { get; set; }

        [StringLength(10)]
        public string? FontSize { get; set; }

        [StringLength(10)]
        public string? Language { get; set; }

        public bool? IsActive { get; set; }
    }

    /// <summary>
    /// 保護者一覧フィルタDTO
    /// </summary>
    public class ParentFilterDto
    {
        public int? NurseryId { get; set; }
        public string? ClassId { get; set; }
        public bool? IsActive { get; set; }
        public string? SearchKeyword { get; set; }
    }

    /// <summary>
    /// 園児基本情報DTO（保護者情報内で使用）
    /// </summary>
    public class ChildBasicInfoDto
    {
        public int NurseryId { get; set; }
        public int ChildId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? ClassId { get; set; }
        public string? ClassName { get; set; }
        public int Age { get; set; }
    }

    /// <summary>
    /// 園児識別子（複合主キー用）
    /// </summary>
    public class ChildIdentifier
    {
        public int NurseryId { get; set; }
        public int ChildId { get; set; }
    }
}

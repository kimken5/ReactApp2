using System.ComponentModel.DataAnnotations;

namespace ReactApp.Server.DTOs.Desktop
{
    /// <summary>
    /// 職員情報DTO
    /// </summary>
    public class StaffDto
    {
        public int NurseryId { get; set; }
        public int StaffId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string Role { get; set; } = string.Empty;
        public string? Position { get; set; }
        public DateTime? LastLoginAt { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        // 関連情報
        public List<StaffClassAssignmentDto> ClassAssignments { get; set; } = new();
    }

    /// <summary>
    /// 職員作成リクエストDTO
    /// </summary>
    public class CreateStaffRequestDto
    {
        [Required(ErrorMessage = "氏名は必須です")]
        [StringLength(50, ErrorMessage = "氏名は50文字以内で入力してください")]
        public string Name { get; set; } = string.Empty;

        [Required(ErrorMessage = "電話番号は必須です")]
        [Phone(ErrorMessage = "有効な電話番号を入力してください")]
        [StringLength(15, ErrorMessage = "電話番号は15文字以内で入力してください")]
        public string PhoneNumber { get; set; } = string.Empty;

        [EmailAddress(ErrorMessage = "有効なメールアドレスを入力してください")]
        [StringLength(200, ErrorMessage = "メールアドレスは200文字以内で入力してください")]
        public string? Email { get; set; }

        [Required(ErrorMessage = "役割は必須です")]
        [StringLength(50, ErrorMessage = "役割は50文字以内で入力してください")]
        public string Role { get; set; } = string.Empty;

        [StringLength(100, ErrorMessage = "役職は100文字以内で入力してください")]
        public string? Position { get; set; }
    }

    /// <summary>
    /// 職員更新リクエストDTO
    /// </summary>
    public class UpdateStaffRequestDto
    {
        [Required(ErrorMessage = "氏名は必須です")]
        [StringLength(50, ErrorMessage = "氏名は50文字以内で入力してください")]
        public string Name { get; set; } = string.Empty;

        [Required(ErrorMessage = "電話番号は必須です")]
        [Phone(ErrorMessage = "有効な電話番号を入力してください")]
        [StringLength(15, ErrorMessage = "電話番号は15文字以内で入力してください")]
        public string PhoneNumber { get; set; } = string.Empty;

        [EmailAddress(ErrorMessage = "有効なメールアドレスを入力してください")]
        [StringLength(200, ErrorMessage = "メールアドレスは200文字以内で入力してください")]
        public string? Email { get; set; }

        [Required(ErrorMessage = "役割は必須です")]
        [StringLength(50, ErrorMessage = "役割は50文字以内で入力してください")]
        public string Role { get; set; } = string.Empty;

        [StringLength(100, ErrorMessage = "役職は100文字以内で入力してください")]
        public string? Position { get; set; }

        public bool? IsActive { get; set; }
    }

    /// <summary>
    /// 職員一覧フィルタDTO
    /// </summary>
    public class StaffFilterDto
    {
        public string? Role { get; set; }
        public string? Position { get; set; }
        public string? ClassId { get; set; }
        public int? AcademicYear { get; set; }
        public bool? IsActive { get; set; }
        public string? SearchKeyword { get; set; }
    }

    /// <summary>
    /// 職員クラス担当割り当てDTO
    /// </summary>
    public class StaffClassAssignmentDto
    {
        public string ClassId { get; set; } = string.Empty;
        public string? ClassName { get; set; }
        public string? Role { get; set; }
        public int AcademicYear { get; set; }
        public bool IsPrimary { get; set; }
        public DateTime? AssignedAt { get; set; }
    }

    /// <summary>
    /// 職員クラス担当割り当てリクエストDTO
    /// </summary>
    public class StaffClassAssignmentRequestDto
    {
        [Required(ErrorMessage = "クラスIDは必須です")]
        [StringLength(50, ErrorMessage = "クラスIDは50文字以内で入力してください")]
        public string ClassId { get; set; } = string.Empty;

        [Required(ErrorMessage = "役割は必須です")]
        [StringLength(50, ErrorMessage = "役割は50文字以内で入力してください")]
        public string Role { get; set; } = string.Empty;

        [Required(ErrorMessage = "年度は必須です")]
        public int AcademicYear { get; set; }
    }
}

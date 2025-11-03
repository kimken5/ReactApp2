using System.ComponentModel.DataAnnotations;

namespace ReactApp.Server.DTOs.Desktop
{
    /// <summary>
    /// 園児情報DTO
    /// </summary>
    public class ChildDto
    {
        public int NurseryId { get; set; }
        public int ChildId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Furigana { get; set; }
        public DateTime DateOfBirth { get; set; }
        public string Gender { get; set; } = string.Empty;
        public string? ClassId { get; set; }
        public string? ClassName { get; set; }
        public string? MedicalNotes { get; set; }
        public string? SpecialInstructions { get; set; }
        public bool IsActive { get; set; }
        public DateTime? GraduationDate { get; set; }
        public string? GraduationStatus { get; set; }
        public string? WithdrawalReason { get; set; }
        public string? BloodType { get; set; }
        public DateTime? LastAttendanceDate { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        // 計算フィールド
        public int Age { get; set; }
        public List<ParentBasicInfoDto> Parents { get; set; } = new();
    }

    /// <summary>
    /// 園児作成リクエストDTO
    /// </summary>
    public class CreateChildRequestDto
    {
        [Required(ErrorMessage = "氏名は必須です")]
        [StringLength(100, ErrorMessage = "氏名は100文字以内で入力してください")]
        public string Name { get; set; } = string.Empty;

        [StringLength(100, ErrorMessage = "ふりがなは100文字以内で入力してください")]
        public string? Furigana { get; set; }

        [Required(ErrorMessage = "生年月日は必須です")]
        public DateTime DateOfBirth { get; set; }

        [Required(ErrorMessage = "性別は必須です")]
        [StringLength(10, ErrorMessage = "性別は10文字以内で入力してください")]
        public string Gender { get; set; } = string.Empty;

        [StringLength(50, ErrorMessage = "クラスIDは50文字以内で入力してください")]
        public string? ClassId { get; set; }

        [StringLength(5, ErrorMessage = "血液型は5文字以内で入力してください")]
        public string? BloodType { get; set; }

        [StringLength(500, ErrorMessage = "医療メモは500文字以内で入力してください")]
        public string? MedicalNotes { get; set; }

        [StringLength(500, ErrorMessage = "特記事項は500文字以内で入力してください")]
        public string? SpecialInstructions { get; set; }

        /// <summary>
        /// 関連付ける保護者IDのリスト
        /// </summary>
        public List<int> ParentIds { get; set; } = new();
    }

    /// <summary>
    /// 園児更新リクエストDTO
    /// </summary>
    public class UpdateChildRequestDto
    {
        [Required(ErrorMessage = "氏名は必須です")]
        [StringLength(100, ErrorMessage = "氏名は100文字以内で入力してください")]
        public string Name { get; set; } = string.Empty;

        [StringLength(100, ErrorMessage = "ふりがなは100文字以内で入力してください")]
        public string? Furigana { get; set; }

        [Required(ErrorMessage = "生年月日は必須です")]
        public DateTime DateOfBirth { get; set; }

        [Required(ErrorMessage = "性別は必須です")]
        [StringLength(10, ErrorMessage = "性別は10文字以内で入力してください")]
        public string Gender { get; set; } = string.Empty;

        [StringLength(50, ErrorMessage = "クラスIDは50文字以内で入力してください")]
        public string? ClassId { get; set; }

        [StringLength(5, ErrorMessage = "血液型は5文字以内で入力してください")]
        public string? BloodType { get; set; }

        [StringLength(500, ErrorMessage = "医療メモは500文字以内で入力してください")]
        public string? MedicalNotes { get; set; }

        [StringLength(500, ErrorMessage = "特記事項は500文字以内で入力してください")]
        public string? SpecialInstructions { get; set; }

        public DateTime? GraduationDate { get; set; }

        [StringLength(20, ErrorMessage = "卒園ステータスは20文字以内で入力してください")]
        public string? GraduationStatus { get; set; }

        [StringLength(200, ErrorMessage = "退園理由は200文字以内で入力してください")]
        public string? WithdrawalReason { get; set; }

        public DateTime? LastAttendanceDate { get; set; }

        public bool IsActive { get; set; } = true;
    }

    /// <summary>
    /// 園児一覧フィルタDTO
    /// </summary>
    public class ChildFilterDto
    {
        public string? ClassId { get; set; }
        public string? GraduationStatus { get; set; }
        public bool? IsActive { get; set; }
        public string? SearchKeyword { get; set; }
    }

    /// <summary>
    /// 保護者基本情報DTO（園児情報内で使用）
    /// </summary>
    public class ParentBasicInfoDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? PhoneNumber { get; set; }
        public string? Email { get; set; }
    }
}

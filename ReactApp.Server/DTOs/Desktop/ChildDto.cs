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
        /// 保護者の登録方法: "select" (既存保護者選択) または "create" (新規作成)
        /// </summary>
        public string ParentRegistrationMode { get; set; } = "select";

        /// <summary>
        /// 関連付ける既存保護者IDのリスト（ParentRegistrationMode = "select" の場合）
        /// </summary>
        public List<int> ParentIds { get; set; } = new();

        /// <summary>
        /// 新規作成する保護者1の情報（ParentRegistrationMode = "create" の場合）
        /// </summary>
        public CreateParentWithChildDto? Parent1 { get; set; }

        /// <summary>
        /// 新規作成する保護者2の情報（ParentRegistrationMode = "create" の場合・任意）
        /// </summary>
        public CreateParentWithChildDto? Parent2 { get; set; }
    }

    /// <summary>
    /// 園児と同時に保護者を作成する際のDTO
    /// </summary>
    public class CreateParentWithChildDto
    {
        [Required(ErrorMessage = "電話番号は必須です")]
        [Phone(ErrorMessage = "有効な電話番号を入力してください")]
        [StringLength(15, ErrorMessage = "電話番号は15文字以内で入力してください")]
        public string PhoneNumber { get; set; } = string.Empty;

        [Required(ErrorMessage = "氏名は必須です")]
        [StringLength(100, ErrorMessage = "氏名は100文字以内で入力してください")]
        public string Name { get; set; } = string.Empty;

        [EmailAddress(ErrorMessage = "有効なメールアドレスを入力してください")]
        [StringLength(200, ErrorMessage = "メールアドレスは200文字以内で入力してください")]
        public string? Email { get; set; }

        [StringLength(200, ErrorMessage = "住所は200文字以内で入力してください")]
        public string? Address { get; set; }
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

        // 日付フィルターは文字列として受け取り、サービス層でDateTimeに変換
        // クエリ文字列からのDateTimeバインディングに問題があるため
        public string? GraduationDateFrom { get; set; }
        public string? GraduationDateTo { get; set; }
        public string? DateOfBirthFrom { get; set; }
        public string? DateOfBirthTo { get; set; }
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

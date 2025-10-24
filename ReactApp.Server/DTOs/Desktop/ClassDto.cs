using System.ComponentModel.DataAnnotations;

namespace ReactApp.Server.DTOs.Desktop
{
    /// <summary>
    /// クラス情報DTO
    /// </summary>
    public class ClassDto
    {
        public int NurseryId { get; set; }
        public string ClassId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public int AgeGroupMin { get; set; }
        public int AgeGroupMax { get; set; }
        public int MaxCapacity { get; set; }
        public int AcademicYear { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        // 計算フィールド
        public int CurrentEnrollment { get; set; }
        public List<string> AssignedStaffNames { get; set; } = new();
    }

    /// <summary>
    /// クラス作成リクエストDTO
    /// </summary>
    public class CreateClassRequestDto
    {
        [Required(ErrorMessage = "クラスIDは必須です")]
        [StringLength(50, ErrorMessage = "クラスIDは50文字以内で入力してください")]
        public string ClassId { get; set; } = string.Empty;

        [Required(ErrorMessage = "クラス名は必須です")]
        [StringLength(50, ErrorMessage = "クラス名は50文字以内で入力してください")]
        public string Name { get; set; } = string.Empty;

        [Required(ErrorMessage = "最小年齢は必須です")]
        [Range(0, 10, ErrorMessage = "最小年齢は0～10の範囲で入力してください")]
        public int AgeGroupMin { get; set; }

        [Required(ErrorMessage = "最大年齢は必須です")]
        [Range(0, 10, ErrorMessage = "最大年齢は0～10の範囲で入力してください")]
        public int AgeGroupMax { get; set; }

        [Required(ErrorMessage = "定員は必須です")]
        [Range(1, 100, ErrorMessage = "定員は1～100の範囲で入力してください")]
        public int MaxCapacity { get; set; }

        public int? AcademicYear { get; set; }
    }

    /// <summary>
    /// クラス更新リクエストDTO
    /// </summary>
    public class UpdateClassRequestDto
    {
        [Required(ErrorMessage = "クラス名は必須です")]
        [StringLength(50, ErrorMessage = "クラス名は50文字以内で入力してください")]
        public string Name { get; set; } = string.Empty;

        [Required(ErrorMessage = "最小年齢は必須です")]
        [Range(0, 10, ErrorMessage = "最小年齢は0～10の範囲で入力してください")]
        public int AgeGroupMin { get; set; }

        [Required(ErrorMessage = "最大年齢は必須です")]
        [Range(0, 10, ErrorMessage = "最大年齢は0～10の範囲で入力してください")]
        public int AgeGroupMax { get; set; }

        [Required(ErrorMessage = "定員は必須です")]
        [Range(1, 100, ErrorMessage = "定員は1～100の範囲で入力してください")]
        public int MaxCapacity { get; set; }

        public int? AcademicYear { get; set; }

        public bool? IsActive { get; set; }
    }

    /// <summary>
    /// クラス一覧フィルタDTO
    /// </summary>
    public class ClassFilterDto
    {
        public int? AcademicYear { get; set; }
        public int? AgeGroupMin { get; set; }
        public int? AgeGroupMax { get; set; }
        public bool? IsActive { get; set; }
        public string? SearchKeyword { get; set; }
    }
}

using System.ComponentModel.DataAnnotations;

namespace ReactApp.Server.DTOs.Desktop
{
    /// <summary>
    /// 入園申込詳細情報DTO
    /// </summary>
    public class ApplicationWorkDto
    {
        public int Id { get; set; }
        public int NurseryId { get; set; }

        // 申請保護者情報
        public string ApplicantName { get; set; } = string.Empty;
        public string ApplicantNameKana { get; set; } = string.Empty;
        public DateTime DateOfBirth { get; set; }
        public string? PostalCode { get; set; }
        public string? Prefecture { get; set; }
        public string? City { get; set; }
        public string? AddressLine { get; set; }
        public string MobilePhone { get; set; } = string.Empty;
        public string? HomePhone { get; set; }
        public string? Email { get; set; }
        public string RelationshipToChild { get; set; } = string.Empty;

        // 園児情報
        public string ChildFamilyName { get; set; } = string.Empty;
        public string ChildFirstName { get; set; } = string.Empty;
        public string ChildFamilyNameKana { get; set; } = string.Empty;
        public string ChildFirstNameKana { get; set; } = string.Empty;
        public DateTime ChildDateOfBirth { get; set; }
        public string ChildGender { get; set; } = string.Empty;
        public string? ChildBloodType { get; set; }
        public string? ChildAllergy { get; set; }
        public string? ChildMedicalNotes { get; set; }
        public string? ChildSpecialInstructions { get; set; }
        public bool ChildNoPhoto { get; set; }

        // 申込管理情報
        public string ApplicationStatus { get; set; } = "Pending";
        public bool IsImported { get; set; }
        public DateTime? ImportedAt { get; set; }
        public int? ImportedByUserId { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public string? RejectionReason { get; set; }

        // 重複保護者情報（フロントエンド表示用）
        public DuplicateParentInfo? DuplicateParentInfo { get; set; }
    }

    /// <summary>
    /// 重複保護者情報
    /// 携帯電話番号が一致する既存保護者がいる場合の情報
    /// </summary>
    public class DuplicateParentInfo
    {
        /// <summary>
        /// 重複あり
        /// </summary>
        public bool HasDuplicate { get; set; }

        /// <summary>
        /// 既存保護者ID
        /// </summary>
        public int? ExistingParentId { get; set; }

        /// <summary>
        /// 既存保護者氏名
        /// </summary>
        public string? ExistingParentName { get; set; }

        /// <summary>
        /// 既存保護者の園児数
        /// </summary>
        public int ChildCount { get; set; }
    }

    /// <summary>
    /// 入園申込一覧項目DTO
    /// </summary>
    public class ApplicationListItemDto
    {
        public int Id { get; set; }
        public string ApplicantName { get; set; } = string.Empty;
        public string ChildFamilyName { get; set; } = string.Empty;
        public string ChildFirstName { get; set; } = string.Empty;

        /// <summary>
        /// 園児フルネーム（表示用: 苗字 + 半角スペース + 名前）
        /// </summary>
        public string ChildName => $"{ChildFamilyName} {ChildFirstName}";

        public DateTime ChildDateOfBirth { get; set; }
        public string RelationshipToChild { get; set; } = string.Empty;
        public string MobilePhone { get; set; } = string.Empty;
        public string ApplicationStatus { get; set; } = "Pending";
        public DateTime CreatedAt { get; set; }
        public DateTime? ImportedAt { get; set; }
        public bool HasDuplicateParent { get; set; }
        public bool ChildNoPhoto { get; set; }
    }

    /// <summary>
    /// 園児情報DTO（複数園児対応）
    /// </summary>
    public class ChildInfoDto
    {
        [Required(ErrorMessage = "園児苗字は必須です")]
        [StringLength(20, ErrorMessage = "園児苗字は20文字以内で入力してください")]
        public string ChildFamilyName { get; set; } = string.Empty;

        [Required(ErrorMessage = "園児名前は必須です")]
        [StringLength(20, ErrorMessage = "園児名前は20文字以内で入力してください")]
        public string ChildFirstName { get; set; } = string.Empty;

        [Required(ErrorMessage = "園児ふりがな（苗字）は必須です")]
        [StringLength(20, ErrorMessage = "園児ふりがな（苗字）は20文字以内で入力してください")]
        public string ChildFamilyNameKana { get; set; } = string.Empty;

        [Required(ErrorMessage = "園児ふりがな（名前）は必須です")]
        [StringLength(20, ErrorMessage = "園児ふりがな（名前）は20文字以内で入力してください")]
        public string ChildFirstNameKana { get; set; } = string.Empty;

        [Required(ErrorMessage = "園児生年月日は必須です")]
        public DateTime ChildDateOfBirth { get; set; }

        [Required(ErrorMessage = "園児性別は必須です")]
        [StringLength(2, ErrorMessage = "園児性別は2文字以内で入力してください")]
        public string ChildGender { get; set; } = string.Empty;

        [StringLength(10, ErrorMessage = "園児血液型は10文字以内で入力してください")]
        public string? ChildBloodType { get; set; }

        [StringLength(200, ErrorMessage = "園児アレルギー情報は200文字以内で入力してください")]
        public string? ChildAllergy { get; set; }

        [StringLength(500, ErrorMessage = "園児医療メモは500文字以内で入力してください")]
        public string? ChildMedicalNotes { get; set; }

        [StringLength(500, ErrorMessage = "園児特別指示は500文字以内で入力してください")]
        public string? ChildSpecialInstructions { get; set; }

        /// <summary>
        /// 撮影禁止フラグ（デフォルト: false - 撮影・共有を許可）
        /// </summary>
        public bool ChildNoPhoto { get; set; } = false;
    }

    /// <summary>
    /// 入園申込作成リクエストDTO（保護者向けWeb申込フォーム）
    /// 複数園児対応（最大4人まで）
    /// </summary>
    public class CreateApplicationRequest
    {
        // 申請保護者情報
        [Required(ErrorMessage = "申請保護者氏名は必須です")]
        [StringLength(100, ErrorMessage = "申請保護者氏名は100文字以内で入力してください")]
        public string ApplicantName { get; set; } = string.Empty;

        [Required(ErrorMessage = "申請保護者フリガナは必須です")]
        [StringLength(100, ErrorMessage = "申請保護者フリガナは100文字以内で入力してください")]
        public string ApplicantNameKana { get; set; } = string.Empty;

        [Required(ErrorMessage = "生年月日は必須です")]
        public DateTime DateOfBirth { get; set; }

        [StringLength(8, ErrorMessage = "郵便番号は8文字以内で入力してください")]
        public string? PostalCode { get; set; }

        [StringLength(10, ErrorMessage = "都道府県は10文字以内で入力してください")]
        public string? Prefecture { get; set; }

        [StringLength(50, ErrorMessage = "市区郡町村は50文字以内で入力してください")]
        public string? City { get; set; }

        [StringLength(200, ErrorMessage = "番地・ビル名等は200文字以内で入力してください")]
        public string? AddressLine { get; set; }

        [Required(ErrorMessage = "電話番号（携帯）は必須です")]
        [StringLength(20, ErrorMessage = "電話番号（携帯）は20文字以内で入力してください")]
        [Phone(ErrorMessage = "有効な電話番号を入力してください")]
        public string MobilePhone { get; set; } = string.Empty;

        [StringLength(20, ErrorMessage = "電話番号（固定）は20文字以内で入力してください")]
        [Phone(ErrorMessage = "有効な電話番号を入力してください")]
        public string? HomePhone { get; set; }

        [StringLength(255, ErrorMessage = "メールアドレスは255文字以内で入力してください")]
        [EmailAddress(ErrorMessage = "有効なメールアドレスを入力してください")]
        public string? Email { get; set; }

        [Required(ErrorMessage = "お子様との続柄は必須です")]
        [StringLength(20, ErrorMessage = "お子様との続柄は20文字以内で入力してください")]
        public string RelationshipToChild { get; set; } = string.Empty;

        // 園児情報（配列、最大4人）
        [Required(ErrorMessage = "園児情報は必須です")]
        [MinLength(1, ErrorMessage = "少なくとも1人の園児情報が必要です")]
        [MaxLength(4, ErrorMessage = "園児は最大4人までです")]
        public List<ChildInfoDto> Children { get; set; } = new List<ChildInfoDto>();
    }

    /// <summary>
    /// 入園申込作成レスポンスDTO
    /// </summary>
    public class CreateApplicationResponse
    {
        public List<int> ApplicationIds { get; set; } = new List<int>();
        public int ChildCount { get; set; }
        public string Message { get; set; } = string.Empty;
    }

    /// <summary>
    /// 入園申込取込リクエストDTO（デスクトップアプリ）
    /// </summary>
    public class ImportApplicationRequest
    {
        /// <summary>
        /// 保護者情報を上書きするか（重複時）
        /// true: 保護者マスタ更新
        /// false: 保護者マスタそのまま
        /// </summary>
        public bool OverwriteParent { get; set; } = true;
    }

    /// <summary>
    /// 入園申込取込結果DTO
    /// </summary>
    public class ImportApplicationResult
    {
        public int ParentId { get; set; }
        public int ChildId { get; set; }
        public bool IsNewParent { get; set; }
        public bool IsNewChild { get; set; }
        public string Message { get; set; } = "入園申込を取り込みました。";

        // フロントエンド表示用の追加プロパティ
        public string ParentName { get; set; } = string.Empty;
        public string ChildName { get; set; } = string.Empty;
        public bool WasParentCreated { get; set; }
        public bool WasParentUpdated { get; set; }
        public bool NoPhotoSet { get; set; } // 撮影禁止設定が有効か
    }

    /// <summary>
    /// 入園申込却下リクエストDTO（デスクトップアプリ）
    /// </summary>
    public class RejectApplicationRequest
    {
        [Required(ErrorMessage = "却下理由は必須です")]
        [StringLength(500, ErrorMessage = "却下理由は500文字以内で入力してください")]
        public string RejectionReason { get; set; } = string.Empty;
    }

    /// <summary>
    /// ApplicationKey検証リクエストDTO（保護者向け）
    /// </summary>
    public class ValidateApplicationKeyRequest
    {
        [Required(ErrorMessage = "申込キーは必須です")]
        public string ApplicationKey { get; set; } = string.Empty;
    }

    /// <summary>
    /// ApplicationKey検証結果DTO
    /// </summary>
    public class ValidateApplicationKeyResult
    {
        public bool IsValid { get; set; }
        public string? NurseryName { get; set; }
        public int? NurseryId { get; set; }

        /// <summary>
        /// 写真機能の利用可否（True: 利用可, False: 利用不可）
        /// </summary>
        public bool PhotoFunction { get; set; }
    }
}

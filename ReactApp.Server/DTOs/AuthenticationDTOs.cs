using System.ComponentModel.DataAnnotations;
using ReactApp.Server.Models;
using ReactApp.Server.Helpers;

namespace ReactApp.Server.DTOs
{
    /// <summary>
    /// SMS認証送信リクエストDTO
    /// 電話番号にSMS認証コードを送信するためのリクエストデータ
    /// </summary>
    public class SendSmsRequest
    {
        /// <summary>
        /// 電話番号（必須）
        /// 10～15桁の有効な電話番号形式である必要がある
        /// </summary>
        [Required]
        [Phone]
        [StringLength(15, MinimumLength = 10)]
        public string PhoneNumber { get; set; } = string.Empty;
    }

    /// <summary>
    /// SMS認証コード検証リクエストDTO
    /// 送信されたSMS認証コードを検証し、認証を完了するためのリクエストデータ
    /// </summary>
    public class VerifySmsRequest
    {
        /// <summary>
        /// 電話番号（必須）
        /// SMS送信時と同じ10～15桁の有効な電話番号
        /// </summary>
        [Required]
        [Phone]
        [StringLength(15, MinimumLength = 10)]
        public string PhoneNumber { get; set; } = string.Empty;

        /// <summary>
        /// SMS認証コード（必須）
        /// 電話番号に送信された6桁の数字認証コード
        /// </summary>
        [Required]
        [StringLength(6, MinimumLength = 6)]
        [RegularExpression(@"^\d{6}$", ErrorMessage = "認証コードは6桁の数字である必要があります。")]
        public string Code { get; set; } = string.Empty;
    }

    /// <summary>
    /// トークンリフレッシュリクエストDTO
    /// 期限切れのアクセストークンをリフレッシュトークンで更新するためのリクエストデータ
    /// </summary>
    public class RefreshTokenRequest
    {
        /// <summary>
        /// アクセストークン（必須）
        /// 期限切れまたは期限間近のJWTアクセストークン
        /// </summary>
        [Required]
        public string AccessToken { get; set; } = string.Empty;

        /// <summary>
        /// リフレッシュトークン（必須）
        /// 新しいアクセストークンを生成するためのリフレッシュトークン
        /// </summary>
        [Required]
        public string RefreshToken { get; set; } = string.Empty;
    }

    /// <summary>
    /// 保護者登録リクエストDTO
    /// 新しい保護者アカウントを登録するためのリクエストデータ
    /// </summary>
    public class RegisterRequestDto
    {
        /// <summary>
        /// 電話番号（必須）
        /// 10～15桁の有効な電話番号、認証の主キーとして使用
        /// </summary>
        [Required]
        [Phone]
        [StringLength(15, MinimumLength = 10)]
        public string PhoneNumber { get; set; } = string.Empty;

        /// <summary>
        /// 保護者名（任意）
        /// 最大100文字の保護者氏名
        /// </summary>
        [StringLength(100)]
        public string? Name { get; set; }

        /// <summary>
        /// メールアドレス（任意）
        /// 最大200文字の有効なメールアドレス形式
        /// </summary>
        [EmailAddress]
        [StringLength(200)]
        public string? Email { get; set; }

        /// <summary>
        /// 住所（任意）
        /// 最大200文字の住所情報
        /// </summary>
        [StringLength(200)]
        public string? Address { get; set; }
    }

    /// <summary>
    /// ログインレスポンスDTO
    /// ログイン成功時に返されるJWTトークンと保護者情報を含むレスポンスデータ
    /// </summary>
    public class LoginResponseDto
    {
        /// <summary>
        /// JWTアクセストークン
        /// API認証に使用する短期間有効なトークン
        /// </summary>
        public string AccessToken { get; set; } = string.Empty;

        /// <summary>
        /// リフレッシュトークン
        /// アクセストークン更新用の長期間有効なトークン
        /// </summary>
        public string RefreshToken { get; set; } = string.Empty;

        /// <summary>
        /// トークン有効期限
        /// アクセストークンの有効期限日時
        /// </summary>
        public DateTime ExpiresAt { get; set; }

        /// <summary>
        /// ログインした保護者情報
        /// 認証成功した保護者の詳細プロフィールデータ
        /// </summary>
        public ParentDto Parent { get; set; } = null!;
    }

    /// <summary>
    /// 認証レスポンスDTO
    /// 認証処理結果を返す統一的なレスポンスフォーマット
    /// </summary>
    public class AuthResponse
    {
        /// <summary>
        /// 認証成功フラグ
        /// 認証処理が成功したかどうかを示す
        /// </summary>
        public bool Success { get; set; }

        /// <summary>
        /// レスポンスメッセージ
        /// 認証処理結果に関するメッセージ
        /// </summary>
        public string Message { get; set; } = string.Empty;

        /// <summary>
        /// JWTアクセストークン（任意）
        /// 認証成功時のみ含まれるアクセストークン
        /// </summary>
        public string? AccessToken { get; set; }

        /// <summary>
        /// リフレッシュトークン（任意）
        /// 認証成功時のみ含まれるリフレッシュトークン
        /// </summary>
        public string? RefreshToken { get; set; }

        /// <summary>
        /// トークン有効期限（任意）
        /// 認証成功時のみ含まれるトークン有効期限
        /// </summary>
        public DateTime? ExpiresAt { get; set; }

        /// <summary>
        /// 保護者情報（任意）
        /// 認証成功時のみ含まれる保護者の基本情報
        /// </summary>
        public ParentInfo? ParentInfo { get; set; }

        /// <summary>
        /// スタッフ情報（任意）
        /// 認証成功時のみ含まれるスタッフの基本情報
        /// </summary>
        public StaffInfo? StaffInfo { get; set; }

        /// <summary>
        /// ユーザー情報（任意）
        /// 認証完了後のユーザー基本情報（フロントエンド用）
        /// </summary>
        public object? User { get; set; }

        /// <summary>
        /// 役割選択が必要かどうか
        /// 複数の役割を持つユーザーの場合はtrue
        /// </summary>
        public bool RequiresRoleSelection { get; set; }

        /// <summary>
        /// 利用可能なユーザー種別フラグ
        /// 複数の役割を持つ場合の選択肢
        /// </summary>
        public UserTypeFlags AvailableUserTypes { get; set; }

        /// <summary>
        /// 選択されたユーザー種別
        /// ログイン完了時の役割
        /// </summary>
        public UserType? UserType { get; set; }

        /// <summary>
        /// リダイレクトURL
        /// ログイン成功後の誘導先URL
        /// </summary>
        public string? RedirectUrl { get; set; }

        /// <summary>
        /// 下位互換性のための保護者情報プロパティ
        /// </summary>
        [Obsolete("Use ParentInfo instead")]
        public ParentInfo? Parent
        {
            get => ParentInfo;
            set => ParentInfo = value;
        }
    }

    /// <summary>
    /// 保護者基本情報DTO
    /// 認証レスポンスに含まれる保護者の簡略情報
    /// </summary>
    public class ParentInfo
    {
        /// <summary>
        /// 保護者ID
        /// システム内の保護者一意識別子
        /// </summary>
        public int Id { get; set; }

        /// <summary>
        /// 電話番号
        /// 認証に使用される保護者の電話番号
        /// </summary>
        public string PhoneNumber { get; set; } = string.Empty;

        /// <summary>
        /// 保護者名（任意）
        /// 保護者の氏名
        /// </summary>
        public string? Name { get; set; }

        /// <summary>
        /// メールアドレス（任意）
        /// 保護者のメールアドレス
        /// </summary>
        public string? Email { get; set; }

        /// <summary>
        /// アカウント有効状態
        /// 保護者アカウントが有効かどうか
        /// </summary>
        public bool IsActive { get; set; }

        /// <summary>
        /// 最終ログイン日時（任意）
        /// 保護者が最後にログインした日時
        /// </summary>
        public DateTime? LastLoginAt { get; set; }

        /// <summary>
        /// 関連する園児数
        /// この保護者に関連付けられている園児の数
        /// </summary>
        public int ChildCount { get; set; }
    }

    /// <summary>
    /// スタッフ基本情報DTO
    /// 認証レスポンスに含まれるスタッフの簡略情報
    /// </summary>
    public class StaffInfo
    {
        /// <summary>
        /// スタッフID
        /// システム内のスタッフ一意識別子
        /// </summary>
        public int Id { get; set; }

        /// <summary>
        /// 保育園ID
        /// スタッフが所属する保育園のID
        /// </summary>
        public int NurseryId { get; set; }

        /// <summary>
        /// スタッフID（複合主キー用）
        /// StaffテーブルのStaffIdカラム
        /// </summary>
        public int StaffId { get; set; }

        /// <summary>
        /// 電話番号
        /// 認証に使用されるスタッフの電話番号
        /// </summary>
        public string PhoneNumber { get; set; } = string.Empty;

        /// <summary>
        /// スタッフ名
        /// スタッフの氏名（フルネーム）
        /// </summary>
        public string Name { get; set; } = string.Empty;

        /// <summary>
        /// 職位（任意）
        /// スタッフの職位・役職
        /// </summary>
        public string? Position { get; set; }

        /// <summary>
        /// メールアドレス（任意）
        /// スタッフのメールアドレス
        /// </summary>
        public string? Email { get; set; }

        /// <summary>
        /// アカウント有効状態
        /// スタッフアカウントが有効かどうか
        /// </summary>
        public bool IsActive { get; set; }

        /// <summary>
        /// 最終ログイン日時（任意）
        /// スタッフが最後にログインした日時
        /// </summary>
        public DateTime? LastLoginAt { get; set; }

        /// <summary>
        /// 役職
        /// スタッフの役職（teacher, admin, principal, nurse等）
        /// </summary>
        public string Role { get; set; } = string.Empty;

        /// <summary>
        /// クラス割り当て一覧
        /// スタッフが担当する全クラスの情報
        /// </summary>
        public List<ClassAssignmentDto> ClassAssignments { get; set; } = new();
    }

    /// <summary>
    /// クラス割り当て情報DTO
    /// スタッフが担当するクラスの詳細情報
    /// </summary>
    public class ClassAssignmentDto
    {
        /// <summary>
        /// クラスID
        /// クラスの一意識別子
        /// </summary>
        public string ClassId { get; set; } = string.Empty;

        /// <summary>
        /// クラス名
        /// クラスの表示名（例：さくら組、ひまわり組）
        /// </summary>
        public string ClassName { get; set; } = string.Empty;

        /// <summary>
        /// 割り当て役割
        /// MainTeacher（主担任）またはAssistantTeacher（副担任）
        /// </summary>
        public string AssignmentRole { get; set; } = string.Empty;
    }

    /// <summary>
    /// APIレスポンスDTO（ジェネリック）
    /// すべてのAPIレスポンスで使用される統一的なレスポンス形式
    /// </summary>
    /// <typeparam name="T">レスポンスデータの型</typeparam>
    public class ApiResponse<T>
    {
        /// <summary>
        /// API処理成功フラグ
        /// API呼び出しが成功したかどうかを示す
        /// </summary>
        public bool Success { get; set; }

        /// <summary>
        /// レスポンスメッセージ
        /// API処理結果に関するメッセージ
        /// </summary>
        public string Message { get; set; } = string.Empty;

        /// <summary>
        /// レスポンスデータ（任意）
        /// APIが返す実際のデータ
        /// </summary>
        public T? Data { get; set; }

        /// <summary>
        /// エラーメッセージ一覧
        /// API処理中に発生したエラーの詳細メッセージ
        /// </summary>
        public List<string> Errors { get; set; } = new();

        /// <summary>
        /// レスポンス生成時刻
        /// レスポンスが生成されたUTC時刻
        /// </summary>
        public DateTime Timestamp { get; set; } = DateTimeHelper.GetJstNow();
    }

    /// <summary>
    /// エラーレスポンスDTO
    /// APIエラー発生時に返される統一的なエラーレスポンス形式
    /// </summary>
    public class ErrorResponse
    {
        /// <summary>
        /// 成功フラグ（固定値：false）
        /// エラーレスポンスなので常にfalse
        /// </summary>
        public bool Success { get; set; } = false;

        /// <summary>
        /// エラーメッセージ
        /// ユーザー向けのエラーメッセージ
        /// </summary>
        public string Message { get; set; } = string.Empty;

        /// <summary>
        /// HTTPステータスコード
        /// エラーに対応するHTTPステータスコード
        /// </summary>
        public int StatusCode { get; set; }

        /// <summary>
        /// 詳細エラーメッセージ一覧
        /// エラーの詳細情報やバリデーションエラー一覧
        /// </summary>
        public List<string> Errors { get; set; } = new();

        /// <summary>
        /// エラー発生時刻
        /// エラーが発生したUTC時刻
        /// </summary>
        public DateTime Timestamp { get; set; } = DateTimeHelper.GetJstNow();

        /// <summary>
        /// リクエストトレースID（任意）
        /// ログ追跡用のリクエスト一意識別子
        /// </summary>
        public string? TraceId { get; set; }
    }


    /// <summary>
    /// 役割選択リクエストDTO
    /// 保護者兼スタッフが役割選択時に使用
    /// </summary>
    public class RoleSelectionRequest
    {
        /// <summary>
        /// 電話番号（必須）
        /// </summary>
        [Required]
        [Phone]
        [StringLength(15, MinimumLength = 10)]
        public string PhoneNumber { get; set; } = string.Empty;

        /// <summary>
        /// 選択された役割（必須）
        /// </summary>
        [Required]
        public UserType SelectedRole { get; set; }

        /// <summary>
        /// 役割選択を記憶するかどうか
        /// </summary>
        public bool RememberChoice { get; set; } = false;
    }

    /// <summary>
    /// ユーザー検索結果DTO
    /// 電話番号による保護者・スタッフ存在確認結果
    /// </summary>
    public class UserLookupResult
    {
        /// <summary>
        /// 有効なユーザーかどうか
        /// 保護者またはスタッフとして登録されているか
        /// </summary>
        public bool IsValidUser { get; set; }

        /// <summary>
        /// 保護者として登録されているか
        /// </summary>
        public bool IsParent { get; set; }

        /// <summary>
        /// スタッフとして登録されているか
        /// </summary>
        public bool IsStaff { get; set; }

        /// <summary>
        /// 園児が関連付けられているか（保護者の場合）
        /// </summary>
        public bool HasChildren { get; set; }

        /// <summary>
        /// 役割選択が必要かどうか
        /// 保護者とスタッフ両方の場合はtrue
        /// </summary>
        public bool RequiresRoleSelection { get; set; }

        /// <summary>
        /// SMS認証が必要かどうか
        /// すべての有効ユーザー（保護者・スタッフ）はSMS認証が必要
        /// </summary>
        public bool RequiresSmsAuthentication { get; set; }

        /// <summary>
        /// ユーザー種別フラグ
        /// </summary>
        public UserTypeFlags UserTypes { get; set; }

        /// <summary>
        /// 保護者情報（保護者の場合）
        /// </summary>
        public ParentLookupInfo? ParentInfo { get; set; }

        /// <summary>
        /// スタッフ情報（スタッフの場合）
        /// </summary>
        public StaffLookupInfo? StaffInfo { get; set; }
    }

    /// <summary>
    /// 保護者検索情報DTO
    /// </summary>
    public class ParentLookupInfo
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Email { get; set; }
        public int ChildCount { get; set; }
        public DateTime? LastLoginAt { get; set; }
    }

    /// <summary>
    /// スタッフ検索情報DTO
    /// </summary>
    public class StaffLookupInfo
    {
        public int Id { get; set; }
        public int NurseryId { get; set; }
        public int StaffId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public string? Position { get; set; }
        public string? Email { get; set; }
        public DateTime? LastLoginAt { get; set; }
        public int ClassCount { get; set; }
    }
}

using FluentValidation;
using ReactApp.Server.DTOs;
using System.Text.RegularExpressions;

namespace ReactApp.Server.Validators
{
    /// <summary>
    /// SMS送信リクエストバリデーター
    /// SendSmsRequestのバリデーションルールを定義し、電話番号の形式を検証する
    /// </summary>
    public class SendSmsRequestValidator : AbstractValidator<SendSmsRequest>
    {
        /// <summary>
        /// SendSmsRequestValidatorコンストラクタ
        /// SMS送信リクエストのバリデーションルールを設定する
        /// </summary>
        public SendSmsRequestValidator()
        {
            RuleFor(x => x.PhoneNumber)
                .NotEmpty()
                .WithMessage("電話番号は必須です。")
                .Must(BeValidPhoneNumber)
                .WithMessage("有効な電話番号を入力してください。");
        }

        /// <summary>
        /// 電話番号有効性検証
        /// 日本の電話番号フォーマットに適合しているかをチェックする
        /// </summary>
        /// <param name="phoneNumber">検証対象の電話番号</param>
        /// <returns>有効な場合true、無効な場合false</returns>
        private bool BeValidPhoneNumber(string phoneNumber)
        {
            if (string.IsNullOrEmpty(phoneNumber))
                return false;

            // 日本の電話番号パターン
            var patterns = new[]
            {
                @"^0\d{10}$",           // 11桁（先頭0）
                @"^0\d{1,4}-\d{1,4}-\d{4}$", // ハイフン付き
                @"^\+81\d{10}$",        // 国際形式
            };

            return patterns.Any(pattern => Regex.IsMatch(phoneNumber, pattern));
        }
    }

    /// <summary>
    /// SMS認証リクエストバリデーター
    /// VerifySmsRequestのバリデーションルールを定義し、電話番号と認証コードの形式を検証する
    /// </summary>
    public class VerifySmsRequestValidator : AbstractValidator<VerifySmsRequest>
    {
        /// <summary>
        /// VerifySmsRequestValidatorコンストラクタ
        /// SMS認証リクエストのバリデーションルールを設定する
        /// </summary>
        public VerifySmsRequestValidator()
        {
            RuleFor(x => x.PhoneNumber)
                .NotEmpty()
                .WithMessage("電話番号は必須です。")
                .Must(BeValidPhoneNumber)
                .WithMessage("有効な電話番号を入力してください。");

            RuleFor(x => x.Code)
                .NotEmpty()
                .WithMessage("認証コードは必須です。")
                .Length(6)
                .WithMessage("認証コードは6桁である必要があります。")
                .Matches(@"^\d{6}$")
                .WithMessage("認証コードは数字のみである必要があります。");
        }

        /// <summary>
        /// 電話番号有効性検証
        /// 日本の電話番号フォーマットに適合しているかをチェックする
        /// </summary>
        /// <param name="phoneNumber">検証対象の電話番号</param>
        /// <returns>有効な場合true、無効な場合false</returns>
        private bool BeValidPhoneNumber(string phoneNumber)
        {
            if (string.IsNullOrEmpty(phoneNumber))
                return false;

            var patterns = new[]
            {
                @"^0\d{10}$",
                @"^0\d{1,4}-\d{1,4}-\d{4}$",
                @"^\+81\d{10}$",
            };

            return patterns.Any(pattern => Regex.IsMatch(phoneNumber, pattern));
        }
    }

    /// <summary>
    /// リフレッシュトークンリクエストバリデーター
    /// RefreshTokenRequestのバリデーションルールを定義し、アクセストークンとリフレッシュトークンの存在を検証する
    /// </summary>
    public class RefreshTokenRequestValidator : AbstractValidator<RefreshTokenRequest>
    {
        /// <summary>
        /// RefreshTokenRequestValidatorコンストラクタ
        /// リフレッシュトークンリクエストのバリデーションルールを設定する
        /// </summary>
        public RefreshTokenRequestValidator()
        {
            RuleFor(x => x.AccessToken)
                .NotEmpty()
                .WithMessage("アクセストークンは必須です。");

            RuleFor(x => x.RefreshToken)
                .NotEmpty()
                .WithMessage("リフレッシュトークンは必須です。");
        }
    }

    /// <summary>
    /// 入退ログ作成リクエストバリデーター
    /// CreateEntryExitLogRequestのバリデーションルールを定義し、入退種別の妥当性を検証する
    /// </summary>
    public class CreateEntryExitLogRequestValidator : AbstractValidator<CreateEntryExitLogRequest>
    {
        /// <summary>
        /// CreateEntryExitLogRequestValidatorコンストラクタ
        /// 入退ログ作成リクエストのバリデーションルールを設定する
        /// </summary>
        public CreateEntryExitLogRequestValidator()
        {
            RuleFor(x => x.ParentId)
                .GreaterThan(0)
                .WithMessage("保護者IDは1以上である必要があります。");

            RuleFor(x => x.NurseryId)
                .GreaterThan(0)
                .WithMessage("保育園IDは1以上である必要があります。");

            RuleFor(x => x.EntryType)
                .NotEmpty()
                .WithMessage("入退種別は必須です。")
                .Must(type => type == "Entry" || type == "Exit")
                .WithMessage("入退種別は 'Entry' または 'Exit' である必要があります。");
        }
    }

    /// <summary>
    /// 入退管理用ログインリクエストバリデーター
    /// EntryExitLoginRequestのバリデーションルールを定義し、ログインIDとパスワードの存在を検証する
    /// </summary>
    public class EntryExitLoginRequestValidator : AbstractValidator<EntryExitLoginRequest>
    {
        /// <summary>
        /// EntryExitLoginRequestValidatorコンストラクタ
        /// 入退管理用ログインリクエストのバリデーションルールを設定する
        /// </summary>
        public EntryExitLoginRequestValidator()
        {
            RuleFor(x => x.LoginId)
                .NotEmpty()
                .WithMessage("ログインIDは必須です。")
                .MaximumLength(50)
                .WithMessage("ログインIDは50文字以内である必要があります。");

            RuleFor(x => x.Password)
                .NotEmpty()
                .WithMessage("パスワードは必須です。")
                .MinimumLength(4)
                .WithMessage("パスワードは4文字以上である必要があります。");
        }
    }
}
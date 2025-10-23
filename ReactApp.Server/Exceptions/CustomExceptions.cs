namespace ReactApp.Server.Exceptions
{
    /// <summary>
    /// 業務ルール違反例外クラス
    /// アプリケーション固有のビジネスロジックエラーを表現
    /// エラーコードと詳細メッセージを保持
    /// </summary>
    public class BusinessException : Exception
    {
        /// <summary>
        /// エラーコード（業務エラーの分類用）
        /// </summary>
        public string Code { get; }

        /// <summary>
        /// BusinessExceptionコンストラクタ
        /// </summary>
        /// <param name="message">エラーメッセージ</param>
        /// <param name="code">エラーコード（任意）</param>
        public BusinessException(string message, string code = "") : base(message)
        {
            Code = code;
        }
    }

    /// <summary>
    /// 認証未実行例外クラス
    /// 認証が必要な操作に対してユーザーが未認証の場合にスロー
    /// HTTPステータス401 Unauthorizedに対応
    /// </summary>
    public class UnauthorizedException : Exception
    {
        /// <summary>
        /// UnauthorizedExceptionコンストラクタ
        /// </summary>
        /// <param name="message">エラーメッセージ（デフォルト: "認証が必要です。"）</param>
        public UnauthorizedException(string message = "認証が必要です。") : base(message)
        {
        }
    }

    /// <summary>
    /// アクセス権限不足例外クラス
    /// 認証済みユーザーが権限不足でアクセスできない場合にスロー
    /// HTTPステータス403 Forbiddenに対応
    /// </summary>
    public class ForbiddenException : Exception
    {
        /// <summary>
        /// ForbiddenExceptionコンストラクタ
        /// </summary>
        /// <param name="message">エラーメッセージ（デフォルト: "アクセスが禁止されています。"）</param>
        public ForbiddenException(string message = "アクセスが禁止されています。") : base(message)
        {
        }
    }

    /// <summary>
    /// リソース未発見例外クラス
    /// 要求されたリソースが存在しない場合にスロー
    /// HTTPステータス404 Not Foundに対応
    /// </summary>
    public class NotFoundException : Exception
    {
        /// <summary>
        /// NotFoundExceptionコンストラクタ
        /// </summary>
        /// <param name="message">エラーメッセージ</param>
        public NotFoundException(string message) : base(message)
        {
        }

        public NotFoundException(string entityName, object key)
            : base($"{entityName} (ID: {key}) が見つかりません。")
        {
        }
    }

    public class ConflictException : Exception
    {
        public ConflictException(string message) : base(message)
        {
        }
    }

    public class ValidationException : Exception
    {
        public Dictionary<string, List<string>> Errors { get; }

        public ValidationException(Dictionary<string, List<string>> errors)
            : base("バリデーションエラーが発生しました。")
        {
            Errors = errors;
        }

        public ValidationException(string field, string message)
            : base($"バリデーションエラー: {message}")
        {
            Errors = new Dictionary<string, List<string>>
            {
                { field, new List<string> { message } }
            };
        }
    }

    public class RateLimitException : Exception
    {
        public TimeSpan RetryAfter { get; }

        public RateLimitException(TimeSpan retryAfter, string message = "レート制限を超えました。")
            : base(message)
        {
            RetryAfter = retryAfter;
        }
    }

    public class ExternalServiceException : Exception
    {
        public string ServiceName { get; }

        public ExternalServiceException(string serviceName, string message)
            : base($"外部サービス '{serviceName}' でエラーが発生しました: {message}")
        {
            ServiceName = serviceName;
        }

        public ExternalServiceException(string serviceName, string message, Exception innerException)
            : base($"外部サービス '{serviceName}' でエラーが発生しました: {message}", innerException)
        {
            ServiceName = serviceName;
        }
    }
}
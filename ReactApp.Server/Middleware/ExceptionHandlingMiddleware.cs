using ReactApp.Server.DTOs;
using ReactApp.Server.Exceptions;
using System.Net;
using System.Text.Json;

namespace ReactApp.Server.Middleware
{
    /// <summary>
    /// 例外ハンドリングミドルウェア
    /// アプリケーション全体で発生する未処理例外をキャッチし、統一的なエラーレスポンスを返す
    /// </summary>
    public class ExceptionHandlingMiddleware
    {
        /// <summary>
        /// 次のミドルウェアデリゲート
        /// ASP.NET Coreパイプラインの次のコンポーネントへの参照
        /// </summary>
        private readonly RequestDelegate _next;

        /// <summary>
        /// ロガー
        /// 例外情報をログ出力するためのロガーインスタンス
        /// </summary>
        private readonly ILogger<ExceptionHandlingMiddleware> _logger;

        /// <summary>
        /// ExceptionHandlingMiddlewareコンストラクタ
        /// ミドルウェアの初期化と依存性注入を行う
        /// </summary>
        /// <param name="next">次のリクエストデリゲート</param>
        /// <param name="logger">ログ出力用ロガー</param>
        public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        /// <summary>
        /// ミドルウェア実行メソッド
        /// HTTPリクエストを処理し、例外が発生した場合はエラーハンドリングを実行する
        /// </summary>
        /// <param name="context">HTTPリクエストコンテキスト</param>
        /// <returns>非同期タスク</returns>
        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "未処理例外が発生しました。Path: {Path}, Method: {Method}, TraceId: {TraceId}",
                    context.Request.Path, context.Request.Method, context.TraceIdentifier);

                await HandleExceptionAsync(context, ex);
            }
        }

        /// <summary>
        /// 例外処理メソッド
        /// 発生した例外の種類に応じて適切なHTTPステータスコードとエラーメッセージを設定し、JSONレスポンスを返す
        /// </summary>
        /// <param name="context">HTTPリクエストコンテキスト</param>
        /// <param name="exception">発生した例外</param>
        /// <returns>非同期タスク</returns>
        private static async Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
            context.Response.ContentType = "application/json";
            
            var errorResponse = new ErrorResponse
            {
                TraceId = context.TraceIdentifier
            };

            switch (exception)
            {
                case FluentValidation.ValidationException validationEx:
                    errorResponse.StatusCode = (int)HttpStatusCode.BadRequest;
                    errorResponse.Message = "バリデーションエラーが発生しました。";
                    errorResponse.Errors.AddRange(validationEx.Errors.Select(e => e.ErrorMessage));
                    break;

                case BusinessException businessEx:
                    errorResponse.StatusCode = (int)HttpStatusCode.BadRequest;
                    errorResponse.Message = businessEx.Message;
                    errorResponse.Errors.Add(businessEx.Code ?? "BUSINESS_ERROR");
                    break;

                case UnauthorizedException unauthorizedEx:
                    errorResponse.StatusCode = (int)HttpStatusCode.Unauthorized;
                    errorResponse.Message = unauthorizedEx.Message;
                    errorResponse.Errors.Add("UNAUTHORIZED");
                    break;

                case ForbiddenException forbiddenEx:
                    errorResponse.StatusCode = (int)HttpStatusCode.Forbidden;
                    errorResponse.Message = forbiddenEx.Message;
                    errorResponse.Errors.Add("FORBIDDEN");
                    break;

                case NotFoundException notFoundEx:
                    errorResponse.StatusCode = (int)HttpStatusCode.NotFound;
                    errorResponse.Message = notFoundEx.Message;
                    errorResponse.Errors.Add("NOT_FOUND");
                    break;

                case ArgumentException:
                    errorResponse.StatusCode = (int)HttpStatusCode.BadRequest;
                    errorResponse.Message = "無効なリクエストパラメータです。";
                    errorResponse.Errors.Add("INVALID_PARAMETER");
                    break;

                case UnauthorizedAccessException:
                    errorResponse.StatusCode = (int)HttpStatusCode.Unauthorized;
                    errorResponse.Message = "認証が必要です。";
                    errorResponse.Errors.Add("UNAUTHORIZED");
                    break;

                case TaskCanceledException when exception.InnerException is TimeoutException:
                    errorResponse.StatusCode = (int)HttpStatusCode.RequestTimeout;
                    errorResponse.Message = "リクエストがタイムアウトしました。";
                    errorResponse.Errors.Add("REQUEST_TIMEOUT");
                    break;

                default:
                    errorResponse.StatusCode = (int)HttpStatusCode.InternalServerError;
                    errorResponse.Message = "内部サーバーエラーが発生しました。";
                    errorResponse.Errors.Add("INTERNAL_SERVER_ERROR");
                    break;
            }

            context.Response.StatusCode = errorResponse.StatusCode;

            var jsonOptions = new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            };

            var result = JsonSerializer.Serialize(errorResponse, jsonOptions);
            await context.Response.WriteAsync(result);
        }
    }
}
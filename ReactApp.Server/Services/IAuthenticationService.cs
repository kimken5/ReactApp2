using ReactApp.Server.DTOs;
using ReactApp.Server.Models;

namespace ReactApp.Server.Services
{
    /// <summary>
    /// 認証サービスインターフェース
    /// SMS認証による保護者ログイン機能の契約を定義
    /// JWTトークン発行、リフレッシュ、ログアウト機能を含む
    /// </summary>
    public interface IAuthenticationService
    {
        /// <summary>
        /// SMS認証コード送信
        /// 指定された電話番号に認証コードを送信し、認証セッションを開始
        /// </summary>
        /// <param name="request">SMS送信リクエスト（電話番号含む）</param>
        /// <param name="ipAddress">クライアントIPアドレス</param>
        /// <param name="userAgent">クライアントユーザーエージェント</param>
        /// <returns>送信結果レスポンス</returns>
        Task<ApiResponse<object>> SendSmsCodeAsync(SendSmsRequest request, string ipAddress, string userAgent);

        /// <summary>
        /// SMS認証コード検証・ログイン実行
        /// 送信された認証コードを検証し、有効な場合はJWTトークンを発行
        /// </summary>
        /// <param name="request">SMS認証リクエスト（電話番号・認証コード含む）</param>
        /// <param name="ipAddress">クライアントIPアドレス</param>
        /// <param name="userAgent">クライアントユーザーエージェント</param>
        /// <returns>認証結果とJWTトークンペア</returns>
        Task<ApiResponse<AuthResponse>> VerifyAndLoginAsync(VerifySmsRequest request, string ipAddress, string userAgent);

        /// <summary>
        /// JWTトークンリフレッシュ
        /// 期限切れ直前のアクセストークンを新しいトークンペアに更新
        /// </summary>
        /// <param name="request">トークンリフレッシュリクエスト</param>
        /// <param name="ipAddress">クライアントIPアドレス</param>
        /// <param name="userAgent">クライアントユーザーエージェント</param>
        /// <returns>新しいJWTトークンペア</returns>
        Task<ApiResponse<AuthResponse>> RefreshTokenAsync(RefreshTokenRequest request, string ipAddress, string userAgent);

        /// <summary>
        /// ログアウト処理
        /// リフレッシュトークンを無効化してセッションを終了
        /// </summary>
        /// <param name="refreshToken">無効化対象のリフレッシュトークン</param>
        /// <returns>ログアウト処理結果</returns>
        Task<ApiResponse<object>> LogoutAsync(string refreshToken);

        /// <summary>
        /// 保護者エンティティの取得・作成
        /// 電話番号から保護者を検索し、存在しない場合は新規作成
        /// </summary>
        /// <param name="phoneNumber">保護者の電話番号</param>
        /// <returns>保護者エンティティ（作成失敗時はnull）</returns>
        Task<Parent?> GetOrCreateParentAsync(string phoneNumber);

        /// <summary>
        /// 役割選択後のログイン処理
        /// 保護者兼スタッフが役割を選択してログインする際に使用
        /// </summary>
        /// <param name="phoneNumber">電話番号</param>
        /// <param name="selectedRole">選択された役割</param>
        /// <param name="ipAddress">クライアントIPアドレス</param>
        /// <param name="userAgent">クライアントユーザーエージェント</param>
        /// <returns>認証結果とJWTトークン</returns>
        Task<ApiResponse<AuthResponse>> LoginWithRoleAsync(string phoneNumber, UserType selectedRole, string ipAddress, string userAgent);

        /// <summary>
        /// スタッフのクラス割り当て情報を取得
        /// StaffClassAssignmentsテーブルからスタッフが担当する全クラスを取得
        /// </summary>
        /// <param name="nurseryId">保育園ID</param>
        /// <param name="staffId">スタッフID</param>
        /// <returns>クラス割り当て情報のリスト</returns>
        Task<List<ClassAssignmentDto>> GetStaffClassAssignmentsAsync(int nurseryId, int staffId);
    }
}